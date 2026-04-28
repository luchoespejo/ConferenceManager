import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Bienvenido, {{ auth.usuario()?.nombre }}</h1>
      <p>{{ auth.usuario()?.organizacion }}</p>
      <button (click)="auth.logout()">Cerrar sesión</button>
    </div>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);
}
