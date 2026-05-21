'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '../../../_components/ImageUpload';
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
  mostrarFechas: boolean; mostrarDescripcion: boolean; mostrarOrganizadores: boolean;
  mostrarContacto: boolean; mostrarInscripciones: boolean;
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

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
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
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );

  return (
    <div className="p-8 max-w-2xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── FORM ─────────────────────────────────────────────────────────────── */}
      <form onSubmit={guardar} className="flex flex-col gap-5">

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
              <textarea value={infoPago} onChange={e => setInfoPago(e.target.value)} rows={2} placeholder="CBU, alias, transferencia..." className={inp + ' resize-y'} />
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
              <textarea value={contactoAdicional} onChange={e => setContactoAdicional(e.target.value)} rows={2} className={inp + ' resize-y'} />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={pending}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
            {pending ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
