import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {
  productType: 'withVariants' | 'withoutVariants' = 'withVariants';
  productFormWithVariants: FormGroup;
  productFormWithoutVariants: FormGroup;
  categories: any[] = [];
  subcategoriesWithVariants: any[] = [];
  subcategoriesWithoutVariants: any[] = [];
  successMessageWithVariants = '';
  errorMessageWithVariants = '';
  successMessageWithoutVariants = '';
  errorMessageWithoutVariants = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private categoryService: CategoryService) {
    this.productFormWithVariants = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: ['', Validators.required],
      subcategoryId: ['', Validators.required],
      mainImageUrl: ['', [Validators.required]],
      variants: this.fb.array([
        this.fb.group({
          quantity: [0, [Validators.required, Validators.min(0)]],
          price: [0, [Validators.required, Validators.min(0.01)]],
          attributes: this.fb.group({})
        })
      ])
    });
    this.productFormWithoutVariants = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: ['', Validators.required],
      subcategoryId: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      mainImageUrl: ['', [Validators.required]]
    });
  }

  setProductType(type: 'withVariants' | 'withoutVariants') {
    this.productType = type;
    // Reset forms and subcategories on tab switch
    if (type === 'withVariants') {
      this.productFormWithVariants.reset();
      this.variantsWithVariants.clear();
      this.addVariantWithVariants();
      this.subcategoriesWithVariants = [];
    } else {
      this.productFormWithoutVariants.reset();
      this.subcategoriesWithoutVariants = [];
    }
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {}
    });
  }

  onCategoryChange(event: any, type: 'withVariants' | 'withoutVariants') {
    const categoryId = event.target.value;
    const selectedCategory = this.categories.find(cat => cat.categoryId === categoryId);
    if (type === 'withVariants') {
      this.subcategoriesWithVariants = selectedCategory?.subcategories || [];
      this.productFormWithVariants.get('subcategoryId')?.setValue('');
    } else {
      this.subcategoriesWithoutVariants = selectedCategory?.subcategories || [];
      this.productFormWithoutVariants.get('subcategoryId')?.setValue('');
    }
  }

  get variantsWithVariants() {
    return this.productFormWithVariants.get('variants') as FormArray;
  }
  addVariantWithVariants() {
    this.variantsWithVariants.push(this.fb.group({
      quantity: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      attributes: this.fb.group({})
    }));
  }
  removeVariantWithVariants(i: number) {
    this.variantsWithVariants.removeAt(i);
  }
  addAttributeWithVariants(variantIndex: number) {
    const attributes = (this.variantsWithVariants.at(variantIndex).get('attributes') as FormGroup);
    const key = prompt('Enter attribute name:');
    if (key) attributes.addControl(key, this.fb.control(''));
  }
  removeAttributeWithVariants(variantIndex: number, key: string) {
    const attributes = (this.variantsWithVariants.at(variantIndex).get('attributes') as FormGroup);
    attributes.removeControl(key);
  }
  getAttributeKeys(attributes: any): string[] {
    if (!attributes || !attributes.controls) return [];
    return Object.keys((attributes as FormGroup).controls);
  }

  onSubmitWithVariants() {
    this.successMessageWithVariants = '';
    this.errorMessageWithVariants = '';
    if (this.variantsWithVariants.length === 0) {
      this.errorMessageWithVariants = 'At least one product variant is required.';
      return;
    }
    if (this.productFormWithVariants.invalid) {
      this.errorMessageWithVariants = 'Some required fields are missing or invalid.';
      return;
    }
    const payload = {
      name: this.productFormWithVariants.value.name,
      description: this.productFormWithVariants.value.description,
      categoryId: this.productFormWithVariants.value.categoryId,
      subcategoryId: this.productFormWithVariants.value.subcategoryId,
      mainImageUrl: this.productFormWithVariants.value.mainImageUrl,
      variants: this.variantsWithVariants.value
    };
    // Use a dedicated endpoint for products with variants
    const token = localStorage.getItem('token');
    this.http.post<any>('http://localhost:5148/api/product/with-variants', payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).subscribe({
      next: () => {
        this.successMessageWithVariants = 'Product with variants added successfully!';
        this.productFormWithVariants.reset();
        this.variantsWithVariants.clear();
        this.addVariantWithVariants();
      },
      error: (err) => {
        if (err?.error?.errors) {
          this.errorMessageWithVariants = Array.isArray(err.error.errors)
            ? err.error.errors.join('\n')
            : Object.values(err.error.errors).flat().join('\n');
        } else {
          this.errorMessageWithVariants = err?.error?.message || 'Failed to add product!';
        }
      }
    });
  }

  onSubmitWithoutVariants() {
    this.successMessageWithoutVariants = '';
    this.errorMessageWithoutVariants = '';
    if (this.productFormWithoutVariants.invalid) {
      this.errorMessageWithoutVariants = 'Some required fields are missing or invalid.';
      return;
    }
    // Build payload WITHOUT variants field
    const payload: any = {
      name: this.productFormWithoutVariants.value.name,
      description: this.productFormWithoutVariants.value.description,
      categoryId: this.productFormWithoutVariants.value.categoryId,
      subcategoryId: this.productFormWithoutVariants.value.subcategoryId,
      mainImageUrl: this.productFormWithoutVariants.value.mainImageUrl,
      quantity: Number(this.productFormWithoutVariants.value.quantity),
      price: Number(this.productFormWithoutVariants.value.price)
    };
    // Use a dedicated endpoint for products without variants
    const token = localStorage.getItem('token');
    this.http.post<any>('http://localhost:5148/api/product/without-variants', payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).subscribe({
      next: () => {
        this.successMessageWithoutVariants = 'Product added successfully!';
        this.productFormWithoutVariants.reset();
      },
      error: (err) => {
        if (err?.error?.errors) {
          this.errorMessageWithoutVariants = Array.isArray(err.error.errors)
            ? err.error.errors.join('\n')
            : Object.values(err.error.errors).flat().join('\n');
        } else {
          this.errorMessageWithoutVariants = err?.error?.message || 'Failed to add product!';
        }
      }
    });
  }
}
