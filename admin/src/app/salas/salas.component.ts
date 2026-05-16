import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SalaService } from './sala.service';
import { SalaDto } from './sala.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../core/toast.service';
import { TopbarComponent } from '../shared/topbar/topbar.component';

@Component({
  selector: 'app-salas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TopbarComponent],
  template: `
    <div class="page-shell">
      <app-topbar>
        <a routerLink="/dashboard" class="btn btn-secondary btn-sm">← Volver</a>
      </app-topbar>
      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Salas</h2>
            <p>Gestioná las salas del congreso</p>
          </div>
        </div>

        @if (loading()) {
          <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
            <div class="spinner"></div> Cargando salas...
          </div>
        } @else {
          <div class="form-panel">
            <h3>{{ editingId() ? 'Editar sala' : 'Nueva sala' }}</h3>
            <form [formGroup]="salaForm" (ngSubmit)="onSubmit()">
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label for="nombre">Nombre <span class="required">*</span></label>
                  <input
                    id="nombre"
                    type="text"
                    formControlName="nombre"
                    class="form-control"
                    placeholder="Ej. Sala Principal"
                  />
                  @if (salaForm.get('nombre')?.hasError('required') && salaForm.get('nombre')?.touched) {
                    <div class="error-msg">El nombre es obligatorio.</div>
                  }
                  @if (salaForm.get('nombre')?.hasError('maxlength') && salaForm.get('nombre')?.touched) {
                    <div class="error-msg">El nombre no puede superar los 100 caracteres.</div>
                  }
                  @if (nombreDuplicadoError()) {
                    <div class="error-msg">Ya existe una sala con ese nombre en este congreso.</div>
                  }
                </div>
                <div class="form-group">
                  <label for="capacidad">Capacidad (opcional)</label>
                  <input
                    id="capacidad"
                    type="number"
                    formControlName="capacidad"
                    class="form-control"
                    placeholder="Ej. 300"
                    min="1"
                  />
                  @if (salaForm.get('capacidad')?.hasError('min') && salaForm.get('capacidad')?.touched) {
                    <div class="error-msg">La capacidad debe ser un entero positivo.</div>
                  }
                </div>
              </div>
              <div class="form-actions">
                @if (editingId()) {
                  <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancelar</button>
                }
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  @if (submitting()) { <span class="spinner"></span> }
                  {{ editingId() ? 'Actualizar sala' : 'Crear sala' }}
                </button>
              </div>
            </form>
          </div>

          @if (salas().length === 0) {
            <div class="empty-wrap" style="min-height:200px">
              <div class="empty-icon">🚪</div>
              <h3>No hay salas registradas</h3>
              <p>Agregá la primera sala usando el formulario de arriba.</p>
            </div>
          } @else {
            <div class="item-list" style="margin-top:1.5rem">
              @for (sala of salas(); track sala.id) {
                <div class="item-row">
                  <div class="item-avatar">🚪</div>
                  <div class="item-info">
                    <div class="item-name">{{ sala.nombre }}</div>
                    <div class="item-sub">
                      {{ sala.capacidad ? 'Capacidad: ' + sala.capacidad + ' personas' : 'Sin capacidad definida' }}
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="btn btn-secondary btn-sm" (click)="startEdit(sala)">Editar</button>
                    <button class="btn btn-danger btn-sm" (click)="deleteSala(sala.id)" [disabled]="submitting()">Eliminar</button>
                  </div>
                </div>
                @if (deleteErrorId() === sala.id) {
                  <div class="error-msg" style="padding:.5rem 1rem">
                    No se puede eliminar una sala con sesiones asignadas.
                  </div>
                }
              }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class SalasComponent implements OnInit {
  private salaService = inject(SalaService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private toast = inject(ToastService);

  private conferenciaId = '';

  salas = signal<SalaDto[]>([]);
  loading = signal(true);
  submitting = signal(false);
  editingId = signal<string | null>(null);
  nombreDuplicadoError = signal(false);
  deleteErrorId = signal<string | null>(null);

  salaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    capacidad: [null, [Validators.min(1)]]
  });

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadSalas();
  }

  private loadSalas(): void {
    this.loading.set(true);
    this.salaService.getSalas(this.conferenciaId).subscribe({
      next: data => {
        this.salas.set(data);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  startEdit(sala: SalaDto): void {
    this.editingId.set(sala.id);
    this.nombreDuplicadoError.set(false);
    this.deleteErrorId.set(null);
    this.salaForm.patchValue({ nombre: sala.nombre, capacidad: sala.capacidad });
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.nombreDuplicadoError.set(false);
    this.salaForm.reset();
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.salaForm.invalid) {
      this.salaForm.markAllAsTouched();
      return;
    }

    this.nombreDuplicadoError.set(false);
    this.submitting.set(true);

    const nombre: string = this.salaForm.value.nombre;
    const capacidad: number | null = this.salaForm.value.capacidad || null;

    const currentEditingId = this.editingId();

    if (currentEditingId) {
      this.salaService.update(this.conferenciaId, currentEditingId, { nombre, capacidad: capacidad ?? undefined }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.editingId.set(null);
          this.salaForm.reset();
          this.loadSalas();
          this.toast.success('Sala actualizada.');
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.nombreDuplicadoError.set(true);
          }
          this.cdr.markForCheck();
        }
      });
    } else {
      this.salaService.create(this.conferenciaId, { nombre, capacidad: capacidad ?? undefined }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.salaForm.reset();
          this.loadSalas();
          this.toast.success('Sala creada.');
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          if (err.status === 409) {
            this.nombreDuplicadoError.set(true);
          }
          this.cdr.markForCheck();
        }
      });
    }
  }

  deleteSala(id: string): void {
    this.deleteErrorId.set(null);
    this.submitting.set(true);

    this.salaService.delete(this.conferenciaId, id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.loadSalas();
        this.toast.success('Sala eliminada.');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 422) {
          this.deleteErrorId.set(id);
        }
        this.cdr.markForCheck();
      }
    });
  }
}
