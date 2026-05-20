'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAviso, updateAviso, deleteAviso } from './actions';

interface Aviso { id: string; mensaje: string; activo: boolean; createdAt: string; }
interface Props { congresoId: string; initialAvisos: Aviso[]; }

export default function AvisosClient({ congresoId, initialAvisos }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    startTransition(async () => {
      try {
        await createAviso(congresoId, mensaje.trim());
        notify('Aviso creado'); setMensaje(''); setShowForm(false); router.refresh();
      } catch { notify('Error al crear aviso', false); }
    });
  };

  const toggleActivo = (a: Aviso) => {
    startTransition(async () => {
      try {
        await updateAviso(congresoId, a.id, { activo: !a.activo });
        router.refresh();
      } catch { notify('Error al actualizar', false); }
    });
  };

  const eliminar = (a: Aviso) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    startTransition(async () => {
      try { await deleteAviso(congresoId, a.id); notify('Aviso eliminado'); router.refresh(); }
      catch { notify('Error al eliminar', false); }
    });
  };

  const activos = initialAvisos.filter(a => a.activo).length;

  return (
    <div className="p-8 max-w-2xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Avisos Urgentes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activos} activo{activos !== 1 ? 's' : ''} — se muestran con polling 30s en el mini-sitio</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
          + Nuevo aviso
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Mensaje * <span className="text-slate-400">({mensaje.length}/500)</span>
              </label>
              <textarea
                value={mensaje} onChange={e => setMensaje(e.target.value.slice(0, 500))}
                placeholder="Ej: La sala A se trasladó al salón principal..."
                rows={3} required maxLength={500}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setMensaje(''); }}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={pending || !mensaje.trim()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
                {pending ? 'Guardando...' : 'Publicar aviso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {initialAvisos.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🔔</div>
          <p className="font-medium text-slate-500">No hay avisos urgentes</p>
          <p className="text-sm mt-1">Los avisos activos aparecen en el mini-sitio en tiempo real</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {initialAvisos.map(a => (
            <div key={a.id} className={`bg-white border rounded-xl p-4 flex gap-3 items-start ${a.activo ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}>
              <div className="text-xl shrink-0 mt-0.5">{a.activo ? '🔔' : '🔕'}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${a.activo ? 'text-orange-900 font-medium' : 'text-slate-500'}`}>{a.mensaje}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString('es-AR')}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => toggleActivo(a)} disabled={pending}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-60 ${
                    a.activo ? 'border-orange-300 text-orange-700 hover:bg-orange-100' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}>
                  {a.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminar(a)} disabled={pending}
                  className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
