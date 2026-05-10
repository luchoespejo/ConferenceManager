import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ConferenciaPreview {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  logoUrl?: string;
  bannerUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  proximasSesiones: Array<{
    id: string;
    titulo: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    salaNombre: string;
    expositorNombre: string;
    qrCodeUrl?: string;
  }>;
}

@Component({
  selector: 'app-site-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="preview-container">
      @if (loading()) {
        <div class="preview-loading">
          <div class="spinner"></div>
          <p style="color: var(--muted)">Cargando vista previa...</p>
        </div>
      } @else if (error()) {
        <div class="preview-error">
          <p style="color: var(--danger)">⚠️ {{ error() }}</p>
        </div>
      } @else if (data()) {
        <!-- Hero Section -->
        <div class="preview-hero" [style.backgroundColor]="data()!.colorPrimario || 'var(--primary)'">
          @if (data()!.bannerUrl) {
            <img
              [src]="resolveUrl(data()!.bannerUrl!)"
              alt="Banner"
              class="preview-banner"
              (error)="onImageError($event)"
            />
          }
          <div class="preview-hero-content">
            @if (data()!.logoUrl) {
              <img
                [src]="resolveUrl(data()!.logoUrl!)"
                alt="Logo"
                class="preview-logo"
                (error)="onImageError($event)"
              />
            }
            <h1 class="preview-title">{{ data()!.nombre }}</h1>
            @if (data()!.descripcion) {
              <p class="preview-desc">{{ data()!.descripcion }}</p>
            }
          </div>
        </div>

        <!-- Upcoming Sessions Preview -->
        @if (data()!.proximasSesiones.length > 0) {
          <div class="preview-sessions">
            <h3>Próximas sesiones</h3>
            <div class="sessions-list">
              @for (sesion of data()!.proximasSesiones.slice(0, 3); track sesion.id) {
                <div class="session-item">
                  <div class="session-main">
                    <div class="session-time">
                      {{ sesion.horaInicio | slice:0:5 }} – {{ sesion.horaFin | slice:0:5 }}
                    </div>
                    <div class="session-info">
                      <div class="session-title">{{ sesion.titulo }}</div>
                      <div class="session-meta">
                        {{ sesion.salaNombre }} · {{ sesion.expositorNombre }}
                      </div>
                    </div>
                  </div>
                  @if (sesion.qrCodeUrl) {
                    <img [src]="sesion.qrCodeUrl" alt="QR" class="session-qr" />
                  }
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .preview-container {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      overflow: hidden;
      background: var(--surface);
      height: 100%;
    }

    .preview-loading,
    .preview-error {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      min-height: 200px;
      color: var(--muted);
    }

    .preview-hero {
      position: relative;
      padding: 2rem 1.5rem;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      min-height: 180px;
      flex-shrink: 0;
      overflow: hidden;
    }

    .preview-banner {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.3;
    }

    .preview-hero-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }

    .preview-logo {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: var(--r-sm);
    }

    .preview-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .preview-desc {
      margin: 0;
      font-size: 0.875rem;
      opacity: 0.9;
      max-width: 300px;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .preview-sessions {
      padding: 1.5rem;
      border-top: 1px solid var(--border);
      flex: 1;
      overflow-y: auto;
    }

    .preview-sessions h3 {
      margin: 0 0 1rem 0;
      font-size: 0.9375rem;
      color: var(--text);
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .session-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
      font-size: 0.8125rem;
      align-items: center;
      justify-content: space-between;
    }

    .session-main {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .session-time {
      flex-shrink: 0;
      font-weight: 600;
      color: var(--primary);
      min-width: 60px;
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-title {
      font-weight: 500;
      color: var(--text);
      margin-bottom: 2px;
    }

    .session-meta {
      color: var(--muted);
      font-size: 0.75rem;
    }

    .session-qr {
      width: 60px;
      height: 60px;
      flex-shrink: 0;
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
      background: white;
      padding: 2px;
    }
  `]
})
export class SitePreviewComponent implements OnInit {
  @Input() conferenciaId!: string;

  private http = inject(HttpClient);

  data = signal<ConferenciaPreview | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.conferenciaId) {
      this.error.set('ID de conferencia no especificado');
      this.loading.set(false);
      return;
    }
    this.loadPreview();
  }

  private loadPreview(): void {
    this.loading.set(true);
    this.error.set(null);

    const apiUrl = 'http://localhost:5000';
    this.http.get<ConferenciaPreview>(
      `${apiUrl}/api/dashboard/preview/${this.conferenciaId}`
    ).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar la vista previa');
        this.loading.set(false);
      }
    });
  }

  resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiUrl = 'http://localhost:5000';
    return `${apiUrl}${url}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.opacity = '0.5';
  }
}
