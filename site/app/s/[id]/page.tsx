'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSlug } from '@/lib/getSlug';

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

export default function SesionDetail() {
  const params = useParams();
  const id = params.id as string;
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    const slug = getSlug();
    setSlug(slug);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    fetch(`${apiUrl}/api/public/${slug}/sesiones/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSesion(data);
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
        <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold mb-4">Expositor</h2>
          <p className="text-xl font-bold">{sesion.expositorNombre}</p>
        </div>

        {/* QR Code */}
        {sesion.qrCodeUrl && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Código QR de la sesión</h2>
            <img
              src={sesion.qrCodeUrl}
              alt={`QR de ${sesion.titulo}`}
              className="w-48 h-48"
            />
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
        </div>
      </div>
    </div>
  );
}
