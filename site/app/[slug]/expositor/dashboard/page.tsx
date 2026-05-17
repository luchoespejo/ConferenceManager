'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Sesion {
  id: string;
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  salaNombre: string;
  encuestaUrl?: string;
}

interface Dashboard {
  nombre: string;
  email?: string;
  bio?: string;
  sesiones: Sesion[];
}

export default function ExpositorDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('expositorToken');
    if (!token) { router.replace(`/${slug}/expositor/login`); return; }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
    fetch(`${apiUrl}/api/public/${slug}/expositor/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('expositorToken'); router.replace(`/${slug}/expositor/login`); throw new Error('UNAUTH'); }
        if (!r.ok) throw new Error('ERROR');
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { if (err.message !== 'UNAUTH') { setError('Error al cargar el dashboard.'); setLoading(false); } });
  }, [slug, router]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#888' }}>Cargando...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <p style={{ color: '#dc2626' }}>{error ?? 'No disponible.'}</p>
        <Link href={`/${slug}/expositor/login`} style={{ color: '#3b82f6' }}>Volver al login</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <h1 style={{ margin: '0 0 .25rem', fontSize: '1.75rem', fontWeight: 700 }}>{data.nombre}</h1>
          {data.email && <p style={{ color: '#64748b', margin: '0 0 .5rem', fontSize: '.9rem' }}>✉️ {data.email}</p>}
          {data.bio && <p style={{ color: '#555', lineHeight: 1.6, margin: 0 }}>{data.bio}</p>}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Mis sesiones ({data.sesiones.length})</h2>

        {data.sesiones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888', background: '#fff', borderRadius: '12px' }}>
            No tenés sesiones asignadas todavía.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.sesiones.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 .25rem', fontSize: '1.05rem', fontWeight: 700 }}>{s.titulo}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '.875rem' }}>
                    📅 {new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-AR')} · ⏰ {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)} · 📍 {s.salaNombre}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {s.encuestaUrl && (
                    <a href={s.encuestaUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600 }}>
                      Encuesta
                    </a>
                  )}
                  <Link href={`/${slug}/s/${s.id}`}
                    style={{ background: '#f1f5f9', color: '#334155', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600 }}>
                    Ver página
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
