'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LayoutTemplateDto } from './actions';
import {
  activateLayoutTemplate,
  duplicateLayoutTemplate,
  deleteLayoutTemplate,
  deployActiveLayout,
  renameLayoutTemplate,
} from './actions';

interface Props {
  congresoId: string;
  initial: LayoutTemplateDto[];
  slug: string;
}

export default function MaquetasClient({ congresoId, initial, slug }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState<LayoutTemplateDto[]>(initial);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasActive = templates.some(t => t.isActive);

  function goToEditor(layoutId?: string) {
    const url = layoutId
      ? `/admin/congreso/${congresoId}/maquetador?layoutId=${layoutId}`
      : `/admin/congreso/${congresoId}/maquetador`;
    router.push(url);
  }

  function handleActivar(t: LayoutTemplateDto) {
    setOpenMenuId(null);
    startTransition(async () => {
      const updated = await activateLayoutTemplate(congresoId, t.id);
      setTemplates(prev => prev.map(l => ({ ...l, isActive: l.id === updated.id })));
    });
  }

  function handleDuplicar(t: LayoutTemplateDto) {
    setOpenMenuId(null);
    const nombre = `${t.nombre} (copia)`;
    startTransition(async () => {
      const copy = await duplicateLayoutTemplate(congresoId, t.id, nombre);
      setTemplates(prev => [copy, ...prev]);
    });
  }

  function handleEliminar(t: LayoutTemplateDto) {
    setOpenMenuId(null);
    if (!confirm(`¿Eliminar "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      await deleteLayoutTemplate(congresoId, t.id);
      setTemplates(prev => prev.filter(l => l.id !== t.id));
    });
  }

  function startEdit(t: LayoutTemplateDto) {
    setEditingId(t.id);
    setEditingNombre(t.nombre);
    setOpenMenuId(null);
  }

  function handleRename(t: LayoutTemplateDto) {
    const nombre = editingNombre.trim();
    if (!nombre) { setEditingId(null); return; }
    startTransition(async () => {
      const updated = await renameLayoutTemplate(congresoId, t.id, nombre);
      setTemplates(prev => prev.map(l => l.id === t.id ? { ...l, nombre: updated.nombre } : l));
      setEditingId(null);
    });
  }

  async function handleDesplegar() {
    if (!hasActive) return;
    setDeploying(true);
    setDeployMsg(null);
    try {
      const res = await deployActiveLayout(congresoId);
      setDeployMsg(`🚀 Desplegando "${res.layoutNombre}"...`);
      setTimeout(() => setDeployMsg(null), 5000);
    } catch {
      setDeployMsg('❌ Error al desplegar');
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Maquetas</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Diseños guardados del sitio público. Activá uno y desplegalo.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {slug && (
            <Link
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              🌐 Ver sitio
            </Link>
          )}
          <button
            onClick={handleDesplegar}
            disabled={deploying || !hasActive || isPending}
            className="px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deploying ? '⏳ Desplegando...' : '🚀 Desplegar activo'}
          </button>
          <button
            onClick={() => goToEditor()}
            className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Nueva maqueta
          </button>
        </div>
      </div>

      {deployMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
          {deployMsg}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🧱</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Sin maquetas todavía</h3>
          <p className="text-sm mb-6">Creá tu primer diseño para el sitio público.</p>
          <button
            onClick={() => goToEditor()}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            + Crear primera maqueta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${
                t.isActive ? 'border-green-400 bg-green-50/30' : 'border-slate-200'
              }`}
            >
              {/* Card header */}
              <div className="flex items-center justify-between min-h-[28px]">
                {t.isActive && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                    ✅ Activa
                  </span>
                )}
                <div className="ml-auto relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-lg leading-none"
                  >
                    ⋮
                  </button>
                  {openMenuId === t.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px] overflow-hidden">
                      <button onClick={() => handleDuplicar(t)} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">📋 Duplicar</button>
                      <button onClick={() => startEdit(t)} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">✏️ Renombrar</button>
                      {!t.isActive && <button onClick={() => handleActivar(t)} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">✅ Activar</button>}
                      <button onClick={() => handleEliminar(t)} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre */}
              {editingId === t.id ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={editingNombre}
                    onChange={e => setEditingNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(t); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 border border-slate-300 rounded-md px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button onClick={() => handleRename(t)} className="px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-md font-medium">OK</button>
                </div>
              ) : (
                <div
                  onClick={() => startEdit(t)}
                  className="text-base font-semibold text-slate-900 cursor-pointer hover:text-slate-600 flex items-center gap-1.5 group"
                  title="Clic para renombrar"
                >
                  {t.nombre}
                  <span className="text-xs opacity-0 group-hover:opacity-60 transition-opacity">✏️</span>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-slate-400">
                Actualizada {new Date(t.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => goToEditor(t.id)}
                  className="flex-1 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors text-center"
                >
                  ✏️ Editar
                </button>
                {!t.isActive && (
                  <button
                    onClick={() => handleActivar(t)}
                    disabled={isPending}
                    className="px-3 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overlay para cerrar menú */}
      {openMenuId && (
        <div className="fixed inset-0 z-[5]" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}
