'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSlug } from '@/lib/getSlug';

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
  const logoUrl = conf?.logoUrl?.startsWith('http')
    ? conf.logoUrl
    : `${apiUrl}${conf?.logoUrl}`;

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif', background: '#f8fafc', color: '#1a1a1a' }}>
        {/* Navbar */}
        <nav className="site-nav" style={{ background: primary }}>
          <Link href="/" className="site-nav-brand">
            {conf?.logoUrl && (
              <img src={logoUrl} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
            )}
            <span>{conf?.nombre || 'ConferenceManager'}</span>
          </Link>
          <div className="site-nav-spacer" />
          <div className="site-nav-links">
            <Link href="/programa" className="site-nav-link">Programa</Link>
            <Link href="/expositores" className="site-nav-link">Expositores</Link>
            <Link href="/certificado" className="site-nav-link-cert">Certificado</Link>
          </div>
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
