import { apiFetch } from '@/lib/api';
import AvisosClient from './AvisosClient';

interface Aviso { id: string; mensaje: string; activo: boolean; createdAt: string; }

export default async function AvisosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let avisos: Aviso[] = [];
  try { avisos = await apiFetch<Aviso[]>(`/api/dashboard/conferencias/${id}/avisos-urgentes`); } catch {}
  return <AvisosClient congresoId={id} initialAvisos={avisos} />;
}
