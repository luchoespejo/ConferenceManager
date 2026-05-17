export const revalidate = 300;

interface Expositor {
  id: string;
  nombre: string;
  bio?: string;
  fotoUrl?: string;
  redesSociales?: Record<string, string>;
}

async function fetchExpositores(slug: string): Promise<Expositor[]> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}/expositores`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Expositores({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const expositores = await fetchExpositores(slug);
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Expositores</h1>

        {expositores.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>No hay expositores registrados aún.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {expositores.map(exp => {
              const fotoSrc = exp.fotoUrl
                ? exp.fotoUrl.startsWith('http') ? exp.fotoUrl : `${backend}${exp.fotoUrl}`
                : null;
              return (
                <div key={exp.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {fotoSrc ? (
                      <img src={fotoSrc} alt={exp.nombre} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                        {exp.nombre[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{exp.nombre}</div>
                  </div>
                  {exp.bio && (
                    <p style={{ fontSize: '.875rem', color: '#555', lineHeight: 1.6, margin: 0 }}>{exp.bio}</p>
                  )}
                  {exp.redesSociales && Object.keys(exp.redesSociales).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(exp.redesSociales).map(([red, url]) => (
                        <a key={red} href={url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '.8rem', padding: '3px 10px', background: '#f1f5f9', borderRadius: '20px', color: '#334155', textDecoration: 'none', textTransform: 'capitalize' as const }}>
                          {red}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
