import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  productId: string;
  productName: string;
  productVariantId?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  variantDetails?: string;
}

interface Order {
  orderId: string;
  userId: string;
  userName: string;
  orderDate: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  orderItems: OrderItem[];
  expanded?: boolean;
}

interface OrdersSummary {
  totalOrders: number;
  pendingOrders: number;
  readyToDispatchOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-orders.component.html',
  styleUrls: ['./manage-orders.component.css']
})
export class ManageOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  ordersSummary: OrdersSummary | null = null;
  loading = false;
  error = '';
  success = '';
  
  // Filter options
  statusFilter = 'All';
  searchQuery = '';
  
  // Status options
  statusOptions = ['Pending', 'Ready to Dispatch', 'In Transit', 'Delivered', 'Cancelled'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadOrders();
    this.loadOrdersSummary();
  }

  loadOrders() {
    this.loading = true;
    this.error = '';
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<Order[]>('https://eshoppingzone.onrender.com/api/m/order', { headers })
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load orders';
          this.loading = false;
        }
      });
  }

  loadOrdersSummary() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<OrdersSummary>('https://eshoppingzone.onrender.com/api/m/order/summary', { headers })
      .subscribe({
        next: (summary) => {
          this.ordersSummary = summary;
        },
        error: (err) => {
          console.error('Failed to load orders summary:', err);
        }
      });
  }

  updateOrderStatus(orderId: string, newStatus: string) {
    this.error = '';
    this.success = '';
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Correct payload: orderId and status in body
    const payload = { orderId: orderId, status: newStatus };

    // Correct endpoint: no orderId in URL
    this.http.put('https://eshoppingzone.onrender.com/api/m/order', payload, { headers })
      .subscribe({
        next: () => {
          this.success = 'Order status updated successfully';
          // Update the local order status
          const order = this.orders.find(o => o.orderId === orderId);
          if (order) {
            order.status = newStatus;
            this.applyFilters();
            this.loadOrdersSummary(); // Refresh summary
          }
          // Clear success message after 3 seconds
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update order status';
        }
      });
  }

  applyFilters() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesStatus = this.statusFilter === 'All' || order.status === this.statusFilter;
      const matchesSearch = this.searchQuery === '' || 
        order.orderId.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        order.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        order.fullName.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSearchQueryChange() {
    this.applyFilters();
  }

  onStatusChange(orderId: string, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.updateOrderStatus(orderId, selectElement.value);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Ready to Dispatch': return 'status-ready';
      case 'In Transit': return 'status-transit';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  expandOrder(order: Order) {
    (order as any).expanded = !(order as any).expanded;
  }

  getOrderTotal(order: Order): number {
    return order.orderItems.reduce((total, item) => total + item.totalPrice, 0);
  }
}
