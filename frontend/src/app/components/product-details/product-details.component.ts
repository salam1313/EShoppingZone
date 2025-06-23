import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent {
  product: any = null;
  quantity: number = 1;
  selectedVariantId?: number;
  validationErrors: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {
    const id = this.route.snapshot.params['id'];
    this.productService.getProduct(id).subscribe({
      next: (res) => { this.product = res; },
      error: () => { this.product = null; }
    });
  }

  addToCart() {
    this.validationErrors = [];
    const toast = document.querySelector('app-toast') as any;
    const token = localStorage.getItem('token');
    if (!token) {
      if (toast && toast.showToast) toast.showToast('Please login to add to cart!');
      return;
    }
    // Client-side validation
    if (!this.product) {
      this.validationErrors.push('Product not loaded.');
    }
    if (!this.quantity || this.quantity < 1) {
      this.validationErrors.push('Quantity must be at least 1.');
    }
    if (this.product.variants && this.product.variants.length > 0 && !this.selectedVariantId) {
      this.validationErrors.push('Please select a variant.');
    }
    if (this.validationErrors.length > 0) {
      if (toast && toast.showToast) toast.showToast(this.validationErrors.join('\n'));
      return;
    }
    let variantIds: number[] | undefined = undefined;
    if (this.product.variants && this.product.variants.length > 0) {
      if (this.selectedVariantId !== undefined) {
        variantIds = [this.selectedVariantId];
      }
    }
    this.cartService.addToCart(this.product.productId || this.product.id, this.quantity, variantIds).subscribe({
      next: () => {
        if (toast && toast.showToast) toast.showToast('Product added to cart!');
      },
      error: (err) => {
        if (err?.error?.errors) {
          this.validationErrors = err.error.errors;
        } else {
          if (toast && toast.showToast) toast.showToast(err?.error?.message || 'Failed to add to cart!');
        }
      }
    });
  }
}
