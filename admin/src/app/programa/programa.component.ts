import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SesionService } from '../sesiones/sesion.service';
import { SesionListItem } from '../sesiones/sesion.model';
import { TopbarComponent } from '../shared/topbar/topbar.component';

interface SesionPorDia {
  fecha: string;
  salas: { nombre: string; sesiones: SesionListItem[] }[];
}

@Component({
  selector: 'app-programa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TopbarComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
        <a [routerLink]="['/congreso', conferenciaId, 'sesiones']" class="btn btn-secondary btn-sm">Editar sesiones</a>
        <a [routerLink]="['/congreso', conferenciaId]" class="btn btn-ghost btn-sm">← Volver</a>
      </app-topbar>

      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Programa del evento</h2>
            <p>Vista de la grilla de sesiones por día y sala</p>
          </div>
        </div>

        @if (loading()) {
          <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
            <div class="spinner"></div> Cargando...
          </div>
        } @else if (programa().length === 0) {
          <div class="empty-wrap" style="min-height:260px">
            <div class="empty-icon">📅</div>
            <h3>Sin sesiones cargadas</h3>
            <p>Agregá sesiones para ver el programa del evento.</p>
            <a [routerLink]="['/congreso', conferenciaId, 'sesiones']" class="btn btn-primary btn-sm" style="margin-top:.75rem">
              Agregar sesiones
            </a>
          </div>
        } @else {
          <!-- Tab días -->
          <div class="day-tabs">
            @for (dia of programa(); track dia.fecha; let i = $index) {
              <button
                class="day-tab"
                [class.day-tab--active]="diaActivo() === i"
                (click)="diaActivo.set(i)">
                {{ dia.fecha | date:'EEE dd/MM':'':'es' }}
              </button>
            }
          </div>

          @if (diaSeleccionado()) {
            <div class="grilla">
              @for (salaGroup of diaSeleccionado()!.salas; track salaGroup.nombre) {
                <div class="sala-col">
                  <div class="sala-header">{{ salaGroup.nombre }}</div>
                  <div class="sesiones-col">
                    @for (sesion of salaGroup.sesiones; track sesion.id) {
                      <div class="sesion-card" [class.sesion-card--track]="sesion.track">
                        <div class="sesion-hora">
                          {{ sesion.horaInicio | slice:0:5 }} – {{ sesion.horaFin | slice:0:5 }}
                        </div>
                        <div class="sesion-titulo">{{ sesion.titulo }}</div>
                        <div class="sesion-expositor">{{ sesion.expositorNombre }}</div>
                        @if (sesion.track) {
                          <span class="sesion-track-badge">{{ sesion.track }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Vista lista alternativa para mobile -->
          <div class="lista-dia">
            @if (diaSeleccionado()) {
              @for (salaGroup of diaSeleccionado()!.salas; track salaGroup.nombre) {
                @for (sesion of salaGroup.sesiones; track sesion.id) {
                  <div class="item-row">
                    <div class="item-avatar">{{ sesion.titulo[0].toUpperCase() }}</div>
                    <div class="item-info">
                      <div class="item-name">{{ sesion.titulo }}</div>
                      <div class="item-sub">
                        {{ sesion.horaInicio | slice:0:5 }} – {{ sesion.horaFin | slice:0:5 }}
                        &nbsp;·&nbsp; {{ salaGroup.nombre }}
                        &nbsp;·&nbsp; {{ sesion.expositorNombre }}
                        @if (sesion.track) {
                          &nbsp;·&nbsp; {{ sesion.track }}
                        }
                      </div>
                    </div>
                  </div>
                }
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .day-tabs {
      display: flex;
      gap: .375rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .day-tab {
      padding: .5rem 1rem;
      border-radius: var(--r-sm);
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      font-size: .875rem;
      cursor: pointer;
      transition: background var(--t), border-color var(--t), color var(--t);
      text-transform: capitalize;
    }
    .day-tab:hover {
      border-color: var(--border-focus);
      color: var(--text);
    }
    .day-tab--active {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }

    /* Grilla desktop */
    .grilla {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: .5rem;
    }
    @media (max-width: 768px) {
      .grilla { display: none; }
    }

    .sala-col {
      flex: 1;
      min-width: 220px;
      max-width: 320px;
    }
    .sala-header {
      font-weight: 700;
      font-size: .875rem;
      text-align: center;
      padding: .625rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-md) var(--r-md) 0 0;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: .04em;
      font-size: .8125rem;
    }
    .sesiones-col {
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 var(--r-md) var(--r-md);
      overflow: hidden;
    }
    .sesion-card {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      transition: background var(--t);
    }
    .sesion-card:last-child { border-bottom: none; }
    .sesion-card:hover { background: var(--surface); }
    .sesion-card--track { border-left: 3px solid var(--primary); }

    .sesion-hora {
      font-size: .75rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
      margin-bottom: .25rem;
    }
    .sesion-titulo {
      font-weight: 600;
      font-size: .9rem;
      margin-bottom: .25rem;
      line-height: 1.3;
    }
    .sesion-expositor {
      font-size: .8125rem;
      color: var(--muted);
      margin-bottom: .375rem;
    }
    .sesion-track-badge {
      display: inline-block;
      font-size: .65rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      color: var(--primary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    /* Lista mobile */
    .lista-dia {
      display: none;
    }
    @media (max-width: 768px) {
      .lista-dia { display: block; }
    }
  `]
})
export class ProgramaComponent implements OnInit, OnDestroy {
  private sesionService = inject(SesionService);
  private route = inject(ActivatedRoute);

  conferenciaId!: string;
  sesiones = signal<SesionListItem[]>([]);
  loading = signal(true);
  diaActivo = signal(0);

  programa = computed<SesionPorDia[]>(() => {
    const all = this.sesiones();
    const porFecha = new Map<string, Map<string, SesionListItem[]>>();

    for (const s of all) {
      if (!porFecha.has(s.fecha)) porFecha.set(s.fecha, new Map());
      const porSala = porFecha.get(s.fecha)!;
      if (!porSala.has(s.salaNombre)) porSala.set(s.salaNombre, []);
      porSala.get(s.salaNombre)!.push(s);
    }

    return Array.from(porFecha.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, salasMap]) => ({
        fecha,
        salas: Array.from(salasMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([nombre, sesiones]) => ({
            nombre,
            sesiones: sesiones.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
          }))
      }));
  });

  diaSeleccionado = computed(() => this.programa()[this.diaActivo()] ?? null);

  private subs = new Subscription();

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id')!;
    this.subs.add(
      this.sesionService.getAllByConferencia(this.conferenciaId).subscribe({
        next: (data) => {
          this.sesiones.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
