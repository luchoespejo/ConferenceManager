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

@Component({
  selector: 'app-salas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="salas-page">
      <header class="salas-header">
        <h1>Salas del congreso</h1>
        <a routerLink="/dashboard" class="btn btn-secondary">Volver al dashboard</a>
      </header>

      @if (loading()) {
        <p class="loading-msg">Cargando salas...</p>
      } @else {
        <section class="sala-form-section">
          <h2>{{ editingId() ? 'Editar sala' : 'Nueva sala' }}</h2>
          <form [formGroup]="salaForm" (ngSubmit)="onSubmit()" class="sala-form">
            <div class="form-group">
              <label for="nombre">Nombre <span class="required">*</span></label>
              <input
                id="nombre"
                type="text"
                formControlName="nombre"
                class="form-control"
                [class.is-invalid]="salaForm.get('nombre')?.invalid && salaForm.get('nombre')?.touched"
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
                [class.is-invalid]="salaForm.get('capacidad')?.invalid && salaForm.get('capacidad')?.touched"
                placeholder="Ej. 300"
                min="1"
              />
              @if (salaForm.get('capacidad')?.hasError('min') && salaForm.get('capacidad')?.touched) {
                <div class="error-msg">La capacidad debe ser un entero positivo.</div>
              }
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                {{ submitting() ? 'Guardando...' : (editingId() ? 'Actualizar' : 'Crear sala') }}
              </button>
              @if (editingId()) {
                <button type="button" class="btn btn-secondary" (click)="cancelEdit()">
                  Cancelar
                </button>
              }
            </div>
          </form>
        </section>

        <section class="salas-list-section">
          <h2>Salas registradas</h2>
          @if (salas().length === 0) {
            <p class="empty-msg">No hay salas registradas para este congreso.</p>
          } @else {
            <table class="salas-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Capacidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (sala of salas(); track sala.id) {
                  <tr>
                    <td>{{ sala.nombre }}</td>
                    <td>{{ sala.capacidad ?? '—' }}</td>
                    <td class="actions-cell">
                      <button class="btn btn-sm" (click)="startEdit(sala)">Editar</button>
                      <button class="btn btn-sm btn-danger" (click)="deleteSala(sala.id)" [disabled]="submitting()">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  @if (deleteErrorId() === sala.id) {
                    <tr class="error-row">
                      <td colspan="3">
                        <span class="error-msg">No se puede eliminar una sala con sesiones asignadas.</span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          }
        </section>
      }
    </div>
  `
})
export class SalasComponent implements OnInit {
  private salaService = inject(SalaService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

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
