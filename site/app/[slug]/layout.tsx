import { notFound } from 'next/navigation';
import AvisosUrgentes from './AvisosUrgentes';
import SlugNav from '@/components/SlugNav';

export const dynamic = 'force-dynamic';

interface ConferenciaBasica {
  nombre: string;
  slug: string;
  logoUrl?: string;
  colorPrimario?: string;
  mostrarInscripciones?: boolean;
  mostrarContacto?: boolean;
  mostrarInformacion?: boolean;
  tieneSesiones?: boolean;
  tieneExpositores?: boolean;
  venueNombre?: string;
  venueDireccion?: string;
  emailContacto?: string;
  instagram?: string;
}

async function fetchConferencia(slug: string): Promise<ConferenciaBasica | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);

  if (!conf) notFound();

  const primary = conf.colorPrimario ?? '#1a1a2e';
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  const logoSrc = conf.logoUrl
    ? conf.logoUrl.startsWith('http')
      ? conf.logoUrl
      : `${backend}${conf.logoUrl}`
    : null;

  const mostrarContacto =
    conf.mostrarContacto ||
    !!conf.venueNombre ||
    !!conf.venueDireccion ||
    !!conf.emailContacto ||
    !!conf.instagram;

  return (
    <>
      <SlugNav
        slug={slug}
        primary={primary}
        logoSrc={logoSrc}
        nombre={conf.nombre}
        tieneSesiones={conf.tieneSesiones}
        tieneExpositores={conf.tieneExpositores}
        mostrarInscripciones={conf.mostrarInscripciones}
        mostrarContacto={mostrarContacto}
        mostrarInformacion={conf.mostrarInformacion}
      />
      <AvisosUrgentes slug={slug} />
      {children}
    </>
  );
}
