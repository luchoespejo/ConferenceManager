'use server';

import { apiFetch } from '@/lib/api';

export async function saveLayoutAction(congresoId: string, puckData: unknown): Promise<void> {
  const layoutJson = JSON.stringify({ version: 1, puckData });
  await apiFetch(`/api/dashboard/conferencias/${congresoId}/layout`, {
    method: 'PUT',
    body: JSON.stringify({ layoutJson }),
  });
}
