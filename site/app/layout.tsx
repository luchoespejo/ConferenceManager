'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ConferenciaBasic {
  nombre: string;
  slug: string;
  colorPrimario?: string;
  colorSecundario?: string;
  logoUrl?: string;
}

interface Aviso {
  id: string;
  mensaje: string;
  createdAt: string;
}

function getSlug(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  const slug = host.split('.')[0];
  return ['localhost', 'www', 'tuplataforma'].includes(slug) ? 'reactconf' : slug;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [conf, setConf] = useState<ConferenciaBasic | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const slug = getSlug();
    if (!slug) return;

    fetch(`${apiUrl}/api/public/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setConf(data))
      .catch(() => {});

    const fetchAvisos = () => {
      fetch(`${apiUrl}/api/public/${slug}/avisos`)
        .then(r => r.ok ? r.json() : [])
        .then(data => Array.isArray(data) && setAvisos(data))
        .catch(() => {});
    };

    fetchAvisos();
    const interval = setInterval(fetchAvisos, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const primary = conf?.colorPrimario || '#1a1a2e';
  const secondary = conf?.colorSecundario || '#16213e';

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif', background: '#f8fafc', color: '#1a1a1a' }}>
        {/* Navbar */}
        <nav style={{
          background: primary,
          color: '#fff',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          height: '60px',
          gap: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,.2)'
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff' }}>
            {conf?.logoUrl && (
              <img src={conf.logoUrl} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
            )}
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              {conf?.nombre || 'ConferenceManager'}
            </span>
          </Link>
          <div style={{ flex: 1 }} />
          <Link href="/programa" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>
            Programa
          </Link>
          <Link href="/expositores" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>
            Expositores
          </Link>
          <Link href="/certificado" style={{
            background: 'rgba(255,255,255,.15)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '.85rem',
            fontWeight: 600
          }}>
            Certificado
          </Link>
        </nav>

        {/* Avisos urgentes */}
        {avisos.length > 0 && (
          <div style={{ background: '#dc2626', color: '#fff', padding: '10px 1.5rem' }}>
            {avisos.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: avisos.indexOf(a) < avisos.length - 1 ? '6px' : 0 }}>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                <span style={{ fontSize: '.9rem', fontWeight: 500 }}>{a.mensaje}</span>
              </div>
            ))}
          </div>
        )}

        <main style={{ minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
