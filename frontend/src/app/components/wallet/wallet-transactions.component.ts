import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletTransaction, WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-wallet-transactions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wallet-transactions.component.html',
  styleUrls: ['./wallet-transactions.component.css']
})
export class WalletTransactionsComponent {
  public recentTransactions: WalletTransaction[] = [];
  public isLoading = true;

  constructor(private walletService: WalletService) {
    this.walletService.getRecentTransactions().subscribe({
      next: txs => {
        this.recentTransactions = txs;
        this.isLoading = false;
      },
      error: () => {
        this.recentTransactions = [];
        this.isLoading = false;
      }
    });
  }
}
