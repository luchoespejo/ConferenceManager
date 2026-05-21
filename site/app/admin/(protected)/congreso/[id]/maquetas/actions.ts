'use server';

import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export interface LayoutTemplateDto {
  id: string;
  conferenciaId: string;
  nombre: string;
  layoutJson: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function layoutsUrl(congresoId: string) {
  return `/api/dashboard/conferencias/${congresoId}/layouts`;
}

export async function getLayoutTemplates(congresoId: string): Promise<LayoutTemplateDto[]> {
  return apiFetch<LayoutTemplateDto[]>(layoutsUrl(congresoId));
}

export async function createLayoutTemplate(
  congresoId: string,
  nombre: string,
  puckData: unknown
): Promise<LayoutTemplateDto> {
  const layoutJson = JSON.stringify({ version: 1, puckData });
  const result = await apiFetch<LayoutTemplateDto>(layoutsUrl(congresoId), {
    method: 'POST',
    body: JSON.stringify({ nombre, layoutJson }),
  });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
  return result;
}

export async function updateLayoutTemplate(
  congresoId: string,
  layoutId: string,
  puckData: unknown
): Promise<LayoutTemplateDto> {
  const layoutJson = JSON.stringify({ version: 1, puckData });
  const result = await apiFetch<LayoutTemplateDto>(`${layoutsUrl(congresoId)}/${layoutId}`, {
    method: 'PUT',
    body: JSON.stringify({ layoutJson }),
  });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
  return result;
}

export async function renameLayoutTemplate(
  congresoId: string,
  layoutId: string,
  nombre: string
): Promise<LayoutTemplateDto> {
  const result = await apiFetch<LayoutTemplateDto>(`${layoutsUrl(congresoId)}/${layoutId}`, {
    method: 'PUT',
    body: JSON.stringify({ nombre }),
  });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
  return result;
}

export async function activateLayoutTemplate(
  congresoId: string,
  layoutId: string
): Promise<LayoutTemplateDto> {
  const result = await apiFetch<LayoutTemplateDto>(`${layoutsUrl(congresoId)}/${layoutId}/activar`, {
    method: 'PUT',
    body: '{}',
  });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
  return result;
}

export async function duplicateLayoutTemplate(
  congresoId: string,
  layoutId: string,
  nombre: string
): Promise<LayoutTemplateDto> {
  const result = await apiFetch<LayoutTemplateDto>(`${layoutsUrl(congresoId)}/${layoutId}/duplicar`, {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
  return result;
}

export async function deleteLayoutTemplate(
  congresoId: string,
  layoutId: string
): Promise<void> {
  await apiFetch<void>(`${layoutsUrl(congresoId)}/${layoutId}`, { method: 'DELETE' });
  revalidatePath(`/admin/congreso/${congresoId}/maquetas`);
}

export async function deployActiveLayout(
  congresoId: string
): Promise<{ triggered: boolean; layoutId: string; layoutNombre: string }> {
  return apiFetch(`${layoutsUrl(congresoId)}/desplegar`, {
    method: 'POST',
    body: '{}',
  });
}
