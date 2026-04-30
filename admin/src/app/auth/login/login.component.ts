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
    <div class="auth-container">
      <h1>Iniciar sesión</h1>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label>Email</label>
          <input type="email" formControlName="email" />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" formControlName="password" />
        </div>
        <button type="submit" [disabled]="loading()">
          {{ loading() ? 'Ingresando...' : 'Ingresar' }}
        </button>
        @if (error()) { <p class="error">{{ error() }}</p> }
      </form>
      <a routerLink="/registro">¿No tenés cuenta? Registrate</a>
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
