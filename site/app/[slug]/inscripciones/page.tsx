import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ArancelFila { categoria: string; monto: string; }
interface ArancelesData { filas: ArancelFila[]; nota?: string; }

interface SeccionConfig { seccionKey: string; bgColor?: string | null; textoColor?: string | null; }

interface Conferencia {
  slug: string;
  nombre: string;
  colorPrimario?: string;
  mostrarInscripciones: boolean;
  arancelesTexto?: string;
  informacionPago?: string;
  formularioInscripcionUrl?: string;
  seccionConfigs?: SeccionConfig[];
}

async function fetchConferencia(slug: string): Promise<Conferencia | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function parseAranceles(raw?: string): ArancelesData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return { filas: parsed as ArancelFila[] };
    if (parsed?.filas && Array.isArray(parsed.filas) && parsed.filas.length > 0) return { filas: parsed.filas, nota: parsed.nota };
  } catch { /* not JSON */ }
  return null;
}

export default async function InscripcionesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);

  if (!conf || !conf.mostrarInscripciones) notFound();

  const primary = conf.colorPrimario ?? '#1a1a2e';
  const aranceles = parseAranceles(conf.arancelesTexto);

  const secciones = Object.fromEntries((conf.seccionConfigs ?? []).map(s => [s.seccionKey, s]));
  const sc = (key: string) => secciones[key] ?? {};

  const pageBg = sc('inscripciones').bgColor ?? '#ffffff';
  const pageColor = sc('inscripciones').textoColor ?? '#1e293b';

  return (
    <div style={{ background: pageBg, minHeight: '100vh' }}>
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem', color: pageColor }}>
        Inscripciones
      </h1>

      {aranceles && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: pageColor, borderBottom: `3px solid ${primary}`, paddingBottom: '.5rem' }}>
            Aranceles
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#334155', border: '1px solid #e2e8f0' }}>
                  Categoría
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#334155', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  Monto
                </th>
              </tr>
            </thead>
            <tbody>
              {aranceles.filas.map((f, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', color: '#334155' }}>{f.categoria}</td>
                  <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', color: '#334155', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{f.monto}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {aranceles.nota && (
            <p style={{ marginTop: '1rem', color: pageColor, opacity: .75, fontSize: '.9rem', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{aranceles.nota}</p>
          )}
        </section>
      )}

      {conf.informacionPago && (
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: pageColor, borderBottom: `3px solid ${primary}`, paddingBottom: '.5rem' }}>
            Formas de pago
          </h2>
          <p style={{ whiteSpace: 'pre-line', color: pageColor, opacity: .85, lineHeight: 1.7 }}>{conf.informacionPago}</p>
        </section>
      )}

      {conf.formularioInscripcionUrl && (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a
            href={conf.formularioInscripcionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: primary,
              color: '#fff',
              fontWeight: 700,
              padding: '14px 36px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '1.1rem'
            }}
          >
            Formulario de inscripción →
          </a>
        </div>
      )}
    </div>
    </div>
  );
}
