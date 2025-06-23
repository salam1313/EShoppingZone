import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute } from '@angular/router';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  paymentMethod: string = 'COD';
  fullName: string = '';
  addressLine1: string = '';
  addressLine2: string = '';
  city: string = '';
  state: string = '';
  zipCode: string = '';
  country: string = '';
  phone: string = '';
  cartTotal: number = 0;
  cartItems: any[] = [];
  paymentSuccess = false;
  paymentError = '';
  paymentSuccessMessage = '';
  showRazorpayModal = false;
  processing = false;
  validationErrors: string[] = [];
  walletError: string = '';
  walletSuccess: string = '';
  walletBalance: number = 0;
  animatedWalletBalance: number = 0;
  showWalletAnimation: boolean = false;
  showWalletPayModal: boolean = false;
  // Address management
  savedAddresses: any[] = [];
  showNewAddressForm = false;
  addressName: string = '';
  saveAddress: boolean = false;
  selectedAddressIndex: number = -1;
  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private walletService: WalletService
  ) {
    console.log('CheckoutComponent loaded');
    this.cartService.getCart().subscribe({
      next: (res) => {
        this.cartItems = res.map((item: any) => ({
          name: item.productName || item.name,
          imageUrl: item.productImage || item.imageUrl || item.image || '',
          variantName: item.variantName || (item.variant ? item.variant.name : ''),
          quantity: item.quantity,
          price: item.unitPrice || item.price || 0
        }));
        this.cartTotal = res.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
      },
      error: () => {
        // DEMO: Always show mock data if cart fails to load, no error message
        this.cartItems = [
          { name: 'Demo Product', imageUrl: '', variantName: '', quantity: 1, price: 100 }
        ];
        this.cartTotal = 100;
      }    });
      // Load saved addresses and user data
    this.loadSavedAddresses();
    
    // Check for address passed from navbar
    this.route.queryParams.subscribe(params => {
      if (params['selectedAddress']) {
        try {
          const address = JSON.parse(params['selectedAddress']);
          this.loadAddressFromNavbar(address);
        } catch (e) {
          console.warn('Invalid address parameter');
        }
      }
    });
    
    // Restore checkout form fields from localStorage if present (browser only)
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('checkoutForm');
      if (saved) {
        const data = JSON.parse(saved);
        this.paymentMethod = data.paymentMethod || this.paymentMethod;
        this.fullName = data.fullName || '';
        this.addressLine1 = data.addressLine1 || '';
        this.addressLine2 = data.addressLine2 || '';
        this.city = data.city || '';
        this.state = data.state || '';
        this.zipCode = data.zipCode || '';
        this.country = data.country || '';
        this.phone = data.phone || '';
      }
    }
  }

  ngOnInit() {
    this.clearAddressOnLogin();
    // Do NOT auto-select any saved address on load
    // Only select if user explicitly chooses or via navbar param
    this.selectedAddressIndex = -1;
    this.showNewAddressForm = this.savedAddresses.length === 0;
  }

  clearAddressOnLogin() {
    // If user is freshly logged in, clear saved addresses and form
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastLogin = localStorage.getItem('lastLoginUser');
      const currentUser = localStorage.getItem('userName');
      if (currentUser && lastLogin !== currentUser) {
        localStorage.removeItem('savedAddresses');
        localStorage.removeItem('checkoutForm');
        this.savedAddresses = [];
        this.selectedAddressIndex = -1;
        this.clearAddressForm();
        localStorage.setItem('lastLoginUser', currentUser);
      }
    }
  }

  loadSavedAddresses() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const addresses = localStorage.getItem('savedAddresses');
      if (addresses) {
        this.savedAddresses = JSON.parse(addresses);
      }
    }
  }

  selectSavedAddress(index: number) {
    this.selectedAddressIndex = index;
    const address = this.savedAddresses[index];
    if (address) {
      this.fullName = address.name;
      this.addressLine1 = address.addressLine1;
      this.addressLine2 = address.addressLine2;
      this.city = address.city;
      this.state = address.state;
      this.zipCode = address.zipCode;
      this.country = address.country;
      this.phone = address.phone;
      this.persistForm();
    }    this.showNewAddressForm = false;
  }

  // Load address from navbar selection
  loadAddressFromNavbar(address: any) {
    this.fullName = address.name || '';
    this.addressLine1 = address.addressLine1 || '';
    this.addressLine2 = address.addressLine2 || '';
    this.city = address.city || '';
    this.state = address.state || '';
    this.zipCode = address.zipCode || '';
    this.country = address.country || '';
    this.phone = address.phone || '';
    
    // Find if this address already exists in saved addresses and select it
    const existingIndex = this.savedAddresses.findIndex(saved => 
      saved.addressLine1 === address.addressLine1 && 
      saved.city === address.city &&
      saved.name === address.name
    );
    
    if (existingIndex !== -1) {
      this.selectedAddressIndex = existingIndex;
    }
    
    this.persistForm();
    this.showNewAddressForm = false;
  }

  // Save current form as a new address
  saveCurrentAddress() {
    if (!this.addressName.trim() || !this.fullName || !this.addressLine1 || !this.city) {
      return;
    }
    const address = {
      name: this.addressName.trim(),
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      phone: this.phone,
      createdAt: new Date().toISOString()
    };
    this.savedAddresses.push(address);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('savedAddresses', JSON.stringify(this.savedAddresses));
    }
    this.selectedAddressIndex = this.savedAddresses.length - 1;
    this.showNewAddressForm = false;
    this.clearAddressForm(); // Clear form after saving
  }

  // Clear address form fields
  clearAddressForm() {
    this.fullName = '';
    this.addressLine1 = '';
    this.addressLine2 = '';
    this.city = '';
    this.state = '';
    this.zipCode = '';
    this.country = '';
    this.phone = '';
    this.addressName = '';
    this.saveAddress = false;
    // Also reset showNewAddressForm so the form is hidden after saving
    this.showNewAddressForm = false;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('checkoutForm');
    }
  }

  // Delete a saved address
  deleteSavedAddress(index: number) {
    if (index >= 0 && index < this.savedAddresses.length) {
      this.savedAddresses.splice(index, 1);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('savedAddresses', JSON.stringify(this.savedAddresses));
      }
      if (this.selectedAddressIndex === index) {
        this.selectedAddressIndex = -1;
      } else if (this.selectedAddressIndex > index) {
        this.selectedAddressIndex--;
      }
    }
  }

  persistForm() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('checkoutForm', JSON.stringify({
        paymentMethod: this.paymentMethod,
        fullName: this.fullName,
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        city: this.city,
        state: this.state,
        zipCode: this.zipCode,
        country: this.country,
        phone: this.phone
      }));
    }
  }
  placeOrder() {
    this.validationErrors = [];
    this.walletError = '';
    this.walletSuccess = '';
    
    if (!this.paymentMethod) {
      this.validationErrors.push('Please select a payment method.');
      return;
    }
    
    if (!this.isAddressSelectedOrFilled) {
      // Enhanced user feedback for address requirement
      this.validationErrors.push('Please select or fill in a delivery address.');
      
      // Scroll to address section if no address is provided
      setTimeout(() => {
        const addressSection = document.querySelector('.checkout-fresh-section h3');
        if (addressSection) {
          addressSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Show alert as backup
      alert('Address can\'t be empty. Please select a saved address or enter your delivery details to checkout.');
      return;
    }
    
    if (this.paymentMethod === 'ONLINE') {
      this.showRazorpayModal = true;
      this.processing = false;
      return;
    }
    
    if (this.paymentMethod === 'WALLET') {
      // Show wallet pay modal instead of direct payment
      this.walletService.getBalance().subscribe({
        next: (res) => {
          this.walletBalance = res.balance ?? 0;
          this.showWalletPayModal = true;
        },
        error: () => {
          this.walletError = 'Unable to fetch wallet balance.';
        }
      });
      return;
    }
    this.processing = true;
    // Place order via API so order history updates
    const orderDto = {
      paymentMethod: this.paymentMethod,
      fullName: this.fullName,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      phone: this.phone
    };
    this.orderService.checkout(orderDto).subscribe({
      next: (res) => {
        this.paymentSuccess = true;
        this.paymentSuccessMessage = 'Order placed successfully! Please pay when you receive the product.';
        this.cartService.clearCart().subscribe(() => {
          this.cartItems = [];
          this.cartTotal = 0;
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('cart');
            localStorage.removeItem('cartCount');
          }
        });
        this.processing = false;
      },
      error: (err) => {
        this.paymentError = err?.error?.message || 'Order failed. Please try again.';
        this.processing = false;
      }
    });
  }

  confirmWalletPayment() {
    this.processing = true;
    this.showWalletPayModal = false;
    this.walletService.payWithWallet({ amount: this.cartTotal }).subscribe({
      next: (res) => {
        // On successful wallet payment, place the order
        const orderDto = {
          paymentMethod: 'WALLET',
          fullName: this.fullName,
          addressLine1: this.addressLine1,
          addressLine2: this.addressLine2,
          city: this.city,
          state: this.state,
          zipCode: this.zipCode,
          country: this.country,
          phone: this.phone
        };
        this.orderService.checkout(orderDto).subscribe({
          next: (orderRes) => {
            this.paymentSuccess = true;
            this.paymentSuccessMessage = 'Order placed and paid with wallet successfully!';
            this.cartService.clearCart().subscribe(() => {
              this.cartItems = [];
              this.cartTotal = 0;
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('cart');
                localStorage.removeItem('cartCount');
              }
            });
            this.processing = false;
          },
          error: (err) => {
            this.paymentError = err?.error?.message || 'Order failed. Please try again.';
            this.processing = false;
          }
        });
      },
      error: (err) => {
        this.walletError = err?.error?.message || 'Not enough funds in wallet.';
        this.processing = false;
      }
    });
  }

  cancelWalletPayment() {
    this.showWalletPayModal = false;
    this.processing = false;
  }

  simulateRazorpayPayment() {
    if (!this.isAddressSelectedOrFilled) {
      this.validationErrors = ['Please select or fill in a delivery address.'];
      this.processing = false;
      return;
    }
    this.processing = true;
    // Place online order via API so order history updates
    const orderDto = {
      paymentMethod: 'ONLINE',
      fullName: this.fullName,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      phone: this.phone
    };
    this.orderService.checkout(orderDto).subscribe({
      next: (res) => {
        this.processing = false;
        this.showRazorpayModal = false;
        this.paymentSuccess = true;
        this.paymentSuccessMessage = 'Online payment successful! Order placed.';
        this.cartService.clearCart().subscribe(() => {
          this.cartItems = [];
          this.cartTotal = 0;
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('cart');
            localStorage.removeItem('cartCount');
          }
        });
      },
      error: (err) => {
        this.processing = false;
        this.showRazorpayModal = false;
        this.paymentError = err?.error?.message || 'Order failed. Please try again.';
      }
    });
  }  closeRazorpayModal() {
    this.showRazorpayModal = false;
    this.processing = false;
  }
  get isAddressSelectedOrFilled(): boolean {
    // If a saved address is selected, validate its phone number too
    if (this.selectedAddressIndex !== -1 && this.savedAddresses[this.selectedAddressIndex]) {
      const selected = this.savedAddresses[this.selectedAddressIndex];
      return !!(selected.phone && /^[0-9]{10}$/.test(selected.phone));
    }
    // If user is filling the new address form and required fields are present
    return !!(this.fullName && this.addressLine1 && this.city && this.state && this.zipCode && this.country && this.phone && /^[0-9]{10}$/.test(this.phone));
  }

  get addressValidationMessage(): string {
    // If a saved address is selected, validate its phone number too
    if (this.selectedAddressIndex !== -1 && this.savedAddresses[this.selectedAddressIndex]) {
      const selected = this.savedAddresses[this.selectedAddressIndex];
      if (!selected.phone || !/^[0-9]{10}$/.test(selected.phone)) {
        return 'Phone number in selected address must be exactly 10 digits';
      }
      return '';
    }
    if (!this.fullName) return 'Full name is required';
    if (!this.addressLine1) return 'Address line 1 is required';
    if (!this.city) return 'City is required';
    if (!this.state) return 'State is required';
    if (!this.zipCode) return 'ZIP code is required';
    if (!this.country) return 'Country is required';
    if (!this.phone) return 'Phone number is required';
    // Phone validation: must be 10 digits and only numbers
    if (!/^[0-9]{10}$/.test(this.phone)) return 'Phone number must be exactly 10 digits';
    return '';
  }

  scrollToAddressForm() {
    setTimeout(() => {
      const form = document.querySelector('.new-address-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  onPhoneInput(event: any) {
    // Only allow digits, limit to 10 digits, and update the input value
    let value = event.target.value;
    // Remove all non-digit characters
    value = value.replace(/[^0-9]/g, '');
    // Limit to 10 digits
    if (value.length > 10) value = value.slice(0, 10);
    this.phone = value;
    event.target.value = value;
  }
}
