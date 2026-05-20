import { apiFetch } from '@/lib/api';
import ParticipantesClient from './ParticipantesClient';

interface Participante { id: string; nombre: string; email: string; empresa?: string | null; puedeGenerarCertificado: boolean; }

export default async function ParticipantesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let participantes: Participante[] = [];
  try { participantes = await apiFetch<Participante[]>(`/api/dashboard/conferencias/${id}/participantes`); } catch {}
  return <ParticipantesClient congresoId={id} initialParticipantes={participantes} />;
}
