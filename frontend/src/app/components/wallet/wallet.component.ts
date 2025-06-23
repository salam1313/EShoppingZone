import { Component, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService, WalletAmountPayload } from '../../services/wallet.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent {
  @ViewChild('balanceElement') balanceElement!: ElementRef;
  @Output() close = new EventEmitter<void>();
  
  balance: number | null = null;
  amount: number = 0;
  payAmount: number = 0;
  payMessage: string = '';
  payError: boolean = false;
  isLoading: boolean = false;
  isAddingFunds: boolean = false;
  isPaying: boolean = false;
  public walletService: WalletService;
  public recentTransactions: any[] = [];

  constructor(walletService: WalletService) {
    this.walletService = walletService;
    this.loadBalance();
    // Demo: fallback to empty array if not present
    this.recentTransactions = (walletService as any).recentTransactions || [];
  }

  loadBalance() {
    this.isLoading = true;
    this.walletService.getBalance().subscribe({
      next: (res: { balance: number }) => { 
        const previousBalance = this.balance;
        this.balance = res.balance;
        
        // Trigger balance update animation if balance changed
        if (previousBalance !== null && previousBalance !== this.balance) {
          this.animateBalanceUpdate();
        }
        
        console.log('Wallet balance loaded:', res.balance);
        this.isLoading = false;
      },
      error: () => { 
        this.balance = null; 
        this.isLoading = false;
      }
    });
  }

  private animateBalanceUpdate() {
    if (this.balanceElement) {
      const element = this.balanceElement.nativeElement;
      element.classList.add('updating');
      setTimeout(() => {
        element.classList.remove('updating');
      }, 800);
    }
  }

  addFunds() {
    if (this.amount > 0 && !this.isAddingFunds) {
      this.isAddingFunds = true;
      this.clearMessages();
      
      const payload: WalletAmountPayload = { amount: this.amount };
      this.walletService.addFunds(payload).subscribe({
        next: (res: { message: string, newBalance: number }) => {
          this.loadBalance();
          this.amount = 0;
          this.payMessage = res.message;
          this.payError = false;
          this.isAddingFunds = false;
          
          // Auto-clear success message after 3 seconds
          setTimeout(() => this.clearMessages(), 3000);
        },
        error: (err: any) => {
          this.payMessage = err?.error?.message || 'Error adding funds';
          this.payError = true;
          this.isAddingFunds = false;
          
          // Auto-clear error message after 5 seconds
          setTimeout(() => this.clearMessages(), 5000);
        }
      });
    }
  }

    payWithWallet() {
    if (this.payAmount > 0 && !this.isPaying) {
      this.isPaying = true;
      this.clearMessages();
      
      const payload: WalletAmountPayload = { amount: this.payAmount };
      this.walletService.payWithWallet(payload).subscribe({
        next: (res: { message: string, newBalance: number }) => {
          this.loadBalance();
          this.payMessage = res.message;
          this.payError = false;
          this.payAmount = 0;
          this.isPaying = false;
          
          // Auto-clear success message after 3 seconds
          setTimeout(() => this.clearMessages(), 3000);
        },
        error: (err: any) => {
          this.payMessage = err?.error?.message || 'Payment failed';
          this.payError = true;
          this.isPaying = false;
          
          // Auto-clear error message after 5 seconds
          setTimeout(() => this.clearMessages(), 5000);
        }
      });
    }
  }

  private clearMessages() {
    this.payMessage = '';
    this.payError = false;
  }

  onClose() {
    this.close.emit();
  }

  // Utility methods for enhanced UI interactions
  getBalanceDisplayClass(): string {
    return this.isLoading ? 'wallet-pro-balance loading' : 'wallet-pro-balance';
  }

  getAddFundsButtonClass(): string {
    return this.isAddingFunds ? 'loading' : '';
  }

  getPayButtonClass(): string {
    return this.isPaying ? 'loading' : '';
  }

  isAddFundsDisabled(): boolean {
    return this.amount <= 0 || this.isAddingFunds || this.isLoading;
  }

  isPayDisabled(): boolean {
    return this.payAmount <= 0 || this.isPaying || this.isLoading || !this.balance || this.payAmount > this.balance;
  }

  goToTransactions() {
    // Navigate to the wallet transactions page (route: /wallet/transactions)
    window.location.href = '/wallet/transactions';
  }
}
