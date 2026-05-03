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

@Component({
  selector: 'app-expositores',
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
          <a [routerLink]="['/congreso', conferenciaId]" class="btn btn-secondary btn-sm">← Volver</a>
        </div>
      </nav>
      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Expositores</h2>
            <p>Gestioná los expositores del congreso</p>
          </div>
          <button class="btn btn-primary" (click)="abrirCrear()">+ Nuevo expositor</button>
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
                <label>URL de foto</label>
                <input class="form-control" type="text" formControlName="fotoUrl" placeholder="https://..." />
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
      email: ['', [Validators.email, Validators.maxLength(255)]],
      fotoUrl: ['']
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
    const siteUrl = this.slugCongreso
      ? `http://${this.slugCongreso}.tuplataforma.com/mi-espacio?token=${expositor.tokenAcceso}`
      : `http://localhost:3000/mi-espacio?token=${expositor.tokenAcceso}`;
    navigator.clipboard.writeText(siteUrl).then(
      () => alert(`Link copiado:\n${siteUrl}`),
      () => prompt('Copiá este link:', siteUrl)
    );
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.mostrarForm.set(true);
  }

  abrirEditar(expositor: ExpositorListItem): void {
    this.editandoId.set(expositor.id);
    this.form.patchValue({
      nombre: expositor.nombre,
      email: expositor.email ?? '',
      fotoUrl: expositor.fotoUrl ?? '',
      bio: ''
    });
    this.mostrarForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editandoId.set(null);
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
        fotoUrl: v.fotoUrl || undefined
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
          fotoUrl: v.fotoUrl || undefined
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
