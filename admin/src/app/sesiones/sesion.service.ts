import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sesion, SesionListItem, CreateSesionDto, UpdateSesionDto } from './sesion.model';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private http = inject(HttpClient);

  private baseUrl(conferenciaId: string) {
    return `${environment.apiUrl}/api/dashboard/conferencias/${conferenciaId}/sesiones`;
  }

  getAllByConferencia(conferenciaId: string): Observable<SesionListItem[]> {
    return this.http.get<SesionListItem[]>(this.baseUrl(conferenciaId));
  }

  getById(conferenciaId: string, id: string): Observable<Sesion> {
    return this.http.get<Sesion>(`${this.baseUrl(conferenciaId)}/${id}`);
  }

  create(conferenciaId: string, dto: CreateSesionDto): Observable<Sesion> {
    return this.http.post<Sesion>(this.baseUrl(conferenciaId), dto);
  }

  update(conferenciaId: string, id: string, dto: UpdateSesionDto): Observable<Sesion> {
    return this.http.put<Sesion>(`${this.baseUrl(conferenciaId)}/${id}`, dto);
  }

  delete(conferenciaId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(conferenciaId)}/${id}`);
  }
}
