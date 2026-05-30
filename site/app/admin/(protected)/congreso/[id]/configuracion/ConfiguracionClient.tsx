'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '../../../_components/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { updateCongreso, type UpdateCongresoData } from './actions';

interface ArancelFila { id: string; categoria: string; monto: string; }

interface Congreso {
  id: string; nombre: string; slug: string; estado: string;
  fechaInicio: string; fechaFin: string;
  colorPrimario?: string | null; colorSecundario?: string | null;
  descripcion?: string | null; subtitulo?: string | null; lema?: string | null;
  venueNombre?: string | null; venueDireccion?: string | null; venueLinkMaps?: string | null;
  emailContacto?: string | null; instagram?: string | null;
  formularioInscripcionUrl?: string | null; arancelesTexto?: string | null;
  informacionPago?: string | null; contactoAdicional?: string | null;
  informacionAdicional?: string | null;
  mostrarFechas: boolean; mostrarDescripcion: boolean; mostrarOrganizadores: boolean;
  mostrarContacto: boolean; mostrarInscripciones: boolean;
  mostrarInformacion: boolean;
  mostrarPrograma: boolean; programaUrl?: string | null; programaAdicional?: string | null;
  logoUrl?: string | null; bannerUrl?: string | null;
}

interface Props { congreso: Congreso; }

function parseAranceles(raw?: string | null): ArancelFila[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const filas = Array.isArray(parsed) ? parsed : (parsed?.filas ?? []);
    return filas.map((f: { categoria?: string; monto?: string }, i: number) => ({
      id: String(i),
      categoria: f.categoria ?? '',
      monto: f.monto ?? '',
    }));
  } catch { return []; }
}

let nextId = 1;
const uid = () => `f${nextId++}`;

