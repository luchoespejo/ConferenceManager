import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ConferenciaContacto {
  nombre: string;
  slug: string;
  colorPrimario?: string;
  venueNombre?: string;
  venueDireccion?: string;
  venueLinkMaps?: string;
  emailContacto?: string;
  instagram?: string;
  formularioInscripcionUrl?: string;
  contactoAdicional?: string;
}

async function fetchConferencia(slug: string): Promise<ConferenciaContacto | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ContactoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);
  if (!conf) notFound();

  const primary = conf.colorPrimario ?? '#1a1a2e';

  const hasVenue = conf.venueNombre || conf.venueDireccion;
  const hasContacto = conf.emailContacto || conf.instagram || conf.formularioInscripcionUrl || conf.contactoAdicional;

  const mapQuery = conf.venueDireccion
    ? encodeURIComponent(conf.venueDireccion)
    : conf.venueNombre
    ? encodeURIComponent(conf.venueNombre)
    : null;

  const mapEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=es`
    : null;

  return (
    <div style={{ minHeight: '60vh', padding: '3rem 1.5rem', maxWidth: '760px', margin: '0 auto' }}>

      {/* Sede */}
      {hasVenue && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: primary, marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: `2px solid ${primary}` }}>
            Sede
          </h2>
          {conf.venueNombre && (
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', marginBottom: '.35rem' }}>
              {conf.venueNombre}
            </p>
          )}
          {conf.venueDireccion && (
            <p style={{ fontSize: '.95rem', color: '#475569', marginBottom: '.75rem' }}>
              📍 {conf.venueDireccion}
            </p>
          )}
          {conf.venueLinkMaps && (
            <a
              href={conf.venueLinkMaps}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                background: primary, color: '#fff', fontWeight: 600,
                padding: '8px 18px', borderRadius: '8px', textDecoration: 'none',
                fontSize: '.9rem', marginBottom: '1.25rem'
              }}
            >
              🗺 Abrir en Google Maps
            </a>
          )}

          {/* Embed Google Maps */}
          {mapEmbedUrl && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: '.75rem' }}>
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="320"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${conf.venueNombre ?? conf.nombre}`}
              />
            </div>
          )}
        </section>
      )}

      {/* Contacto */}
      {hasContacto && (
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: primary, marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: `2px solid ${primary}` }}>
            Contacto e Informes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {conf.emailContacto && (
              <a
                href={`mailto:${conf.emailContacto}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: primary, fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}
              >
                ✉ {conf.emailContacto}
              </a>
            )}
            {conf.instagram && (
              <a
                href={`https://instagram.com/${conf.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: primary, fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}
              >
                📷 @{conf.instagram}
              </a>
            )}
            {conf.formularioInscripcionUrl && (
              <a
                href={conf.formularioInscripcionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: primary, fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}
              >
                📝 Formulario de inscripción
              </a>
            )}
            {conf.contactoAdicional && (
              <p style={{ fontSize: '.95rem', color: '#475569', whiteSpace: 'pre-line', marginTop: '.5rem' }}>
                {conf.contactoAdicional}
              </p>
            )}
          </div>
        </section>
      )}

      {!hasVenue && !hasContacto && (
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '4rem' }}>
          No hay información de contacto disponible aún.
        </p>
      )}
    </div>
  );
}
