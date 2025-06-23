import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { WalletService } from '../../services/wallet.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletComponent } from '../wallet/wallet.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, CommonModule, FormsModule, WalletComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  private _isLoggedIn = false;
  isInitialized = false; // Add flag to prevent showing navbar before initialization
  userName: string | null = null;
  userAddress: string | null = null;
  userRole: string | null = null; // Add missing userRole property
  categories: any[] = [];
  selectedCategory: any = null;
  subcategories: any[] = [];
  selectedSubcategory: any = null;
  showUserDropdown = false;
  editingAddress = false;
  editAddress = '';
  walletBalance: number = 0;
  addFundsAmount: number = 0;
  walletMessage: string = '';
  orderHistory: any[] = [];
  showWalletModal = false;
  showEditAddressModal = false;
  isMerchant = false;
  savedAddresses: any[] = [];
  showAddressSubmenu = false;
  showMobileMenu = false;

  // Getter for isLoggedIn that checks localStorage in real-time if needed
  get isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      // Always check localStorage for the most current state
      const token = localStorage.getItem('token');
      const isLoggedInFlag = localStorage.getItem('isLoggedIn');
      const currentState = (isLoggedInFlag === 'true') || !!(token && token.trim().length > 0);
      
      // Update internal state if different
      if (this._isLoggedIn !== currentState) {
        this._isLoggedIn = currentState;
      }
      
      return this._isLoggedIn;
    }
    return this._isLoggedIn;
  }

  // Setter for isLoggedIn
  set isLoggedIn(value: boolean) {
    this._isLoggedIn = value;
  }constructor(
    private categoryService: CategoryService,
    private orderService: OrderService,
    private walletService: WalletService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize login state immediately in constructor if browser
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLoginState();
    } else {
      this.isInitialized = true; // Mark as initialized for SSR
    }
  }

  get userSymbol(): string {
    return this.isLoggedIn ? '👤' : '';
  }  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Ensure immediate initialization
      this.initializeLoginState();
      
      // Listen for route changes to update login status
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.setLoginStateFromStorage();
        }
      });
      
      // Listen for storage events to update UI when user logs in/out
      window.addEventListener('storage', () => {
        this.setLoginStateFromStorage();
        if (this.isLoggedIn && (this.userRole !== 'merchant' && this.userRole !== 'Merchant')) {
          this.fetchWalletBalance();
        }
      });
        window.addEventListener('loginStatusChanged', () => {
        this.setLoginStateFromStorage();
      });
      
    } else {
      this._isLoggedIn = false;
      this.userRole = '';
      this.userName = '';
      this.isInitialized = true;
    }
  }
  // New method for immediate initialization
  private initializeLoginState() {
    // Use synchronous approach to prevent any delay
    const token = localStorage.getItem('token');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn');
    
    // Immediately determine login state
    this._isLoggedIn = (isLoggedInFlag === 'true') || !!(token && token.trim().length > 0);
    this.isInitialized = true; // Mark as initialized immediately
    
    // Then set full login state
    this.setLoginStateFromStorage();
  }setLoginStateFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const isMerchantFlag = localStorage.getItem('isMerchant');        // Determine login status
        this._isLoggedIn = (isLoggedIn === 'true') || !!(token && token.trim().length > 0);
        
        if (this._isLoggedIn) {
          // Set user name
          this.userName = localStorage.getItem('userName') || 'User';
          
          // Set user role and merchant status
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              this.userRole = user.role || 'user';
            } catch {
              this.userRole = 'user';
            }
          } else {
            this.userRole = 'user';
          }
          
          // Set merchant status (check both userRole and separate flag for robustness)
          this.isMerchant = (this.userRole === 'merchant' || this.userRole === 'Merchant') || (isMerchantFlag === 'true');
          
          // Load additional user data if logged in
          this.userAddress = localStorage.getItem('userAddress') || '';
          this.loadSavedAddresses();
          
          // Fetch wallet balance for non-merchants
          if (!this.isMerchant && (this.userRole !== 'merchant' && this.userRole !== 'Merchant')) {
            this.fetchWalletBalance();
          }
        } else {
          // Reset all user data if not logged in
          this.userName = '';
          this.userRole = '';
          this.userAddress = '';
          this.isMerchant = false;
          this.walletBalance = 0;
          this.savedAddresses = [];
        }        console.log('Navbar login state updated:', {
          isLoggedIn: this._isLoggedIn,
          userName: this.userName,
          userRole: this.userRole,
          isMerchant: this.isMerchant
        });
        
        // Mark as initialized after setting login state
        this.isInitialized = true;
        
      } catch (error) {
        console.error('Error reading login state from localStorage:', error);        // Reset to safe defaults on error
        this._isLoggedIn = false;
        this.userName = '';
        this.userRole = '';
        this.userAddress = '';
        this.isMerchant = false;
        this.isInitialized = true; // Mark as initialized even on error
        this.walletBalance = 0;
      }
    } else {
      // Server-side rendering defaults
      this.isLoggedIn = false;
      this.userRole = '';
      this.userName = '';
      this.userAddress = '';
      this.isMerchant = false;
    }
  }  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAddress');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('isMerchant');
    }    this.isLoggedIn = false;
    this.userRole = '';
    this.userName = '';
    this.isMerchant = false;
    this.showUserDropdown = false;
    
    // Dispatch storage event to update other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('loginStatusChanged'));
    
    this.router.navigate(['/']);
  }
  refreshUserState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const token = localStorage.getItem('token');
      
      this.isLoggedIn = (isLoggedIn === 'true') || !!token;
      this.userName = localStorage.getItem('userName') || '';
      this.userAddress = localStorage.getItem('userAddress') || '';
        // Get user role from the 'user' localStorage item
      const userStr = localStorage.getItem('user');
      const isMerchantFlag = localStorage.getItem('isMerchant');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.userRole = user.role || 'user';
          this.isMerchant = (user.role === 'merchant') || (isMerchantFlag === 'true');
        } catch {
          this.userRole = 'user';
          this.isMerchant = (isMerchantFlag === 'true');
        }
      } else {
        this.userRole = '';
        this.isMerchant = (isMerchantFlag === 'true');
      }
      
      // Reload saved addresses when user state changes
      this.loadSavedAddresses();
    }
  }

  fetchWalletBalance() {
    this.walletService.getBalance().subscribe({
      next: (res) => { this.walletBalance = res.balance ?? 0; },
      error: () => { this.walletBalance = 0; }
    });
  }
  fetchOrderHistory() {
    // Check if user is authenticated before making the API call
    const token = localStorage.getItem('token');
    if (!token || !this.isLoggedIn) {
      return;
    }

    this.orderService.getOrderHistory().subscribe({
      next: (orders) => {
        this.orderHistory = orders;
      },
      error: (error) => {
        if (error.status === 401) {
          console.log('Authentication expired, logging out user');
          this.logout();
        } else {
          console.error('Error fetching order history:', error);
        }
      }
    });
  }

  onCategorySelect(event: any) {
    const idx = event.target.value;
    if (idx === "" || idx == null || isNaN(idx)) {
      this.selectedCategory = null;
      this.subcategories = [];
      this.selectedSubcategory = null;
      return;
    }
    this.selectedCategory = this.categories[+idx];
    this.subcategories = this.selectedCategory?.subcategories || [];
    this.selectedSubcategory = null;
  }

  onSubcategorySelect(event: any) {
    const idx = event.target.value;
    if (idx === "" || idx == null || isNaN(idx)) {
      this.selectedSubcategory = null;
      return;
    }
    this.selectedSubcategory = this.subcategories[+idx];
  }

  openEditAddressModal() {
    this.showUserDropdown = false;
    // Load the user's saved address from savedAddresses if available
    let addresses = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      } catch {}
    }
    // Find address by userName
    const userAddressObj = addresses.find((a: any) => a.name === this.userName);
    if (userAddressObj) {
      this.editAddress = userAddressObj.addressLine1 || '';
    } else {
      this.editAddress = this.userAddress || '';
    }
    this.showEditAddressModal = true;
  }
  closeEditAddressModal() {
    this.showEditAddressModal = false;
  }
  // Save address and allow editing
  saveAddress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('userAddress', this.editAddress);
      this.userAddress = this.editAddress;
      // Save to savedAddresses array for checkout use
      let addresses = [];
      try {
        addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      } catch {}
      // If address already exists, update it; else, add new
      const idx = addresses.findIndex((a: any) => a.name === this.userName);
      const addressObj = {
        name: this.userName,
        addressLine1: this.editAddress,
        // Add more fields as needed
        city: '', state: '', zipCode: '', country: '', phone: ''
      };
      if (idx !== -1) {
        addresses[idx] = addressObj;
      } else {
        addresses.push(addressObj);
      }
      localStorage.setItem('savedAddresses', JSON.stringify(addresses));
      this.showEditAddressModal = false;
    }
  }

  cancelEditAddress() {
    this.editingAddress = false;
    this.editAddress = this.userAddress || '';
  }

  addFunds() {
    if (!this.addFundsAmount || this.addFundsAmount < 1) return;
    this.walletService.addFunds({ amount: this.addFundsAmount }).subscribe({
      next: (res) => {
        this.walletMessage = res.message || 'Funds added!';
        this.fetchWalletBalance();
        this.addFundsAmount = 0;
        setTimeout(() => this.walletMessage = '', 2000);
      },
      error: (err) => {
        this.walletMessage = err?.error?.message || 'Failed to add funds!';
        setTimeout(() => this.walletMessage = '', 2000);
      }
    });
  }

  showAnimation(type: 'login-success' | 'logout') {
    const anim = document.createElement('div');
    anim.className = 'custom-animation';
    if (type === 'login-success') {
      anim.innerHTML = '<span style="font-size:2rem;">✅</span> Login successful!';
    } else if (type === 'logout') {
      anim.innerHTML = '<span style="font-size:2rem;">👋</span> Logged out!';
    }
    Object.assign(anim.style, {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      background: '#3182ce',
      color: '#fff',
      padding: '1rem 2rem',
      borderRadius: '0.7rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      fontSize: '1.1rem',
      zIndex: 2000,
      opacity: 0.97,
      transition: 'all 0.5s',
      pointerEvents: 'none',
      animation: 'fadeInOutAnim 2.2s',
    });
    document.body.appendChild(anim);
    setTimeout(() => { anim.style.opacity = '0'; }, 1800);
    setTimeout(() => { document.body.removeChild(anim); }, 2200);
  }

  goToAddress() {
    this.showUserDropdown = false;
    this.router.navigate(['/address']);
  }
  goToOrderHistory() {
    this.showUserDropdown = false;
    this.router.navigate(['/order-history']);
  }
  goToMerchantDashboard() {
    this.showUserDropdown = false;
    this.router.navigate(['/merchant']);
  }
  // Only allow wallet modal for non-merchants
  openWalletModal() {
    if (this.userRole === 'merchant' || this.userRole === 'Merchant') {
      return;
    }
    this.showUserDropdown = false;
    this.showWalletModal = true;
    this.fetchWalletBalance();
  }
  closeWalletModal() {
    this.showWalletModal = false;
    this.addFundsAmount = 0;
    this.walletMessage = '';
  }

  // Add a method to open the manage address page
  openManageAddress() {
    this.router.navigate(['/manage-address']);
  }

  toggleUserDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
    if (this.showUserDropdown) {
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick, true);
      });
    } else {
      document.removeEventListener('click', this.handleOutsideClick, true);
    }
  }

  closeUserDropdown() {
    this.showUserDropdown = false;
    document.removeEventListener('click', this.handleOutsideClick, true);
  }
  handleOutsideClick = (event: any) => {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
      this.closeUserDropdown();
    }
  }

  // Address management methods
  loadSavedAddresses() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('savedAddresses');
      this.savedAddresses = saved ? JSON.parse(saved) : [];
    }
  }

  selectAddress(address: any) {
    // Navigate to checkout with selected address
    this.router.navigate(['/checkout'], { 
      queryParams: { selectedAddress: JSON.stringify(address) } 
    });
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
