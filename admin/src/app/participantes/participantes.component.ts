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
import { ParticipanteService } from './participante.service';
import { TopbarComponent } from '../shared/topbar/topbar.component';
import { Participante, CreateParticipanteDto, UpdateParticipanteDto } from './participante.model';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-participantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TopbarComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
        <a [routerLink]="['/congreso', conferenciaId]" class="btn btn-secondary btn-sm">← Volver al congreso</a>
      </app-topbar>

      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Participantes</h2>
            <p>{{ total() }} participante{{ total() !== 1 ? 's' : '' }} registrado{{ total() !== 1 ? 's' : '' }} · {{ conCertificado() }} con certificado habilitado</p>
          </div>
          <div style="display:flex;gap:.5rem">
            @if (participantes().length > 0) {
              <button class="btn btn-secondary" (click)="exportarCsv()">↓ Exportar CSV</button>
            }
            <button class="btn btn-primary" (click)="abrirFormNuevo()">+ Nuevo participante</button>
          </div>
        </div>

        @if (apiError()) {
          <div class="error-banner" style="margin-bottom:1.25rem">{{ apiError() }}</div>
        }

        @if (mostrarForm()) {
          <div class="form-panel" style="margin-bottom:1.5rem">
            <h3>{{ editando() ? 'Editar participante' : 'Nuevo participante' }}</h3>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Nombre <span class="required">*</span></label>
                  <input class="form-control" type="text" formControlName="nombre" placeholder="Nombre completo" />
                  @if (form.get('nombre')?.invalid && form.get('nombre')?.touched) {
                    <span class="field-error">El nombre es obligatorio</span>
                  }
                </div>
                <div class="form-group">
                  <label>Email <span class="required">*</span></label>
                  <input class="form-control" type="email" formControlName="email" placeholder="participante@email.com" />
                  @if (form.get('email')?.invalid && form.get('email')?.touched) {
                    <span class="field-error">Email inválido</span>
                  }
                </div>
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Empresa / Institución</label>
                  <input class="form-control" type="text" formControlName="empresa" placeholder="Opcional" />
                </div>
                <div class="form-group" style="justify-content:flex-end">
                  <label class="toggle-label">
                    <input type="checkbox" formControlName="puedeGenerarCertificado" />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>Habilitar certificado</span>
                  </label>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="cancelarForm()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  @if (guardando()) { <span class="spinner"></span> }
                  {{ editando() ? 'Guardar cambios' : 'Agregar participante' }}
                </button>
              </div>
            </form>
          </div>
        }

        @if (loading()) {
          <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
            <div class="spinner"></div> Cargando...
          </div>
        } @else if (participantes().length === 0) {
          <div class="empty-wrap" style="min-height:200px">
            <div class="empty-icon">👥</div>
            <h3>No hay participantes registrados</h3>
            <p>Agregá el primer participante usando el botón de arriba.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Empresa</th>
                  <th style="text-align:center">Certificado</th>
                  <th style="text-align:right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of participantes(); track p.id) {
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:.75rem">
                        <div class="item-avatar" style="width:32px;height:32px;font-size:.8rem;flex-shrink:0">
                          {{ p.nombre[0].toUpperCase() }}
                        </div>
                        {{ p.nombre }}
                      </div>
                    </td>
                    <td>{{ p.email }}</td>
                    <td>{{ p.empresa || '—' }}</td>
                    <td style="text-align:center">
                      <button
                        class="cert-toggle"
                        [class.cert-toggle--on]="p.puedeGenerarCertificado"
                        (click)="toggleCertificado(p)"
                        [title]="p.puedeGenerarCertificado ? 'Deshabilitar certificado' : 'Habilitar certificado'">
                        {{ p.puedeGenerarCertificado ? '✓' : '—' }}
                      </button>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;gap:.5rem;justify-content:flex-end">
                        <button class="btn btn-secondary btn-sm" (click)="abrirFormEdicion(p)">Editar</button>
                        <button class="btn btn-danger btn-sm" (click)="eliminar(p.id)">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper {
      overflow-x: auto;
      border-radius: var(--r-md);
      border: 1px solid var(--border);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: .875rem;
    }
    .data-table th {
      background: var(--surface);
      padding: .75rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: .8125rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .04em;
      border-bottom: 1px solid var(--border);
    }
    .data-table td {
      padding: .875rem 1rem;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      vertical-align: middle;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: var(--surface); }

    .cert-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted);
      font-size: .875rem;
      cursor: pointer;
      transition: background var(--t), border-color var(--t), color var(--t);
    }
    .cert-toggle--on {
      background: color-mix(in srgb, var(--success) 15%, transparent);
      border-color: var(--success);
      color: var(--success);
    }
    .cert-toggle:hover {
      border-color: var(--border-focus);
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: .625rem;
      cursor: pointer;
      user-select: none;
      margin-top: 1.875rem;
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
export class ParticipantesComponent implements OnInit, OnDestroy {
  private participanteService = inject(ParticipanteService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  conferenciaId!: string;
  participantes = signal<Participante[]>([]);
  loading = signal(true);
  mostrarForm = signal(false);
  editando = signal<Participante | null>(null);
  guardando = signal(false);
  apiError = signal<string | null>(null);

  total = computed(() => this.participantes().length);
  conCertificado = computed(() => this.participantes().filter(p => p.puedeGenerarCertificado).length);

  form!: FormGroup;
  private subs = new Subscription();

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id')!;
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      empresa: ['', Validators.maxLength(200)],
      puedeGenerarCertificado: [false]
    });
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.subs.add(
      this.participanteService.getAll(this.conferenciaId).subscribe({
        next: (data) => {
          this.participantes.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.apiError.set('Error al cargar los participantes.');
        }
      })
    );
  }

  abrirFormNuevo(): void {
    this.editando.set(null);
    this.form.reset({ puedeGenerarCertificado: false });
    this.apiError.set(null);
    this.mostrarForm.set(true);
  }

  abrirFormEdicion(p: Participante): void {
    this.editando.set(p);
    this.form.setValue({
      nombre: p.nombre,
      email: p.email,
      empresa: p.empresa ?? '',
      puedeGenerarCertificado: p.puedeGenerarCertificado
    });
    this.apiError.set(null);
    this.mostrarForm.set(true);
  }

  cancelarForm(): void {
    this.mostrarForm.set(false);
    this.editando.set(null);
    this.form.reset({ puedeGenerarCertificado: false });
    this.apiError.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.apiError.set(null);

    const editandoId = this.editando()?.id;
    if (editandoId) {
      const dto: UpdateParticipanteDto = {
        nombre: this.form.value.nombre,
        email: this.form.value.email,
        empresa: this.form.value.empresa || null,
        puedeGenerarCertificado: this.form.value.puedeGenerarCertificado
      };
      this.subs.add(
        this.participanteService.update(this.conferenciaId, editandoId, dto).subscribe({
          next: (updated) => {
            this.participantes.update(list => list.map(p => p.id === editandoId ? updated : p));
            this.guardando.set(false);
            this.cancelarForm();
            this.toast.success('Participante actualizado.');
          },
          error: (err) => {
            this.guardando.set(false);
            const msg = err.error?.error === 'EMAIL_ALREADY_EXISTS'
              ? 'Ya existe otro participante con ese email en este congreso.'
              : 'Error al actualizar el participante.';
            this.apiError.set(msg);
            this.toast.error(msg);
          }
        })
      );
    } else {
      const dto: CreateParticipanteDto = {
        nombre: this.form.value.nombre,
        email: this.form.value.email,
        empresa: this.form.value.empresa || null,
        puedeGenerarCertificado: this.form.value.puedeGenerarCertificado
      };
      this.subs.add(
        this.participanteService.create(this.conferenciaId, dto).subscribe({
          next: (nuevo) => {
            this.participantes.update(list => [...list, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            this.guardando.set(false);
            this.cancelarForm();
            this.toast.success('Participante agregado.');
          },
          error: (err) => {
            this.guardando.set(false);
            const msg = err.error?.error === 'EMAIL_ALREADY_EXISTS'
              ? 'Ya existe un participante con ese email en este congreso.'
              : 'Error al crear el participante.';
            this.apiError.set(msg);
            this.toast.error(msg);
          }
        })
      );
    }
  }

  toggleCertificado(p: Participante): void {
    const nuevoValor = !p.puedeGenerarCertificado;
    this.subs.add(
      this.participanteService.toggleCertificado(this.conferenciaId, p.id, nuevoValor).subscribe({
        next: (updated) => {
          this.participantes.update(list => list.map(x => x.id === p.id ? updated : x));
        },
        error: () => {
          this.apiError.set('Error al actualizar el certificado.');
        }
      })
    );
  }

  exportarCsv(): void {
    const rows = [
      ['Nombre', 'Email', 'Empresa', 'Certificado', 'Registrado'],
      ...this.participantes().map(p => [
        p.nombre,
        p.email,
        p.empresa ?? '',
        p.puedeGenerarCertificado ? 'Sí' : 'No',
        new Date(p.createdAt).toLocaleDateString('es-AR')
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-${this.conferenciaId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este participante? Esta acción no se puede deshacer.')) return;
    this.subs.add(
      this.participanteService.delete(this.conferenciaId, id).subscribe({
        next: () => { this.participantes.update(list => list.filter(p => p.id !== id)); this.toast.success('Participante eliminado.'); },
        error: () => { this.apiError.set('Error al eliminar el participante.'); this.toast.error('Error al eliminar el participante.'); }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
