import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  showSuccess(message: string, duration: number = 3000) {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'success',
      duration
    });
  }

  showError(message: string, duration: number = 4000) {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'error',
      duration
    });
  }

  showWarning(message: string, duration: number = 3500) {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'warning',
      duration
    });
  }

  showInfo(message: string, duration: number = 3000) {
    this.addToast({
      id: this.generateId(),
      message,
      type: 'info',
      duration
    });
  }

  private addToast(toast: ToastMessage) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto remove toast after duration
    setTimeout(() => {
      this.removeToast(toast.id);
    }, toast.duration || 3000);
  }

  removeToast(id: string) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }
}
