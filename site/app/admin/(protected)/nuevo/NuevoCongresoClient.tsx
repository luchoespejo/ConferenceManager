'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCongresoAction } from './actions';
import Link from 'next/link';

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NuevoCongresoClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [venueNombre, setVenueNombre] = useState('');
  const [venueDireccion, setVenueDireccion] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [colorPrimario, setColorPrimario] = useState('#1e3a5f');
  const [colorSecundario, setColorSecundario] = useState('#16213e');

  const handleNombre = (v: string) => {
    setNombre(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSlug = (v: string) => {
    setSlug(v);
    setSlugManual(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !fechaInicio || !fechaFin) return;
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createCongresoAction({
          nombre: nombre.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          fechaInicio,
          fechaFin,
          ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
          ...(venueNombre.trim() ? { venueNombre: venueNombre.trim() } : {}),
          ...(venueDireccion.trim() ? { venueDireccion: venueDireccion.trim() } : {}),
          ...(emailContacto.trim() ? { emailContacto: emailContacto.trim() } : {}),
          colorPrimario,
          colorSecundario,
        });
        router.push(`/admin/congreso/${id}/maquetador`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear congreso');
      }
    });
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Mis congresos
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo congreso</h1>
        <p className="text-sm text-slate-500 mt-1">Completá los datos básicos para crear el congreso.</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-6">
        {/* Card datos básicos */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-800 text-sm">Datos básicos</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del congreso *</label>
            <input
              value={nombre}
              onChange={e => handleNombre(e.target.value)}
              placeholder="Ej. Congreso Internacional de Medicina"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Slug (URL pública)</label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg text-xs text-slate-400 whitespace-nowrap">
                tuplataforma.com/
              </span>
              <input
                value={slug}
                onChange={e => handleSlug(e.target.value)}
                placeholder="mi-congreso-2025"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Opcional — se genera automáticamente del nombre.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha inicio *</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => { setFechaInicio(e.target.value); if (!fechaFin) setFechaFin(e.target.value); }}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha fin *</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                min={fechaInicio}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Breve descripción del evento..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Card sede */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-800 text-sm">Sede y contacto</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del lugar</label>
              <input
                value={venueNombre}
                onChange={e => setVenueNombre(e.target.value)}
                placeholder="Ej. Centro de Convenciones"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
              <input
                value={venueDireccion}
                onChange={e => setVenueDireccion(e.target.value)}
                placeholder="Calle 123, Ciudad"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email de contacto</label>
            <input
              type="email"
              value={emailContacto}
              onChange={e => setEmailContacto(e.target.value)}
              placeholder="info@micongreso.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Card colores */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-800 text-sm">Colores</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Color primario</label>
              <div className="flex items-center gap-2">
                <label className="relative cursor-pointer">
                  <div style={{ background: colorPrimario }} className="w-9 h-9 rounded-lg border border-slate-300" />
                  <input type="color" value={colorPrimario} onChange={e => setColorPrimario(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </label>
                <input
                  value={colorPrimario}
                  onChange={e => setColorPrimario(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Color secundario</label>
              <div className="flex items-center gap-2">
                <label className="relative cursor-pointer">
                  <div style={{ background: colorSecundario }} className="w-9 h-9 rounded-lg border border-slate-300" />
                  <input type="color" value={colorSecundario} onChange={e => setColorSecundario(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </label>
                <input
                  value={colorSecundario}
                  onChange={e => setColorSecundario(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={pending || !nombre.trim() || !fechaInicio || !fechaFin}
            className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
            {pending ? 'Creando...' : 'Crear congreso'}
          </button>
        </div>
      </form>
    </div>
  );
}
