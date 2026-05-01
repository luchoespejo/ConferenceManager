import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CongresoService } from '../congreso.service';
import { CreateCongresoDto, UpdateCongresoDto } from '../congreso.model';

/** Cross-field validator: fechaFin must be >= fechaInicio */
function fechasValidator(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('fechaInicio')?.value as string | null;
  const fin = group.get('fechaFin')?.value as string | null;
  if (inicio && fin && fin < inicio) {
    return { fechaFinAnterior: true };
  }
  return null;
}

/** Derive a URL-safe slug from a display name */
function slugFromNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

@Component({
  selector: 'app-congreso-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-container">
      <h1>{{ id ? 'Configurar congreso' : 'Nuevo congreso' }}</h1>

      @if (loadError()) {
        <p class="error">No se pudo cargar el congreso. <a routerLink="/dashboard">Volver</a></p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Nombre -->
          <div class="field">
            <label for="nombre">Nombre *</label>
            <input id="nombre" type="text" formControlName="nombre" />
            @if (f['nombre'].touched && f['nombre'].errors?.['required']) {
              <span class="field-error">El nombre es requerido.</span>
            }
          </div>

          <!-- Slug -->
          <div class="field">
            <label for="slug">Slug (subdominio) *</label>
            <input
              id="slug"
              type="text"
              formControlName="slug"
              (input)="onSlugInput()"
            />
            @if (f['slug'].touched && f['slug'].errors?.['required']) {
              <span class="field-error">El slug es requerido.</span>
            }
            @if (f['slug'].touched && f['slug'].errors?.['pattern']) {
              <span class="field-error">Solo letras minúsculas, números y guiones (3-50 caracteres).</span>
            }
            @if (slugConflict()) {
              <span class="field-error">Este slug ya está en uso. Elegí otro.</span>
            }
            @if (form.get('slug')?.disabled) {
              <span class="field-hint">El slug no se puede cambiar en congresos publicados o finalizados.</span>
            }
          </div>

          <!-- Fechas -->
          <div class="field-row">
            <div class="field">
              <label for="fechaInicio">Fecha inicio *</label>
              <input id="fechaInicio" type="date" formControlName="fechaInicio" />
              @if (f['fechaInicio'].touched && f['fechaInicio'].errors?.['required']) {
                <span class="field-error">La fecha de inicio es requerida.</span>
              }
            </div>
            <div class="field">
              <label for="fechaFin">Fecha fin *</label>
              <input id="fechaFin" type="date" formControlName="fechaFin" />
              @if (f['fechaFin'].touched && f['fechaFin'].errors?.['required']) {
                <span class="field-error">La fecha de fin es requerida.</span>
              }
            </div>
          </div>
          @if (form.errors?.['fechaFinAnterior'] && (f['fechaFin'].touched || f['fechaInicio'].touched)) {
            <span class="field-error">La fecha de fin debe ser igual o posterior a la fecha de inicio.</span>
          }
          @if (fechasError()) {
            <span class="field-error">{{ fechasError() }}</span>
          }

          <!-- Descripción -->
          <div class="field">
            <label for="descripcion">Descripción</label>
            <textarea id="descripcion" formControlName="descripcion" rows="3"></textarea>
          </div>

          <!-- Branding -->
          <fieldset>
            <legend>Branding</legend>

            <div class="field">
              <label for="logoUrl">URL del logo</label>
              <input id="logoUrl" type="url" formControlName="logoUrl" />
            </div>

            <div class="field-row">
              <div class="field">
                <label for="colorPrimario">Color primario</label>
                <input id="colorPrimario" type="text" formControlName="colorPrimario" placeholder="#rrggbb" maxlength="7" />
                @if (f['colorPrimario'].errors?.['maxlength']) {
                  <span class="field-error">Máximo 7 caracteres.</span>
                }
              </div>
              <div class="field">
                <label for="colorSecundario">Color secundario</label>
                <input id="colorSecundario" type="text" formControlName="colorSecundario" placeholder="#rrggbb" maxlength="7" />
                @if (f['colorSecundario'].errors?.['maxlength']) {
                  <span class="field-error">Máximo 7 caracteres.</span>
                }
              </div>
            </div>

            <div class="field">
              <label for="tipografia">Tipografía</label>
              <input id="tipografia" type="text" formControlName="tipografia" maxlength="100" />
              @if (f['tipografia'].errors?.['maxlength']) {
                <span class="field-error">Máximo 100 caracteres.</span>
              }
            </div>
          </fieldset>

          <!-- Venue -->
          <fieldset>
            <legend>Sede del evento</legend>

            <div class="field">
              <label for="venueNombre">Nombre del lugar</label>
              <input id="venueNombre" type="text" formControlName="venueNombre" />
            </div>
            <div class="field">
              <label for="venueDireccion">Dirección</label>
              <input id="venueDireccion" type="text" formControlName="venueDireccion" />
            </div>
            <div class="field">
              <label for="venueLinkMaps">Link de Google Maps</label>
              <input id="venueLinkMaps" type="url" formControlName="venueLinkMaps" />
            </div>
          </fieldset>

          <!-- General API error -->
          @if (apiError()) {
            <p class="error">{{ apiError() }}</p>
          }

          <!-- Actions -->
          <div class="form-actions">
            <a routerLink="/dashboard" class="btn btn-secondary">Cancelar</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Guardando...' : (id ? 'Guardar cambios' : 'Crear congreso') }}
            </button>
          </div>

        </form>
      }
    </div>
  `
})
export class CongresoFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private congresoService = inject(CongresoService);

  id: string | null = null;
  slugManuallyEdited = false;

  loading = signal(false);
  loadError = signal(false);
  submitting = signal(false);
  apiError = signal<string | null>(null);
  slugConflict = signal(false);
  fechasError = signal<string | null>(null);

  form: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]{3,50}$/)]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      descripcion: [''],
      logoUrl: [''],
      colorPrimario: ['', [Validators.maxLength(7)]],
      colorSecundario: ['', [Validators.maxLength(7)]],
      tipografia: ['', [Validators.maxLength(100)]],
      venueNombre: [''],
      venueDireccion: [''],
      venueLinkMaps: ['']
    },
    { validators: fechasValidator }
  );

  /** Shortcut to access form controls */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  private nombreSub: Subscription | null = null;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    // Auto-suggest slug from nombre when not manually edited
    this.nombreSub = this.form.get('nombre')!.valueChanges.subscribe((value: string) => {
      if (!this.slugManuallyEdited) {
        const suggested = slugFromNombre(value ?? '');
        this.form.get('slug')!.setValue(suggested, { emitEvent: false });
      }
    });

    if (this.id) {
      this.loadCongresoData(this.id);
    }
  }

  ngOnDestroy(): void {
    this.nombreSub?.unsubscribe();
  }

  /** Mark slug as manually edited when user types in it */
  onSlugInput(): void {
    this.slugManuallyEdited = true;
    this.slugConflict.set(false);
  }

  private loadCongresoData(id: string): void {
    this.loading.set(true);
    this.congresoService.getById(id).subscribe({
      next: (congreso) => {
        this.form.patchValue({
          nombre: congreso.nombre,
          slug: congreso.slug,
          fechaInicio: congreso.fechaInicio,
          fechaFin: congreso.fechaFin,
          descripcion: congreso.descripcion ?? '',
          logoUrl: congreso.logoUrl ?? '',
          colorPrimario: congreso.colorPrimario ?? '',
          colorSecundario: congreso.colorSecundario ?? '',
          tipografia: congreso.tipografia ?? '',
          venueNombre: congreso.venueNombre ?? '',
          venueDireccion: congreso.venueDireccion ?? '',
          venueLinkMaps: congreso.venueLinkMaps ?? ''
        });

        // Disable slug field when not in Borrador state
        if (congreso.estado !== 'Borrador') {
          this.form.get('slug')!.disable();
        }

        // Slug was loaded from server — treat as manually set (don't overwrite)
        this.slugManuallyEdited = true;
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.apiError.set(null);
    this.slugConflict.set(false);
    this.fechasError.set(null);

    if (this.id) {
      this.update(this.id);
    } else {
      this.create();
    }
  }

  private create(): void {
    const raw = this.form.getRawValue();
    const dto: CreateCongresoDto = {
      nombre: raw['nombre'],
      slug: raw['slug'],
      fechaInicio: raw['fechaInicio'],
      fechaFin: raw['fechaFin'],
      descripcion: raw['descripcion'] || undefined,
      colorPrimario: raw['colorPrimario'] || undefined,
      colorSecundario: raw['colorSecundario'] || undefined,
      tipografia: raw['tipografia'] || undefined,
      venueNombre: raw['venueNombre'] || undefined,
      venueDireccion: raw['venueDireccion'] || undefined,
      venueLinkMaps: raw['venueLinkMaps'] || undefined
    };

    this.congresoService.create(dto).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.handleApiError(err)
    });
  }

  private update(id: string): void {
    const raw = this.form.getRawValue();
    const dto: UpdateCongresoDto = {
      nombre: raw['nombre'],
      slug: this.form.get('slug')!.enabled ? raw['slug'] : undefined,
      fechaInicio: raw['fechaInicio'],
      fechaFin: raw['fechaFin'],
      descripcion: raw['descripcion'] || undefined,
      colorPrimario: raw['colorPrimario'] || undefined,
      colorSecundario: raw['colorSecundario'] || undefined,
      tipografia: raw['tipografia'] || undefined,
      venueNombre: raw['venueNombre'] || undefined,
      venueDireccion: raw['venueDireccion'] || undefined,
      venueLinkMaps: raw['venueLinkMaps'] || undefined
    };

    this.congresoService.update(id, dto).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.handleApiError(err)
    });
  }

  private handleApiError(err: { status: number; error?: { error?: string; message?: string } }): void {
    this.submitting.set(false);
    const status = err.status;
    const code = err.error?.error;

    if (status === 409 && code === 'SLUG_ALREADY_EXISTS') {
      this.slugConflict.set(true);
      return;
    }

    if (status === 400) {
      if (code === 'FECHA_INICIO_AFTER_FECHA_FIN') {
        this.fechasError.set('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
        return;
      }
      if (code === 'SLUG_INVALID_FORMAT') {
        this.form.get('slug')!.setErrors({ pattern: true });
        return;
      }
    }

    this.apiError.set(err.error?.message ?? 'Ocurrió un error inesperado. Intente nuevamente.');
  }
}
