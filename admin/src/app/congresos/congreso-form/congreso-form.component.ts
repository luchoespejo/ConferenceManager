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
    <div class="page-shell">
      <nav class="topbar">
        <a routerLink="/dashboard" class="topbar-brand">
          <div class="brand-icon">🎪</div>
          <span class="brand-name">ConferenceManager</span>
        </a>
        <div class="topbar-right">
          @if (id) {
            <span class="badge badge-{{ congresoEstado().toLowerCase() }}">{{ congresoEstado() }}</span>
          }
          <a routerLink="/dashboard" class="btn btn-secondary btn-sm">← Dashboard</a>
        </div>
      </nav>

      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>{{ id ? 'Configurar congreso' : 'Nuevo congreso' }}</h2>
            <p>{{ id ? 'Editá los datos de tu evento' : 'Completá la información para crear tu congreso' }}</p>
          </div>
        </div>

        @if (loadError()) {
          <div class="error-banner">
            No se pudo cargar el congreso. <a routerLink="/dashboard">Volver al dashboard</a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <!-- Información general -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Información general</h3>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="nombre">Nombre <span class="required">*</span></label>
                <input id="nombre" type="text" formControlName="nombre" class="form-control" placeholder="Nombre del congreso" />
                @if (f['nombre'].touched && f['nombre'].errors?.['required']) {
                  <div class="error-msg">El nombre es requerido.</div>
                }
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="slug">Slug (subdominio) <span class="required">*</span></label>
                <input id="slug" type="text" formControlName="slug" class="form-control" placeholder="mi-congreso" (input)="onSlugInput()" />
                @if (f['slug'].touched && f['slug'].errors?.['required']) {
                  <div class="error-msg">El slug es requerido.</div>
                }
                @if (f['slug'].touched && f['slug'].errors?.['pattern']) {
                  <div class="error-msg">Solo letras minúsculas, números y guiones (3-50 caracteres).</div>
                }
                @if (slugConflict()) {
                  <div class="error-msg">Este slug ya está en uso. Elegí otro.</div>
                }
                @if (form.get('slug')?.disabled) {
                  <div class="hint" style="font-size:.8rem;color:var(--muted)">El slug no se puede cambiar en congresos publicados o finalizados.</div>
                }
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label for="fechaInicio">Fecha inicio <span class="required">*</span></label>
                  <input id="fechaInicio" type="date" formControlName="fechaInicio" class="form-control" />
                  @if (f['fechaInicio'].touched && f['fechaInicio'].errors?.['required']) {
                    <div class="error-msg">La fecha de inicio es requerida.</div>
                  }
                </div>
                <div class="form-group">
                  <label for="fechaFin">Fecha fin <span class="required">*</span></label>
                  <input id="fechaFin" type="date" formControlName="fechaFin" class="form-control" />
                  @if (f['fechaFin'].touched && f['fechaFin'].errors?.['required']) {
                    <div class="error-msg">La fecha de fin es requerida.</div>
                  }
                </div>
              </div>
              @if (form.errors?.['fechaFinAnterior'] && (f['fechaFin'].touched || f['fechaInicio'].touched)) {
                <div class="error-msg" style="margin-bottom:.75rem">La fecha de fin debe ser igual o posterior a la fecha de inicio.</div>
              }
              @if (fechasError()) {
                <div class="error-msg" style="margin-bottom:.75rem">{{ fechasError() }}</div>
              }
              <div class="form-group">
                <label for="descripcion">Descripción</label>
                <textarea id="descripcion" formControlName="descripcion" class="form-control" rows="3" placeholder="Descripción del congreso (opcional)"></textarea>
              </div>
            </div>

            <!-- Branding -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Branding</h3>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="logoUrl">URL del logo</label>
                <input id="logoUrl" type="url" formControlName="logoUrl" class="form-control" placeholder="https://..." />
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label for="colorPrimario">Color primario</label>
                  <input id="colorPrimario" type="text" formControlName="colorPrimario" class="form-control" placeholder="#rrggbb" maxlength="7" />
                  @if (f['colorPrimario'].errors?.['maxlength']) {
                    <div class="error-msg">Máximo 7 caracteres.</div>
                  }
                </div>
                <div class="form-group">
                  <label for="colorSecundario">Color secundario</label>
                  <input id="colorSecundario" type="text" formControlName="colorSecundario" class="form-control" placeholder="#rrggbb" maxlength="7" />
                  @if (f['colorSecundario'].errors?.['maxlength']) {
                    <div class="error-msg">Máximo 7 caracteres.</div>
                  }
                </div>
              </div>
              <div class="form-group">
                <label for="tipografia">Tipografía</label>
                <input id="tipografia" type="text" formControlName="tipografia" class="form-control" placeholder="Inter, Roboto..." maxlength="100" />
                @if (f['tipografia'].errors?.['maxlength']) {
                  <div class="error-msg">Máximo 100 caracteres.</div>
                }
              </div>
            </div>

            <!-- Sede -->
            <div class="card" style="margin-bottom:1.25rem">
              <h3 style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">Sede del evento</h3>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="venueNombre">Nombre del lugar</label>
                <input id="venueNombre" type="text" formControlName="venueNombre" class="form-control" placeholder="Ej. Centro de Convenciones" />
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label for="venueDireccion">Dirección</label>
                <input id="venueDireccion" type="text" formControlName="venueDireccion" class="form-control" placeholder="Calle y número, ciudad" />
              </div>
              <div class="form-group">
                <label for="venueLinkMaps">Link de Google Maps</label>
                <input id="venueLinkMaps" type="url" formControlName="venueLinkMaps" class="form-control" placeholder="https://maps.google.com/..." />
              </div>
            </div>

            @if (apiError()) {
              <div class="error-banner" style="margin-bottom:1.25rem">{{ apiError() }}</div>
            }

            <!-- Sticky footer actions -->
            <div style="position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--border);padding:1rem 0;display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem">
              <a routerLink="/dashboard" class="btn btn-secondary">Cancelar</a>
              @if (id && congresoEstado() === 'Borrador') {
                <button type="button" class="btn btn-secondary" style="border-color:var(--success);color:var(--success)" (click)="publicar()" [disabled]="publicando()">
                  @if (publicando()) { <span class="spinner"></span> }
                  Publicar
                </button>
              }
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) { <span class="spinner"></span> }
                {{ id ? 'Guardar cambios' : 'Crear congreso' }}
              </button>
            </div>

          </form>
        }
      </div>
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
  publicando = signal(false);
  apiError = signal<string | null>(null);
  slugConflict = signal(false);
  fechasError = signal<string | null>(null);
  congresoEstado = signal<string>('Borrador');

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

        this.congresoEstado.set(congreso.estado);

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

  publicar(): void {
    if (!this.id) return;
    if (!confirm('¿Publicar este congreso? Será visible en el mini-sitio.')) return;

    this.publicando.set(true);
    this.apiError.set(null);

    this.congresoService.publicar(this.id).subscribe({
      next: (congreso) => {
        this.congresoEstado.set(congreso.estado);
        this.publicando.set(false);
      },
      error: (err) => {
        this.publicando.set(false);
        this.apiError.set(err.error?.message ?? 'Error publicando congreso.');
      }
    });
  }
}
