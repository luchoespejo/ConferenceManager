'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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

interface Expositor {
  id: string;
  nombre: string;
  bio?: string;
  fotoUrl?: string;
}

export default function SesionDetail() {
  const params = useParams();
  const id = params.id as string;
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [expositor, setExpositor] = useState<Expositor | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const extractedSlug = host.split('.')[0];
    setSlug(extractedSlug);

    if (['localhost', 'www', 'tuplataforma'].includes(extractedSlug)) {
      setSlug('demo');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Fetch programa to find the sesion
    fetch(`${apiUrl}/api/public/${extractedSlug || 'demo'}/programa`)
      .then((res) => res.json())
      .then((data) => {
        const foundSesion = data.find((s: Sesion) => s.id === id);
        setSesion(foundSesion);
      })
      .then(() => {
        // Fetch expositores
        return fetch(`${apiUrl}/api/public/${extractedSlug || 'demo'}/expositores`);
      })
      .then((res) => res.json())
      .then((data) => {
        if (sesion) {
          const foundExpositor = data.find((e: Expositor) => e.nombre === sesion.expositorNombre);
          setExpositor(foundExpositor);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando sesión...</div>;
  }

  if (!sesion) {
    return <div className="flex items-center justify-center h-screen">Sesión no encontrada.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg">
        <a href="/programa" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Volver al programa
        </a>

        {/* Sesion Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold">{sesion.titulo}</h1>
            {sesion.track && <span className="bg-gray-200 px-4 py-2 rounded font-semibold">{sesion.track}</span>}
          </div>

          <div className="space-y-2 text-gray-600 mb-6">
            <p className="text-lg">
              📅 {new Date(sesion.fecha).toLocaleDateString()} • ⏰ {sesion.horaInicio} - {sesion.horaFin}
            </p>
            <p className="text-lg">📍 Sala: {sesion.salaNombre}</p>
          </div>

          {sesion.descripcion && <p className="text-gray-700 text-lg mb-6">{sesion.descripcion}</p>}
        </div>

        {/* Expositor */}
        {expositor && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold mb-4">Expositor</h2>
            <div className="flex gap-6">
              {expositor.fotoUrl && (
                <img
                  src={expositor.fotoUrl}
                  alt={expositor.nombre}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-bold mb-2">{expositor.nombre}</h3>
                {expositor.bio && <p className="text-gray-700">{expositor.bio}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {sesion.encuestaUrl && (
            <a
              href={sesion.encuestaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded hover:bg-blue-700"
            >
              Responder Encuesta
            </a>
          )}
          {sesion.qrCodeUrl && (
            <a
              href={sesion.qrCodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-300 text-black font-bold py-3 px-6 rounded hover:bg-gray-400"
            >
              Ver QR
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
