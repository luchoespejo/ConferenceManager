import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CongresoService } from '../congresos/congreso.service';
import { CongresoListItemDto } from '../congresos/congreso.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1>Bienvenido, {{ auth.usuario()?.nombre }}</h1>
          <p>{{ auth.usuario()?.organizacion }}</p>
        </div>
        <div class="header-actions">
          <a routerLink="/congreso/nuevo" class="btn btn-primary">Nuevo congreso</a>
          <button (click)="auth.logout()" class="btn btn-secondary">Cerrar sesión</button>
        </div>
      </header>

      @if (loading()) {
        <p class="loading-msg">Cargando congresos...</p>
      } @else if (congresos().length === 0) {
        <div class="empty-state">
          <p>Todavía no tenés ningún congreso creado.</p>
          <a routerLink="/congreso/nuevo" class="btn btn-primary">Crear primer congreso</a>
        </div>
      } @else {
        <table class="congresos-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>Sesiones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (congreso of congresos(); track congreso.id) {
              <tr>
                <td>{{ congreso.nombre }}</td>
                <td><code>{{ congreso.slug }}</code></td>
                <td>
                  <span class="badge badge-{{ congreso.estado.toLowerCase() }}">
                    {{ congreso.estado }}
                  </span>
                </td>
                <td>{{ congreso.fechaInicio }}</td>
                <td>{{ congreso.fechaFin }}</td>
                <td>{{ congreso.cantidadSesiones }}</td>
                <td>
                  <a [routerLink]="['/congreso', congreso.id, 'configuracion']" class="btn btn-sm">
                    Gestionar
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private congresoService = inject(CongresoService);

  congresos = signal<CongresoListItemDto[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.congresoService.getMisCongresos().subscribe({
      next: data => {
        this.congresos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
