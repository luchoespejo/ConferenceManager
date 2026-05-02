import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Participante, CreateParticipanteDto, UpdateParticipanteDto } from './participante.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParticipanteService {
  private http = inject(HttpClient);

  private baseUrl(conferenciaId: string) {
    return `${environment.apiUrl}/api/dashboard/conferencias/${conferenciaId}/participantes`;
  }

  getAll(conferenciaId: string): Observable<Participante[]> {
    return this.http.get<Participante[]>(this.baseUrl(conferenciaId));
  }

  create(conferenciaId: string, dto: CreateParticipanteDto): Observable<Participante> {
    return this.http.post<Participante>(this.baseUrl(conferenciaId), dto);
  }

  update(conferenciaId: string, id: string, dto: UpdateParticipanteDto): Observable<Participante> {
    return this.http.put<Participante>(`${this.baseUrl(conferenciaId)}/${id}`, dto);
  }

  delete(conferenciaId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(conferenciaId)}/${id}`);
  }

  toggleCertificado(conferenciaId: string, id: string, valor: boolean): Observable<Participante> {
    return this.http.patch<Participante>(`${this.baseUrl(conferenciaId)}/${id}/certificado`, { valor });
  }
}
