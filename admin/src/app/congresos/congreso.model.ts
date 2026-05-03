export type EstadoCongreso = 'Borrador' | 'Publicado' | 'Finalizado';

export interface CongresoListItemDto {
  id: string;
  slug: string;
  nombre: string;
  estado: EstadoCongreso;
  fechaInicio: string;
  fechaFin: string;
  cantidadSesiones: number;
  creadoEn: string;
}

export interface CongresoDetalleDto {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoCongreso;
  fechaInicio: string;
  fechaFin: string;
  logoUrl: string | null;
  logoSecundarioUrl: string | null;
  bannerUrl: string | null;
  faviconUrl: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
  tipografia: string | null;
  venueNombre: string | null;
  venueDireccion: string | null;
  venueLinkMaps: string | null;
  creadoEn: string;
}

export interface CreateCongresoDto {
  nombre: string;
  slug?: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion?: string;
  logoUrl?: string;
  logoSecundarioUrl?: string;
  bannerUrl?: string;
  faviconUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  tipografia?: string;
  venueNombre?: string;
  venueDireccion?: string;
  venueLinkMaps?: string;
}

export type UpdateCongresoDto = Partial<CreateCongresoDto>;

export interface SesionProximaDto {
  id: string;
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  salaNombre: string;
  expositorNombre: string;
  track: string | null;
}

export interface CongresoOverviewDto {
  id: string;
  nombre: string;
  slug: string;
  estado: EstadoCongreso;
  fechaInicio: string;
  fechaFin: string;
  colorPrimario: string | null;
  venueNombre: string | null;
  venueDireccion: string | null;
  totalSesiones: number;
  totalExpositores: number;
  totalSalas: number;
  totalParticipantes: number;
  proximasSesiones: SesionProximaDto[];
}
