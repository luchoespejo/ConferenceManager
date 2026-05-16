import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;pointer-events:none">
      @for (t of toastService.toasts(); track t.id) {
        <div
          [style.background]="t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#2563eb'"
          style="color:#fff;padding:.75rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:500;
                 box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;align-items:center;gap:.75rem;
                 pointer-events:all;min-width:240px;max-width:360px;animation:slideIn .2s ease"
        >
          <span>{{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}</span>
          <span style="flex:1">{{ t.message }}</span>
          <button
            (click)="toastService.remove(t.id)"
            style="background:none;border:none;color:#fff;opacity:.7;cursor:pointer;font-size:1rem;padding:0;line-height:1"
          >×</button>
        </div>
      }
    </div>
    <style>
      @keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    </style>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
