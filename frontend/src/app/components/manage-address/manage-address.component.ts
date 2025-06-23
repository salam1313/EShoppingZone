import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-address',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-address.component.html',
  styleUrls: ['./manage-address.component.css']
})
export class ManageAddressComponent implements OnInit {
  addresses: any[] = [];
  selectedIndex: number = -1;
  showForm = false;
  editingIndex = -1;
  form: any = {
    name: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: '', phone: ''
  };

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        this.addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
      } catch { this.addresses = []; }
    }
  }

  openAddAddress() {
    this.editingIndex = -1;
    this.form = { name: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: '', phone: '' };
    this.showForm = true;
  }

  editAddress(i: number) {
    this.editingIndex = i;
    this.form = { ...this.addresses[i] };
    this.showForm = true;
  }

  deleteAddress(i: number) {
    this.addresses.splice(i, 1);
    this.saveToStorage();
  }

  saveAddress() {
    if (this.editingIndex === -1) {
      this.addresses.push({ ...this.form });
    } else {
      this.addresses[this.editingIndex] = { ...this.form };
    }
    this.saveToStorage();
    this.showForm = false;
  }

  closeForm() {
    this.showForm = false;
  }

  saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('savedAddresses', JSON.stringify(this.addresses));
    }
  }
}
