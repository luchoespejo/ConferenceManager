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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AvisoUrgenteService } from './aviso-urgente.service';
import { AvisoUrgente, CreateAvisoUrgenteDto } from './aviso-urgente.model';
import { TopbarComponent } from '../shared/topbar/topbar.component';
import { CongresoNavComponent } from '../shared/congreso-nav/congreso-nav.component';

@Component({
  selector: 'app-avisos-urgentes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TopbarComponent, CongresoNavComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
      </app-topbar>
      <app-congreso-nav [id]="conferenciaId" />

      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Avisos Urgentes</h2>
            <p>
              {{ totalActivos() }} aviso{{ totalActivos() !== 1 ? 's' : '' }} activo{{ totalActivos() !== 1 ? 's' : '' }} · se muestran en el mini-sitio con polling de 30s
            </p>
          </div>
          <button class="btn btn-primary" (click)="abrirForm()">+ Nuevo aviso</button>
        </div>

        @if (apiError()) {
          <div class="error-banner" style="margin-bottom:1.25rem">{{ apiError() }}</div>
        }

        @if (mostrarForm()) {
          <div class="form-panel" style="margin-bottom:1.5rem">
            <h3>Nuevo aviso urgente</h3>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-group" style="margin-bottom:1rem">
                <label>Mensaje <span class="required">*</span></label>
                <textarea
                  class="form-control"
                  formControlName="mensaje"
                  placeholder="Ej: La sala A se trasladó al salón principal por obras"
                  rows="3"
                  style="resize:vertical"></textarea>
                @if (form.get('mensaje')?.invalid && form.get('mensaje')?.touched) {
                  <span class="field-error">El mensaje es obligatorio (máx. 500 caracteres)</span>
                }
                <span style="font-size:.75rem;color:var(--muted)">{{ form.get('mensaje')?.value?.length ?? 0 }}/500</span>
              </div>
              <div class="form-group" style="margin-bottom:1.25rem">
                <label class="toggle-label">
                  <input type="checkbox" formControlName="activo" />
                  <span class="toggle-track"><span class="toggle-thumb"></span></span>
                  <span>Activar inmediatamente</span>
                </label>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="cancelarForm()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  @if (guardando()) { <span class="spinner"></span> }
                  Publicar aviso
                </button>
              </div>
            </form>
          </div>
        }

        @if (loading()) {
          <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
            <div class="spinner"></div> Cargando...
          </div>
        } @else if (avisos().length === 0) {
          <div class="empty-wrap" style="min-height:200px">
            <div class="empty-icon">📢</div>
            <h3>No hay avisos urgentes</h3>
            <p>Publicá un aviso cuando necesites comunicar algo importante durante el evento.</p>
          </div>
        } @else {
          <div class="item-list">
            @for (aviso of avisos(); track aviso.id) {
              <div class="item-row" [class.aviso-inactivo]="!aviso.activo">
                <div class="item-avatar" [style.background]="aviso.activo ? 'color-mix(in srgb, var(--warning) 20%, transparent)' : 'var(--surface-alt)'"
                     [style.color]="aviso.activo ? 'var(--warning)' : 'var(--muted)'">
                  📢
                </div>
                <div class="item-info" style="flex:1;min-width:0">
                  <div class="item-name" style="white-space:normal;line-height:1.4">{{ aviso.mensaje }}</div>
                  <div class="item-sub">{{ aviso.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
                <div style="display:flex;align-items:center;gap:.75rem;flex-shrink:0">
                  @if (aviso.activo) {
                    <span class="badge badge-publicado">Activo</span>
                  } @else {
                    <span class="badge badge-borrador">Inactivo</span>
                  }
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="toggleActivo(aviso)"
                    [title]="aviso.activo ? 'Desactivar' : 'Activar'">
                    {{ aviso.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="eliminar(aviso.id)">Eliminar</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .aviso-inactivo {
      opacity: .6;
    }
    .toggle-label {
      display: flex;
      align-items: center;
      gap: .625rem;
      cursor: pointer;
      user-select: none;
    }
    .toggle-label input[type="checkbox"] { display: none; }
    .toggle-track {
      width: 40px;
      height: 22px;
      background: var(--border);
      border-radius: 11px;
      position: relative;
      transition: background var(--t);
      flex-shrink: 0;
    }
    .toggle-label input:checked + .toggle-track { background: var(--primary); }
    .toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform var(--t);
      box-shadow: 0 1px 3px rgba(0,0,0,.3);
    }
    .toggle-label input:checked + .toggle-track .toggle-thumb {
      transform: translateX(18px);
    }
  `]
})
export class AvisosUrgentesComponent implements OnInit, OnDestroy {
  private avisoService = inject(AvisoUrgenteService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  conferenciaId!: string;
  avisos = signal<AvisoUrgente[]>([]);
  loading = signal(true);
  mostrarForm = signal(false);
  guardando = signal(false);
  apiError = signal<string | null>(null);

  totalActivos = computed(() => this.avisos().filter(a => a.activo).length);

  form!: FormGroup;
  private subs = new Subscription();

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id')!;
    this.form = this.fb.group({
      mensaje: ['', [Validators.required, Validators.maxLength(500)]],
      activo: [true]
    });
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.subs.add(
      this.avisoService.getAll(this.conferenciaId).subscribe({
        next: (data) => {
          this.avisos.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.apiError.set('Error al cargar los avisos.');
        }
      })
    );
  }

  abrirForm(): void {
    this.form.reset({ activo: true });
    this.apiError.set(null);
    this.mostrarForm.set(true);
  }

  cancelarForm(): void {
    this.mostrarForm.set(false);
    this.form.reset({ activo: true });
    this.apiError.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.apiError.set(null);

    const dto: CreateAvisoUrgenteDto = {
      mensaje: this.form.value.mensaje,
      activo: this.form.value.activo
    };

    this.subs.add(
      this.avisoService.create(this.conferenciaId, dto).subscribe({
        next: (nuevo) => {
          this.avisos.update(list => [nuevo, ...list]);
          this.guardando.set(false);
          this.cancelarForm();
        },
        error: () => {
          this.guardando.set(false);
          this.apiError.set('Error al crear el aviso.');
        }
      })
    );
  }

  toggleActivo(aviso: AvisoUrgente): void {
    this.subs.add(
      this.avisoService.update(this.conferenciaId, aviso.id, { activo: !aviso.activo }).subscribe({
        next: (updated) => {
          this.avisos.update(list => list.map(a => a.id === aviso.id ? updated : a));
        },
        error: () => this.apiError.set('Error al actualizar el aviso.')
      })
    );
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este aviso? Esta acción no se puede deshacer.')) return;
    this.subs.add(
      this.avisoService.delete(this.conferenciaId, id).subscribe({
        next: () => this.avisos.update(list => list.filter(a => a.id !== id)),
        error: () => this.apiError.set('Error al eliminar el aviso.')
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
