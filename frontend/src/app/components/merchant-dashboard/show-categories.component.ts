import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-show-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-categories.component.html',
  styleUrls: ['./show-categories.component.css']
})
export class ShowCategoriesComponent implements OnInit {
  categories: any[] = [];
  errorMessage = '';
  subcategoriesByCatId: { [catId: string]: any[] } = {};
  loadingSub: { [catId: string]: boolean } = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('https://eshoppingzone.onrender.com/api/category').subscribe({
      next: (res) => {
        this.categories = res;
        // For each category, fetch its subcategories
        for (const cat of this.categories) {
          this.http.get<any>(`https://eshoppingzone.onrender.com/api/category/${cat.categoryId}`).subscribe({
            next: (catRes) => {
              cat.subcategories = catRes.subcategories || [];
            },
            error: () => {
              cat.subcategories = [];
            }
          });
        }
      },
      error: (err) => { this.errorMessage = err?.error?.message || 'Failed to load categories!'; }
    });
  }

  fetchSubcategories(catId: string) {
    if (this.subcategoriesByCatId[catId]) return; // Already loaded
    this.loadingSub[catId] = true;
    this.http.get<any>(`https://eshoppingzone.onrender.com/api/category/${catId}`).subscribe({
      next: (res) => {
        this.subcategoriesByCatId[catId] = res.subcategories || [];
        this.loadingSub[catId] = false;
      },
      error: () => {
        this.subcategoriesByCatId[catId] = [];
        this.loadingSub[catId] = false;
      }
    });
  }

  deleteCategory(categoryId: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.http.delete(`https://eshoppingzone.onrender.com/api/category/${categoryId}`).subscribe({
      next: () => {
        this.categories = this.categories.filter(cat => cat.categoryId !== categoryId);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete category!';
      }
    });
  }
}
