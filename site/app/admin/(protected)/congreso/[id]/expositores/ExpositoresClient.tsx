'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '../../../_components/ImageUpload';
import { createExpositor, updateExpositor, deleteExpositor, sendCredentials, getExpositorDetalle } from './actions';

interface Expositor { id: string; nombre: string; email?: string | null; fotoUrl?: string | null; tokenAcceso: string; }
interface Props { congresoId: string; slug: string; initialExpositores: Expositor[]; }

export default function ExpositoresClient({ congresoId, slug, initialExpositores }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const abrirCrear = () => {
    setEditandoId(null); setNombre(''); setEmail(''); setBio(''); setFotoUrl(null); setShowForm(true);
  };

  const abrirEditar = (e: Expositor) => {
    setEditandoId(e.id); setNombre(e.nombre); setEmail(e.email ?? '');
    setFotoUrl(e.fotoUrl ?? null); setBio(''); setShowForm(true);
    getExpositorDetalle(congresoId, e.id).then(d => setBio(d.bio ?? '')).catch(() => {});
  };

  const cancelar = () => { setShowForm(false); setEditandoId(null); };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!nombre.trim()) return;
    const data = {
      nombre: nombre.trim(),
      ...(email ? { email } : {}),
      ...(bio ? { bio } : {}),
      ...(fotoUrl ? { fotoUrl } : {}),
    };
    startTransition(async () => {
      try {
        if (editandoId) {
          await updateExpositor(congresoId, editandoId, data);
          notify('Expositor actualizado');
        } else {
          await createExpositor(congresoId, data);
          notify('Expositor creado');
        }
        cancelar(); router.refresh();
      } catch { notify('Error al guardar', false); }
    });
  };

  const eliminar = (e: Expositor) => {
    if (!confirm(`¿Eliminar "${e.nombre}"?`)) return;
    startTransition(async () => {
      try {
        await deleteExpositor(congresoId, e.id);
        notify('Expositor eliminado'); router.refresh();
      } catch { notify('Error al eliminar', false); }
    });
  };

  const copiarLink = (e: Expositor) => {
    const base = slug ? `https://${slug}.tuplataforma.com` : 'http://localhost:3000';
    const url = `${base}/expositor/${e.tokenAcceso}`;
    navigator.clipboard.writeText(url).then(
      () => notify('Link copiado'),
      () => prompt('Copiá el link:', url)
    );
  };

  const enviarTodos = () => {
    if (!confirm('¿Enviar credenciales a todos?')) return;
    startTransition(async () => {
      try {
        await sendCredentials(congresoId, initialExpositores.map(e => e.id));
        notify(`Emails enviados a ${initialExpositores.length} expositores`);
      } catch { notify('Error al enviar emails', false); }
    });
  };

  const enviarUno = (e: Expositor) => {
    startTransition(async () => {
      try {
        await sendCredentials(congresoId, [e.id]);
        notify(`Email enviado a ${e.nombre}`);
      } catch { notify('Error al enviar email', false); }
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
          <h1 className="text-xl font-bold text-slate-900">Expositores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{initialExpositores.length} registrado{initialExpositores.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {initialExpositores.length > 0 && (
            <button onClick={enviarTodos} disabled={pending}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-60">
              📧 Enviar a todos
            </button>
          )}
          <button onClick={abrirCrear}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
            + Nuevo expositor
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editandoId ? 'Editar expositor' : 'Nuevo expositor'}</h2>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Biografía</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Foto</label>
              <ImageUpload value={fotoUrl} onChange={setFotoUrl} label="foto" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={cancelar}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={pending}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
                {pending ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {initialExpositores.length === 0 && !showForm ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🎤</div>
          <p className="font-medium text-slate-500">No hay expositores registrados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {initialExpositores.map(e => (
            <div key={e.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0 overflow-hidden">
                {e.fotoUrl ? <img src={e.fotoUrl} alt={e.nombre} className="w-full h-full object-cover" /> : e.nombre[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{e.nombre}</p>
                <p className="text-xs text-slate-400">{e.email || 'Sin email'}</p>
              </div>
              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                <button onClick={() => copiarLink(e)} className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">🔗 Link</button>
                <button onClick={() => enviarUno(e)} disabled={pending} className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60">📧</button>
                <button onClick={() => abrirEditar(e)} className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">Editar</button>
                <button onClick={() => eliminar(e)} disabled={pending} className="px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
