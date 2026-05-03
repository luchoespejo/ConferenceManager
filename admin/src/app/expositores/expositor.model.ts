export interface ExpositorListItem {
  id: string;
  conferenciaId: string;
  nombre: string;
  email?: string;
  fotoUrl?: string;
  tokenAcceso: string;
}

export interface ExpositorDetalle extends ExpositorListItem {
  bio?: string;
  redesSociales?: Record<string, string>;
  tokenAcceso: string;
}

export interface CreateExpositorDto {
  nombre: string;
  bio?: string;
  fotoUrl?: string;
  email?: string;
  redesSociales?: Record<string, string>;
}

export type UpdateExpositorDto = Partial<CreateExpositorDto>;
