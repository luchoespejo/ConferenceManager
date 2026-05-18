import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Sesion {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  track?: string;
  salaNombre: string;
  expositorNombre: string;
  encuestaUrl?: string;
  qrCodeUrl?: string;
}

async function fetchSesion(slug: string, id: string): Promise<Sesion | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}/sesiones/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SesionPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const sesion = await fetchSesion(slug, id);

  if (!sesion) notFound();

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Link href={`/${slug}/programa`} style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '.9rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '1.5rem' }}>
          ← Volver al programa
        </Link>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>{sesion.titulo}</h1>
            {sesion.track && (
              <span style={{ background: '#f1f5f9', borderRadius: '20px', padding: '4px 14px', fontSize: '.85rem', color: '#475569', whiteSpace: 'nowrap' }}>
                {sesion.track}
              </span>
            )}
          </div>

          <div style={{ color: '#64748b', fontSize: '.95rem', marginBottom: '1.5rem', lineHeight: 1.8 }}>
            <p style={{ margin: 0 }}>📅 {fmtDate(sesion.fecha)}</p>
            <p style={{ margin: 0 }}>⏰ {sesion.horaInicio.slice(0, 5)} – {sesion.horaFin.slice(0, 5)}</p>
            <p style={{ margin: 0 }}>📍 {sesion.salaNombre}</p>
            <p style={{ margin: 0 }}>👤 {sesion.expositorNombre}</p>
          </div>

          {sesion.descripcion && (
            <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1.5rem' }}>{sesion.descripcion}</p>
          )}

          {sesion.qrCodeUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>Código QR</p>
              <img src={sesion.qrCodeUrl} alt={`QR ${sesion.titulo}`} style={{ width: '160px', height: '160px' }} />
            </div>
          )}

          {sesion.encuestaUrl && (
            <a href={sesion.encuestaUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', fontWeight: 600, padding: '10px 24px', borderRadius: '8px', textDecoration: 'none' }}>
              Responder Encuesta
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
