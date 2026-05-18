import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  inject,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CongresoService } from '../congreso.service';
import { CongresoDetalleDto, OrganizadorDto, FechaImportanteDto, EjeTematicoDto, SeccionConfigDto } from '../congreso.model';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

interface PreviewData {
  conf: CongresoDetalleDto;
  organizadores: OrganizadorDto[];
  fechas: FechaImportanteDto[];
  ejes: EjeTematicoDto[];
  secciones: Record<string, SeccionConfigDto>;
}

@Component({
  selector: 'app-site-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="pv-center"><div class="spinner"></div></div>
    } @else if (!data()) {
      <div class="pv-center" style="color:var(--danger)">No se pudo cargar la vista previa</div>
    } @else {
      <div class="pv-root" [style.fontFamily]="data()!.conf.tipografia || 'Arial, sans-serif'">

        <!-- HERO -->
        @if (esDecorativo()) {
          <!-- Hero claro -->
          <div class="pv-hero-light" [style.background]="sc('hero').bgColor || '#fff'">
            @if (logoSrc()) {
              <img [src]="logoSrc()!" alt="" class="pv-logo-light" />
            }
            <h1 class="pv-title-light" [style.color]="sc('hero').textoColor || '#0f172a'">{{ data()!.conf.nombre }}</h1>
            @if (data()!.conf.subtitulo) {
              <p class="pv-subtitulo" [style.color]="sc('hero').textoColor || '#334155'">{{ data()!.conf.subtitulo }}</p>
            }
            @if (data()!.conf.lema) {
              <p class="pv-lema" [style.color]="sc('hero').textoColor || '#475569'">&ldquo;{{ data()!.conf.lema }}&rdquo;</p>
            }
            @if (bannerSrc()) {
              <img [src]="bannerSrc()!" alt="" class="pv-banner-decorativo" />
            }
            <div class="pv-date-badge" [style.background]="primary()">
              <p class="pv-date-text">{{ fmtDateRange(data()!.conf.fechaInicio, data()!.conf.fechaInicio !== data()!.conf.fechaFin ? data()!.conf.fechaFin : undefined) }}</p>
              @if (data()!.conf.venueNombre) {
                <p class="pv-venue-text">{{ data()!.conf.venueNombre }}{{ data()!.conf.venueDireccion ? ' · ' + data()!.conf.venueDireccion : '' }}</p>
              }
            </div>
            <div class="pv-btns">
              <span class="pv-btn-solid" [style.background]="primary()" [style.color]="'#fff'">Ver Programa</span>
              @if (data()!.conf.mostrarInscripciones) {
                <span class="pv-btn-outline" [style.color]="primary()" [style.borderColor]="primary()">Inscribirse</span>
              }
            </div>
          </div>
        } @else {
          <!-- Hero oscuro -->
          <div class="pv-hero-dark"
            [style.background]="bannerSrc()
              ? 'linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)),url(' + bannerSrc()! + ') center/cover'
              : (sc(\'hero\').bgColor || primary())"
            [style.color]="sc('hero').textoColor || '#fff'">
            @if (logoSrc()) {
              <img [src]="logoSrc()!" alt="" class="pv-logo-dark" />
            }
            <h1 class="pv-title-dark">{{ data()!.conf.nombre }}</h1>
            @if (data()!.conf.subtitulo) {
              <p class="pv-subtitulo-dark">{{ data()!.conf.subtitulo }}</p>
            }
            @if (data()!.conf.lema) {
              <p class="pv-lema-dark">&ldquo;{{ data()!.conf.lema }}&rdquo;</p>
            }
            <p class="pv-dates-dark">{{ fmtDateRange(data()!.conf.fechaInicio, data()!.conf.fechaInicio !== data()!.conf.fechaFin ? data()!.conf.fechaFin : undefined) }}</p>
            @if (data()!.conf.venueNombre) {
              <p class="pv-venue-dark">{{ data()!.conf.venueNombre }}{{ data()!.conf.venueDireccion ? ' · ' + data()!.conf.venueDireccion : '' }}</p>
            }
            <div class="pv-btns">
              <span class="pv-btn-solid" [style.background]="'#fff'" [style.color]="primary()">Ver Programa</span>
              @if (data()!.conf.mostrarInscripciones) {
                <span class="pv-btn-outline" style="color:#fff;border-color:rgba(255,255,255,.8)">Inscribirse</span>
              }
            </div>
          </div>
        }

        <!-- FECHAS IMPORTANTES -->
        @if (data()!.conf.mostrarFechas && data()!.fechas.length > 0) {
          <div class="pv-section" [style.background]="sc('fechas').bgColor || secondary()" [style.color]="sc('fechas').textoColor || '#fff'">
            <h2 class="pv-section-title">Fechas importantes</h2>
            <div class="pv-fechas">
              @for (f of data()!.fechas; track f.id) {
                <div class="pv-fecha-row" [style.justifyContent]="f.descripcion ? 'space-between' : 'center'">
                  @if (f.descripcion) { <span style="font-weight:600">{{ f.descripcion }}</span> }
                  <span style="opacity:.85;font-size:.95rem">{{ fmtDateRange(f.fecha, f.fechaFin) }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- DESCRIPCIÓN + EJES -->
        @if (data()!.conf.mostrarDescripcion && (data()!.conf.descripcion || data()!.ejes.length > 0)) {
          <div class="pv-section" [style.background]="sc('descripcion').bgColor || '#f8fafc'" [style.color]="sc('descripcion').textoColor || '#334155'">
            @if (data()!.conf.descripcion) {
              <p class="pv-desc-text">{{ data()!.conf.descripcion }}</p>
            }
            @if (data()!.ejes.length > 0) {
              <p class="pv-ejes-label">Ejes temáticos</p>
              <div class="pv-chips">
                @for (e of data()!.ejes; track e.id) {
                  <span class="pv-chip" [style.background]="primary()">{{ e.nombre }}</span>
                }
              </div>
            }
          </div>
        }

        <!-- ORGANIZADORES — strip centrado -->
        @if (data()!.conf.mostrarOrganizadores && data()!.organizadores.length > 0) {
          <div class="pv-org-strip" [style.background]="sc('organizadores').bgColor || '#f1f5f9'">
            <p class="pv-org-label" [style.color]="sc('organizadores').textoColor || '#64748b'">Organizado por</p>
            <div class="pv-org-logos">
              @for (org of data()!.organizadores; track org.id) {
                @if (resolveUrl(org.logoUrl)) {
                  <img [src]="resolveUrl(org.logoUrl)!" alt="{{ org.nombre }}" class="pv-org-logo" />
                } @else {
                  <span class="pv-org-name" [style.color]="sc('organizadores').textoColor || '#475569'">{{ org.nombre }}</span>
                }
              }
            </div>
          </div>
        }

        <!-- CONTACTO -->
        @if (data()!.conf.mostrarContacto && (data()!.conf.emailContacto || data()!.conf.instagram || data()!.conf.contactoAdicional)) {
          <div class="pv-section" [style.background]="sc('contacto').bgColor || primary()" [style.color]="sc('contacto').textoColor || '#fff'" style="text-align:center">
            <h2 class="pv-section-title">Informes</h2>
            @if (data()!.conf.emailContacto) {
              <p style="margin:.4rem 0;font-size:1rem;font-weight:600">{{ data()!.conf.emailContacto }}</p>
            }
            @if (data()!.conf.instagram) {
              <p style="margin:.4rem 0;font-size:1rem;font-weight:600">&#64;{{ data()!.conf.instagram }}</p>
            }
            @if (data()!.conf.contactoAdicional) {
              <p style="margin:.75rem 0 0;font-size:.9rem;opacity:.85;white-space:pre-line">{{ data()!.conf.contactoAdicional }}</p>
            }
          </div>
        }

      </div>
    }
  `,
  styles: [`
    :host { display:block; height:100%; overflow-y:auto; }
    .pv-center { display:flex;align-items:center;justify-content:center;height:200px;gap:.75rem; }
    .pv-root { font-size:14px; }

    /* Hero claro */
    .pv-hero-light { padding:2rem 1.5rem 0;text-align:center; }
    .pv-logo-light { height:56px;width:auto;margin:0 auto 1rem;display:block;object-fit:contain; }
    .pv-title-light { font-size:clamp(1.2rem,3vw,1.8rem);font-weight:800;margin:0 0 .5rem;line-height:1.25; }
    .pv-subtitulo { font-size:.95rem;font-weight:600;margin:0 auto .5rem;max-width:560px;line-height:1.4; }
    .pv-lema { font-size:.9rem;font-style:italic;margin:0 auto .75rem;max-width:500px;line-height:1.5; }
    .pv-banner-decorativo { width:100%;height:auto;border-radius:8px;margin:1rem 0;display:block; }
    .pv-date-badge { border-radius:8px;padding:.75rem 1.5rem;margin:0 auto 1rem;display:inline-block;min-width:200px; }
    .pv-date-text { margin:0;font-weight:700;font-size:1rem; }
    .pv-venue-text { margin:.2rem 0 0;font-size:.85rem;opacity:.85; }

    /* Hero oscuro */
    .pv-hero-dark { padding:3rem 1.5rem;text-align:center; }
    .pv-logo-dark { height:56px;width:auto;margin:0 auto 1rem;display:block;object-fit:contain; }
    .pv-title-dark { font-size:clamp(1.2rem,3vw,1.8rem);font-weight:700;margin:0 0 .5rem;line-height:1.2; }
    .pv-subtitulo-dark { font-size:.9rem;font-weight:600;margin:0 auto .4rem;max-width:560px;opacity:.9;line-height:1.4; }
    .pv-lema-dark { font-size:.95rem;font-style:italic;margin:0 auto 1rem;max-width:500px;opacity:.9;line-height:1.5; }
    .pv-dates-dark { font-size:.95rem;opacity:.85;margin:0 0 .3rem; }
    .pv-venue-dark { font-size:.85rem;opacity:.75;margin:0 0 1.5rem; }

    /* Botones */
    .pv-btns { display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin-top:1rem;padding-bottom:1.5rem; }
    .pv-btn-solid { display:inline-block;font-weight:700;padding:8px 20px;border-radius:8px;font-size:.875rem; }
    .pv-btn-outline { display:inline-block;font-weight:700;padding:8px 20px;border-radius:8px;font-size:.875rem;border:2px solid;background:transparent; }

    /* Secciones genéricas */
    .pv-section { padding:2rem 1.5rem; }
    .pv-section-title { font-size:1.1rem;font-weight:700;margin:0 0 1rem;text-align:center; }

    /* Fechas */
    .pv-fechas { display:flex;flex-direction:column;gap:.5rem;max-width:500px;margin:0 auto; }
    .pv-fecha-row { display:flex;justify-content:space-between;align-items:center;padding:.6rem .75rem;background:rgba(255,255,255,.08);border-radius:6px;gap:.75rem; }

    /* Descripción */
    .pv-desc-text { font-size:.95rem;line-height:1.7;margin-bottom:1.25rem; }
    .pv-ejes-label { font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem;opacity:.7; }
    .pv-chips { display:flex;flex-wrap:wrap;gap:.4rem; }
    .pv-chip { color:#fff;padding:4px 12px;border-radius:999px;font-size:.8rem;font-weight:500; }

    /* Organizadores — strip centrado */
    .pv-org-strip { text-align:center;padding:.75rem 1rem;border-top:1px solid rgba(0,0,0,.08);border-bottom:1px solid rgba(0,0,0,.08); }
    .pv-org-label { font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin:0 0 .6rem; }
    .pv-org-logos { display:flex;flex-wrap:wrap;gap:1.25rem;align-items:center;justify-content:center; }
    .pv-org-logo { max-width:80px;max-height:36px;width:auto;height:auto;object-fit:contain;display:block; }
    .pv-org-name { font-size:.75rem;font-weight:600; }
  `]
})
export class SitePreviewComponent implements OnInit {
  @Input() conferenciaId!: string;

  private svc = inject(CongresoService);

  loading = signal(true);
  data = signal<PreviewData | null>(null);

  primary = computed(() => this.data()?.conf.colorPrimario ?? '#1a1a2e');
  secondary = computed(() => this.data()?.conf.colorSecundario ?? '#16213e');
  esDecorativo = computed(() => this.data()?.conf.bannerModo === 'decorativo');

  logoSrc = computed(() => this.resolveUrl(this.data()?.conf.logoUrl));
  bannerSrc = computed(() => this.resolveUrl(this.data()?.conf.bannerUrl));

  sc(key: string): SeccionConfigDto {
    return this.data()?.secciones[key] ?? { seccionKey: key, bgColor: null, textoColor: null };
  }

  ngOnInit(): void {
    if (!this.conferenciaId) return;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      conf: this.svc.getById(this.conferenciaId),
      organizadores: this.svc.getOrganizadores(this.conferenciaId),
      fechas: this.svc.getFechasImportantes(this.conferenciaId),
      ejes: this.svc.getEjesTematicos(this.conferenciaId),
      seccionList: this.svc.getSeccionConfigs(this.conferenciaId),
    }).subscribe({
      next: ({ conf, organizadores, fechas, ejes, seccionList }) => {
        const secciones: Record<string, SeccionConfigDto> = {};
        seccionList.forEach(s => secciones[s.seccionKey] = s);
        this.data.set({ conf, organizadores, fechas, ejes, secciones });
        this.loading.set(false);
      },
      error: () => {
        this.data.set(null);
        this.loading.set(false);
      }
    });
  }

  resolveUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  fmtDate(d: string): string {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  fmtDateShort(d: string): string {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
  }

  fmtDateRange(fecha: string, fechaFin?: string | null): string {
    if (!fechaFin) return this.fmtDate(fecha);
    const d1 = new Date(fecha + 'T12:00:00');
    const d2 = new Date(fechaFin + 'T12:00:00');
    if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
      const mes = d1.toLocaleDateString('es-AR', { month: 'long' });
      return `${d1.getDate()} al ${d2.getDate()} de ${mes} de ${d1.getFullYear()}`;
    }
    return `${this.fmtDateShort(fecha)} — ${this.fmtDate(fechaFin)}`;
  }
}
