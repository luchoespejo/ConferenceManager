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
import { SesionService } from './sesion.service';
import { SalaService } from '../salas/sala.service';
import { ExpositorService } from '../expositores/expositor.service';
import { ToastService } from '../core/toast.service';
import { SesionListItem, CreateSesionDto, UpdateSesionDto } from './sesion.model';
import { SalaDto } from '../salas/sala.model';
import { ExpositorListItem } from '../expositores/expositor.model';
import { TopbarComponent } from '../shared/topbar/topbar.component';
import { CongresoNavComponent } from '../shared/congreso-nav/congreso-nav.component';

@Component({
  selector: 'app-sesiones',
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
            <h2>Sesiones</h2>
            <p>Gestioná el programa del congreso</p>
          </div>
          <button class="btn btn-primary" (click)="abrirCrear()">+ Nueva sesión</button>
        </div>

        @if (mostrarForm()) {
          <div class="form-panel">
            <h3>{{ editandoId() ? 'Editar sesión' : 'Nueva sesión' }}</h3>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-group" style="margin-bottom:1rem">
                <label>Título <span class="required">*</span></label>
                <input class="form-control" type="text" formControlName="titulo" placeholder="Título de la sesión" />
              </div>
              <div class="form-group" style="margin-bottom:1rem">
                <label>Descripción</label>
                <textarea class="form-control" formControlName="descripcion" placeholder="Descripción de la sesión"></textarea>
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Sala <span class="required">*</span></label>
                  <select class="form-control" formControlName="salaId">
                    <option value="">Seleccionar sala</option>
                    @for (sala of salas(); track sala.id) {
                      <option [value]="sala.id">{{ sala.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Expositor <span class="required">*</span></label>
                  <select class="form-control" formControlName="expositorId">
                    <option value="">Seleccionar expositor</option>
                    @for (expositor of expositores(); track expositor.id) {
                      <option [value]="expositor.id">{{ expositor.nombre }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Fecha <span class="required">*</span></label>
                  <input class="form-control" type="date" formControlName="fecha" />
                </div>
                <div class="form-group">
                  <label>Track</label>
                  <input class="form-control" type="text" formControlName="track" placeholder="Ej. Keynote" />
                </div>
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>Hora inicio <span class="required">*</span></label>
                  <input class="form-control" type="time" formControlName="horaInicio" />
                </div>
                <div class="form-group">
                  <label>Hora fin <span class="required">*</span></label>
                  <input class="form-control" type="time" formControlName="horaFin" />
                </div>
              </div>
              <div class="form-row" style="margin-bottom:1rem">
                <div class="form-group">
                  <label>URL Encuesta</label>
                  <input class="form-control" type="url" formControlName="encuestaUrl" placeholder="https://..." />
                </div>
                <div class="form-group">
                  <label>URL QR</label>
                  <input class="form-control" type="url" formControlName="qrCodeUrl" placeholder="https://..." />
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="cancelar()">Cancelar</button>
                <button type="submit" class="btn btn-primary">{{ editandoId() ? 'Actualizar' : 'Guardar sesión' }}</button>
              </div>
            </form>
          </div>
        }

        @if (sesiones().length === 0) {
          <div class="empty-wrap" style="min-height:200px">
            <div class="empty-icon">📅</div>
            <h3>No hay sesiones registradas</h3>
            <p>Agregá la primera sesión usando el botón de arriba.</p>
          </div>
        } @else {
          <div class="table-wrap" style="margin-top:1.5rem">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Sala</th>
                  <th>Expositor</th>
                  <th>Track</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (sesion of sesiones(); track sesion.id) {
                  <tr>
                    <td style="font-weight:600">{{ sesion.titulo }}</td>
                    <td>{{ sesion.fecha }}</td>
                    <td style="white-space:nowrap">{{ sesion.horaInicio }} – {{ sesion.horaFin }}</td>
                    <td>{{ sesion.salaNombre }}</td>
                    <td>{{ sesion.expositorNombre }}</td>
                    <td>
                      @if (sesion.track) {
                        <span class="badge badge-finalizado">{{ sesion.track }}</span>
                      } @else {
                        <span style="color:var(--muted)">—</span>
                      }
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm" style="margin-right:.5rem" (click)="abrirEditar(sesion)">Editar</button>
                      <button class="btn btn-danger btn-sm" (click)="eliminar(sesion.id)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class SesionesComponent implements OnInit, OnDestroy {
  private sesionService = inject(SesionService);
  private salaService = inject(SalaService);
  private expositorService = inject(ExpositorService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  sesiones = signal<SesionListItem[]>([]);
  salas = signal<SalaDto[]>([]);
  expositores = signal<ExpositorListItem[]>([]);
  mostrarForm = signal(false);
  editandoId = signal<string | null>(null);
  conferenciaId!: string;
  form!: FormGroup;
  private subs = new Subscription();

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id')!;
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: [''],
      salaId: ['', Validators.required],
      expositorId: ['', Validators.required],
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      track: [''],
      encuestaUrl: [''],
      qrCodeUrl: ['']
    });
    this.cargarSesiones();
    this.cargarSalas();
    this.cargarExpositores();
  }

  private cargarSesiones(): void {
    this.subs.add(
      this.sesionService.getAllByConferencia(this.conferenciaId).subscribe({
        next: (data) => this.sesiones.set(data),
        error: (err) => console.error('Error cargando sesiones:', err)
      })
    );
  }

  private cargarSalas(): void {
    this.subs.add(
      this.salaService.getSalas(this.conferenciaId).subscribe({
        next: (data) => this.salas.set(data),
        error: (err) => console.error('Error cargando salas:', err)
      })
    );
  }

  private cargarExpositores(): void {
    this.subs.add(
      this.expositorService.getAll(this.conferenciaId).subscribe({
        next: (data) => this.expositores.set(data),
        error: (err) => console.error('Error cargando expositores:', err)
      })
    );
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.mostrarForm.set(true);
  }

  abrirEditar(sesion: SesionListItem): void {
    this.editandoId.set(sesion.id);
    this.subs.add(
      this.sesionService.getById(this.conferenciaId, sesion.id).subscribe({
        next: (detalle) => {
          this.form.patchValue({
            titulo: detalle.titulo,
            descripcion: detalle.descripcion ?? '',
            salaId: detalle.salaId,
            expositorId: detalle.expositorId,
            fecha: detalle.fecha,
            horaInicio: detalle.horaInicio?.slice(0, 5) ?? '',
            horaFin: detalle.horaFin?.slice(0, 5) ?? '',
            track: detalle.track ?? '',
            encuestaUrl: detalle.encuestaUrl ?? '',
            qrCodeUrl: detalle.qrCodeUrl ?? ''
          });
          this.mostrarForm.set(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => console.error('Error cargando sesión:', err)
      })
    );
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
      const dto: UpdateSesionDto = {
        salaId: v.salaId,
        expositorId: v.expositorId,
        titulo: v.titulo,
        descripcion: v.descripcion || undefined,
        fecha: v.fecha,
        horaInicio: v.horaInicio,
        horaFin: v.horaFin,
        track: v.track || undefined,
        encuestaUrl: v.encuestaUrl || undefined,
        qrCodeUrl: v.qrCodeUrl || undefined
      };
      this.subs.add(
        this.sesionService.update(this.conferenciaId, id, dto).subscribe({
          next: () => { this.toast.success('Sesión actualizada.'); this.cancelar(); this.cargarSesiones(); },
          error: (err) => { this.toast.error('Error al actualizar la sesión.'); console.error(err.error ?? err); }
        })
      );
    } else {
      const dto: CreateSesionDto = {
        salaId: v.salaId,
        expositorId: v.expositorId,
        titulo: v.titulo,
        descripcion: v.descripcion || undefined,
        fecha: v.fecha,
        horaInicio: v.horaInicio,
        horaFin: v.horaFin,
        track: v.track || undefined,
        encuestaUrl: v.encuestaUrl || undefined,
        qrCodeUrl: v.qrCodeUrl || undefined
      };
      this.subs.add(
        this.sesionService.create(this.conferenciaId, dto).subscribe({
          next: () => { this.toast.success('Sesión creada.'); this.cancelar(); this.cargarSesiones(); },
          error: (err) => { this.toast.error('Error al crear la sesión.'); console.error(err.error ?? err); }
        })
      );
    }
  }

  eliminar(id: string): void {
    if (confirm('¿Eliminar esta sesión?')) {
      this.subs.add(
        this.sesionService.delete(this.conferenciaId, id).subscribe({
          next: () => { this.toast.success('Sesión eliminada.'); this.cargarSesiones(); },
          error: () => this.toast.error('Error al eliminar la sesión.')
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
