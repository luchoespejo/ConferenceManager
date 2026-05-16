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
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ExpositorService } from './expositor.service';
import { CongresoService } from '../congresos/congreso.service';
import { ExpositorListItem, UpdateExpositorDto } from './expositor.model';
import { ImageUploadComponent } from '../shared/image-upload/image-upload.component';

@Component({
  selector: 'app-expositores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImageUploadComponent],
  template: `
    <div class="page-shell">
      <nav class="topbar">
        <a routerLink="/dashboard" class="topbar-brand">
          <div class="brand-icon">🎪</div>
          <span class="brand-name">ConferenceManager</span>
        </a>
        <div class="topbar-right">
          <a [routerLink]="['/congreso', conferenciaId]" class="btn btn-secondary btn-sm">← Volver</a>
        </div>
      </nav>
      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Expositores</h2>
            <p>Gestioná los expositores del congreso</p>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-secondary" (click)="resendTodos()" [disabled]="expositores().length === 0">📧 Enviar a todos</button>
            <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo expositor</button>
          </div>
        </div>

        @if (mostrarForm()) {
          <div class="form-panel">
            <h3>{{ editandoId() ? 'Editar expositor' : 'Nuevo expositor' }}</h3>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Nombre <span class="required">*</span></label>
                  <input class="form-control" type="text" formControlName="nombre" placeholder="Nombre completo" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input class="form-control" type="email" formControlName="email" placeholder="expositor@email.com" />
                </div>
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label>Biografía</label>
                <textarea class="form-control" formControlName="bio" placeholder="Breve descripción del expositor"></textarea>
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label>Foto</label>
                <app-image-upload
                  label="foto"
                  [currentUrl]="fotoUrl()"
                  (urlChange)="fotoUrl.set($event)" />
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="cancelar()">Cancelar</button>
                <button type="submit" class="btn btn-primary">{{ editandoId() ? 'Actualizar' : 'Guardar' }}</button>
              </div>
            </form>
          </div>
        }

        @if (expositores().length === 0) {
          <div class="empty-wrap" style="min-height:200px">
            <div class="empty-icon">🎤</div>
            <h3>No hay expositores registrados</h3>
            <p>Agregá el primer expositor usando el botón de arriba.</p>
          </div>
        } @else {
          <div class="item-list">
            @for (expositor of expositores(); track expositor.id) {
              <div class="item-row">
                <div class="item-avatar">
                  @if (expositor.fotoUrl) {
                    <img [src]="expositor.fotoUrl" [alt]="expositor.nombre" style="width:100%;height:100%;border-radius:50%;object-fit:cover">
                  } @else {
                    {{ expositor.nombre[0].toUpperCase() }}
                  }
                </div>
                <div class="item-info">
                  <div class="item-name">{{ expositor.nombre }}</div>
                  <div class="item-sub">{{ expositor.email || 'Sin email' }}</div>
                </div>
                <div class="item-actions">
                  <button class="btn btn-secondary btn-sm" title="Copiar link de acceso" (click)="copiarLink(expositor)">🔗 Link</button>
                  <button class="btn btn-secondary btn-sm" (click)="resendUno(expositor)" [disabled]="enviando()">📧 Enviar</button>
                  <button class="btn btn-secondary btn-sm" (click)="abrirEditar(expositor)">Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="eliminar(expositor.id)">Eliminar</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ExpositoresComponent implements OnInit, OnDestroy {
  private expositorService = inject(ExpositorService);
  private congresoService = inject(CongresoService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  expositores = signal<ExpositorListItem[]>([]);
  mostrarForm = signal(false);
  editandoId = signal<string | null>(null);
  fotoUrl = signal<string | null>(null);
  enviando = signal(false);
  conferenciaId!: string;
  private slugCongreso = '';
  form!: FormGroup;
  private subs = new Subscription();

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id')!;
    this.subs.add(
      this.congresoService.getById(this.conferenciaId).subscribe({
        next: (c) => { this.slugCongreso = c.slug; },
        error: () => {}
      })
    );
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      bio: [''],
      email: ['', [Validators.email, Validators.maxLength(255)]]
    });
    this.cargar();
  }

  private cargar(): void {
    this.subs.add(
      this.expositorService.getAll(this.conferenciaId).subscribe({
        next: (data) => this.expositores.set(data),
        error: (err) => console.error('Error cargando expositores:', err)
      })
    );
  }

  copiarLink(expositor: ExpositorListItem): void {
    const baseUrl = this.slugCongreso
      ? `https://${this.slugCongreso}.tuplataforma.com`
      : `http://localhost:3000`;
    const accessUrl = `${baseUrl}/expositor/${expositor.tokenAcceso}`;
    navigator.clipboard.writeText(accessUrl).then(
      () => alert(`Link copiado:\n${accessUrl}`),
      () => prompt('Copiá este link:', accessUrl)
    );
  }

  resendUno(expositor: ExpositorListItem): void {
    this.enviando.set(true);
    this.subs.add(
      this.expositorService.sendCredentials(this.conferenciaId, [expositor.id]).subscribe({
        next: () => {
          this.enviando.set(false);
          alert(`✓ Email enviado a ${expositor.nombre}`);
        },
        error: (err) => {
          this.enviando.set(false);
          alert('✗ Error al enviar email');
          console.error(err);
        }
      })
    );
  }

  resendTodos(): void {
    if (!confirm('¿Enviar credenciales a todos los expositores?')) return;
    this.enviando.set(true);
    const ids = this.expositores().map(e => e.id);
    this.subs.add(
      this.expositorService.sendCredentials(this.conferenciaId, ids).subscribe({
        next: () => {
          this.enviando.set(false);
          alert(`✓ Emails enviados a ${ids.length} expositores`);
        },
        error: (err) => {
          this.enviando.set(false);
          alert('✗ Error al enviar emails');
          console.error(err);
        }
      })
    );
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.fotoUrl.set(null);
    this.form.reset();
    this.mostrarForm.set(true);
  }

  abrirEditar(expositor: ExpositorListItem): void {
    this.editandoId.set(expositor.id);
    this.fotoUrl.set(expositor.fotoUrl ?? null);
    this.form.patchValue({ nombre: expositor.nombre, email: expositor.email ?? '', bio: '' });
    this.mostrarForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.expositorService.getById(this.conferenciaId, expositor.id).subscribe({
      next: (detalle) => this.form.patchValue({ bio: detalle.bio ?? '' }),
      error: () => {}
    });
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editandoId.set(null);
    this.fotoUrl.set(null);
    this.form.reset();
  }

  submit(): void {
    if (!this.form.valid) return;
    const v = this.form.value;
    const id = this.editandoId();

    if (id) {
      const dto: UpdateExpositorDto = {
        nombre: v.nombre,
        email: v.email || undefined,
        bio: v.bio || undefined,
        fotoUrl: this.fotoUrl() ?? undefined
      };
      this.subs.add(
        this.expositorService.update(this.conferenciaId, id, dto).subscribe({
          next: () => { this.cancelar(); this.cargar(); },
          error: (err) => console.error('Error actualizando expositor:', err)
        })
      );
    } else {
      this.subs.add(
        this.expositorService.create(this.conferenciaId, {
          nombre: v.nombre,
          email: v.email || undefined,
          bio: v.bio || undefined,
          fotoUrl: this.fotoUrl() ?? undefined
        }).subscribe({
          next: () => { this.cancelar(); this.cargar(); },
          error: (err) => console.error('Error creando expositor:', err)
        })
      );
    }
  }

  eliminar(id: string): void {
    if (confirm('¿Eliminar este expositor?')) {
      this.subs.add(
        this.expositorService.delete(this.conferenciaId, id).subscribe({
          next: () => this.cargar(),
          error: (err) => console.error('Error eliminando:', err)
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
