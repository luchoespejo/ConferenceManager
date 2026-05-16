'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
}

export default function Programa() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [filteredSesiones, setFilteredSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>('');
  const [filterTrack, setFilterTrack] = useState<string>('');
  const [filterExpositor, setFilterExpositor] = useState<string>('');

  useEffect(() => {
    const slug = getSlug();
    setSlug(slug);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/public/${slug}/programa`)
      .then((res) => res.json())
      .then((data) => {
        setSesiones(data);
        setFilteredSesiones(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = sesiones;
    if (filterTrack) {
      filtered = filtered.filter((s) => s.track === filterTrack);
    }
    if (filterExpositor) {
      filtered = filtered.filter((s) => s.expositorNombre === filterExpositor);
    }
    setFilteredSesiones(filtered);
  }, [filterTrack, filterExpositor, sesiones]);

  const tracks = Array.from(new Set(sesiones.map((s) => s.track).filter(Boolean)));
  const expositores = Array.from(new Set(sesiones.map((s) => s.expositorNombre)));

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando programa...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Programa</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg mb-8 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Track</label>
            <select
              value={filterTrack}
              onChange={(e) => setFilterTrack(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Todos</option>
              {tracks.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expositor</label>
            <select
              value={filterExpositor}
              onChange={(e) => setFilterExpositor(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Todos</option>
              {expositores.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sesiones */}
        <div className="space-y-4">
          {filteredSesiones.length > 0 ? (
            filteredSesiones.map((sesion) => (
              <Link key={sesion.id} href={`/s/${sesion.id}`}>
                <div className="bg-white p-6 rounded-lg hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{sesion.titulo}</h3>
                    {sesion.track && <span className="bg-gray-200 px-3 py-1 rounded text-sm">{sesion.track}</span>}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {new Date(sesion.fecha).toLocaleDateString()} • {sesion.horaInicio} - {sesion.horaFin}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>📍 {sesion.salaNombre}</span>
                    <span>👤 {sesion.expositorNombre}</span>
                  </div>
                  {sesion.descripcion && <p className="text-gray-500 mt-3 text-sm">{sesion.descripcion}</p>}
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center text-gray-500">No hay sesiones con los filtros seleccionados.</div>
          )}
        </div>
      </div>
    </div>
  );
}
