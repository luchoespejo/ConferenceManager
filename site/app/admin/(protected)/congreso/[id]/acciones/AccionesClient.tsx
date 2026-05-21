'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { publicarCongreso, finalizarCongreso, redeployarSitio } from '../configuracion/actions';

interface Overview {
  id: string; nombre: string; slug: string; estado: string;
  cantidadSesiones?: number;
}

interface Props { congreso: Overview; }

const ESTADO_COLOR: Record<string, { badge: string; desc: string }> = {
  Borrador:   { badge: 'bg-slate-100 text-slate-700 border border-slate-200', desc: 'No visible públicamente' },
  Publicado:  { badge: 'bg-green-100 text-green-800 border border-green-200', desc: 'Visible en el mini-sitio' },
  Finalizado: { badge: 'bg-blue-100 text-blue-800 border border-blue-200', desc: 'Evento concluido' },
};

export default function AccionesClient({ congreso: init }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [estado, setEstado] = useState(init.estado);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const publicar = () => {
    if (!confirm('¿Publicar este congreso? Quedará visible en el mini-sitio.')) return;
    startTransition(async () => {
      try { const r = await publicarCongreso(init.id); setEstado(r.estado); notify('Congreso publicado ✓'); router.refresh(); }
      catch (e) { notify(e instanceof Error ? e.message : 'Error al publicar', false); }
    });
  };

  const finalizar = () => {
    if (!confirm('¿Finalizar el congreso? Esta acción no se puede deshacer.')) return;
    startTransition(async () => {
      try { const r = await finalizarCongreso(init.id); setEstado(r.estado); notify('Congreso finalizado'); router.refresh(); }
      catch (e) { notify(e instanceof Error ? e.message : 'Error al finalizar', false); }
    });
  };

  const redeploy = () => {
    startTransition(async () => {
      try { await redeployarSitio(init.id); notify('Re-deploy disparado — Vercel construirá el sitio en ~1 min'); }
      catch { notify('Error al disparar deploy', false); }
    });
  };

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://conference-manager-irl1.vercel.app';
  const siteUrl = `${siteBase}/${init.slug}`;
  const info = ESTADO_COLOR[estado] ?? { badge: 'bg-slate-100 text-slate-600 border border-slate-200', desc: '' };

  return (
    <div className="p-8 max-w-xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-xl font-bold text-slate-900 mb-1">Acciones</h1>
      <p className="text-sm text-slate-500 mb-6">{init.nombre}</p>

      {/* Estado */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Estado</p>
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${info.badge}`}>
            {estado === 'Publicado' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
            {estado}
          </span>
          <p className="text-xs text-slate-400 mt-1">{info.desc}</p>
        </div>
        <a href={siteUrl} target="_blank" rel="noopener"
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
          🌐 Ver sitio
          <svg className="w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3">
        {estado === 'Borrador' && (
          <ActionCard
            icon="🚀"
            title="Publicar congreso"
            desc="Lo hace visible en el mini-sitio y dispara el build de Vercel."
            cta="Publicar"
            ctaClass="bg-green-600 hover:bg-green-700 text-white"
            onClick={publicar}
            disabled={pending}
          />
        )}

        {estado === 'Publicado' && (
          <ActionCard
            icon="✅"
            title="Finalizar congreso"
            desc="Marca el evento como concluido. No se puede deshacer."
            cta="Finalizar"
            ctaClass="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={finalizar}
            disabled={pending}
          />
        )}

        {(estado === 'Publicado' || estado === 'Finalizado') && (
          <ActionCard
            icon="🔄"
            title="Re-deploy del sitio"
            desc="Dispara un nuevo build en Vercel para actualizar el mini-sitio con los últimos datos."
            cta="Disparar re-deploy"
            ctaClass="bg-slate-900 hover:bg-slate-800 text-white"
            onClick={redeploy}
            disabled={pending}
          />
        )}

        {estado === 'Borrador' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-400 flex gap-3 items-start">
            <span className="text-lg">ℹ️</span>
            <span>El sitio no está publicado. Completá el maquetador y publicá el congreso para que sea visible.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, cta, ctaClass, onClick, disabled }: {
  icon: string; title: string; desc: string; cta: string; ctaClass: string; onClick: () => void; disabled: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button onClick={onClick} disabled={disabled}
        className={`px-4 py-2 rounded-lg text-sm font-semibold shrink-0 disabled:opacity-60 transition-colors ${ctaClass}`}>
        {cta}
      </button>
    </div>
  );
}
