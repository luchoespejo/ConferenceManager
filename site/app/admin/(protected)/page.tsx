import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface ConferenciaListItem {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadSesiones: number;
}

const ESTADO_BADGE: Record<string, { label: string; class: string }> = {
  Borrador: { label: 'Borrador', class: 'bg-slate-100 text-slate-600' },
  Publicado: { label: 'Publicado', class: 'bg-green-100 text-green-700' },
  Finalizado: { label: 'Finalizado', class: 'bg-blue-100 text-blue-700' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function AdminDashboard() {
  let congresos: ConferenciaListItem[] = [];
  try {
    congresos = await apiFetch<ConferenciaListItem[]>('/api/dashboard/conferencias');
  } catch {
    // show empty state
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis congresos</h1>
          <p className="text-sm text-slate-500 mt-1">{congresos.length} congreso{congresos.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo congreso
        </Link>
      </div>

      {congresos.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="font-medium text-slate-500">No tenés congresos todavía</p>
          <p className="text-sm mt-1">Creá tu primer congreso para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {congresos.map(c => {
            const badge = ESTADO_BADGE[c.estado] ?? { label: c.estado, class: 'bg-slate-100 text-slate-600' };
            return (
              <Link
                key={c.id}
                href={`/admin/congreso/${c.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-slate-900 group-hover:text-slate-700 leading-snug">
                    {c.nombre}
                  </h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  {formatDate(c.fechaInicio)} → {formatDate(c.fechaFin)}
                </p>
                <p className="text-xs text-slate-400">{c.cantidadSesiones} sesiones · /{c.slug}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
