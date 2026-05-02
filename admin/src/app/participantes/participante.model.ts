export interface Participante {
  id: string;
  nombre: string;
  email: string;
  empresa: string | null;
  puedeGenerarCertificado: boolean;
  createdAt: string;
}

export interface CreateParticipanteDto {
  nombre: string;
  email: string;
  empresa?: string | null;
  puedeGenerarCertificado: boolean;
}

export interface UpdateParticipanteDto {
  nombre?: string;
  email?: string;
  empresa?: string | null;
  puedeGenerarCertificado?: boolean;
}
