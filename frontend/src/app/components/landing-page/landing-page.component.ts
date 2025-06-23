import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  categories: any[] = [];
  selectedCategory: any = null;
  subcategories: any[] = [];
  selectedSubcategory: any = null;
  products: any[] = [];
  searchTerm: string = '';
  sortOption: string = '';
  quantityMap: { [productId: string]: number } = {};
  isMerchant: boolean = false;
  imageModalOpen: boolean = false;
  currentProductImages: string[] = [];
  currentImageIndex: number = 0;
  toastMessage: string = '';
  toastVisible: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private productService: ProductService,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.productService.getAllProducts().subscribe({
      next: (res) => { this.products = res; },
      error: () => { this.products = []; }
    });
    this.categoryService.getAllCategories().subscribe({
      next: (res) => { this.categories = res; },
      error: () => { this.categories = []; }
    });
    // Remove merchant redirect from constructor
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.isMerchant = user?.role === 'merchant';
        } catch {}
      }
      // Do not redirect here
    }
  }
  ngOnInit() {
    // Remove automatic merchant redirect to avoid routing conflicts
    // Merchant redirection should be handled by login component and guards
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (event) => {
        if (event.key === 'productsUpdated') {
          this.productService.getAllProducts().subscribe({
            next: (res) => { this.products = res; }
          });
        }
      });
      // Refresh product stock every 10 seconds for real-time updates
      setInterval(() => {
        this.refreshProductStock();
      }, 10000);
      // Also refresh when window/tab regains focus
      window.addEventListener('focus', () => {
        this.refreshProductStock();
      });
    }
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

  // Enhanced filter management methods
  onSearchChange() {
    // Triggered when search input changes
  }

  onSortChange() {
    // Triggered when sort option changes
  }

  clearCategoryFilter() {
    this.selectedCategory = null;
    this.subcategories = [];
    this.selectedSubcategory = null;
  }

  clearSubcategoryFilter() {
    this.selectedSubcategory = null;
  }

  clearSearchFilter() {
    this.searchTerm = '';
  }

  clearAllFilters() {
    this.selectedCategory = null;
    this.subcategories = [];
    this.selectedSubcategory = null;
    this.searchTerm = '';
    this.sortOption = '';
  }

  trackByProductId(index: number, product: any): any {
    return product.variantId || product.id || product.productId || index;
  }

  // Enhanced stock management with real-time updates
  refreshProductStock() {
    // Always call getAllProducts with NO payload/filters unless user is actively filtering
    this.productService.getAllProducts().subscribe({
      next: (res) => {
        this.products = res;
        // Optionally, reset quantityMap if you want to clear user selections on stock update:
        // this.quantityMap = {};
      },
      error: () => { this.products = []; }
    });
  }

  incrementQuantity(item: any) {
    // Use variant id if present, else product id
    const id = item.variantId || item.id || item.productId;
    if (typeof this.quantityMap[id] !== 'number') this.quantityMap[id] = 0;
    this.quantityMap[id]++;
  }

  decrementQuantity(item: any) {
    const id = item.variantId || item.id || item.productId;
    if (typeof this.quantityMap[id] !== 'number') this.quantityMap[id] = 0;
    if (this.quantityMap[id] <= 0) {
      this.quantityMap[id] = 0;
      return;
    }
    this.quantityMap[id]--;
  }

  getQuantity(item: any): number {
    const id = item.variantId || item.id || item.productId;
    return typeof this.quantityMap[id] === 'number' ? this.quantityMap[id] : 0;
  }

  addToCart(product: any, variant?: any) {
    const toast = document.querySelector('app-toast') as any;
    if (this.isMerchant) {
      if (toast && toast.showToast) toast.showToast('Merchants cannot add products to cart.');
      this.showAnimation('merchant-cart-blocked');
      return;
    }
    console.log('DEBUG: addToCart called with:', product, variant);
    const token = localStorage.getItem('token');
    if (!token) {
      if (toast && toast.showToast) toast.showToast('Please login to add to cart!');
      this.showAnimation('login-required');
      this.router.navigate(['/login']);
      return;
    }
    let productId = product?.productId || product?.id;
    let variantIds: number[] | undefined = undefined;
    let quantity = 0;
    if (variant) {
      variantIds = [variant.id];
      quantity = this.getQuantity(variant);
    } else {
      quantity = this.getQuantity(product);
    }
    if (!productId) {
      if (toast && toast.showToast) toast.showToast('Invalid product!');
      return;
    }
    if (quantity <= 0) {
      if (toast && toast.showToast) toast.showToast('Please select a quantity greater than 0!');
      return;
    }
    const payload: any = {
      items: [
        {
          productId: productId.toString(),
          quantity: quantity,
          ...(variantIds ? { variantIds } : {})
        }
      ]
    };
    console.log('DEBUG: Add to cart payload:', payload);
    this.cartService.addToCartRaw(payload).subscribe({
      next: (res: any) => {
        if (toast && toast.showToast) toast.showToast('Product added to cart!');
        this.showAnimation('cart');
        window.dispatchEvent(new Event('storage'));
        if (window.location.pathname === '/cart') {
          setTimeout(() => window.location.reload(), 500);
        }
      },
      error: (err: any) => {
        if (err?.status === 403) {
          if (toast && toast.showToast) toast.showToast('Merchants are not allowed to use the cart.');
          this.showAnimation('merchant-cart-blocked');
        } else if (toast && toast.showToast) {
          toast.showToast(err?.error?.message || 'Failed to add to cart!');
        }
      }
    });
  }

  // Call this when the cart button is clicked
  onCartClick() {
    const toast = document.querySelector('app-toast') as any;
    if (this.isMerchant) {
      if (toast && toast.showToast) toast.showToast('Merchants cannot access the cart.');
      this.showAnimation('merchant-cart-blocked');
      return;
    }
    this.router.navigate(['/cart']);
  }

  showAnimation(type: 'cart' | 'login-success' | 'logout' | 'login-required' | 'merchant-cart-blocked') {
    if (this.isMerchant && type !== 'logout' && type !== 'merchant-cart-blocked') return;
    const anim = document.createElement('div');
    anim.className = 'custom-animation';
    if (type === 'cart') {
      anim.innerHTML = '<span style="font-size:2rem;">🛒</span> Product added to cart!';
    } else if (type === 'login-success') {
      anim.innerHTML = '<span style="font-size:2rem;">✅</span> Login successful!';
    } else if (type === 'logout') {
      anim.innerHTML = '<span style="font-size:2rem;">👋</span> Logged out!';
    } else if (type === 'login-required') {
      anim.innerHTML = '<span style="font-size:2rem;">🔒</span> Please login to add to cart!';
    } else if (type === 'merchant-cart-blocked') {
      anim.innerHTML = '<span style="font-size:2rem;">🚫</span> Merchants cannot use the cart!';
      anim.style.background = '#e53e3e';
    }
    Object.assign(anim.style, {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      background: '#e53e3e',
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

  viewProduct(product: any) {
    if (this.isMerchant) return; // Prevent merchant from viewing product details
    this.router.navigate(['/product', product.id]);
  }
  get filteredProducts() {
    let filtered = this.flattenedProducts; // Apply filtering to flattened products
    
    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategory.categoryId);
    }
    
    // Apply subcategory filter
    if (this.selectedSubcategory) {
      filtered = filtered.filter(p => p.subcategoryId === this.selectedSubcategory.subcategoryId);
    }
    
    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.displayName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    if (this.sortOption) {
      switch (this.sortOption) {
        case 'price-asc':
          filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price-desc':
          filtered = filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'name-asc':
          filtered = filtered.sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''));
          break;
        case 'name-desc':
          filtered = filtered.sort((a, b) => (b.displayName || b.name || '').localeCompare(a.displayName || a.name || ''));
          break;
        case 'stock-asc':
          filtered = filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
          break;
        case 'stock-desc':
          filtered = filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));
          break;
      }
    }
    
    return filtered;
  }

  /**
   * Returns the best image URL for a product, or the fallback if none is available or valid.
   * No name-based placeholder logic; only real or fallback image.
   */
  getProductImage(product: any): string {
    if (product.mainImageUrl && typeof product.mainImageUrl === 'string' && product.mainImageUrl.trim() !== '') {
      return product.mainImageUrl;
    }
    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      return product.image;
    }
    return 'assets/no-image.png';
  }

  /**
   * Flattens products so each variant is shown as a separate product card.
   * If no variants, the product itself is shown.
   */
  get flattenedProducts() {
    const result: any[] = [];
    for (const product of this.products) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          result.push({
            ...product,
            variant,
            displayName: product.name + ' - ' + Object.entries(variant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', '),
            price: variant.price,
            stock: variant.quantity,
            variantId: variant.id
          });
        }
      } else {
        result.push({
          ...product,
          displayName: product.name,
          price: product.price,
          stock: product.quantity,
          variantId: null
        });
      }
    }
    return result;
  }

  getProductTooltip(product: any): string {
    let tooltip = `Name: ${product.name}\nDescription: ${product.description}`;
    if (product.price) tooltip += `\nPrice: ₹${product.price}`;
    if (product.categoryName) tooltip += `\nCategory: ${product.categoryName}`;
    if (product.subcategoryName) tooltip += `\nSubcategory: ${product.subcategoryName}`;
    if (product.variants && product.variants.length > 0) {
      tooltip += `\nVariants:`;
      product.variants.forEach((v: any, idx: number) => {
        tooltip += `\n  - ${v.name || v.variantName || 'Variant'}: ₹${v.price}`;
        if (v.attributes) {
          Object.entries(v.attributes).forEach(([key, value]) => {
            tooltip += `, ${key}: ${value}`;
          });
        }
      });
    }
    return tooltip;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/no-image.png';
  }

  openImageModal(product: any) {
    // Support both imageUrls (array) and fallback to mainImageUrl/image
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      this.currentProductImages = product.imageUrls;
    } else if (product.mainImageUrl) {
      this.currentProductImages = [product.mainImageUrl];
    } else if (product.image) {
      this.currentProductImages = [product.image];
    } else {
      this.currentProductImages = ['assets/no-image.png'];
    }
    this.currentImageIndex = 0;
    this.imageModalOpen = true;
  }

  closeImageModal() {
    this.imageModalOpen = false;
    this.currentProductImages = [];
    this.currentImageIndex = 0;
  }

  prevImage(event: Event) {
    event.stopPropagation();
    if (this.currentProductImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.currentProductImages.length) % this.currentProductImages.length;
    }
  }

  nextImage(event: Event) {
    event.stopPropagation();
    if (this.currentProductImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.currentProductImages.length;
    }
  }

  onModalImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/no-image.png';
  }

  showToast(message: string, duration: number = 2500) {
    this.toastMessage = message;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      setTimeout(() => this.toastMessage = '', 300); // Wait for animation
    }, duration);
  }
}