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
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ExpositorService } from './expositor.service';
import { ExpositorListItem, CreateExpositorDto } from './expositor.model';

@Component({
  selector: 'app-expositores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h2>Expositores</h2>
      <button (click)="mostrarForm.set(true)">Nuevo Expositor</button>

      <div class="expositores-list">
        @for (expositor of expositores(); track expositor.id) {
          <div class="expositor-item">
            <div class="avatar">
              @if (expositor.fotoUrl) {
                <img [src]="expositor.fotoUrl" [alt]="expositor.nombre">
              } @else {
                <span>{{ expositor.nombre[0].toUpperCase() }}</span>
              }
            </div>
            <div class="info">
              <h4>{{ expositor.nombre }}</h4>
              <p>{{ expositor.email || 'Sin email' }}</p>
            </div>
            <button (click)="eliminar(expositor.id)">Eliminar</button>
          </div>
        }
      </div>

      @if (mostrarForm()) {
        <div class="form-panel">
          <h3>Nuevo Expositor</h3>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <input type="text" formControlName="nombre" placeholder="Nombre" required>
            <textarea formControlName="bio" placeholder="Biografía"></textarea>
            <input type="email" formControlName="email" placeholder="Email">
            <input type="text" formControlName="fotoUrl" placeholder="URL Foto">
            <button type="submit">Guardar</button>
            <button type="button" (click)="mostrarForm.set(false)">Cancelar</button>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .expositores-list { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }
    .expositor-item { display: flex; gap: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .avatar { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #eee; }
    .avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .info { flex: 1; }
    .info h4 { margin: 0; }
    .info p { margin: 5px 0 0 0; color: #666; }
    .form-panel { padding: 20px; border: 1px solid #ccc; border-radius: 4px; margin: 20px 0; }
    input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
  `]
})
export class ExpositoresComponent implements OnInit, OnDestroy {
  private expositorService = inject(ExpositorService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  expositores = signal<ExpositorListItem[]>([]);
  mostrarForm = signal(false);
  conferenciaId!: string;
  form!: FormGroup;
  private subs = new Subscription();

  ngOnInit(): void {
    this.conferenciaId = this.route.snapshot.paramMap.get('id')!;
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

  submit(): void {
    if (!this.form.valid) return;
    const dto: CreateExpositorDto = this.form.value;
    this.subs.add(
      this.expositorService.create(this.conferenciaId, dto).subscribe({
        next: () => {
          this.form.reset();
          this.mostrarForm.set(false);
          this.cargar();
        },
        error: (err) => console.error('Error creando expositor:', err)
      })
    );
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
