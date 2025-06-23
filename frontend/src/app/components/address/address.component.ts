import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.css']
})
export class AddressComponent {
  address: string = '';
  editing = false;

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.address = localStorage.getItem('userAddress') || '';
    }
  }

  saveAddress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('userAddress', this.address);
      this.editing = false;
    }
  }

  edit() {
    this.editing = true;
  }

  proceedToCheckout() {
    // This method can be customized to emit an event or navigate to the next step
    // For now, just a placeholder for integration with checkout flow
    // Example: this.router.navigate(['/checkout/confirm']);
    alert('Proceeding to checkout with address: ' + this.address);
  }
}
