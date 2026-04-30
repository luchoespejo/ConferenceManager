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
  colorPrimario?: string;
  colorSecundario?: string;
  tipografia?: string;
  venueNombre?: string;
  venueDireccion?: string;
  venueLinkMaps?: string;
}

export type UpdateCongresoDto = Partial<CreateCongresoDto>;
