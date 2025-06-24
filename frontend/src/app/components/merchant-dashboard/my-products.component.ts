import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-products.component.html',
  styleUrls: ['./my-products.component.css']
})
export class MyProductsComponent implements OnInit {
  products: any[] = [];
  loading = false;
  errorMessage = '';
  private API_BASE = 'https://eshoppingzone.onrender.com/';

  // Modal state
  showDeleteModal = false;
  productToDelete: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMyProducts();
  }

  loadMyProducts() {
    this.loading = true;
    this.errorMessage = '';
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.get<any[]>(`${this.API_BASE}/api/product/my-products`, { headers }).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load your products.';
        this.loading = false;
      }
    });
  }

  openDeleteModal(productId: string) {
    this.productToDelete = productId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  confirmDelete() {
    if (!this.productToDelete) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.delete(`${this.API_BASE}/api/product/${this.productToDelete}`, { headers }).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.productId !== this.productToDelete);
        this.closeDeleteModal();
      },
      error: () => {
        this.errorMessage = 'Failed to delete product.';
        this.closeDeleteModal();
      }
    });
  }

  getUniqueCategories(): string[] {
    if (!this.products || this.products.length === 0) return [];
    const cats = this.products.map(p => p.categoryId).filter(Boolean);
    return Array.from(new Set(cats));
  }
}
