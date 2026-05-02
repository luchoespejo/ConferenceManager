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
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SesionService } from './sesion.service';
import { SalaService } from '../salas/sala.service';
import { ExpositorService } from '../expositores/expositor.service';
import { SesionListItem, CreateSesionDto } from './sesion.model';
import { SalaDto } from '../salas/sala.model';
import { ExpositorListItem } from '../expositores/expositor.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h2>Sesiones</h2>
      <button (click)="mostrarForm.set(true)">Nueva Sesión</button>

      <div class="sesiones-list">
        @for (sesion of sesiones(); track sesion.id) {
          <div class="sesion-item">
            <div class="sesion-header">
              <h4>{{ sesion.titulo }}</h4>
              <span class="track" *ngIf="sesion.track">{{ sesion.track }}</span>
            </div>
            <div class="sesion-meta">
              <p><strong>Fecha:</strong> {{ sesion.fecha }}</p>
              <p><strong>Hora:</strong> {{ sesion.horaInicio }} - {{ sesion.horaFin }}</p>
              <p><strong>Sala:</strong> {{ sesion.salaNombre }}</p>
              <p><strong>Expositor:</strong> {{ sesion.expositorNombre }}</p>
            </div>
            <button (click)="eliminar(sesion.id)">Eliminar</button>
          </div>
        }
      </div>

      @if (mostrarForm()) {
        <div class="form-panel">
          <h3>Nueva Sesión</h3>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <input type="text" formControlName="titulo" placeholder="Título" required>
            <textarea formControlName="descripcion" placeholder="Descripción"></textarea>

            <select formControlName="salaId" required>
              <option value="">Seleccionar sala</option>
              @for (sala of salas(); track sala.id) {
                <option [value]="sala.id">{{ sala.nombre }}</option>
              }
            </select>

            <select formControlName="expositorId" required>
              <option value="">Seleccionar expositor</option>
              @for (expositor of expositores(); track expositor.id) {
                <option [value]="expositor.id">{{ expositor.nombre }}</option>
              }
            </select>

            <input type="date" formControlName="fecha" required>
            <input type="time" formControlName="horaInicio" required>
            <input type="time" formControlName="horaFin" required>
            <input type="text" formControlName="track" placeholder="Track (ej. Keynote)">
            <input type="url" formControlName="encuestaUrl" placeholder="URL Encuesta">
            <input type="url" formControlName="qrCodeUrl" placeholder="URL QR">

            <button type="submit">Guardar</button>
            <button type="button" (click)="mostrarForm.set(false)">Cancelar</button>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .sesiones-list { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }
    .sesion-item { padding: 15px; border: 1px solid #ccc; border-radius: 4px; }
    .sesion-header { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .sesion-header h4 { margin: 0; flex: 1; }
    .track { background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-size: 0.85em; }
    .sesion-meta { margin: 10px 0; }
    .sesion-meta p { margin: 5px 0; font-size: 0.9em; color: #666; }
    .form-panel { padding: 20px; border: 1px solid #ccc; border-radius: 4px; margin: 20px 0; }
    input, textarea, select { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { padding: 8px 16px; margin-right: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; cursor: pointer; }
  `]
})
export class SesionesComponent implements OnInit, OnDestroy {
  private sesionService = inject(SesionService);
  private salaService = inject(SalaService);
  private expositorService = inject(ExpositorService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  sesiones = signal<SesionListItem[]>([]);
  salas = signal<SalaDto[]>([]);
  expositores = signal<ExpositorListItemDto[]>([]);
  mostrarForm = signal(false);
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

  submit(): void {
    if (!this.form.valid) return;
    const dto: CreateSesionDto = {
      ...this.form.value,
      fecha: this.form.value.fecha,
      horaInicio: this.form.value.horaInicio,
      horaFin: this.form.value.horaFin
    };
    this.subs.add(
      this.sesionService.create(this.conferenciaId, dto).subscribe({
        next: () => {
          this.form.reset();
          this.mostrarForm.set(false);
          this.cargarSesiones();
        },
        error: (err) => console.error('Error creando sesión:', err)
      })
    );
  }

  eliminar(id: string): void {
    if (confirm('¿Eliminar esta sesión?')) {
      this.subs.add(
        this.sesionService.delete(this.conferenciaId, id).subscribe({
          next: () => this.cargarSesiones(),
          error: (err) => console.error('Error eliminando:', err)
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
