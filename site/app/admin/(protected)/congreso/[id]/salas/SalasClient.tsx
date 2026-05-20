'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSala, updateSala, deleteSala } from './actions';

interface Sala { id: string; nombre: string; capacidad?: number | null; }

interface Props { congresoId: string; initialSalas: Sala[]; }

export default function SalasClient({ congresoId, initialSalas }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState<Sala | null>(null);
  const [nombre, setNombre] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const abrirCrear = () => {
    setEditando(null); setNombre(''); setCapacidad(''); setShowForm(true);
  };

  const abrirEditar = (s: Sala) => {
    setEditando(s); setNombre(s.nombre); setCapacidad(s.capacidad ? String(s.capacidad) : '');
    setShowForm(true);
  };

  const cancelar = () => { setShowForm(false); setEditando(null); setNombre(''); setCapacidad(''); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const data = { nombre: nombre.trim(), ...(capacidad ? { capacidad: Number(capacidad) } : {}) };
    setDeleteError(null);
    startTransition(async () => {
      try {
        if (editando) {
          await updateSala(congresoId, editando.id, data);
          notify('Sala actualizada');
        } else {
          await createSala(congresoId, data);
          notify('Sala creada');
        }
        cancelar();
        router.refresh();
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Error', false);
      }
    });
  };

  const eliminar = (sala: Sala) => {
    if (!confirm(`¿Eliminar "${sala.nombre}"?`)) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteSala(congresoId, sala.id);
        notify('Sala eliminada');
        router.refresh();
      } catch {
        setDeleteError(sala.id);
        notify('No se puede eliminar una sala con sesiones asignadas', false);
      }
    });
  };

  return (
    <div className="p-8 max-w-3xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Salas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestioná las salas del congreso</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">{editando ? 'Editar sala' : 'Nueva sala'}</h2>
        <form onSubmit={submit} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
            <input
              value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Sala Principal" required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-slate-600 mb-1">Capacidad</label>
            <input
              type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)}
              placeholder="Opcional" min={1}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="flex gap-2">
            {editando && (
              <button type="button" onClick={cancelar}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={pending}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
              {pending ? 'Guardando...' : editando ? 'Actualizar' : 'Crear sala'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {initialSalas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🚪</div>
          <p className="font-medium text-slate-500">No hay salas registradas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {initialSalas.map(sala => (
            <div key={sala.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-lg shrink-0">🚪</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{sala.nombre}</p>
                <p className="text-xs text-slate-400">
                  {sala.capacidad ? `Cap. ${sala.capacidad} personas` : 'Sin capacidad definida'}
                </p>
                {deleteError === sala.id && (
                  <p className="text-xs text-red-600 mt-0.5">Tiene sesiones asignadas — no se puede eliminar</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => abrirEditar(sala)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50">
                  Editar
                </button>
                <button onClick={() => eliminar(sala)} disabled={pending}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60">
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
