import { notFound } from 'next/navigation';
import Link from 'next/link';
import AvisosUrgentes from './AvisosUrgentes';

export const revalidate = 300;

interface ConferenciaBasica {
  nombre: string;
  slug: string;
  logoUrl?: string;
  colorPrimario?: string;
}

async function fetchConferencia(slug: string): Promise<ConferenciaBasica | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { next: { revalidate: 300 } });
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
          {logoSrc && (
            <img src={logoSrc} alt={conf.nombre} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          )}
          <span>{conf.nombre}</span>
        </Link>
        <div className="site-nav-spacer" />
        <div className="site-nav-links">
          <Link href={`/${slug}/programa`} className="site-nav-link">Programa</Link>
          <Link href={`/${slug}/expositores`} className="site-nav-link">Expositores</Link>
          <Link href={`/${slug}/certificado`} className="site-nav-link-cert">Certificado</Link>
        </div>
      </nav>
      <AvisosUrgentes slug={slug} />
      {children}
    </>
  );
}
