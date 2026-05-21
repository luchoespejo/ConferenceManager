import { apiFetch } from '@/lib/api';
import ConfiguracionClient from './ConfiguracionClient';
import { notFound } from 'next/navigation';

interface Congreso {
  id: string; nombre: string; slug: string; estado: string;
  fechaInicio: string; fechaFin: string;
  descripcion?: string | null; subtitulo?: string | null; lema?: string | null;
  venueNombre?: string | null; venueDireccion?: string | null; venueLinkMaps?: string | null;
  emailContacto?: string | null; instagram?: string | null;
  formularioInscripcionUrl?: string | null; arancelesTexto?: string | null; informacionPago?: string | null; contactoAdicional?: string | null;
  mostrarFechas: boolean; mostrarDescripcion: boolean; mostrarOrganizadores: boolean;
  mostrarContacto: boolean; mostrarInscripciones: boolean;
  logoUrl?: string | null; bannerUrl?: string | null;
}

export default async function ConfiguracionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const congreso = await apiFetch<Congreso>(`/api/dashboard/conferencias/${id}`);
    return <ConfiguracionClient congreso={congreso} />;
  } catch {
    notFound();
  }
}
