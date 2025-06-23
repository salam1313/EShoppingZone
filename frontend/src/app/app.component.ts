import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend';
  hideNavbar = false;
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        console.log('=== Navigation completed ===');
        console.log('URL:', event.url);
        console.log('ID:', event.id);
        console.log('urlAfterRedirects:', event.urlAfterRedirects);
        
        // Always show navbar, even on login/register
        this.hideNavbar = false;
      }
    });
  }

  // Add a method to hide navbar after login is done
  onLoginSuccess() {
    this.hideNavbar = false;
  }
}
