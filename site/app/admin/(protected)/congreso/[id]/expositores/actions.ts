'use server';
import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

const base = (id: string) => `/api/dashboard/conferencias/${id}/expositores`;

export async function createExpositor(congresoId: string, data: { nombre: string; email?: string; bio?: string; fotoUrl?: string }) {
  await apiFetch(base(congresoId), { method: 'POST', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/expositores`);
}

export async function updateExpositor(congresoId: string, id: string, data: { nombre: string; email?: string; bio?: string; fotoUrl?: string }) {
  await apiFetch(`${base(congresoId)}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/expositores`);
}

export async function deleteExpositor(congresoId: string, id: string) {
  await apiFetch(`${base(congresoId)}/${id}`, { method: 'DELETE' });
  revalidatePath(`/admin/congreso/${congresoId}/expositores`);
}

export async function sendCredentials(congresoId: string, ids: string[]) {
  await apiFetch(`${base(congresoId)}/send-credentials`, {
    method: 'POST',
    body: JSON.stringify({ expositorIds: ids }),
  });
}

export async function getExpositorDetalle(congresoId: string, id: string) {
  return apiFetch<{ id: string; nombre: string; email?: string; bio?: string; fotoUrl?: string }>(`${base(congresoId)}/${id}`);
}
