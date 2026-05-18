import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CongresoListItemDto,
  CongresoDetalleDto,
  CreateCongresoDto,
  UpdateCongresoDto,
  CongresoOverviewDto,
  OrganizadorDto,
  FechaImportanteDto,
  EjeTematicoDto,
  SeccionConfigDto
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

  finalizar(id: string): Observable<CongresoDetalleDto> {
    return this.http.put<CongresoDetalleDto>(`${this.baseUrl}/${id}/finalizar`, {});
  }

  // Organizadores
  getOrganizadores(congresoId: string): Observable<OrganizadorDto[]> {
    return this.http.get<OrganizadorDto[]>(`${this.baseUrl}/${congresoId}/organizadores`);
  }
  addOrganizador(congresoId: string, dto: { nombre: string; logoUrl?: string | null; orden: number }): Observable<OrganizadorDto> {
    return this.http.post<OrganizadorDto>(`${this.baseUrl}/${congresoId}/organizadores`, dto);
  }
  updateOrganizador(congresoId: string, id: string, dto: { nombre: string; logoUrl?: string | null; orden: number }): Observable<OrganizadorDto> {
    return this.http.put<OrganizadorDto>(`${this.baseUrl}/${congresoId}/organizadores/${id}`, dto);
  }
  deleteOrganizador(congresoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${congresoId}/organizadores/${id}`);
  }

  // Fechas importantes
  getFechasImportantes(congresoId: string): Observable<FechaImportanteDto[]> {
    return this.http.get<FechaImportanteDto[]>(`${this.baseUrl}/${congresoId}/fechas-importantes`);
  }
  addFechaImportante(congresoId: string, dto: { descripcion: string; fecha: string; fechaFin?: string | null }): Observable<FechaImportanteDto> {
    return this.http.post<FechaImportanteDto>(`${this.baseUrl}/${congresoId}/fechas-importantes`, dto);
  }
  updateFechaImportante(congresoId: string, id: string, dto: { descripcion: string; fecha: string; fechaFin?: string | null }): Observable<FechaImportanteDto> {
    return this.http.put<FechaImportanteDto>(`${this.baseUrl}/${congresoId}/fechas-importantes/${id}`, dto);
  }
  deleteFechaImportante(congresoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${congresoId}/fechas-importantes/${id}`);
  }

  // Secciones (colores y estilos)
  getSeccionConfigs(congresoId: string): Observable<SeccionConfigDto[]> {
    return this.http.get<SeccionConfigDto[]>(`${this.baseUrl}/${congresoId}/secciones`);
  }
  upsertSeccion(congresoId: string, key: string, dto: { bgColor: string | null; textoColor: string | null }): Observable<SeccionConfigDto> {
    return this.http.put<SeccionConfigDto>(`${this.baseUrl}/${congresoId}/secciones/${key}`, dto);
  }

  // Ejes temáticos
  getEjesTematicos(congresoId: string): Observable<EjeTematicoDto[]> {
    return this.http.get<EjeTematicoDto[]>(`${this.baseUrl}/${congresoId}/ejes-tematicos`);
  }
  addEjeTematico(congresoId: string, dto: { nombre: string }): Observable<EjeTematicoDto> {
    return this.http.post<EjeTematicoDto>(`${this.baseUrl}/${congresoId}/ejes-tematicos`, dto);
  }
  deleteEjeTematico(congresoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${congresoId}/ejes-tematicos/${id}`);
  }
}
