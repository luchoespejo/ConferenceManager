'use client';

import Link from 'next/link';
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

export default function CongresoNav({ nombre, estado }: Props) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
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
  );
}
