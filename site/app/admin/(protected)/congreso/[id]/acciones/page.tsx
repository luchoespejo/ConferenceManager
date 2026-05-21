import { apiFetch } from '@/lib/api';
import AccionesClient from './AccionesClient';
import { notFound } from 'next/navigation';

interface Congreso { id: string; nombre: string; slug: string; estado: string; cantidadSesiones?: number; }

export default async function AccionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const congreso = await apiFetch<Congreso>(`/api/dashboard/conferencias/${id}`);
    return <AccionesClient congreso={congreso} />;
  } catch { notFound(); }
}
