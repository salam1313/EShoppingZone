import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  readonly API_BASE = 'http://localhost:5148'; // Updated to match current backend URL
  loginType: string = 'user';
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  validationErrors: string[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  get loginEndpoint(): string {
    return this.loginType === 'merchant'
      ? this.API_BASE + '/api/m/auth/login'
      : this.API_BASE + '/api/auth/login';
  }

  onLogin() {
    this.validationErrors = [];
    // Client-side validation
    if (!this.email) {
      this.validationErrors.push('Email is required.');
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.validationErrors.push('Please enter a valid email address.');
    }
    if (!this.password) {
      this.validationErrors.push('Password is required.');
    }
    if (this.validationErrors.length > 0) {
      return;
    }
    const toast = document.querySelector('app-toast') as any;
    this.errorMessage = '';
    const body = { Email: this.email, Password: this.password };
    
    this.http.post<any>(this.loginEndpoint, body, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) })
      .subscribe({
        next: (res) => {          console.log('Login response received:', res);
          
          // Set basic login state first
          localStorage.setItem('isLoggedIn', 'true');
          
          if (res.token) {
            localStorage.setItem('token', res.token);
            console.log('Token stored successfully');
            
            // Decode JWT token to extract user information
            try {
              const tokenPayload = JSON.parse(atob(res.token.split('.')[1]));
              const userName = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
                             tokenPayload['name'] || 
                             tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                             this.email;
              
              const userRole = tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                             tokenPayload['role'] || 
                             (this.loginType === 'merchant' ? 'merchant' : 'user');
              
              // Store user information
              localStorage.setItem('userName', userName);
              localStorage.setItem('user', JSON.stringify({ role: userRole }));
              localStorage.setItem('isMerchant', userRole === 'Merchant' ? 'true' : 'false');
              console.log('User data stored successfully:');
              console.log('- userName:', userName);
              console.log('- userRole:', userRole);
              console.log('- isMerchant:', userRole === 'Merchant' ? 'true' : 'false');
              
            } catch (error) {
              console.warn('Could not decode token, using fallback:', error);
              
              // Fallback based on login type
              const fallbackRole = this.loginType === 'merchant' ? 'Merchant' : 'user';
              localStorage.setItem('user', JSON.stringify({ role: fallbackRole }));
              localStorage.setItem('isMerchant', fallbackRole === 'Merchant' ? 'true' : 'false');
              console.log('Fallback data stored:');
              console.log('- fallbackRole:', fallbackRole);
              console.log('- isMerchant:', fallbackRole === 'Merchant' ? 'true' : 'false');
            }
          } else {
            console.warn('No token received in response');
          }
          
          if (toast && toast.showToast) toast.showToast('Login successful!');
          this.showAnimation('login-success');
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('loginStatusChanged'));
            console.log('Login type:', this.loginType);
          console.log('Stored user role:', localStorage.getItem('user'));
          console.log('Stored isMerchant:', localStorage.getItem('isMerchant'));          // Use a more robust approach for merchant redirection
          if (this.loginType === 'merchant') {
            console.log('=== MERCHANT LOGIN FLOW ===');
            console.log('About to set localStorage and redirect');
            // Always use window.location.href for merchant login for robust redirect
            setTimeout(() => {
              window.location.href = '/merchant';
            }, 300);
          } else {
            console.log('Redirecting regular user to home');
            this.router.navigateByUrl('/', { replaceUrl: true });
          }
        },
        error: (err) => {
          if (err?.error?.errors) {
            this.validationErrors = err.error.errors;
          } else {
            this.errorMessage = err?.error?.message || 'Invalid credentials. Please try again!';
          }
          const toast = document.querySelector('app-toast') as any;
          if (toast && toast.showToast) toast.showToast(this.errorMessage || this.validationErrors.join('\n'));
          console.error('Login error:', err);
        }
      });
  }

  showAnimation(type: 'login-success') {
    const anim = document.createElement('div');
    anim.className = 'custom-animation';
    if (type === 'login-success') {
      anim.innerHTML = '<span style="font-size:2rem;">✅</span> Login successful!';
    }
    Object.assign(anim.style, {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      background: '#38a169',
      color: '#fff',
      padding: '1rem 2rem',
      borderRadius: '0.7rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      fontSize: '1.1rem',
      zIndex: 2000,
      opacity: 0.97,
      transition: 'all 0.5s',
      pointerEvents: 'none',
      animation: 'fadeInOutAnim 2.2s',
    });
    document.body.appendChild(anim);
    setTimeout(() => { anim.style.opacity = '0'; }, 1800);
    setTimeout(() => { document.body.removeChild(anim); }, 2200);
  }
}
