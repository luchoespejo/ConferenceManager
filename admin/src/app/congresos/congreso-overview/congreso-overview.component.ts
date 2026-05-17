import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CongresoService } from '../congreso.service';
import { CongresoOverviewDto } from '../congreso.model';
import { SitePreviewComponent } from '../site-preview/site-preview.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/toast.service';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ConfirmModalService } from '../../shared/confirm-modal/confirm-modal.service';
import { CongresoNavComponent } from '../../shared/congreso-nav/congreso-nav.component';

@Component({
  selector: 'app-congreso-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, SitePreviewComponent, TopbarComponent, CongresoNavComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
        @if (overview()) {
          <span class="badge badge-{{ overview()!.estado.toLowerCase() }}">{{ overview()!.estado }}</span>
          <a [routerLink]="['/congreso', id, 'configuracion']" class="btn btn-secondary btn-sm">Configuración</a>
          <a href="https://conference-manager-irl1.vercel.app" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">🌍 Sitio publicado ↗</a>
          <a [routerLink]="['/congreso', id, 'demo']" class="btn btn-warning btn-sm">👁️ Demo</a>
          <button class="btn btn-secondary btn-sm" (click)="imprimirQrs()" [disabled]="imprimiendoQrs()">
            @if (imprimiendoQrs()) { <span class="spinner"></span> } 🖨️ QRs
          </button>
          @if (overview()!.estado === 'Borrador') {
            <button class="btn btn-outline-success btn-sm" (click)="publicar()" [disabled]="publicando()">
              @if (publicando()) { <span class="spinner"></span> }
              Publicar
            </button>
          }
          @if (overview()!.estado === 'Publicado') {
            <button class="btn btn-outline-primary btn-sm" (click)="finalizar()" [disabled]="finalizando()">
              @if (finalizando()) { <span class="spinner"></span> }
              Finalizar
            </button>
          }
          @if (overview()!.estado === 'Borrador') {
            <button class="btn btn-outline-danger btn-sm" (click)="eliminar()" [disabled]="eliminando()">
              @if (eliminando()) { <span class="spinner"></span> }
              Eliminar
            </button>
          }
        }
      </app-topbar>
      <app-congreso-nav [id]="id" />

      <div class="page-body">
        @if (loading()) {
          <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
            <div class="spinner"></div> Cargando...
          </div>
        } @else if (loadError()) {
          <div class="error-banner">
            No se pudo cargar el congreso. <a routerLink="/dashboard">Volver al dashboard</a>
          </div>
        } @else if (overview()) {
          <div class="page-header">
            <div class="page-title">
              <h2>{{ overview()!.nombre }}</h2>
              <p>
                📅 {{ overview()!.fechaInicio }} → {{ overview()!.fechaFin }}
                @if (overview()!.venueNombre) {
                  &nbsp;· 📍 {{ overview()!.venueNombre }}
                }
              </p>
            </div>
          </div>

          @if (apiError()) {
            <div class="error-banner" style="margin-bottom:1.25rem">{{ apiError() }}</div>
          }

          <!-- Stats grid -->
          <div class="stats-grid">
            <div class="stat-card stat-primary">
              <div class="stat-label">Sesiones</div>
              <div class="stat-value">{{ overview()!.totalSesiones }}</div>
            </div>
            <div class="stat-card stat-success">
              <div class="stat-label">Expositores</div>
              <div class="stat-value">{{ overview()!.totalExpositores }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Salas</div>
              <div class="stat-value">{{ overview()!.totalSalas }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Participantes</div>
              <div class="stat-value">{{ overview()!.totalParticipantes }}</div>
            </div>
          </div>

          <!-- Quick actions grid -->
          <h3 style="margin-bottom:1rem">Acciones rápidas</h3>
          <div class="cards-grid" style="margin-bottom:2rem">
            <a [routerLink]="['/congreso', id, 'sesiones']" class="action-card">
              <div class="action-icon">📋</div>
              <div class="action-content">
                <div class="action-title">Sesiones</div>
                <div class="action-desc">Gestioná las charlas y talleres del evento</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
            <a [routerLink]="['/congreso', id, 'expositores']" class="action-card">
              <div class="action-icon">🎤</div>
              <div class="action-content">
                <div class="action-title">Expositores</div>
                <div class="action-desc">Administrá los speakers y sus perfiles</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
            <a [routerLink]="['/congreso', id, 'salas']" class="action-card">
              <div class="action-icon">🏛️</div>
              <div class="action-content">
                <div class="action-title">Salas</div>
                <div class="action-desc">Configurá los espacios del evento</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
            <a [routerLink]="['/congreso', id, 'participantes']" class="action-card">
              <div class="action-icon">👥</div>
              <div class="action-content">
                <div class="action-title">Participantes</div>
                <div class="action-desc">Gestioná los asistentes y sus certificados</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
            <a [routerLink]="['/congreso', id, 'avisos']" class="action-card">
              <div class="action-icon">📢</div>
              <div class="action-content">
                <div class="action-title">Avisos Urgentes</div>
                <div class="action-desc">Publicá comunicados en tiempo real durante el evento</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
            <a [routerLink]="['/congreso', id, 'programa']" class="action-card">
              <div class="action-icon">🗓️</div>
              <div class="action-content">
                <div class="action-title">Programa</div>
                <div class="action-desc">Vista de grilla del evento por día y sala</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
          </div>

          <!-- Próximas sesiones -->
          @if (overview()!.proximasSesiones.length > 0) {
            <h3 style="margin-bottom:1rem">Próximas sesiones</h3>
            <div class="item-list">
              @for (sesion of overview()!.proximasSesiones; track sesion.id) {
                <div class="item-row">
                  <div class="item-avatar">{{ sesion.titulo[0].toUpperCase() }}</div>
                  <div class="item-info">
                    <div class="item-name">{{ sesion.titulo }}</div>
                    <div class="item-sub">
                      {{ sesion.fecha }} · {{ sesion.horaInicio | slice:0:5 }} – {{ sesion.horaFin | slice:0:5 }}
                      &nbsp;·&nbsp; {{ sesion.salaNombre }}
                      &nbsp;·&nbsp; {{ sesion.expositorNombre }}
                    </div>
                  </div>
                  @if (sesion.track) {
                    <span class="badge badge-publicado" style="font-size:.7rem">{{ sesion.track }}</span>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="empty-wrap" style="min-height:160px">
              <div class="empty-icon" style="font-size:2rem">📋</div>
              <p style="margin:0">Todavía no hay sesiones cargadas.</p>
              <a [routerLink]="['/congreso', id, 'sesiones']" class="btn btn-primary btn-sm" style="margin-top:.75rem">Agregar sesiones</a>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .btn-outline-success { background:transparent; color:var(--success); border-color:var(--success); }
    .btn-outline-success:hover { background:var(--success-sub); }
    .btn-outline-primary { background:transparent; color:var(--primary); border-color:var(--primary); }
    .btn-outline-primary:hover { background:var(--primary-sub); }
    .btn-outline-danger { background:transparent; color:var(--danger); border-color:var(--danger); }
    .btn-outline-danger:hover { background:var(--danger-sub); }
    .action-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: var(--text);
      transition: border-color var(--t), box-shadow var(--t);
      cursor: pointer;
    }
    .action-card:hover {
      border-color: var(--border-focus);
      box-shadow: var(--sh-md);
      color: var(--text);
    }
    .action-card--disabled {
      opacity: .55;
      cursor: not-allowed;
      pointer-events: none;
    }
    .action-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
      width: 44px;
      text-align: center;
    }
    .action-content {
      flex: 1;
      min-width: 0;
    }
    .action-title {
      font-weight: 600;
      font-size: .9375rem;
      margin-bottom: 2px;
    }
    .action-desc {
      font-size: .8125rem;
      color: var(--muted);
    }
    .action-arrow {
      font-size: 1.125rem;
      color: var(--muted);
      flex-shrink: 0;
    }
  `]
})
export class CongresoOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private congresoService = inject(CongresoService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirmSvc = inject(ConfirmModalService);

  id = '';
  overview = signal<CongresoOverviewDto | null>(null);
  loading = signal(true);
  loadError = signal(false);
  publicando = signal(false);
  finalizando = signal(false);
  eliminando = signal(false);
  imprimiendoQrs = signal(false);
  apiError = signal<string | null>(null);

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadOverview();
  }

  private loadOverview(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.congresoService.getOverview(this.id).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  async publicar(): Promise<void> {
    const ok = await this.confirmSvc.ask({
      title: '¿Publicar congreso?',
      message: 'El congreso será visible en el mini-sitio público.',
      type: 'primary',
      confirmLabel: 'Publicar'
    });
    if (!ok) return;
    this.publicando.set(true);
    this.apiError.set(null);
    this.congresoService.publicar(this.id).subscribe({
      next: (congreso) => {
        this.overview.update(o => o ? { ...o, estado: congreso.estado } : o);
        this.publicando.set(false);
        this.toast.success('Congreso publicado correctamente.');
      },
      error: (err) => {
        this.publicando.set(false);
        this.toast.error(err.error?.message ?? 'Error al publicar el congreso.');
      }
    });
  }

  async finalizar(): Promise<void> {
    const ok = await this.confirmSvc.ask({
      title: '¿Finalizar congreso?',
      message: 'Esta acción no se puede deshacer.',
      type: 'danger',
      confirmLabel: 'Finalizar'
    });
    if (!ok) return;
    this.finalizando.set(true);
    this.apiError.set(null);
    this.congresoService.finalizar(this.id).subscribe({
      next: (congreso) => {
        this.overview.update(o => o ? { ...o, estado: congreso.estado } : o);
        this.finalizando.set(false);
        this.toast.success('Congreso finalizado.');
      },
      error: (err) => {
        this.finalizando.set(false);
        this.toast.error(err.error?.message ?? 'Error al finalizar el congreso.');
      }
    });
  }

  async eliminar(): Promise<void> {
    const ok = await this.confirmSvc.ask({
      title: '¿Eliminar congreso?',
      message: 'Esta acción no se puede deshacer. Se perderán todos los datos del congreso.',
      type: 'danger',
      confirmLabel: 'Eliminar'
    });
    if (!ok) return;
    this.eliminando.set(true);
    this.apiError.set(null);
    this.congresoService.delete(this.id).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.eliminando.set(false);
        this.apiError.set(err.error?.message ?? 'Error al eliminar el congreso.');
      }
    });
  }

  imprimirQrs(): void {
    this.imprimiendoQrs.set(true);
    const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token') ?? '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const base = `${environment.apiUrl}/api/dashboard/conferencias/${this.id}/sesiones`;

    this.http.post<{ regenerated: number }>(`${base}/regenerar-qrs`, {}, { headers })
      .subscribe({
        next: (regen) => {
          this.toast.success(`QRs generados: ${regen?.regenerated ?? 0}`);
          this.http.get<any[]>(base, { headers }).subscribe({
            next: (sesiones) => {
              this.imprimiendoQrs.set(false);
              const conQr = sesiones.filter(s => !!s.qrCodeUrl).length;
              this.toast.success(`Sesiones con QR: ${conQr}/${sesiones.length}`);
              const nombre = this.overview()?.nombre ?? 'Congreso';
              const html = this.buildQrHtml(nombre, sesiones);
              const win = window.open('', '_blank');
              if (win) { win.document.write(html); win.document.close(); }
            },
            error: () => {
              this.imprimiendoQrs.set(false);
              this.apiError.set('No se pudieron cargar los QRs. Intentá de nuevo.');
            }
          });
        },
        error: () => {
          this.imprimiendoQrs.set(false);
          this.apiError.set('Error al regenerar los QRs. Intentá de nuevo.');
        }
      });
  }

  private buildQrHtml(congreso: string, sesiones: any[]): string {
    const conNombre = congreso.replace(/</g, '&lt;');
    const cards = sesiones.map(s => {
      const titulo = (s.titulo ?? '').replace(/</g, '&lt;');
      const sala = (s.salaNombre ?? '').replace(/</g, '&lt;');
      const expositor = (s.expositorNombre ?? '').replace(/</g, '&lt;');
      const track = s.track ? `<span class="track">${s.track.replace(/</g, '&lt;')}</span>` : '';
      const fecha = s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR') : '';
      const hora = s.horaInicio && s.horaFin ? `${s.horaInicio.slice(0,5)} – ${s.horaFin.slice(0,5)}` : '';
      const qr = s.qrCodeUrl
        ? `<img src="${s.qrCodeUrl}" alt="QR" class="qr-img" />`
        : `<div class="qr-placeholder">Sin QR<br><small>Regenerar desde el panel</small></div>`;
      return `
        <div class="card">
          ${qr}
          <div class="info">
            <div class="title">${titulo}</div>
            ${track}
            <div class="meta">📅 ${fecha} &nbsp; ⏰ ${hora}</div>
            <div class="meta">📍 ${sala} &nbsp; 🎤 ${expositor}</div>
          </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>QRs — ${conNombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { margin: 8mm; }
  body { font-family: Arial, sans-serif; background: #fff; padding: .5rem; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
  .card { border: 1px solid #ddd; border-radius: 6px; padding: .625rem; display: flex; flex-direction: column; align-items: center; gap: .5rem; break-inside: avoid; page-break-inside: avoid; }
  .qr-img { width: 130px; height: 130px; }
  .qr-placeholder { width: 130px; height: 130px; border: 2px dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: .75rem; text-align: center; border-radius: 4px; }
  .info { width: 100%; text-align: center; }
  .title { font-weight: 700; font-size: .85rem; margin-bottom: .3rem; line-height: 1.3; }
  .track { display: inline-block; background: #f0f0f0; padding: 1px 6px; border-radius: 4px; font-size: .7rem; margin-bottom: .3rem; }
  .meta { font-size: .72rem; color: #555; margin-top: .15rem; }
  .print-btn { position: fixed; top: .75rem; right: .75rem; background: #1a1a2e; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: .875rem; font-weight: 600; z-index: 10; }
  @media print { .print-btn { display: none; } }
</style></head><body>
<button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
<div class="grid">${cards}</div>
</body></html>`;
  }

}
