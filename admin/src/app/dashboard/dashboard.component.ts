import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CongresoService } from '../congresos/congreso.service';
import { CongresoListItemDto } from '../congresos/congreso.model';
import { TopbarComponent } from '../shared/topbar/topbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TopbarComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
        <span style="font-size:.875rem;color:var(--muted)">{{ auth.usuario()?.nombre }}</span>
        <div class="avatar">{{ auth.usuario()?.nombre?.[0]?.toUpperCase() }}</div>
        <a routerLink="/congreso/nuevo" class="btn btn-primary btn-sm">+ Nuevo</a>
        <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Salir</button>
      </app-topbar>
      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Mis congresos</h2>
            <p>Administrá todos tus eventos desde acá</p>
          </div>
        </div>
        @if (loading()) {
          <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
            <div class="spinner"></div> Cargando...
          </div>
        } @else if (congresos().length === 0) {
          <div class="empty-wrap">
            <div class="empty-icon">🎪</div>
            <h3>Todavía no tenés congresos</h3>
            <p>Creá tu primer congreso y empezá a gestionar sesiones, expositores y participantes.</p>
            <a routerLink="/congreso/nuevo" class="btn btn-primary">Crear primer congreso</a>
          </div>
        } @else {
          <div class="stats-grid">
            <div class="stat-card stat-primary animate-in animate-in-1">
              <div class="stat-label">Total</div>
              <div class="stat-value">{{ congresos().length }}</div>
            </div>
            <div class="stat-card stat-success animate-in animate-in-2">
              <div class="stat-label">Publicados</div>
              <div class="stat-value">{{ publicados() }}</div>
            </div>
            <div class="stat-card animate-in animate-in-3">
              <div class="stat-label">Borradores</div>
              <div class="stat-value">{{ borradores() }}</div>
            </div>
          </div>
          <div class="cards-grid">
            @for (c of congresos(); track c.id; let i = $index) {
              <div class="congreso-card animate-in" [style.animation-delay]="(i * 0.05) + 's'">
                <div class="card-header-row">
                  <span class="card-title">{{ c.nombre }}</span>
                  <span class="badge badge-{{ c.estado.toLowerCase() }}">{{ c.estado }}</span>
                </div>
                <div class="card-meta">
                  <span>📅 {{ c.fechaInicio | date:'dd/MM/yyyy' }} → {{ c.fechaFin | date:'dd/MM/yyyy' }}</span>
                </div>
                <span class="card-slug">{{ c.slug }}</span>
                <div class="card-footer-row">
                  <span class="sessions-count"><strong>{{ c.cantidadSesiones }}</strong> sesiones</span>
                  <a [routerLink]="['/congreso', c.id]" class="btn btn-primary btn-sm">Gestionar →</a>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private congresoService = inject(CongresoService);

  congresos = signal<CongresoListItemDto[]>([]);
  loading = signal<boolean>(true);
  publicados = computed(() => this.congresos().filter(c => c.estado === 'Publicado').length);
  borradores = computed(() => this.congresos().filter(c => c.estado === 'Borrador').length);

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
