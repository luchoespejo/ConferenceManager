'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '../../../_components/ImageUpload';
import { updateCongreso, publicarCongreso, finalizarCongreso, redeployarSitio, type UpdateCongresoData } from './actions';

interface Congreso {
  id: string; nombre: string; slug: string; estado: string;
  fechaInicio: string; fechaFin: string;
  descripcion?: string | null; subtitulo?: string | null; lema?: string | null;
  venueNombre?: string | null; venueDireccion?: string | null; venueLinkMaps?: string | null;
  emailContacto?: string | null; instagram?: string | null;
  formularioInscripcionUrl?: string | null; informacionPago?: string | null; contactoAdicional?: string | null;
  mostrarFechas: boolean; mostrarDescripcion: boolean; mostrarOrganizadores: boolean;
  mostrarContacto: boolean; mostrarInscripciones: boolean;
  logoUrl?: string | null; bannerUrl?: string | null;
}

interface Props { congreso: Congreso; }

export default function ConfiguracionClient({ congreso: init }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form state
  const [nombre, setNombre] = useState(init.nombre);
  const [fechaInicio, setFechaInicio] = useState(init.fechaInicio);
  const [fechaFin, setFechaFin] = useState(init.fechaFin);
  const [descripcion, setDescripcion] = useState(init.descripcion ?? '');
  const [subtitulo, setSubtitulo] = useState(init.subtitulo ?? '');
  const [lema, setLema] = useState(init.lema ?? '');
  const [venueNombre, setVenueNombre] = useState(init.venueNombre ?? '');
  const [venueDireccion, setVenueDireccion] = useState(init.venueDireccion ?? '');
  const [venueLinkMaps, setVenueLinkMaps] = useState(init.venueLinkMaps ?? '');
  const [emailContacto, setEmailContacto] = useState(init.emailContacto ?? '');
  const [instagram, setInstagram] = useState(init.instagram ?? '');
  const [formularioUrl, setFormularioUrl] = useState(init.formularioInscripcionUrl ?? '');
  const [infoPago, setInfoPago] = useState(init.informacionPago ?? '');
  const [contactoAdicional, setContactoAdicional] = useState(init.contactoAdicional ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(init.logoUrl ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(init.bannerUrl ?? null);

  // Toggles
  const [mostrarFechas, setMostrarFechas] = useState(init.mostrarFechas);
  const [mostrarDescripcion, setMostrarDescripcion] = useState(init.mostrarDescripcion);
  const [mostrarOrganizadores, setMostrarOrganizadores] = useState(init.mostrarOrganizadores);
  const [mostrarContacto, setMostrarContacto] = useState(init.mostrarContacto);
  const [mostrarInscripciones, setMostrarInscripciones] = useState(init.mostrarInscripciones);

  const [estado, setEstado] = useState(init.estado);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    const data: UpdateCongresoData = {
      nombre, fechaInicio, fechaFin,
      ...(descripcion ? { descripcion } : {}),
      ...(subtitulo ? { subtitulo } : {}),
      ...(lema ? { lema } : {}),
      ...(venueNombre ? { venueNombre } : {}),
      ...(venueDireccion ? { venueDireccion } : {}),
      ...(venueLinkMaps ? { venueLinkMaps } : {}),
      ...(emailContacto ? { emailContacto } : {}),
      ...(instagram ? { instagram } : {}),
      ...(formularioUrl ? { formularioInscripcionUrl: formularioUrl } : {}),
      ...(infoPago ? { informacionPago: infoPago } : {}),
      ...(contactoAdicional ? { contactoAdicional } : {}),
      ...(logoUrl ? { logoUrl } : {}),
      ...(bannerUrl ? { bannerUrl } : {}),
      mostrarFechas, mostrarDescripcion, mostrarOrganizadores, mostrarContacto, mostrarInscripciones,
    };
    startTransition(async () => {
      try { await updateCongreso(init.id, data); notify('Configuración guardada'); router.refresh(); }
      catch { notify('Error al guardar', false); }
    });
  };

  const publicar = () => {
    if (!confirm('¿Publicar este congreso? Será visible en el mini-sitio.')) return;
    startTransition(async () => {
      try { const r = await publicarCongreso(init.id); setEstado(r.estado); notify('Congreso publicado ✓'); router.refresh(); }
      catch { notify('Error al publicar', false); }
    });
  };

  const finalizar = () => {
    if (!confirm('¿Finalizar el congreso? Ya no será editable.')) return;
    startTransition(async () => {
      try { const r = await finalizarCongreso(init.id); setEstado(r.estado); notify('Congreso finalizado'); router.refresh(); }
      catch { notify('Error al finalizar', false); }
    });
  };

  const redeploy = () => {
    startTransition(async () => {
      try { await redeployarSitio(init.id); notify('Re-deploy disparado ✓'); }
      catch { notify('Error al disparar deploy', false); }
    });
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900';
  const lbl = (t: string) => <label className="block text-xs font-medium text-slate-600 mb-1">{t}</label>;

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-slate-900' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );

  const ESTADO_COLOR: Record<string, string> = {
    Borrador: 'bg-slate-100 text-slate-700',
    Publicado: 'bg-green-100 text-green-800',
    Finalizado: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="p-8 max-w-2xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── ACCIONES (top, prominente) ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Acciones</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ESTADO_COLOR[estado] ?? 'bg-slate-100 text-slate-600'}`}>{estado}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {estado === 'Borrador' && (
            <button type="button" onClick={publicar} disabled={pending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
              🚀 Publicar congreso
            </button>
          )}
          {estado === 'Publicado' && (
            <>
              <button type="button" onClick={finalizar} disabled={pending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                ✓ Finalizar congreso
              </button>
              <button type="button" onClick={redeploy} disabled={pending}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
                🔄 Re-deploy sitio
              </button>
            </>
          )}
          {estado === 'Finalizado' && (
            <button type="button" onClick={redeploy} disabled={pending}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
              🔄 Re-deploy sitio
            </button>
          )}
          <a href={`http://localhost:3000/${init.slug}`} target="_blank" rel="noopener"
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 inline-flex items-center gap-1.5">
            🌐 Ver mini-sitio
            <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        {pending && <p className="text-xs text-slate-400 mt-3">Procesando...</p>}
      </div>

      {/* ── FORM ─────────────────────────────────────────────────────────── */}
      <form onSubmit={guardar} className="flex flex-col gap-5">

        {/* Info básica */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Información básica</h2>
          <div className="flex flex-col gap-4">
            <div>
              {lbl('Nombre *')}
              <input value={nombre} onChange={e => setNombre(e.target.value)} required className={inputCls} />
            </div>
            <div>
              {lbl('Slug (subdominio)')}
              <input value={init.slug} disabled
                className={inputCls + ' bg-slate-50 text-slate-400 cursor-not-allowed'}
                title={estado !== 'Borrador' ? 'El slug no cambia una vez publicado' : ''} />
              {estado !== 'Borrador' && <p className="text-xs text-slate-400 mt-1">No editable — congreso {estado.toLowerCase()}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl('Fecha inicio *')}
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required className={inputCls} />
              </div>
              <div>
                {lbl('Fecha fin *')}
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required className={inputCls} />
              </div>
            </div>
            <div>
              {lbl('Subtítulo')}
              <input value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Línea 2 del título" className={inputCls} />
            </div>
            <div>
              {lbl('Lema')}
              <input value={lema} onChange={e => setLema(e.target.value)} placeholder="Frase en cursiva" className={inputCls} />
            </div>
            <div>
              {lbl('Descripción')}
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} className={inputCls + ' resize-y'} />
            </div>
          </div>
        </section>

        {/* Branding básico */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Branding</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              {lbl('Logo')}
              <ImageUpload value={logoUrl} onChange={setLogoUrl} label="logo" />
            </div>
            <div>
              {lbl('Banner / Fondo hero')}
              <ImageUpload value={bannerUrl} onChange={setBannerUrl} label="banner" />
            </div>
          </div>
        </section>

        {/* Venue */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Sede</h2>
          <div className="flex flex-col gap-3">
            <div>
              {lbl('Nombre de la sede')}
              <input value={venueNombre} onChange={e => setVenueNombre(e.target.value)} placeholder="Ej. Centro de Convenciones" className={inputCls} />
            </div>
            <div>
              {lbl('Dirección')}
              <input value={venueDireccion} onChange={e => setVenueDireccion(e.target.value)} placeholder="Av. Corrientes 1234, CABA" className={inputCls} />
            </div>
            <div>
              {lbl('Link Google Maps')}
              <input type="url" value={venueLinkMaps} onChange={e => setVenueLinkMaps(e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Contacto e inscripciones</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                {lbl('Email de contacto')}
                <input type="email" value={emailContacto} onChange={e => setEmailContacto(e.target.value)} className={inputCls} />
              </div>
              <div>
                {lbl('Instagram')}
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario" className={inputCls} />
              </div>
            </div>
            <div>
              {lbl('URL formulario de inscripción')}
              <input type="url" value={formularioUrl} onChange={e => setFormularioUrl(e.target.value)} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              {lbl('Información de pago')}
              <textarea value={infoPago} onChange={e => setInfoPago(e.target.value)} rows={2} className={inputCls + ' resize-y'} />
            </div>
            <div>
              {lbl('Contacto adicional')}
              <textarea value={contactoAdicional} onChange={e => setContactoAdicional(e.target.value)} rows={2} className={inputCls + ' resize-y'} />
            </div>
          </div>
        </section>

        {/* Visibilidad */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100">Secciones visibles en el mini-sitio</h2>
          <div className="flex flex-col gap-3">
            <Toggle value={mostrarFechas} onChange={setMostrarFechas} label="Fechas importantes" />
            <Toggle value={mostrarDescripcion} onChange={setMostrarDescripcion} label="Descripción" />
            <Toggle value={mostrarOrganizadores} onChange={setMostrarOrganizadores} label="Organizadores / Sponsors" />
            <Toggle value={mostrarContacto} onChange={setMostrarContacto} label="Contacto" />
            <Toggle value={mostrarInscripciones} onChange={setMostrarInscripciones} label="Inscripciones" />
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
