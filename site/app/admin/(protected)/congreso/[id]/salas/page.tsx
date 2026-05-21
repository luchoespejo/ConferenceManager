import { apiFetch } from '@/lib/api';
import SalasClient from './SalasClient';

interface Sala { id: string; nombre: string; capacidad?: number | null; }

export default async function SalasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let salas: Sala[] = [];
  try { salas = await apiFetch<Sala[]>(`/api/dashboard/conferencias/${id}/salas`); } catch {}
  return <SalasClient congresoId={id} initialSalas={salas} />;
}
