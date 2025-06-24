import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-manage-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-inventory.component.html',
  styleUrls: ['./manage-inventory.component.css']
})
export class ManageInventoryComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  quantityMap: { [key: string]: number } = {};

  private API_BASE = 'https://eshoppingzone.onrender.com/';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(`${this.API_BASE}/api/product`, { headers }).subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        // Initialize quantity map with current quantities
        products.forEach(product => {
          this.quantityMap[product.productId] = product.quantity;
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load products';
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  getNewQuantity(productId: string): number {
    return this.quantityMap[productId] || 0;
  }

  setNewQuantity(productId: string, event: any) {
    const value = parseInt(event.target.value) || 0;
    this.quantityMap[productId] = Math.max(0, value);
  }

  increaseQuantity(product: any, amount: number) {
    this.quantityMap[product.productId] = (this.quantityMap[product.productId] || product.quantity) + amount;
    this.updateQuantity(product);
  }

  updateQuantity(product: any) {
    const newQuantity = this.quantityMap[product.productId];
    if (newQuantity === product.quantity) {
      return; // No change
    }

    this.successMessage = '';
    this.errorMessage = '';

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const body = { quantity: newQuantity };

    this.http.patch(`${this.API_BASE}/api/product/${product.productId}/quantity`, body, { headers }).subscribe({
      next: () => {
        product.quantity = newQuantity;
        this.successMessage = `Successfully updated ${product.name} quantity to ${newQuantity}`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update quantity';
        // Reset the input to original value
        this.quantityMap[product.productId] = product.quantity;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}
