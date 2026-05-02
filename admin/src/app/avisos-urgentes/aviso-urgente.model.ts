export interface AvisoUrgente {
  id: string;
  mensaje: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateAvisoUrgenteDto {
  mensaje: string;
  activo: boolean;
}

export interface UpdateAvisoUrgenteDto {
  mensaje?: string;
  activo?: boolean;
}
