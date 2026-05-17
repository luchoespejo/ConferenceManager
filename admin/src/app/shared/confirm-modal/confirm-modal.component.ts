import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalService } from './confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (svc.isOpen()) {
      <div class="modal-backdrop" (click)="cancel()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-icon" [class]="'modal-icon--' + svc.options().type">
            {{ svc.options().type === 'danger' ? '⚠️' : '❓' }}
          </div>
          <h3 class="modal-title">{{ svc.options().title }}</h3>
          <p class="modal-msg">{{ svc.options().message }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="cancel()">Cancelar</button>
            <button class="btn" [class]="svc.options().type === 'danger' ? 'btn-danger' : 'btn-primary'" (click)="confirm()">
              {{ svc.options().confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.6);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9000;
      animation: fadeInUp .15s ease both;
    }
    .modal-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 2rem;
      max-width: 400px;
      width: calc(100% - 2rem);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,.6);
    }
    .modal-icon { font-size: 2rem; }
    .modal-title { font-size: 1.125rem; font-weight: 700; text-align: center; }
    .modal-msg { font-size: .9rem; color: var(--muted); text-align: center; line-height: 1.5; }
    .modal-actions { display: flex; gap: .75rem; width: 100%; justify-content: center; margin-top: .5rem; }
    .modal-actions .btn { min-width: 100px; justify-content: center; }
  `]
})
export class ConfirmModalComponent {
  svc = inject(ConfirmModalService);
  confirm() { this.svc.resolve(true); }
  cancel()  { this.svc.resolve(false); }
}
