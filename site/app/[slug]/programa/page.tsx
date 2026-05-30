import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ConferenciaPrograma {
  slug: string;
  nombre: string;
  colorPrimario?: string;
  mostrarPrograma: boolean;
  programaUrl?: string;
  programaAdicional?: string;
}

async function fetchConferencia(slug: string): Promise<ConferenciaPrograma | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProgramaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);

  if (!conf || !conf.mostrarPrograma) notFound();

  const primary = conf.colorPrimario ?? '#1a1a2e';

  // Resolve PDF URL — if internal /api/files/ point to backend
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  const programaHref = conf.programaUrl
    ? conf.programaUrl.startsWith('/api/')
      ? `${backend}${conf.programaUrl}`
      : conf.programaUrl
    : null;

  return (
    <div className="subpage-content">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: primary }}>
        Programa
      </h1>

      {programaHref && (
        <div style={{ marginBottom: '1.75rem' }}>
          <a
            href={programaHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              padding: '.65rem 1.25rem', background: primary, color: '#fff',
              borderRadius: '8px', fontWeight: 600, fontSize: '.9375rem',
              textDecoration: 'none',
            }}
          >
            ⬇️ Descargar
          </a>
        </div>
      )}

      {conf.programaAdicional ? (
        conf.programaAdicional.trimStart().startsWith('<') ? (
          <div
            style={{ lineHeight: 1.7, color: '#1e293b' }}
            className="puck-richtext"
            dangerouslySetInnerHTML={{ __html: conf.programaAdicional }}
          />
        ) : (
          <p style={{ whiteSpace: 'pre-line', color: '#1e293b', lineHeight: 1.7 }}>
            {conf.programaAdicional}
          </p>
        )
      ) : !programaHref ? (
        <p style={{ color: '#94a3b8' }}>El programa estará disponible próximamente.</p>
      ) : null}
    </div>
  );
}
