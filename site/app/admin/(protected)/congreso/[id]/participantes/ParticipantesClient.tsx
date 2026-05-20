'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createParticipante, updateParticipante, toggleCertificado, deleteParticipante } from './actions';

interface Participante { id: string; nombre: string; email: string; empresa?: string | null; puedeGenerarCertificado: boolean; }
interface Props { congresoId: string; initialParticipantes: Participante[]; }

const EMPTY = { nombre: '', email: '', empresa: '', cert: false };

export default function ParticipantesClient({ congresoId, initialParticipantes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };
  const setF = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: k === 'cert' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const abrirCrear = () => { setEditandoId(null); setForm(EMPTY); setShowForm(true); };
  const abrirEditar = (p: Participante) => {
    setEditandoId(p.id);
    setForm({ nombre: p.nombre, email: p.email, empresa: p.empresa ?? '', cert: p.puedeGenerarCertificado });
    setShowForm(true);
  };
  const cancelar = () => { setShowForm(false); setEditandoId(null); setForm(EMPTY); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nombre: form.nombre, email: form.email, puedeGenerarCertificado: form.cert, ...(form.empresa ? { empresa: form.empresa } : {}) };
    startTransition(async () => {
      try {
        if (editandoId) { await updateParticipante(congresoId, editandoId, data); notify('Participante actualizado'); }
        else { await createParticipante(congresoId, data); notify('Participante creado'); }
        cancelar(); router.refresh();
      } catch { notify('Error al guardar', false); }
    });
  };

  const toggleCert = (p: Participante) => {
    startTransition(async () => {
      try { await toggleCertificado(congresoId, p.id, !p.puedeGenerarCertificado); router.refresh(); }
      catch { notify('Error al actualizar certificado', false); }
    });
  };

  const eliminar = (p: Participante) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    startTransition(async () => {
      try { await deleteParticipante(congresoId, p.id); notify('Participante eliminado'); router.refresh(); }
      catch { notify('Error al eliminar', false); }
    });
  };

  const exportCsv = () => {
    const rows = [['Nombre', 'Email', 'Empresa', 'Certificado'],
      ...initialParticipantes.map(p => [p.nombre, p.email, p.empresa ?? '', p.puedeGenerarCertificado ? 'Sí' : 'No'])];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = 'participantes.csv'; a.click();
  };

  const filtrados = initialParticipantes.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.email.toLowerCase().includes(busqueda.toLowerCase())
  );
  const conCert = initialParticipantes.filter(p => p.puedeGenerarCertificado).length;
  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900';

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Participantes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{initialParticipantes.length} registrado{initialParticipantes.length !== 1 ? 's' : ''} · {conCert} con certificado</p>
        </div>
        <div className="flex gap-2">
          {initialParticipantes.length > 0 && (
            <button onClick={exportCsv} className="px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium hover:bg-slate-50">↓ CSV</button>
          )}
          <button onClick={abrirCrear} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
            + Nuevo participante
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editandoId ? 'Editar participante' : 'Nuevo participante'}</h2>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={setF('nombre')} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={setF('email')} required className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Empresa / Institución</label>
                <input value={form.empresa} onChange={setF('empresa')} placeholder="Opcional" className={inputCls} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
                <input type="checkbox" checked={form.cert} onChange={setF('cert')} className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-700">Habilitar certificado</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={cancelar} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={pending} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
                {pending ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {initialParticipantes.length > 0 && (
        <div className="mb-4">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
      )}

      {filtrados.length === 0 && !showForm ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium text-slate-500">{busqueda ? 'Sin resultados' : 'No hay participantes registrados'}</p>
        </div>
      ) : filtrados.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Nombre', 'Email', 'Empresa', 'Certificado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{p.email}</td>
                  <td className="px-4 py-3 text-slate-500">{p.empresa || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleCert(p)} disabled={pending}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${p.puedeGenerarCertificado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {p.puedeGenerarCertificado ? '✓ Habilitado' : 'Deshabilitado'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => abrirEditar(p)} className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">Editar</button>
                      <button onClick={() => eliminar(p)} disabled={pending} className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
