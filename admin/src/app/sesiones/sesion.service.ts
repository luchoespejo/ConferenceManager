import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sesion, SesionListItem, CreateSesionDto, UpdateSesionDto } from './sesion.model';

@Injectable({
  providedIn: 'root'
})
export class SesionService {
  constructor(private http: HttpClient) {}

  getAllByConferencia(conferenciaId: string): Observable<SesionListItem[]> {
    return this.http.get<SesionListItem[]>(
      `/api/dashboard/conferencias/${conferenciaId}/sesiones`
    );
  }

  getById(conferenciaId: string, id: string): Observable<Sesion> {
    return this.http.get<Sesion>(
      `/api/dashboard/conferencias/${conferenciaId}/sesiones/${id}`
    );
  }

  create(conferenciaId: string, dto: CreateSesionDto): Observable<Sesion> {
    return this.http.post<Sesion>(
      `/api/dashboard/conferencias/${conferenciaId}/sesiones`,
      dto
    );
  }

  update(conferenciaId: string, id: string, dto: UpdateSesionDto): Observable<Sesion> {
    return this.http.put<Sesion>(
      `/api/dashboard/conferencias/${conferenciaId}/sesiones/${id}`,
      dto
    );
  }

  delete(conferenciaId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `/api/dashboard/conferencias/${conferenciaId}/sesiones/${id}`
    );
  }
}
