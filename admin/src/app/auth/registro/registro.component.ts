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
    <div class="auth-container">
      <h1>Crear cuenta</h1>
      @if (enviado()) {
        <p>¡Revisá tu email para confirmar tu cuenta!</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div>
            <label>Nombre</label>
            <input type="text" formControlName="nombre" />
          </div>
          <div>
            <label>Organización</label>
            <input type="text" formControlName="organizacion" />
          </div>
          <div>
            <label>Email</label>
            <input type="email" formControlName="email" />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" formControlName="password" />
          </div>
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Creando cuenta...' : 'Registrarse' }}
          </button>
          @if (error()) { <p class="error">{{ error() }}</p> }
        </form>
        <a routerLink="/login">¿Ya tenés cuenta? Ingresá</a>
      }
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
