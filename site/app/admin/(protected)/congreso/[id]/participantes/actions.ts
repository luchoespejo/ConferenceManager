'use server';
import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

const base = (id: string) => `/api/dashboard/conferencias/${id}/participantes`;

export async function createParticipante(congresoId: string, data: { nombre: string; email: string; empresa?: string; puedeGenerarCertificado: boolean }) {
  await apiFetch(base(congresoId), { method: 'POST', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/participantes`);
}

export async function updateParticipante(congresoId: string, id: string, data: { nombre: string; email: string; empresa?: string; puedeGenerarCertificado: boolean }) {
  await apiFetch(`${base(congresoId)}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/participantes`);
}

export async function toggleCertificado(congresoId: string, id: string, value: boolean) {
  await apiFetch(`${base(congresoId)}/${id}/certificado`, { method: 'PATCH', body: JSON.stringify({ puedeGenerarCertificado: value }) });
  revalidatePath(`/admin/congreso/${congresoId}/participantes`);
}

export async function deleteParticipante(congresoId: string, id: string) {
  await apiFetch(`${base(congresoId)}/${id}`, { method: 'DELETE' });
  revalidatePath(`/admin/congreso/${congresoId}/participantes`);
}
