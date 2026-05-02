import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CongresoListItemDto,
  CongresoDetalleDto,
  CreateCongresoDto,
  UpdateCongresoDto,
  CongresoOverviewDto
} from './congreso.model';

@Injectable({ providedIn: 'root' })
export class CongresoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dashboard/conferencias`;

  getMisCongresos(): Observable<CongresoListItemDto[]> {
    return this.http.get<CongresoListItemDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<CongresoDetalleDto> {
    return this.http.get<CongresoDetalleDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCongresoDto): Observable<CongresoDetalleDto> {
    return this.http.post<CongresoDetalleDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCongresoDto): Observable<CongresoDetalleDto> {
    return this.http.put<CongresoDetalleDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getOverview(id: string): Observable<CongresoOverviewDto> {
    return this.http.get<CongresoOverviewDto>(`${this.baseUrl}/${id}/overview`);
  }

  publicar(id: string): Observable<CongresoDetalleDto> {
    return this.http.put<CongresoDetalleDto>(`${this.baseUrl}/${id}/publicar`, {});
  }
}
