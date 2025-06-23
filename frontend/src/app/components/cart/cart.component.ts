import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  showStockWarning: boolean = false;
  stockWarningMsg: string = '';
  stockErrorItemId: string | null = null; // Track which item has stock error
  lastValidQty: { [cartItemId: string]: number } = {};
  updatingQty: { [cartItemId: string]: boolean } = {};
  debounceTimers: { [cartItemId: string]: any } = {};

  constructor(private cartService: CartService, private router: Router) {}
  ngOnInit() {
    // Prevent merchant from accessing cart - use proper role checking
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.role === 'merchant') {
            // Use Angular router instead of window.location
            this.router.navigate(['/merchant']);
            return;
          }
        } catch {}
      }
    }
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res && Array.isArray(res.items)) {
          this.cartItems = res.items;
        } else if (Array.isArray(res)) {
          this.cartItems = res;
        } else {
          this.cartItems = [];
        }
        // Save last valid qty for each item
        this.cartItems.forEach(item => {
          this.lastValidQty[item.cartItemId] = item.quantity;
        });
      },
      error: () => {
        this.cartItems = [];
      }
    });
  }

  get total() {
    return this.cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  // Returns a user-friendly error message if quantity is invalid or exceeds stock
  getQtyErrorMsg(item: any): string | null {
    const qty = Math.floor(Number(item.quantity));
    if (isNaN(qty) || qty < 1) return 'Please enter a quantity of at least 1.';
    if (item.stock !== undefined && qty > item.stock) {
      return `You cannot order more than available stock (${item.stock}).`;
    }
    return null;
  }

  // Plus button: increments quantity, but never above stock
  increment(item: any) {
    let qty = Math.floor(Number(item.quantity));
    if (isNaN(qty) || qty < 1) qty = 1;
    // Clamp to stock: never allow increment above stock
    if (item.stock !== undefined && qty >= item.stock) {
      item.quantity = item.stock;
      return;
    }
    this.setQuantity(item, qty + 1);
  }

  // Minus button: decrements quantity, but never below 1
  decrement(item: any) {
    let qty = Math.floor(Number(item.quantity));
    if (isNaN(qty) || qty <= 1) return;
    this.setQuantity(item, qty - 1);
  }

  // Sets quantity, syncs with backend/localStorage, always clamps to valid range
  setQuantity(item: any, newQty: number, forceUpdateLocalStorage: boolean = false) {
    let clamped = Math.floor(Number(newQty));
    if (isNaN(clamped) || clamped < 1) clamped = 1;
    if (item.stock !== undefined && clamped > item.stock) clamped = item.stock;
    item.quantity = clamped;
    this.lastValidQty[item.cartItemId] = clamped;
    this.updatingQty[item.cartItemId] = true;
    // Always sync to localStorage for persistence
    if (typeof window !== 'undefined' && window.localStorage) {
      let cart = localStorage.getItem('cart');
      let cartArr = [];
      if (cart) {
        cartArr = JSON.parse(cart);
        const idx = cartArr.findIndex((ci: any) => ci.cartItemId === item.cartItemId);
        if (idx !== -1) {
          cartArr[idx].quantity = clamped;
        } else {
          cartArr.push({ ...item, quantity: clamped });
        }
      } else {
        cartArr = [{ ...item, quantity: clamped }];
      }
      localStorage.setItem('cart', JSON.stringify(cartArr));
    }
    // Sync backend
    this.cartService.updateCart([{ CartItemId: item.cartItemId, Quantity: clamped }]).subscribe({
      next: () => {
        this.updatingQty[item.cartItemId] = false;
        const toast = document.querySelector('app-toast') as any;
        if (toast && toast.showToast) toast.showToast('Quantity updated!');
      },
      error: (err) => {
        this.updatingQty[item.cartItemId] = false;
        // Show a generic error toast for backend errors
        const backendMsg = err?.error?.message || (err?.error?.errors ? err.error.errors.join(', ') : null) || '';
        const toast = document.querySelector('app-toast') as any;
        if (toast && toast.showToast) {
          const msg = backendMsg || 'Failed to update quantity. Please try again.';
          toast.showToast(msg);
        }
      }
    });
  }

  resetInput(item: any) {
    // Reset input to last valid value
    item.quantity = this.lastValidQty[item.cartItemId] || 1;
    // Also update input field if present
    setTimeout(() => {
      const input = document.getElementById('qty-input-' + item.cartItemId) as HTMLInputElement;
      if (input) input.value = String(item.quantity);
    }, 0);
  }

  closeStockWarning() {
    this.showStockWarning = false;
    this.stockWarningMsg = '';
    // Do NOT reset input here, just close the modal and let user adjust the value
    this.stockErrorItemId = null;
  }

  removeItem(item: any) {
    this.cartService.removeItem(item.cartItemId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.cartItemId !== item.cartItemId);
        const toast = document.querySelector('app-toast') as any;
        if (toast && toast.showToast) toast.showToast('Item removed from cart!');
      }
    });
  }

  clearCart() {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.cartItems = [];
        const toast = document.querySelector('app-toast') as any;
        if (toast && toast.showToast) toast.showToast('Cart cleared!');
      }
    });
  }

  get hasInvalidItem() {
    // Defensive: always check type and stock
    return this.cartItems.some(item => {
      let qty = Math.floor(Number(item.quantity));
      if (isNaN(qty) || qty < 1) return true;
      if (item.stock !== undefined && qty >= item.stock) return true;
      return false;
    });
  }

  // Disable checkout if any item is invalid (less than 1 or more than or equal to stock)
  get canProceedToCheckout() {
    return !this.cartItems.some(item => {
      let qty = Math.floor(Number(item.quantity));
      if (isNaN(qty) || qty < 1) return true;
      if (item.stock !== undefined && qty >= item.stock) return true;
      return false;
    }) && !this.isAnyItemUpdating;
  }

  goToCheckout() {
    // Check for any invalid item before proceeding
    const overstockItem = this.cartItems.find(item => {
      let qty = Math.floor(Number(item.quantity));
      if (isNaN(qty) || qty < 1) return true;
      if (item.stock !== undefined && qty >= item.stock) return true;
      return false;
    });
    if (overstockItem) {
      this.showStockWarning = true;
      this.stockWarningMsg = `❌ You cannot order more than available stock for "${overstockItem.productName}" (max: ${overstockItem.stock}). Please adjust the quantity to proceed.`;
      this.stockErrorItemId = overstockItem.cartItemId;
      return;
    }
    // Only proceed if all quantities are valid
    this.router.navigate(['/checkout']);
  }

  getSubtotal(item: any) {
    return item.unitPrice * item.quantity;
  }

  get isAnyItemUpdating() {
    return this.cartItems.some(i => this.updatingQty[i.cartItemId]);
  }
}
