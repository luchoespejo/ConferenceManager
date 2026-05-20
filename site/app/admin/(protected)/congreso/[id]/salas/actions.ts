'use server';
import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

const base = (id: string) => `/api/dashboard/conferencias/${id}/salas`;

export async function createSala(congresoId: string, data: { nombre: string; capacidad?: number }) {
  await apiFetch(`${base(congresoId)}`, { method: 'POST', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/salas`);
}

export async function updateSala(congresoId: string, salaId: string, data: { nombre: string; capacidad?: number }) {
  await apiFetch(`${base(congresoId)}/${salaId}`, { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/salas`);
}

export async function deleteSala(congresoId: string, salaId: string) {
  await apiFetch(`${base(congresoId)}/${salaId}`, { method: 'DELETE' });
  revalidatePath(`/admin/congreso/${congresoId}/salas`);
}
