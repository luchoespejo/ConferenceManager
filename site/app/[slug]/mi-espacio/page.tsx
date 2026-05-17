'use client';

import { use, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Sesion {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  track?: string;
  salaNombre: string;
  encuestaUrl?: string;
}

interface Perfil {
  id: string;
  nombre: string;
  bio?: string;
  fotoUrl?: string;
  email?: string;
  conferenciaNombre: string;
  sesiones: Sesion[];
}

function MiEspacioContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No se proporcionó un token de acceso.');
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
    fetch(`${apiUrl}/api/public/${slug}/mi-espacio?token=${encodeURIComponent(token)}`)
      .then(r => {
        if (r.status === 404) throw new Error('TOKEN_INVALID');
        if (!r.ok) throw new Error('ERROR');
        return r.json();
      })
      .then(data => { setPerfil(data); setLoading(false); })
      .catch(err => {
        setError(err.message === 'TOKEN_INVALID' ? 'Token inválido o no encontrado.' : 'Error al cargar tu perfil.');
        setLoading(false);
      });
  }, [token, slug]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#888' }}>Cargando tu espacio...</div>;
  }

  if (error || !perfil) {
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ marginBottom: '.5rem' }}>Acceso no válido</h2>
        <p style={{ color: '#64748b' }}>{error ?? 'No se pudo acceder a tu espacio.'}</p>
        <Link href={`/${slug}`} style={{ color: '#3b82f6', marginTop: '1rem', display: 'inline-block' }}>← Volver al inicio</Link>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
  const fotoSrc = perfil.fotoUrl
    ? perfil.fotoUrl.startsWith('http') ? perfil.fotoUrl : `${apiUrl}${perfil.fotoUrl}`
    : null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {fotoSrc ? (
          <img src={fotoSrc} alt={perfil.nombre} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
            {perfil.nombre[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ color: '#64748b', fontSize: '.875rem', margin: '0 0 4px' }}>{perfil.conferenciaNombre}</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 .5rem' }}>{perfil.nombre}</h1>
          {perfil.email && <p style={{ color: '#64748b', fontSize: '.9rem', margin: '0 0 .5rem' }}>✉️ {perfil.email}</p>}
          {perfil.bio && <p style={{ color: '#555', lineHeight: 1.6, margin: 0 }}>{perfil.bio}</p>}
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Mis sesiones ({perfil.sesiones.length})</h2>

      {perfil.sesiones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888', background: '#fff', borderRadius: '12px' }}>
          No tenés sesiones asignadas todavía.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {perfil.sesiones.map(s => (
            <div key={s.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: '0 0 .25rem', fontSize: '1.1rem', fontWeight: 700 }}>{s.titulo}</h3>
                  <p style={{ margin: '0 0 .5rem', color: '#64748b', fontSize: '.875rem' }}>
                    📅 {new Date(s.fecha + 'T00:00:00').toLocaleDateString('es-AR')} · ⏰ {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)} · 📍 {s.salaNombre}
                  </p>
                  {s.track && <span style={{ background: '#f1f5f9', borderRadius: '20px', padding: '2px 10px', fontSize: '.8rem', color: '#334155' }}>{s.track}</span>}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {s.encuestaUrl && (
                    <a href={s.encuestaUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600 }}>
                      Ver encuesta
                    </a>
                  )}
                  <Link href={`/${slug}/s/${s.id}`}
                    style={{ background: '#f1f5f9', color: '#334155', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600 }}>
                    Ver página
                  </Link>
                </div>
              </div>
              {s.descripcion && <p style={{ margin: '.75rem 0 0', color: '#555', fontSize: '.875rem', lineHeight: 1.6 }}>{s.descripcion}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MiEspacio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#888' }}>Cargando...</div>}>
        <MiEspacioContent slug={slug} />
      </Suspense>
    </div>
  );
}
