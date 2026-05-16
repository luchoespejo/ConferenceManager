import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void { this.add(message, 'success'); }
  error(message: string): void { this.add(message, 'error'); }
  info(message: string): void { this.add(message, 'info'); }

  private add(message: string, type: ToastType): void {
    const id = ++this.counter;
    this.toasts.update(ts => [...ts, { id, message, type }]);
    setTimeout(() => this.remove(id), 3500);
  }

  remove(id: number): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }
}
