import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { AddressComponent } from './components/address/address.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { MerchantDashboardComponent } from './components/merchant-dashboard/merchant-dashboard.component';
import { ManageAddressComponent } from './components/manage-address/manage-address.component';
import { AuthGuard, GuestGuard, MerchantGuard } from './guards/auth.guard';
import { WalletTransactionsComponent } from './components/wallet/wallet-transactions.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'product/:id', component: ProductDetailsComponent },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'address', component: AddressComponent, canActivate: [AuthGuard] },
  { path: 'order-history', component: OrderHistoryComponent, canActivate: [AuthGuard] },
  { path: 'merchant', component: MerchantDashboardComponent, canActivate: [MerchantGuard] },
  { path: 'manage-address', component: ManageAddressComponent, canActivate: [AuthGuard] },
  { path: 'wallet/transactions', component: WalletTransactionsComponent, canActivate: [AuthGuard] },
];
