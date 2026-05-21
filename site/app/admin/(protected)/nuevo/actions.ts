'use server';

import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export interface CreateCongresoPayload {
  nombre: string;
  slug?: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  venueNombre?: string;
  venueDireccion?: string;
  emailContacto?: string;
}

export async function createCongresoAction(data: CreateCongresoPayload): Promise<{ id: string }> {
  const result = await apiFetch<{ id: string }>('/api/dashboard/conferencias', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  revalidatePath('/admin');
  return result;
}
