import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ExpositorListItem, ExpositorDetalle, CreateExpositorDto, UpdateExpositorDto } from './expositor.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpositorService {
  private http = inject(HttpClient);

  private baseUrl(conferenciaId: string) {
    return `${environment.apiUrl}/api/dashboard/conferencias/${conferenciaId}/expositores`;
  }

  getAll(conferenciaId: string): Observable<ExpositorListItem[]> {
    return this.http.get<ExpositorListItem[]>(this.baseUrl(conferenciaId));
  }

  getById(conferenciaId: string, id: string): Observable<ExpositorDetalle> {
    return this.http.get<ExpositorDetalle>(`${this.baseUrl(conferenciaId)}/${id}`);
  }

  create(conferenciaId: string, dto: CreateExpositorDto): Observable<ExpositorDetalle> {
    return this.http.post<ExpositorDetalle>(this.baseUrl(conferenciaId), dto);
  }

  update(conferenciaId: string, id: string, dto: UpdateExpositorDto): Observable<ExpositorDetalle> {
    return this.http.put<ExpositorDetalle>(`${this.baseUrl(conferenciaId)}/${id}`, dto);
  }

  delete(conferenciaId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(conferenciaId)}/${id}`);
  }
}
