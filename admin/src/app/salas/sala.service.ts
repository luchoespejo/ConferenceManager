import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SalaDto, CreateSalaDto, UpdateSalaDto } from './sala.model';

@Injectable({ providedIn: 'root' })
export class SalaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dashboard/conferencias`;

  getSalas(conferenciaId: string): Observable<SalaDto[]> {
    return this.http.get<SalaDto[]>(`${this.baseUrl}/${conferenciaId}/salas`);
  }

  create(conferenciaId: string, dto: CreateSalaDto): Observable<SalaDto> {
    return this.http.post<SalaDto>(`${this.baseUrl}/${conferenciaId}/salas`, dto);
  }

  update(conferenciaId: string, id: string, dto: UpdateSalaDto): Observable<SalaDto> {
    return this.http.put<SalaDto>(`${this.baseUrl}/${conferenciaId}/salas/${id}`, dto);
  }

  delete(conferenciaId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${conferenciaId}/salas/${id}`);
  }
}
