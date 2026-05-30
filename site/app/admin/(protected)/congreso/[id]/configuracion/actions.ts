'use server';
import { apiFetch } from '@/lib/api';
import { revalidatePath } from 'next/cache';

const base = (id: string) => `/api/dashboard/conferencias/${id}`;

export interface UpdateCongresoData {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  colorPrimario?: string;
  colorSecundario?: string;
  descripcion?: string;
  subtitulo?: string;
  lema?: string;
  venueNombre?: string;
  venueDireccion?: string;
  venueLinkMaps?: string;
  emailContacto?: string;
  instagram?: string;
  formularioInscripcionUrl?: string;
  arancelesTexto?: string;
  informacionPago?: string;
  contactoAdicional?: string;
  mostrarFechas?: boolean;
  mostrarDescripcion?: boolean;
  mostrarOrganizadores?: boolean;
  mostrarContacto?: boolean;
  mostrarInscripciones?: boolean;
  informacionAdicional?: string;
  mostrarInformacion?: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  mostrarPrograma?: boolean;
  programaUrl?: string;
  programaAdicional?: string;
}

export async function updateCongreso(congresoId: string, data: UpdateCongresoData) {
  await apiFetch(base(congresoId), { method: 'PUT', body: JSON.stringify(data) });
  revalidatePath(`/admin/congreso/${congresoId}/configuracion`);
}

export async function publicarCongreso(congresoId: string) {
  const result = await apiFetch<{ estado: string }>(
    `${base(congresoId)}/publicar`, { method: 'PUT' }
  );
  revalidatePath(`/admin/congreso/${congresoId}`);
  return result;
}

export async function finalizarCongreso(congresoId: string) {
  const result = await apiFetch<{ estado: string }>(
    `${base(congresoId)}/finalizar`, { method: 'PUT' }
  );
  revalidatePath(`/admin/congreso/${congresoId}`);
  return result;
}

export async function redeployarSitio(congresoId: string) {
  await apiFetch(`${base(congresoId)}/redeployar`, { method: 'POST' });
}
