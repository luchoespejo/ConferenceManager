import { apiFetch } from '@/lib/api';
import CongresoNav from './_components/CongresoNav';

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
    <div className="flex flex-col min-h-screen">
      <CongresoNav id={id} nombre={congreso?.nombre ?? '...'} slug={congreso?.slug ?? ''} estado={congreso?.estado ?? ''} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
