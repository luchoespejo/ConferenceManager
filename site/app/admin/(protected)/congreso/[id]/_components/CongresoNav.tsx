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

const ESTADO_BADGE: Record<string, string> = {
  Borrador: 'bg-slate-100 text-slate-600',
  Publicado: 'bg-green-100 text-green-700',
  Finalizado: 'bg-blue-100 text-blue-700',
};

const SECTIONS = [
  { label: 'Maquetas',      path: 'maquetas' },
  { label: 'Configuración', path: 'configuracion' },
  { label: 'Sesiones',      path: 'sesiones' },
  { label: 'Expositores',   path: 'expositores' },
  { label: 'Participantes', path: 'participantes' },
  { label: 'Salas',         path: 'salas' },
  { label: 'Avisos',        path: 'avisos' },
  { label: 'Acciones',      path: 'acciones' },
];

export default function CongresoNav({ id, nombre, estado }: Props) {
  const pathname = usePathname();
  const base = `/admin/congreso/${id}`;

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Breadcrumb row */}
      <div className="px-6 pt-3 pb-0 flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors shrink-0"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Mis congresos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800 truncate">{nombre}</span>
        {estado && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ESTADO_BADGE[estado] ?? 'bg-slate-100 text-slate-600'}`}>
            {estado}
          </span>
        )}
      </div>

      {/* Section tabs row */}
      <nav className="px-4 flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {SECTIONS.map(({ label, path }) => {
          const href = `${base}/${path}`;
          const active = pathname.startsWith(`${base}/${path}`);
          return (
            <Link
              key={path}
              href={href}
              className={[
                'px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
                active
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              ].join(' ')}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
