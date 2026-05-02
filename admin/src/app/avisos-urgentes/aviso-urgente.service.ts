import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AvisoUrgente, CreateAvisoUrgenteDto, UpdateAvisoUrgenteDto } from './aviso-urgente.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AvisoUrgenteService {
  private http = inject(HttpClient);

  private baseUrl(conferenciaId: string) {
    return `${environment.apiUrl}/dashboard/conferencias/${conferenciaId}/avisos-urgentes`;
  }

  getAll(conferenciaId: string): Observable<AvisoUrgente[]> {
    return this.http.get<AvisoUrgente[]>(this.baseUrl(conferenciaId));
  }

  create(conferenciaId: string, dto: CreateAvisoUrgenteDto): Observable<AvisoUrgente> {
    return this.http.post<AvisoUrgente>(this.baseUrl(conferenciaId), dto);
  }

  update(conferenciaId: string, id: string, dto: UpdateAvisoUrgenteDto): Observable<AvisoUrgente> {
    return this.http.put<AvisoUrgente>(`${this.baseUrl(conferenciaId)}/${id}`, dto);
  }

  delete(conferenciaId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(conferenciaId)}/${id}`);
  }
}