export default function ConfiguracionClient({ congreso: init }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Info básica
  const [nombre, setNombre] = useState(init.nombre);
  const [colorPrimario, setColorPrimario] = useState(init.colorPrimario ?? '#1a1a2e');
  const [colorSecundario, setColorSecundario] = useState(init.colorSecundario ?? '#16213e');
  const [fechaInicio, setFechaInicio] = useState(init.fechaInicio);
  const [fechaFin, setFechaFin] = useState(init.fechaFin);
  const [descripcion, setDescripcion] = useState(init.descripcion ?? '');
  const [subtitulo, setSubtitulo] = useState(init.subtitulo ?? '');
  const [lema, setLema] = useState(init.lema ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(init.logoUrl ?? null);

  // Inscripciones
  const [mostrarInscripciones, setMostrarInscripciones] = useState(init.mostrarInscripciones);
  const [formularioUrl, setFormularioUrl] = useState(init.formularioInscripcionUrl ?? '');
  const [aranceles, setAranceles] = useState<ArancelFila[]>(parseAranceles(init.arancelesTexto));
  const [infoPago, setInfoPago] = useState(init.informacionPago ?? '');

  // Ubicación
  const [mostrarUbicacion, setMostrarUbicacion] = useState(!!(init.venueNombre || init.venueDireccion || init.venueLinkMaps));
  const [venueNombre, setVenueNombre] = useState(init.venueNombre ?? '');
  const [venueDireccion, setVenueDireccion] = useState(init.venueDireccion ?? '');
  const [venueLinkMaps, setVenueLinkMaps] = useState(init.venueLinkMaps ?? '');

  // Contacto
  const [mostrarContacto, setMostrarContacto] = useState(init.mostrarContacto);
  const [emailContacto, setEmailContacto] = useState(init.emailContacto ?? '');
  const [instagram, setInstagram] = useState(init.instagram ?? '');
  const [contactoAdicional, setContactoAdicional] = useState(init.contactoAdicional ?? '');

  // Información adicional
  const [mostrarInformacion, setMostrarInformacion] = useState(init.mostrarInformacion ?? false);
  const [informacionAdicional, setInformacionAdicional] = useState(init.informacionAdicional ?? '');

  // Programa
  const [mostrarPrograma, setMostrarPrograma] = useState(init.mostrarPrograma ?? false);
  const [programaUrl, setProgramaUrl] = useState(init.programaUrl ?? '');
  const [programaAdicional, setProgramaAdicional] = useState(init.programaAdicional ?? '');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // PDF upload handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      setPdfError('El PDF debe ser menor a 1 MB');
      return;
    }
    setPdfError(null);
    setUploadingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Full = ev.target?.result as string;
        const [, base64] = base64Full.split(',');
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, contentType: 'application/pdf' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Error al subir PDF');
        setProgramaUrl(data.url);
        setUploadingPdf(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Error al subir');
      setUploadingPdf(false);
    }
  };

  // Aranceles helpers
  const addFila = () => setAranceles(prev => [...prev, { id: uid(), categoria: '', monto: '' }]);
  const removeFila = (id: string) => setAranceles(prev => prev.filter(f => f.id !== id));
  const updateFila = (id: string, field: 'categoria' | 'monto', value: string) =>
    setAranceles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    const arancelesJson = aranceles.length > 0
      ? JSON.stringify(aranceles.map(f => ({ categoria: f.categoria, monto: f.monto })))
      : '';

    const data: UpdateCongresoData = {
      nombre, fechaInicio, fechaFin,
      colorPrimario, colorSecundario,
      ...(descripcion ? { descripcion } : {}),
      ...(subtitulo ? { subtitulo } : {}),
      ...(lema ? { lema } : {}),
      ...(logoUrl ? { logoUrl } : {}),
      // Inscripciones
      mostrarInscripciones,
      ...(formularioUrl ? { formularioInscripcionUrl: formularioUrl } : {}),
      ...(arancelesJson ? { arancelesTexto: arancelesJson } : {}),
      ...(infoPago ? { informacionPago: infoPago } : {}),
      // Ubicación
      venueNombre: mostrarUbicacion ? venueNombre : '',
      venueDireccion: mostrarUbicacion ? venueDireccion : '',
      venueLinkMaps: mostrarUbicacion ? venueLinkMaps : '',
      // Contacto
      mostrarContacto,
      ...(emailContacto ? { emailContacto } : {}),
      ...(instagram ? { instagram } : {}),
      ...(contactoAdicional ? { contactoAdicional } : {}),
      // Información adicional
      mostrarInformacion,
      ...(informacionAdicional ? { informacionAdicional } : {}),
      // Programa — always send so backend doesn't clear them on partial save
      mostrarPrograma,
      programaUrl: programaUrl || '',
      programaAdicional: programaAdicional || '',
      // Preservar flags no expuestos en la UI
      mostrarFechas: init.mostrarFechas,
      mostrarDescripcion: init.mostrarDescripcion,
      mostrarOrganizadores: init.mostrarOrganizadores,
    };

    startTransition(async () => {
      try {
        await updateCongreso(init.id, data);
        notify('Configuración guardada ✓');
        router.refresh();
      } catch {
        notify('Error al guardar', false);
      }
    });
  };

  const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900';
  const lbl = (t: string) => <label className="block text-xs font-medium text-slate-600 mb-1">{t}</label>;

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-slate-900' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </label>
  );

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── FORM ─────────────────────────────────────────────────────────────── */}
      <form onSubmit={guardar}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Col 1: Información básica ──────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

        {/* ── Información básica ─────────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Información básica</h2>
          <div className="flex flex-col gap-4">
            <div>
              {lbl('Nombre del congreso *')}
              <input value={nombre} onChange={e => setNombre(e.target.value)} required className={inp} />
            </div>
            <div>
              {lbl('Slug (subdominio)')}
              <input value={init.slug} disabled
                className={inp + ' bg-slate-50 text-slate-400 cursor-not-allowed'} />
              {init.estado !== 'Borrador' && <p className="text-xs text-slate-400 mt-1">No editable — congreso {init.estado.toLowerCase()}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl('Fecha inicio *')}
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required className={inp} />
              </div>
              <div>
                {lbl('Fecha fin *')}
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required className={inp} />
              </div>
            </div>
            <div>
              {lbl('Subtítulo')}
              <input value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Línea 2 del título" className={inp} />
            </div>
            <div>
              {lbl('Lema')}
              <input value={lema} onChange={e => setLema(e.target.value)} placeholder="Frase en cursiva" className={inp} />
            </div>
            <div>
              {lbl('Descripción')}
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} className={inp + ' resize-y'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl('Color primario (barra de navegación del sitio)')}
                <div className="flex gap-2 items-center mt-1">
                  <input type="color" value={colorPrimario} onChange={e => setColorPrimario(e.target.value)}
                    className="w-10 h-9 rounded border border-slate-300 cursor-pointer p-0.5 bg-white" />
                  <input type="text" value={colorPrimario} onChange={e => setColorPrimario(e.target.value)}
                    className={inp + ' font-mono'} placeholder="#1a1a2e" />
                </div>
              </div>
              <div>
                {lbl('Color secundario')}
                <div className="flex gap-2 items-center mt-1">
                  <input type="color" value={colorSecundario} onChange={e => setColorSecundario(e.target.value)}
                    className="w-10 h-9 rounded border border-slate-300 cursor-pointer p-0.5 bg-white" />
                  <input type="text" value={colorSecundario} onChange={e => setColorSecundario(e.target.value)}
                    className={inp + ' font-mono'} placeholder="#16213e" />
                </div>
              </div>
            </div>
            <div>
              {lbl('Logo del evento (aparece en la barra de navegación del sitio)')}
              <ImageUpload value={logoUrl} onChange={setLogoUrl} label="logo" />
            </div>
          </div>
        </section>

        {/* ── Información adicional ───────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Información</h2>
            <Toggle value={mostrarInformacion} onChange={setMostrarInformacion} label="Mostrar tab" />
          </div>
          {mostrarInformacion && (
            <div className="flex flex-col gap-3">
              <div>
                {lbl('Contenido')}
                <RichTextEditor
                  value={informacionAdicional}
                  onChange={setInformacionAdicional}
                  placeholder="Escribí aquí la información adicional del congreso..."
                />
                <p className="text-xs text-slate-400 mt-1">Soporta negrita, listas y links. Podés escribir <code>[[#url:https://...]]</code>, <code>[[#mail:email@...]]</code> para links especiales.</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Programa ────────────────────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Programa</h2>
            <Toggle value={mostrarPrograma} onChange={setMostrarPrograma} label="Mostrar tab" />
          </div>
          {mostrarPrograma && (
            <div className="flex flex-col gap-4">
              {/* PDF upload or external link */}
              <div>
                {lbl('PDF del programa o link externo')}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={programaUrl}
                    onChange={e => setProgramaUrl(e.target.value)}
                    placeholder="https://... o subí un PDF abajo"
                    className={inp + ' flex-1'}
                  />
                  {programaUrl && (
                    <button
                      type="button"
                      onClick={() => setProgramaUrl('')}
                      className="px-2 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                    >✕</button>
                  )}
                </div>
                <label className={`mt-2 flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-colors ${uploadingPdf ? 'opacity-60 pointer-events-none' : ''}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploadingPdf ? 'Subiendo PDF...' : 'Subir PDF (máx. 1 MB)'}
                  <input type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
                {pdfError && <p className="text-xs text-red-600 mt-1">{pdfError}</p>}
                {programaUrl && programaUrl.startsWith('/api/files/') && (
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-2">
                    ✓ PDF subido
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL ?? ''}${programaUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600 hover:text-blue-800"
                    >
                      Ver PDF ↗
                    </a>
                    — se empaquetará en el sitio estático al desplegar
                  </p>
                )}
              </div>

              {/* Rich text */}
              <div>
                {lbl('Información adicional (opcional)')}
                <RichTextEditor
                  value={programaAdicional}
                  onChange={setProgramaAdicional}
                  placeholder="Texto complementario al programa..."
                />
              </div>
            </div>
          )}
        </section>

        </div>{/* /Col 1 */}

        {/* ── Col 2: Inscripciones + Ubicación + Contacto ────────────────────── */}
        <div className="flex flex-col gap-5">

        {/* ── Inscripciones ──────────────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Inscripciones</h2>
            <Toggle value={mostrarInscripciones} onChange={setMostrarInscripciones} label="Mostrar tab" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              {lbl('URL formulario de inscripción')}
              <input type="url" value={formularioUrl} onChange={e => setFormularioUrl(e.target.value)} placeholder="https://..." className={inp} />
            </div>

            {/* Tabla aranceles */}
            <div>
              {lbl('Tabla de aranceles')}
              {aranceles.length > 0 && (
                <div className="mb-2 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200 w-full">Categoría</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">Monto</th>
                        <th className="px-2 py-2 border-b border-slate-200 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {aranceles.map((f, i) => (
                        <tr key={f.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-2 py-1.5">
                            <input
                              value={f.categoria}
                              onChange={e => updateFila(f.id, 'categoria', e.target.value)}
                              placeholder="Ej: Profesional"
                              className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={f.monto}
                              onChange={e => updateFila(f.id, 'monto', e.target.value)}
                              placeholder="$5.000"
                              className="w-32 px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeFila(f.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none"
                              title="Eliminar fila"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                type="button"
                onClick={addFila}
                className="text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors w-full"
              >
                + Agregar fila
              </button>
            </div>

            <div>
              {lbl('Información de pago')}
              <RichTextEditor
                value={infoPago}
                onChange={setInfoPago}
                placeholder="CBU, alias, transferencia..."
              />
              <p className="text-xs text-slate-400 mt-1">Soporta negrita, listas y links. Podés escribir <code>[[#url:https://...]]</code>, <code>[[#mail:email@...]]</code> para links especiales.</p>
            </div>
          </div>
        </section>

        {/* ── Ubicación ──────────────────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Ubicación</h2>
            <Toggle value={mostrarUbicacion} onChange={setMostrarUbicacion} label="Mostrar tab" />
          </div>
          {mostrarUbicacion && (
            <div className="flex flex-col gap-3">
              <div>
                {lbl('Nombre del lugar')}
                <input value={venueNombre} onChange={e => setVenueNombre(e.target.value)} placeholder="Ej. Centro de Convenciones" className={inp} />
              </div>
              <div>
                {lbl('Dirección')}
                <input value={venueDireccion} onChange={e => setVenueDireccion(e.target.value)} placeholder="Av. Corrientes 1234, CABA" className={inp} />
              </div>
              <div>
                {lbl('Link Google Maps')}
                <input type="url" value={venueLinkMaps} onChange={e => setVenueLinkMaps(e.target.value)} placeholder="https://maps.google.com/..." className={inp} />
              </div>
            </div>
          )}
        </section>

        {/* ── Contacto ───────────────────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Contacto</h2>
            <Toggle value={mostrarContacto} onChange={setMostrarContacto} label="Mostrar tab" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl('Email de contacto')}
                <input type="email" value={emailContacto} onChange={e => setEmailContacto(e.target.value)} className={inp} />
              </div>
              <div>
                {lbl('Instagram')}
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario" className={inp} />
              </div>
            </div>
            <div>
              {lbl('Información adicional')}
              <textarea value={contactoAdicional} onChange={e => setContactoAdicional(e.target.value)} rows={3} className={inp + ' resize-y'} />
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                💡 Tags de links:{' '}
                <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{'[[#url:https://...]]'}</code>{' '}
                · <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{'[[#mail:email@...]]'}</code>{' '}
                · <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{'[[#ig:@usuario]]'}</code>
                {' — '}texto personalizado con{' '}
                <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{'|Texto'}</code>
                {' antes del '}
                <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{']]'}</code>
                {'. Ej: '}
                <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{'[[#url:https://forms.gle/abc|Inscribite aquí]]'}</code>
              </p>
            </div>
          </div>
        </section>

        </div>{/* /Col 2 */}
        </div>{/* /grid */}

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={pending}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
            {pending ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
