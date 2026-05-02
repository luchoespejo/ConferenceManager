export interface Sesion {
  id: string;
  conferenciaId: string;
  salaId: string;
  expositorId: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  track?: string;
  encuestaUrl?: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export interface SesionListItem {
  id: string;
  conferenciaId: string;
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  track?: string;
  salaNombre: string;
  expositorNombre: string;
}

export interface CreateSesionDto {
  salaId: string;
  expositorId: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  track?: string;
  encuestaUrl?: string;
  qrCodeUrl?: string;
}

export interface UpdateSesionDto {
  salaId?: string;
  expositorId?: string;
  titulo?: string;
  descripcion?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  track?: string;
  encuestaUrl?: string;
  qrCodeUrl?: string;
}
