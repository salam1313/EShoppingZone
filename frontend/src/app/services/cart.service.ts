import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private API_BASE = 'https://eshoppingzone.onrender.com/api/cart';

  constructor(private http: HttpClient) {}


  private getAuthHeaders(): HttpHeaders {
    let token = '';
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('token') || '';
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getCart(): Observable<any> {
    return this.http.get(`${this.API_BASE}`, { headers: this.getAuthHeaders() });
  }

  addToCart(productId: string, quantity: number, variantIds?: number[]): Observable<any> {
    console.log('DEBUG: cart.service.ts addToCart called', productId, quantity, variantIds);
    const item: any = { ProductId: productId, Quantity: quantity };
    if (variantIds && variantIds.length > 0) {
      item.VariantIds = variantIds;
    }
    const body = { items: [item] };
    // Debug: Log the payload before sending
    console.log('Add to cart payload:', body);
    return this.http.post(`${this.API_BASE}/add`, body, { headers: this.getAuthHeaders() });
  }

  addToCartRaw(payload: any): Observable<any> {
    // Sends the payload as-is to /api/cart/add
    return this.http.post(`${this.API_BASE}/add`, payload, { headers: this.getAuthHeaders() });
  }

  updateCart(items: any[]): Observable<any> {
    // Use capital 'Items' to match backend DTO
    return this.http.put(`${this.API_BASE}/update`, { Items: items }, { headers: this.getAuthHeaders() });
  }

  removeItem(cartItemId: string): Observable<any> {
    return this.http.delete(`${this.API_BASE}/${cartItemId}`, { headers: this.getAuthHeaders() });
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.API_BASE}`, { headers: this.getAuthHeaders() });
  }

  getCartCount(): Observable<any> {
    return this.http.get(`${this.API_BASE}/count`, { headers: this.getAuthHeaders() });
  }
}
