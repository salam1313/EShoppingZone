import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private API_BASE = 'http://localhost:5148/api/order';

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

  checkout(dto: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/checkout`, dto, { headers: this.getAuthHeaders() });
  }

  getOrderHistory(): Observable<any> {
    return this.http.get(`${this.API_BASE}/history`, { headers: this.getAuthHeaders() });
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/cancel/${orderId}`, {}, { headers: this.getAuthHeaders() });
  }
}
