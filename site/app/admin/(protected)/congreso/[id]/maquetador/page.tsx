import { apiFetch } from '@/lib/api';
import MaquetadorClient from './MaquetadorClient';

export default async function MaquetadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let layoutJson: string | null = null;
  try {
    const res = await apiFetch<{ layoutJson: string | null }>(
      `/api/dashboard/conferencias/${id}/layout`
    );
    layoutJson = res.layoutJson;
  } catch {
    // no layout yet — client will show "start" prompt
  }

  return <MaquetadorClient congresoId={id} initialLayoutJson={layoutJson} />;
}
