'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Expositor {
  id: string;
  nombre: string;
  bio?: string;
  fotoUrl?: string;
  redesSociales?: Record<string, string>;
}

function getSlug(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  const slug = host.split('.')[0];
  return ['localhost', 'www', 'tuplataforma'].includes(slug) ? 'demo' : slug;
}

export default function Expositores() {
  const [expositores, setExpositores] = useState<Expositor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = getSlug();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/public/${slug}/expositores`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setExpositores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: '#888' }}>
        Cargando expositores...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Expositores</h1>

      {expositores.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '3rem' }}>
          No hay expositores registrados aún.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {expositores.map(exp => (
            <div
              key={exp.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {exp.fotoUrl ? (
                  <img
                    src={exp.fotoUrl}
                    alt={exp.nombre}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#64748b',
                    flexShrink: 0
                  }}>
                    {exp.nombre[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{exp.nombre}</div>
                </div>
              </div>

              {exp.bio && (
                <p style={{ fontSize: '.875rem', color: '#555', lineHeight: 1.6, margin: 0 }}>
                  {exp.bio}
                </p>
              )}

              {exp.redesSociales && Object.keys(exp.redesSociales).length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(exp.redesSociales).map(([red, url]) => (
                    <a
                      key={red}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '.8rem',
                        padding: '3px 10px',
                        background: '#f1f5f9',
                        borderRadius: '20px',
                        color: '#334155',
                        textDecoration: 'none',
                        textTransform: 'capitalize'
                      }}
                    >
                      {red}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
