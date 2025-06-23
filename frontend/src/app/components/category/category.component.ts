import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="category-container">
      <h2>Categories</h2>
      <form (ngSubmit)="addCategory()">
        <input type="text" [(ngModel)]="newCategory" name="newCategory" placeholder="New Category" required>
        <button type="submit">Add Category</button>
      </form>
      <div *ngFor="let cat of categories" class="category-item">
        <span>{{ cat.name }}</span>
        <button (click)="deleteCategory(cat.categoryId)">Delete</button>
      </div>
    </div>
  `,
  styleUrls: ['./category.component.css']
})
export class CategoryComponent {
  categories: any[] = [];
  newCategory: string = '';

  constructor(private categoryService: CategoryService) {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => { this.categories = res; },
      error: () => { this.categories = []; }
    });
  }

  addCategory() {
    if (this.newCategory.trim()) {
      this.categoryService.addCategory({ name: this.newCategory }).subscribe({
        next: () => { this.newCategory = ''; this.loadCategories(); },
        error: () => {}
      });
    }
  }

  deleteCategory(id: string) {
    // This method requires a corresponding service method
    // this.categoryService.deleteCategory(id).subscribe({
    //   next: () => { this.loadCategories(); },
    //   error: () => {}
    // });
  }
}
