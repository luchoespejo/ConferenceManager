import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioInfo { id: string; email: string; nombre: string; organizacion?: string; }
export interface LoginDto { email: string; password: string; }
export interface RegistroDto { email: string; password: string; nombre: string; organizacion?: string; }
export interface AuthResponseDto { accessToken: string; refreshToken: string; expiresIn: number; usuario: UsuarioInfo; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private _accessToken = signal<string | null>(localStorage.getItem('access_token'));
  private _usuario = signal<UsuarioInfo | null>(
    JSON.parse(localStorage.getItem('usuario') ?? 'null')
  );

  accessToken = this._accessToken.asReadonly();
  usuario = this._usuario.asReadonly();
  isAuthenticated = computed(() => !!this._accessToken());

  login(dto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/auth/login`, dto).pipe(
      tap(res => this.storeSession(res))
    );
  }

  registro(dto: RegistroDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/auth/registro`, dto);
  }

  refresh(): Observable<AuthResponseDto> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    this._accessToken.set(null);
    this._usuario.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  private storeSession(res: AuthResponseDto): void {
    this._accessToken.set(res.accessToken);
    this._usuario.set(res.usuario);
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('usuario', JSON.stringify(res.usuario));
  }
}
