import { notFound } from 'next/navigation';
import React from 'react';

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
  contactoAdicional?: string;
}

// Converts inline link tags to <a> elements. Supports:
//   [[#url:https://...|Texto]]    → plain hyperlink
//   [[#mail:email@...|Texto]]     → mailto: link
//   [[#ig:@usuario|Texto]]        → instagram.com profile link
// Display text after | is optional; falls back to the raw value.
const INLINE_LINK = /\[\[#(url|mail|ig):([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function renderInlineUrls(text: string, linkColor: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_LINK.lastIndex = 0;
  while ((match = INLINE_LINK.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const tag     = match[1];
    const value   = match[2].trim();
    const display = match[3]?.trim() ?? value;
    const href =
      tag === 'mail' ? `mailto:${value}` :
      tag === 'ig'   ? `https://instagram.com/${value.replace(/^@/, '')}` :
      value;
    parts.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
         style={{ color: linkColor, fontWeight: 600, textDecoration: 'none' }}>
        {display}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
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
  const hasContacto = conf.emailContacto || conf.instagram || conf.contactoAdicional;

  const mapQuery = conf.venueDireccion
    ? encodeURIComponent(conf.venueDireccion)
    : conf.venueNombre
    ? encodeURIComponent(conf.venueNombre)
    : null;

  const mapEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=es`
    : null;

  return (
    <div className="subpage-content">

      {/* Ubicación */}
      {hasVenue && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: primary, marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: `2px solid ${primary}` }}>
            Ubicación
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
                href={`https://instagram.com/${conf.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: primary, fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}
              >
                📷 @{conf.instagram.replace(/^@/, '')}
              </a>
            )}
            {/* formularioInscripcionUrl shown only in Inscripciones, not here */}
            {conf.contactoAdicional && (
              <p style={{ fontSize: '.95rem', color: '#475569', whiteSpace: 'pre-line', marginTop: '.5rem' }}>
                {renderInlineUrls(conf.contactoAdicional, primary)}
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
