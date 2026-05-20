'use server';
import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

const base = (id: string) => `/api/dashboard/conferencias/${id}/sesiones`;

export interface SesionPayload {
  titulo: string; descripcion?: string; salaId: string; expositorId: string;
  fecha: string; horaInicio: string; horaFin: string;
  track?: string; encuestaUrl?: string; qrCodeUrl?: string;
}

export async function createSesion(congresoId: string, data: SesionPayload) {
  await apiFetch(base(congresoId), { method: 'POST', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/sesiones`);
}

export async function updateSesion(congresoId: string, sesionId: string, data: SesionPayload) {
  await apiFetch(`${base(congresoId)}/${sesionId}`, { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/sesiones`);
}

export async function deleteSesion(congresoId: string, sesionId: string) {
  await apiFetch(`${base(congresoId)}/${sesionId}`, { method: 'DELETE' });
  revalidatePath(`/admin/congreso/${congresoId}/sesiones`);
}

export async function getSesionDetalle(congresoId: string, sesionId: string) {
  return apiFetch<SesionPayload & { id: string; salaId: string; expositorId: string }>(`${base(congresoId)}/${sesionId}`);
}
