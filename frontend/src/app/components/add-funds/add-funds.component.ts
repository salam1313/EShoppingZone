import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-funds',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Page Not Available</h2>
      <p>This feature is currently disabled.</p>
    </div>
  `,
  styles: [`
    .container { max-width: 400px; margin: 20px auto; padding: 20px; text-align: center; }
  `]
})
export class AddFundsComponent {
  // Component disabled - no wallet functionality
}
