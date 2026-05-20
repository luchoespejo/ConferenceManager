'use server';
import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

const base = (id: string) => `/api/dashboard/conferencias/${id}/avisos-urgentes`;

export async function createAviso(congresoId: string, mensaje: string) {
  await apiFetch(base(congresoId), { method: 'POST', body: JSON.stringify({ mensaje }) });
  revalidatePath(`/admin/congreso/${congresoId}/avisos`);
}

export async function updateAviso(congresoId: string, avisoId: string, data: { mensaje?: string; activo?: boolean }) {
  await apiFetch(`${base(congresoId)}/${avisoId}`, { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/avisos`);
}

export async function deleteAviso(congresoId: string, avisoId: string) {
  await apiFetch(`${base(congresoId)}/${avisoId}`, { method: 'DELETE' });
  revalidatePath(`/admin/congreso/${congresoId}/avisos`);
}
