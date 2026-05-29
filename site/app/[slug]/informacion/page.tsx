import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ConferenciaInfo {
  slug: string;
  nombre: string;
  colorPrimario?: string;
  mostrarInformacion: boolean;
  informacionAdicional?: string;
}

async function fetchConferencia(slug: string): Promise<ConferenciaInfo | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function InformacionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);

  if (!conf || !conf.mostrarInformacion) notFound();

  const primary = conf.colorPrimario ?? '#1a1a2e';

  return (
    <div className="subpage-content">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: primary }}>
        Información
      </h1>

      {conf.informacionAdicional ? (
        /* Render as HTML (richtext) if content looks like HTML, else plain text */
        conf.informacionAdicional.trimStart().startsWith('<')
          ? (
            <div
              style={{ lineHeight: 1.7, color: '#1e293b' }}
              className="puck-richtext"
              dangerouslySetInnerHTML={{ __html: conf.informacionAdicional }}
            />
          ) : (
            <p style={{ whiteSpace: 'pre-line', color: '#1e293b', lineHeight: 1.7 }}>
              {conf.informacionAdicional}
            </p>
          )
      ) : (
        <p style={{ color: '#94a3b8' }}>No hay información disponible aún.</p>
      )}
    </div>
  );
}
