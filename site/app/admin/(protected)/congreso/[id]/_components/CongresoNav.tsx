'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon } from './icons';

interface Props {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
}

const TABS = [
  { key: 'maquetas',      label: '🧱 Maquetas' },
  { key: 'salas',         label: '🚪 Salas' },
  { key: 'expositores',   label: '🎤 Expositores' },
  { key: 'sesiones',      label: '📅 Sesiones' },
  { key: 'participantes', label: '👥 Participantes' },
  { key: 'avisos',        label: '🔔 Avisos' },
  { key: 'acciones',      label: '⚡ Acciones' },
];

const ESTADO_BADGE: Record<string, string> = {
  Borrador: 'bg-slate-100 text-slate-600',
  Publicado: 'bg-green-100 text-green-700',
  Finalizado: 'bg-blue-100 text-blue-700',
};

export default function CongresoNav({ id, nombre, slug, estado }: Props) {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Mis congresos
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-medium text-slate-700">{nombre}</span>
          {estado && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[estado] ?? 'bg-slate-100 text-slate-600'}`}>
              {estado}
            </span>
          )}
        </div>

        <nav className="flex gap-1 -mb-px">
          {TABS.map(({ key, label }) => {
            const href = `/admin/congreso/${id}/${key}`;
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={key}
                href={href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
