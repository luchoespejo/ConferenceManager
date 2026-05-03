import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  organizacion: string;
  emailVerificado: boolean;
  activo: boolean;
  createdAt: string;
  congresoCount: number;
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-shell">
      <nav class="topbar">
        <a routerLink="/dashboard" class="topbar-brand">
          <div class="brand-icon">🎪</div>
          <span class="brand-name">ConferenceManager</span>
        </a>
        <div class="topbar-right">
          <span style="font-size:.8rem;color:var(--muted);font-family:monospace">SUPERADMIN</span>
          <a routerLink="/dashboard" class="btn btn-secondary btn-sm">← Dashboard</a>
        </div>
      </nav>

      <div class="page-body">
        <div class="page-header">
          <div class="page-title">
            <h2>Usuarios registrados</h2>
            <p>Gestioná el acceso de los organizadores</p>
          </div>
        </div>

        @if (!autenticado()) {
          <div class="card" style="max-width:400px">
            <h3 style="margin-bottom:1rem">Clave de administrador</h3>
            <div class="form-group" style="margin-bottom:1rem">
              <input class="form-control" type="password" #keyInput placeholder="Admin secret key" />
            </div>
            @if (authError()) {
              <div class="error-banner" style="margin-bottom:.75rem">Clave incorrecta o error de conexión.</div>
            }
            <button class="btn btn-primary" (click)="autenticar(keyInput.value)">Acceder</button>
          </div>
        } @else {

          @if (loading()) {
            <div style="display:flex;align-items:center;gap:12px;padding:3rem;color:var(--muted)">
              <div class="spinner"></div> Cargando...
            </div>
          } @else {
            <div class="stats-grid" style="margin-bottom:1.5rem">
              <div class="stat-card stat-primary">
                <div class="stat-label">Total</div>
                <div class="stat-value">{{ usuarios().length }}</div>
              </div>
              <div class="stat-card stat-success">
                <div class="stat-label">Activos</div>
                <div class="stat-value">{{ activos() }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Inactivos</div>
                <div class="stat-value">{{ inactivos() }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Sin verificar</div>
                <div class="stat-value">{{ sinVerificar() }}</div>
              </div>
            </div>

            <div class="item-list">
              @for (u of usuarios(); track u.id) {
                <div class="item-row" [style.opacity]="u.activo ? 1 : 0.55">
                  <div class="item-avatar" [style.background]="u.activo ? 'var(--primary)' : 'var(--muted)'">
                    {{ u.nombre[0].toUpperCase() }}
                  </div>
                  <div class="item-info">
                    <div class="item-name" style="display:flex;align-items:center;gap:.5rem">
                      {{ u.nombre }}
                      @if (!u.activo) {
                        <span class="badge" style="background:#dc354520;color:#dc3545;font-size:.7rem">Deshabilitado</span>
                      }
                      @if (!u.emailVerificado) {
                        <span class="badge" style="background:#ffc10720;color:#856404;font-size:.7rem">Sin verificar</span>
                      }
                    </div>
                    <div class="item-sub">
                      {{ u.email }}
                      @if (u.organizacion) { · {{ u.organizacion }} }
                      · {{ u.congresoCount }} congreso{{ u.congresoCount !== 1 ? 's' : '' }}
                      · Registrado {{ u.createdAt | date:'dd/MM/yyyy' }}
                    </div>
                  </div>
                  <div class="item-actions">
                    @if (u.activo) {
                      <button class="btn btn-sm"
                        style="border-color:#dc3545;color:#dc3545;background:transparent"
                        [disabled]="procesando() === u.id"
                        (click)="desactivar(u)">
                        @if (procesando() === u.id) { <span class="spinner"></span> }
                        Deshabilitar
                      </button>
                    } @else {
                      <button class="btn btn-sm"
                        style="border-color:var(--success);color:var(--success);background:transparent"
                        [disabled]="procesando() === u.id"
                        (click)="activar(u)">
                        @if (procesando() === u.id) { <span class="spinner"></span> }
                        Habilitar
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AdminUsuariosComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/admin`;

  usuarios = signal<UsuarioAdmin[]>([]);
  loading = signal(false);
  autenticado = signal(false);
  authError = signal(false);
  procesando = signal<string | null>(null);

  activos = () => this.usuarios().filter(u => u.activo).length;
  inactivos = () => this.usuarios().filter(u => !u.activo).length;
  sinVerificar = () => this.usuarios().filter(u => !u.emailVerificado).length;

  private adminKey = '';

  ngOnInit(): void {
    const saved = sessionStorage.getItem('admin_key');
    if (saved) {
      this.adminKey = saved;
      this.cargar();
    }
  }

  autenticar(key: string): void {
    this.adminKey = key;
    this.authError.set(false);
    this.cargar();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Admin-Key': this.adminKey });
  }

  private cargar(): void {
    this.loading.set(true);
    this.http.get<UsuarioAdmin[]>(`${this.apiUrl}/usuarios`, { headers: this.headers() }).subscribe({
      next: (data) => {
        sessionStorage.setItem('admin_key', this.adminKey);
        this.usuarios.set(data);
        this.autenticado.set(true);
        this.loading.set(false);
      },
      error: () => {
        sessionStorage.removeItem('admin_key');
        this.authError.set(true);
        this.loading.set(false);
      }
    });
  }

  activar(u: UsuarioAdmin): void {
    this.procesando.set(u.id);
    this.http.put(`${this.apiUrl}/usuarios/${u.id}/activar`, {}, { headers: this.headers() }).subscribe({
      next: () => {
        this.usuarios.update(list => list.map(x => x.id === u.id ? { ...x, activo: true } : x));
        this.procesando.set(null);
      },
      error: () => this.procesando.set(null)
    });
  }

  desactivar(u: UsuarioAdmin): void {
    if (!confirm(`¿Deshabilitar acceso a ${u.email}?`)) return;
    this.procesando.set(u.id);
    this.http.put(`${this.apiUrl}/usuarios/${u.id}/desactivar`, {}, { headers: this.headers() }).subscribe({
      next: () => {
        this.usuarios.update(list => list.map(x => x.id === u.id ? { ...x, activo: false } : x));
        this.procesando.set(null);
      },
      error: () => this.procesando.set(null)
    });
  }
}
