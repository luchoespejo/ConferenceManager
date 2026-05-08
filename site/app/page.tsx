'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSlug } from '@/lib/getSlug';

interface Conferencia {
  id: string;
  slug: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  logoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  venueNombre?: string;
  venueDireccion?: string;
}

export default function Home() {
  const [conferencia, setConferencia] = useState<Conferencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    const slug = getSlug();
    setSlug(slug);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/public/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setConferencia(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!conferencia) {
    return <div className="flex items-center justify-center h-screen">Congreso no encontrado.</div>;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const logoUrl = conferencia.logoUrl?.startsWith('http')
    ? conferencia.logoUrl
    : `${apiUrl}${conferencia.logoUrl}`;

  console.log('Logo data:', { apiUrl, rawUrl: conferencia.logoUrl, finalUrl: logoUrl });

  return (
    <div
      className="min-h-screen"
      style={{
        '--color-primary': conferencia.colorPrimario || '#000',
        '--color-secondary': conferencia.colorSecundario || '#666',
      } as React.CSSProperties & { [key: string]: string }}
    >
      {/* Hero */}
      <div className="bg-[var(--color-primary)] text-white py-20 px-6 text-center">
        {conferencia.logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-6" />
        )}
        <h1 className="text-4xl font-bold mb-4">{conferencia.nombre}</h1>
        {conferencia.descripcion && (
          <p className="text-lg text-gray-100 max-w-2xl mx-auto mb-6">{conferencia.descripcion}</p>
        )}
        <p className="text-sm text-gray-200 mb-8">
          {new Date(conferencia.fechaInicio).toLocaleDateString()} -{' '}
          {new Date(conferencia.fechaFin).toLocaleDateString()}
        </p>
        <Link href="/programa" className="inline-block bg-white text-[var(--color-primary)] font-bold py-3 px-8 rounded">
          Ver Programa
        </Link>
      </div>

      {/* Venue */}
      {conferencia.venueNombre && (
        <div className="py-16 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Sede del evento</h2>
            <p className="text-lg mb-2">{conferencia.venueNombre}</p>
            {conferencia.venueDireccion && (
              <p className="text-gray-600 mb-4">{conferencia.venueDireccion}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
