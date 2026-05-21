'use server';

import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

// Legacy: guarda en layoutJson de la conferencia (mantener por compatibilidad)
export async function saveLayoutAction(congresoId: string, puckData: unknown): Promise<void> {
  const layoutJson = JSON.stringify({ version: 1, puckData });
  await apiFetch(`/api/dashboard/conferencias/${congresoId}/layout`, {
    method: 'PUT',
    body: JSON.stringify({ layoutJson }),
  });
}

// Template: crea nuevo
export async function createTemplateAction(
  congresoId: string,
  nombre: string,
  puckData: unknown
): Promise<{ id: string; nombre: string }> {
  const layoutJson = JSON.stringify({ version: 1, puckData });
  const result = await apiFetch<{ id: string; nombre: string }>(
    `/api/dashboard/conferencias/${congresoId}/layouts`,
    {
      method: 'POST',
      body: JSON.stringify({ nombre, layoutJson }),
    }
  );
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
  return result;
}

// Template: actualiza existente
export async function updateTemplateAction(
  congresoId: string,
  layoutId: string,
  puckData: unknown
): Promise<void> {
  const layoutJson = JSON.stringify({ version: 1, puckData });
  await apiFetch(`/api/dashboard/conferencias/${congresoId}/layouts/${layoutId}`, {
    method: 'PUT',
    body: JSON.stringify({ layoutJson }),
  });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
}
