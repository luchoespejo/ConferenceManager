import { apiFetch } from '@/lib/api';
import SesionesClient from './SesionesClient';

interface SesionItem { id: string; titulo: string; fecha: string; horaInicio: string; horaFin: string; salaNombre: string; expositorNombre: string; track?: string | null; }
interface Sala { id: string; nombre: string; }
interface Expositor { id: string; nombre: string; }

export default async function SesionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let sesiones: SesionItem[] = [];
  let salas: Sala[] = [];
  let expositores: Expositor[] = [];
  try {
    [sesiones, salas, expositores] = await Promise.all([
      apiFetch<SesionItem[]>(`/api/dashboard/conferencias/${id}/sesiones`),
      apiFetch<Sala[]>(`/api/dashboard/conferencias/${id}/salas`),
      apiFetch<Expositor[]>(`/api/dashboard/conferencias/${id}/expositores`),
    ]);
  } catch {}
  return <SesionesClient congresoId={id} initialSesiones={sesiones} salas={salas} expositores={expositores} />;
}
