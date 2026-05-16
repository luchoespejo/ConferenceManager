'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Sesion {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  salaNombre: string;
  track: string;
  qrCodeUrl: string;
}

interface ExpositorData {
  expositor: {
    id: string;
    nombre: string;
    email: string;
    bio: string;
    fotoUrl: string;
  };
  conferencia: {
    id: string;
    nombre: string;
    slug: string;
  };
  sesiones: Sesion[];
}

export default function ExpositorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ExpositorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('expositorToken');
    if (!token) {
      router.push('/expositor/login');
      return;
    }

    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/public/expositor/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('expositorToken');
            router.push('/expositor/login');
            return;
          }
          throw new Error('Error cargando datos');
        }

        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('expositorToken');
    router.push('/expositor/login');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#721c24' }}>
        {error || 'Error al cargar datos'}
      </div>
    );
  }

  const { expositor, conferencia, sesiones } = data;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0' }}>Panel Expositor</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>{conferencia.nombre}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        {/* Expositor Info */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {expositor.fotoUrl && (
              <img
                src={expositor.fotoUrl.startsWith('http') ? expositor.fotoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${expositor.fotoUrl}`}
                alt={expositor.nombre}
                style={{ width: '150px', height: '150px', borderRadius: '0.5rem', objectFit: 'cover' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{expositor.nombre}</h2>
              <p style={{ margin: '0 0 1rem 0', color: '#666' }}>{expositor.email}</p>
              {expositor.bio && <p style={{ margin: 0, color: '#555' }}>{expositor.bio}</p>}
            </div>
          </div>
        </div>

        {/* Sesiones */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Mis Sesiones</h2>

          {sesiones.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', textAlign: 'center', color: '#666' }}>
              No tienes sesiones asignadas
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {sesiones.map((sesion) => (
                <div key={sesion.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{sesion.titulo}</h3>
                      <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        <p style={{ margin: '0.25rem 0' }}>📅 {sesion.fecha} · 🕐 {sesion.horaInicio.slice(0, 5)} – {sesion.horaFin.slice(0, 5)}</p>
                        <p style={{ margin: '0.25rem 0' }}>🏛️ {sesion.salaNombre}</p>
                        {sesion.track && <p style={{ margin: '0.25rem 0' }}>🏷️ {sesion.track}</p>}
                      </div>
                      {sesion.descripcion && (
                        <p style={{ margin: 0, color: '#555', fontSize: '0.9375rem' }}>{sesion.descripcion}</p>
                      )}
                    </div>

                    {sesion.qrCodeUrl && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <img
                          src={sesion.qrCodeUrl}
                          alt="QR"
                          style={{ width: '120px', height: '120px', border: '1px solid #ddd', borderRadius: '0.5rem' }}
                        />
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>Código QR</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
