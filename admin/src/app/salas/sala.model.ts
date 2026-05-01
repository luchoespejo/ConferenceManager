export interface SalaDto {
  id: string;
  nombre: string;
  capacidad: number | null;
  creadoEn: string;
}

export interface CreateSalaDto {
  nombre: string;
  capacidad?: number;
}

export interface UpdateSalaDto {
  nombre?: string;
  capacidad?: number;
}
