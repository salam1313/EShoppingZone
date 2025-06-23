import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent implements OnInit {
  // Category form data
  categoryForm = {
    name: '',
    description: ''
  };

  // Subcategory form data
  subcategoryForm = {
    categoryId: '',
    name: '',
    description: ''
  };

  // State management
  categories: any[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';
  activeTab = 'category'; // 'category' or 'subcategory'

  constructor(private categoryService: CategoryService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.clearMessages();
  }

  addCategory() {
    if (!this.categoryForm.name.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    this.loading = true;
    this.clearMessages();

    const categoryData = {
      name: this.categoryForm.name.trim(),
      description: this.categoryForm.description.trim() || undefined
    };

    this.categoryService.addCategory(categoryData).subscribe({
      next: (response) => {
        this.successMessage = 'Category added successfully!';
        this.categoryForm = { name: '', description: '' };
        this.loadCategories(); // Refresh the categories list
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to add category';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  addSubcategory() {
    if (!this.subcategoryForm.categoryId) {
      this.errorMessage = 'Please select a category';
      return;
    }

    if (!this.subcategoryForm.name.trim()) {
      this.errorMessage = 'Subcategory name is required';
      return;
    }

    if (!this.subcategoryForm.description.trim()) {
      this.errorMessage = 'Subcategory description is required';
      return;
    }

    this.loading = true;
    this.clearMessages();

    const subcategoryData = {
      name: this.subcategoryForm.name.trim(),
      description: this.subcategoryForm.description.trim()
    };

    this.categoryService.addSubcategory(this.subcategoryForm.categoryId, subcategoryData).subscribe({
      next: (response) => {
        this.successMessage = 'Subcategory added successfully!';
        this.subcategoryForm = { categoryId: '', name: '', description: '' };
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to add subcategory';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getSelectedCategoryName(): string {
    const selectedCategory = this.categories.find(cat => cat.categoryId === this.subcategoryForm.categoryId);
    return selectedCategory ? selectedCategory.name : '';
  }
}