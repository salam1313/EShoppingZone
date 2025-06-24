import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  readonly API_BASE = 'https://eshoppingzone.onrender.com'; // Updated to Render backend
  registerType: string = 'user';
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  validationErrors: string[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  get registerEndpoint(): string {
    return this.registerType === 'merchant'
      ? this.API_BASE + '/api/m/auth/register'
      : this.API_BASE + '/api/auth/register';
  }

  onRegister() {
    this.validationErrors = [];
    // Client-side validation
    if (!this.name) {
      this.validationErrors.push('Full name is required.');
    } else if (this.name.length > 100 || !/^[a-zA-Z\s'-]+$/.test(this.name)) {
      this.validationErrors.push('Full name cannot exceed 100 characters and can only contain letters, spaces, apostrophes, and hyphens.');
    }
    if (!this.email) {
      this.validationErrors.push('Email is required.');
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.validationErrors.push('Please enter a valid email address.');
    }
    if (!this.password) {
      this.validationErrors.push('Password is required.');
    } else if (this.password.length < 6) {
      this.validationErrors.push('Password must be at least 6 characters long.');
    }
    if (!this.confirmPassword) {
      this.validationErrors.push('Confirm password is required.');
    } else if (this.password !== this.confirmPassword) {
      this.validationErrors.push('Passwords do not match.');
    }
    if (this.validationErrors.length > 0) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';    const registerData = {
      Name: this.name,
      Email: this.email,
      Password: this.password,
      ConfirmPassword: this.confirmPassword
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    this.http.post(this.registerEndpoint, registerData, { headers }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.router.navigate(['/login'], { 
          queryParams: { message: 'Registration successful! Please login.' }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        console.error('Error response body:', error.error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        
        if (error?.error?.errors) {
          this.validationErrors = error.error.errors;
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid registration data. Please check your inputs.';
        } else if (error.status === 409) {
          this.errorMessage = 'Email already exists. Please use a different email.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }

  private validateForm(): boolean {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'All fields are required.';
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return false;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return false;
    }

    return true;
  }
}
