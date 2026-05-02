import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🎪</div>
          <div>
            <p class="auth-title">ConferenceManager</p>
            <p class="auth-subtitle">Crear nueva cuenta</p>
          </div>
        </div>
        @if (enviado()) {
          <div class="success-banner">¡Revisá tu email para confirmar tu cuenta!</div>
          <p class="auth-footer"><a routerLink="/login">Volver al inicio de sesión</a></p>
        } @else {
          @if (error()) {
            <div class="error-banner">{{ error() }}</div>
          }
          <form class="auth-form" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Nombre <span class="required">*</span></label>
              <input class="form-control" type="text" formControlName="nombre" placeholder="Tu nombre completo" />
            </div>
            <div class="form-group">
              <label>Organización</label>
              <input class="form-control" type="text" formControlName="organizacion" placeholder="Nombre de tu organización" />
            </div>
            <div class="form-group">
              <label>Email <span class="required">*</span></label>
              <input class="form-control" type="email" formControlName="email" placeholder="tu@email.com" />
            </div>
            <div class="form-group">
              <label>Contraseña <span class="required">*</span></label>
              <input class="form-control" type="password" formControlName="password" placeholder="••••••••" />
              <span class="hint">Mínimo 8 caracteres</span>
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="loading()" style="width:100%;justify-content:center;padding:.75rem">
              @if (loading()) { <span class="spinner"></span> } Crear cuenta
            </button>
          </form>
          <p class="auth-footer">¿Ya tenés cuenta? <a routerLink="/login">Ingresá</a></p>
        }
      </div>
    </div>
  `
})
export class RegistroComponent {
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  enviado = signal(false);

  form = new FormGroup({
    nombre: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    organizacion: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required, Validators.minLength(8)], nonNullable: true })
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.registro(this.form.getRawValue()).subscribe({
      next: () => { this.loading.set(false); this.enviado.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error ?? 'Error al crear la cuenta');
      }
    });
  }
}
