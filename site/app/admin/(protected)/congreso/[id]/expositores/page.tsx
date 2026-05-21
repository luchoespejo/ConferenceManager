import { apiFetch } from '@/lib/api';
import ExpositoresClient from './ExpositoresClient';

interface Expositor { id: string; nombre: string; email?: string | null; fotoUrl?: string | null; tokenAcceso: string; }

export default async function ExpositoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let expositores: Expositor[] = [];
  let slug = '';
  try {
    [expositores] = await Promise.all([
      apiFetch<Expositor[]>(`/api/dashboard/conferencias/${id}/expositores`),
    ]);
    const congreso = await apiFetch<{ slug: string }>(`/api/dashboard/conferencias/${id}`);
    slug = congreso.slug;
  } catch {}
  return <ExpositoresClient congresoId={id} slug={slug} initialExpositores={expositores} />;
}
