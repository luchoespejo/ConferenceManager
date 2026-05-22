import { apiFetch } from '@/lib/api';
import CongresoLayoutClient from './CongresoLayoutClient';

interface ConferenciaDetalle {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
}

export default async function CongresoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let congreso: ConferenciaDetalle | null = null;
  try {
    congreso = await apiFetch<ConferenciaDetalle>(`/api/dashboard/conferencias/${id}`);
  } catch {
    // will show minimal header
  }

  return (
    <CongresoLayoutClient
      id={id}
      nombre={congreso?.nombre ?? '...'}
      slug={congreso?.slug ?? ''}
      estado={congreso?.estado ?? ''}
    >
      {children}
    </CongresoLayoutClient>
  );
}
