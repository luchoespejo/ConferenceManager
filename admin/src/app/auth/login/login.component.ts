import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
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
            <p class="auth-subtitle">Panel de organizadores</p>
          </div>
        </div>
        @if (error()) {
          <div class="error-banner">{{ error() }}</div>
        }
        <form class="auth-form" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" formControlName="email" placeholder="tu@email.com" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input class="form-control" type="password" formControlName="password" placeholder="••••••••" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="loading()" style="width:100%;justify-content:center;padding:.75rem">
            @if (loading()) { <span class="spinner"></span> } Ingresar
          </button>
        </form>
        <p class="auth-footer">¿No tenés cuenta? <a routerLink="/registro">Registrate</a></p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required, Validators.minLength(8)], nonNullable: true })
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error ?? 'Credenciales incorrectas');
      }
    });
  }
}
