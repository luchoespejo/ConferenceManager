import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 300;

interface Conferencia {
  nombre: string;
  slug: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  venueNombre?: string;
  venueDireccion?: string;
}

async function fetchConferencia(slug: string): Promise<Conferencia | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ConferenciaHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);

  if (!conf) notFound();

  const primary = conf.colorPrimario ?? '#1a1a2e';
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  const logoSrc = conf.logoUrl
    ? conf.logoUrl.startsWith('http') ? conf.logoUrl : `${backend}${conf.logoUrl}`
    : null;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Hero */}
      <div style={{ background: primary, color: '#fff', padding: '5rem 1.5rem', textAlign: 'center' }}>
        {logoSrc && (
          <img src={logoSrc} alt={conf.nombre} style={{ height: '64px', width: 'auto', margin: '0 auto 1.5rem', display: 'block' }} />
        )}
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 700, margin: '0 0 1rem' }}>{conf.nombre}</h1>
        {conf.descripcion && (
          <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 1.5rem', opacity: .9, lineHeight: 1.6 }}>
            {conf.descripcion}
          </p>
        )}
        <p style={{ fontSize: '.95rem', opacity: .8, margin: '0 0 2rem' }}>
          {fmtDate(conf.fechaInicio)} — {fmtDate(conf.fechaFin)}
        </p>
        <Link
          href={`/${slug}/programa`}
          style={{
            display: 'inline-block',
            background: '#fff',
            color: primary,
            fontWeight: 700,
            padding: '12px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1rem'
          }}
        >
          Ver Programa
        </Link>
      </div>

      {/* Venue */}
      {conf.venueNombre && (
        <div style={{ padding: '4rem 1.5rem', background: '#f8fafc' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Sede del evento</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '.5rem' }}>{conf.venueNombre}</p>
            {conf.venueDireccion && (
              <p style={{ color: '#64748b' }}>{conf.venueDireccion}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
