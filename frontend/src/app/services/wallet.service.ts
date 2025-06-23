import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WalletAmountPayload { amount: number; }

export interface WalletTransaction {
  amount: number;
  type: string;
  description: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private API_BASE = 'http://localhost:5148/api/wallet';

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

  getBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(`${this.API_BASE}/balance`, { headers: this.getAuthHeaders() });
  }

  addFunds(payload: WalletAmountPayload): Observable<{ message: string, newBalance: number }> {
    return this.http.post<{ message: string, newBalance: number }>(`${this.API_BASE}/add-funds`, payload, { headers: this.getAuthHeaders() });
  }

  payWithWallet(payload: WalletAmountPayload): Observable<{ message: string, newBalance: number }> {
    return this.http.post<{ message: string, newBalance: number }>(`${this.API_BASE}/pay`, payload, { headers: this.getAuthHeaders() });
  }

  getRecentTransactions(): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.API_BASE}/transactions`, { headers: this.getAuthHeaders() });
  }
}
