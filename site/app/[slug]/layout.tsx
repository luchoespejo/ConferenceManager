import { notFound } from 'next/navigation';
import Link from 'next/link';
import AvisosUrgentes from './AvisosUrgentes';

export const dynamic = 'force-dynamic';

interface ConferenciaBasica {
  nombre: string;
  slug: string;
  logoUrl?: string;
  colorPrimario?: string;
  mostrarInscripciones?: boolean;
  mostrarContacto?: boolean;
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

  return (
    <>
      <nav className="site-nav" style={{ background: primary }}>
        <Link href={`/${slug}`} className="site-nav-brand">
          {logoSrc ? (
            <img src={logoSrc} alt={conf.nombre} style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <span>Inicio</span>
          )}
        </Link>
        <div className="site-nav-spacer" />
        <div className="site-nav-links">
          {conf.tieneSesiones && (
            <Link href={`/${slug}/programa`} className="site-nav-link">Programa</Link>
          )}
          {conf.tieneExpositores && (
            <Link href={`/${slug}/expositores`} className="site-nav-link">Expositores</Link>
          )}
          {conf.mostrarInscripciones && (
            <Link href={`/${slug}/inscripciones`} className="site-nav-link" style={{ fontWeight: 700 }}>
              Inscripciones
            </Link>
          )}
          {(conf.mostrarContacto || conf.venueNombre || conf.venueDireccion || conf.emailContacto || conf.instagram) && (
            <Link href={`/${slug}/contacto`} className="site-nav-link">Contacto</Link>
          )}
        </div>
      </nav>
      <AvisosUrgentes slug={slug} />
      {children}
    </>
  );
}
