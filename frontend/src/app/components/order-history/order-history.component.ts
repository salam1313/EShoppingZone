import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent, ToastComponent],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orderHistory: any[] = [];
  showCancelModal = false;
  orderToCancel: string = '';

  constructor(
    private orderService: OrderService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadOrderHistory();
  }

  loadOrderHistory() {
    this.orderService.getOrderHistory().subscribe({
      next: (res) => {
        this.orderHistory = (res || []).map((order: any) => ({ ...order, expanded: false }));
      },
      error: () => { this.orderHistory = []; }
    });
  }

  toggleOrder(order: any) {
    order.expanded = !order.expanded;
  }

  canCancelOrder(status: string): boolean {
    return status !== 'In Transit' && status !== 'Delivered' && status !== 'Cancelled';
  }
  cancelOrder(orderId: string) {
    this.orderToCancel = orderId;
    this.showCancelModal = true;
  }
  onCancelConfirmed() {
    this.orderService.cancelOrder(this.orderToCancel).subscribe({
      next: (response) => {
        // Show a specific refund message if the order was paid by wallet
        const cancelledOrder = this.orderHistory.find(o => o.orderId === this.orderToCancel);
        if (cancelledOrder && cancelledOrder.paymentMethod && cancelledOrder.paymentMethod.toLowerCase() === 'wallet') {
          this.toastService.showSuccess('Order cancelled and amount refunded to your wallet.');
        } else {
          this.toastService.showSuccess('Order cancelled successfully!');
        }
        this.loadOrderHistory(); // Refresh the order history
        this.showCancelModal = false;
        this.orderToCancel = '';
      },
      error: (error) => {
        this.toastService.showError(error.error?.message || 'Failed to cancel order. Please try again.');
        this.showCancelModal = false;
        this.orderToCancel = '';
      }
    });
  }

  onCancelModalClosed() {
    this.showCancelModal = false;
    this.orderToCancel = '';
  }
}
