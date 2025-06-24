import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private API_BASE = 'https://eshoppingzone.onrender.com/api/category';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllCategories(): Observable<any> {
    return this.http.get(this.API_BASE);
  }

  getCategory(id: string): Observable<any> {
    return this.http.get(`${this.API_BASE}/${id}`);
  }  addCategory(categoryData: { name: string; description?: string }): Observable<any> {
    return this.http.post(this.API_BASE, categoryData, { headers: this.getAuthHeaders() });
  }
  addSubcategory(categoryId: string, subcategoryData: { name: string; description: string }): Observable<any> {
    return this.http.put(`${this.API_BASE}/${categoryId}/subcategory`, subcategoryData, { headers: this.getAuthHeaders() });
  }

  getSubcategory(id: string): Observable<any> {
    return this.http.get(`${this.API_BASE}/sub/${id}`);
  }
  // Add this method to support deleting a category
  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.API_BASE}/${id}`, { headers: this.getAuthHeaders() });
  }
}
