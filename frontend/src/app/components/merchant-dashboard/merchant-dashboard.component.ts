import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AddProductComponent } from './add-product.component';
import { ShowCategoriesComponent } from './show-categories.component';
import { ManageInventoryComponent } from './manage-inventory.component';
import { AddCategoryComponent } from './add-category.component';
import { ManageOrdersComponent } from './manage-orders.component';
import { MyProductsComponent } from './my-products.component';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [CommonModule, AddProductComponent, ShowCategoriesComponent, ManageInventoryComponent, AddCategoryComponent, ManageOrdersComponent, MyProductsComponent],
  templateUrl: './merchant-dashboard.component.html',
  styleUrls: ['./merchant-dashboard.component.css']
})
export class MerchantDashboardComponent implements OnInit {
  showAddProduct = false;
  showCategories = false;
  showInventory = false;
  showAddCategory = false;
  showManageOrders = false;
  showMyProducts = false;

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}
    // Ensure only one section is open at a time
  openAddProduct() {
    this.showAddProduct = true;
    this.showCategories = false;
    this.showInventory = false;
    this.showAddCategory = false;
    this.showManageOrders = false;
    this.showMyProducts = false;
  }
  
  openShowCategories() {
    this.showCategories = true;
    this.showAddProduct = false;
    this.showInventory = false;
    this.showAddCategory = false;
    this.showManageOrders = false;
    this.showMyProducts = false;
  }
    openAddCategory() {
    this.showAddCategory = true;
    this.showAddProduct = false;
    this.showCategories = false;
    this.showInventory = false;
    this.showManageOrders = false;
    this.showMyProducts = false;
  }
  
  openInventory() {
    this.showInventory = true;
    this.showAddProduct = false;
    this.showCategories = false;
    this.showAddCategory = false;
    this.showManageOrders = false;
    this.showMyProducts = false;
  }
  openManageOrders() {
    this.showManageOrders = true;
    this.showAddProduct = false;
    this.showCategories = false;
    this.showInventory = false;
    this.showAddCategory = false;
    this.showMyProducts = false;
  }
  openMyProducts() {
    this.showMyProducts = true;
    this.showAddProduct = false;
    this.showCategories = false;
    this.showInventory = false;
    this.showAddCategory = false;
    this.showManageOrders = false;
  }
  
  closeAll() {
    this.showAddProduct = false;
    this.showCategories = false;
    this.showInventory = false;
    this.showAddCategory = false;
    this.showManageOrders = false;
    this.showMyProducts = false;
  }

  // Prevent browser back from logging out, stay on merchant page
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    // If on merchant page, reload the dashboard instead of logging out or navigating away
    if (window.location.pathname === '/merchant') {
      window.location.reload(); // Refreshes the dashboard, keeps session
    }
  }  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('=== Merchant Dashboard Component: ngOnInit ===');
      console.log('Current localStorage contents:');
      console.log('- token:', localStorage.getItem('token') ? 'exists' : 'null');
      console.log('- user:', localStorage.getItem('user'));
      console.log('- isMerchant:', localStorage.getItem('isMerchant'));
      console.log('- userName:', localStorage.getItem('userName'));
    }
    // The MerchantGuard has already validated authentication and merchant status
    // No need to duplicate that logic here
    console.log('✅ Merchant dashboard initialized successfully');
    console.log('✅ Authentication was already validated by MerchantGuard');
  }
}
