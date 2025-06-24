import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private API_BASE = 'https://eshoppingzone.onrender.com/api/product';

  constructor(private http: HttpClient) {}

  getAllProducts(filters?: { minPrice?: number; maxPrice?: number; customAttributes?: { [key: string]: string } }): Observable<any> {
    let params: any = {};
    if (filters) {
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      if (filters.customAttributes) params.customAttributes = filters.customAttributes;
    }
    return this.http.get(this.API_BASE, { params });
  }

  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.API_BASE}/${id}`);
  }

  addProduct(product: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.API_BASE, product, { headers });
  }

  updateProduct(productId: string, product: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(`${this.API_BASE}/${productId}`, product, { headers });
  }

  updateProductQuantity(productId: string, quantity: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.patch(`${this.API_BASE}/${productId}/quantity`, { quantity }, { headers });
  }
}
