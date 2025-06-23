import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  canActivate(): boolean | UrlTree {
    if (!isPlatformBrowser(this.platformId)) return true; // Allow on server
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check for exp field (seconds since epoch)
        if (decoded && decoded.exp && Date.now() < decoded.exp * 1000) {
          return true;
        }
      } catch (e) {
        // Invalid token
        return this.router.parseUrl('/login');
      }
    }
    return this.router.parseUrl('/login');
  }
}

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}
  
  canActivate(): boolean | UrlTree {
    console.log('=== GuestGuard: canActivate called ===');
    if (!isPlatformBrowser(this.platformId)) return true; // Allow on server
    
    const token = localStorage.getItem('token');
    const currentUrl = this.router.url;
    console.log('GuestGuard: token exists?', !!token);
    console.log('GuestGuard: current URL:', currentUrl);
    
    if (token) {
      // If already logged in, check user role and redirect appropriately
      console.log('GuestGuard: User already logged in, checking role for proper redirect');
      
      const userStr = localStorage.getItem('user');
      const isMerchantFlag = localStorage.getItem('isMerchant');
      
      try {
        const user = JSON.parse(userStr || '{}');
        console.log('GuestGuard: parsed user:', user);
        console.log('GuestGuard: isMerchant flag:', isMerchantFlag);
        
        if (user?.role === 'merchant' || isMerchantFlag === 'true') {
          console.log('GuestGuard: Redirecting merchant to dashboard');
          return this.router.parseUrl('/merchant');
        } else {
          console.log('GuestGuard: Redirecting regular user to home');
          return this.router.parseUrl('/');
        }
      } catch (error) {
        console.warn('GuestGuard: Error parsing user data, using isMerchant flag fallback:', error);
        if (isMerchantFlag === 'true') {
          console.log('GuestGuard: Redirecting merchant to dashboard (fallback)');
          return this.router.parseUrl('/merchant');
        } else {
          console.log('GuestGuard: Redirecting to home (fallback)');
          return this.router.parseUrl('/');
        }
      }
    }
    
    console.log('GuestGuard: No token, allowing access to login');
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class MerchantGuard implements CanActivate {
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}
  canActivate(): boolean | UrlTree {
    console.log('=== MerchantGuard: canActivate called ===');
    if (!isPlatformBrowser(this.platformId)) return true; // Allow on server
    console.log('Current URL:', window.location.href);
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const isMerchantFlag = localStorage.getItem('isMerchant');
    
    console.log('MerchantGuard: localStorage contents:');
    console.log('- token exists?', !!token);
    console.log('- token value:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('- user string:', userStr);
    console.log('- isMerchant flag:', isMerchantFlag);
    
    if (!token) {
      console.log('❌ MerchantGuard: No token, redirecting to login');
      return this.router.parseUrl('/login');
    }
    // Only allow if both token and merchant role/flag are present
    try {
      const user = JSON.parse(userStr || '{}');
      console.log('MerchantGuard: parsed user object:', user);
      console.log('MerchantGuard: user.role:', user?.role);
      const isMerchantRole = user?.role?.toLowerCase() === 'merchant';
      console.log('MerchantGuard: role comparison result:', isMerchantRole);
      if ((isMerchantRole || isMerchantFlag === 'true') && token) {
        console.log('✅ MerchantGuard: User is merchant, allowing access');
        return true;
      } else {
        console.log('❌ MerchantGuard: User is not merchant or missing token, redirecting to login');
        return this.router.parseUrl('/login');
      }
    } catch (error) {
      console.error('❌ MerchantGuard: Error parsing user data:', error);
      if (isMerchantFlag === 'true' && token) {
        console.log('✅ MerchantGuard: isMerchant flag is true and token exists, allowing access');
        return true;
      }
      console.log('❌ MerchantGuard: Both user parsing and isMerchant flag failed, redirecting to login');
      return this.router.parseUrl('/login');
    }
  }
}
