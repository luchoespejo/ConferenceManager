'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSesion, updateSesion, deleteSesion, getSesionDetalle, type SesionPayload } from './actions';

interface SesionItem {
  id: string; titulo: string; fecha: string;
  horaInicio: string; horaFin: string;
  salaNombre: string; expositorNombre: string; track?: string | null;
}
interface Sala { id: string; nombre: string; }
interface Expositor { id: string; nombre: string; }
interface Props { congresoId: string; initialSesiones: SesionItem[]; salas: Sala[]; expositores: Expositor[]; }

const EMPTY_FORM: SesionPayload = {
  titulo: '', descripcion: '', salaId: '', expositorId: '',
  fecha: '', horaInicio: '', horaFin: '', track: '', encuestaUrl: '', qrCodeUrl: '',
};

export default function SesionesClient({ congresoId, initialSesiones, salas, expositores }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<SesionPayload>(EMPTY_FORM);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const set = (field: keyof SesionPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const abrirCrear = () => { setEditandoId(null); setForm(EMPTY_FORM); setShowForm(true); };

  const abrirEditar = (s: SesionItem) => {
    setEditandoId(s.id); setShowForm(true);
    startTransition(async () => {
      try {
        const d = await getSesionDetalle(congresoId, s.id);
        setForm({
          titulo: d.titulo, descripcion: d.descripcion ?? '',
          salaId: d.salaId, expositorId: d.expositorId,
          fecha: d.fecha, horaInicio: d.horaInicio?.slice(0, 5) ?? '',
          horaFin: d.horaFin?.slice(0, 5) ?? '', track: d.track ?? '',
          encuestaUrl: d.encuestaUrl ?? '', qrCodeUrl: d.qrCodeUrl ?? '',
        });
      } catch { notify('Error al cargar sesión', false); }
    });
  };

  const cancelar = () => { setShowForm(false); setEditandoId(null); setForm(EMPTY_FORM); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: SesionPayload = {
      titulo: form.titulo, salaId: form.salaId, expositorId: form.expositorId,
      fecha: form.fecha, horaInicio: form.horaInicio, horaFin: form.horaFin,
      ...(form.descripcion ? { descripcion: form.descripcion } : {}),
      ...(form.track ? { track: form.track } : {}),
      ...(form.encuestaUrl ? { encuestaUrl: form.encuestaUrl } : {}),
      ...(form.qrCodeUrl ? { qrCodeUrl: form.qrCodeUrl } : {}),
    };
    startTransition(async () => {
      try {
        if (editandoId) {
          await updateSesion(congresoId, editandoId, data);
          notify('Sesión actualizada');
        } else {
          await createSesion(congresoId, data);
          notify('Sesión creada');
        }
        cancelar(); router.refresh();
      } catch { notify('Error al guardar', false); }
    });
  };

  const eliminar = (s: SesionItem) => {
    if (!confirm(`¿Eliminar "${s.titulo}"?`)) return;
    startTransition(async () => {
      try {
        await deleteSesion(congresoId, s.id);
        notify('Sesión eliminada'); router.refresh();
      } catch { notify('Error al eliminar', false); }
    });
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900';
  const label = (txt: string, req = false) => (
    <label className="block text-xs font-medium text-slate-600 mb-1">{txt}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  );

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sesiones</h1>
          <p className="text-sm text-slate-500 mt-0.5">{initialSesiones.length} sesión{initialSesiones.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={abrirCrear}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
          + Nueva sesión
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">{editandoId ? 'Editar sesión' : 'Nueva sesión'}</h2>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              {label('Título', true)}
              <input value={form.titulo} onChange={set('titulo')} required className={inputCls} />
            </div>
            <div>
              {label('Descripción')}
              <textarea value={form.descripcion} onChange={set('descripcion')} rows={2} className={inputCls + ' resize-y'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {label('Sala', true)}
                <select value={form.salaId} onChange={set('salaId')} required className={inputCls}>
                  <option value="">Seleccionar sala</option>
                  {salas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                {label('Expositor', true)}
                <select value={form.expositorId} onChange={set('expositorId')} required className={inputCls}>
                  <option value="">Seleccionar expositor</option>
                  {expositores.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                {label('Fecha', true)}
                <input type="date" value={form.fecha} onChange={set('fecha')} required className={inputCls} />
              </div>
              <div>
                {label('Hora inicio', true)}
                <input type="time" value={form.horaInicio} onChange={set('horaInicio')} required className={inputCls} />
              </div>
              <div>
                {label('Hora fin', true)}
                <input type="time" value={form.horaFin} onChange={set('horaFin')} required className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                {label('Track')}
                <input value={form.track} onChange={set('track')} placeholder="Ej. Keynote" className={inputCls} />
              </div>
              <div>
                {label('URL Encuesta')}
                <input type="url" value={form.encuestaUrl} onChange={set('encuestaUrl')} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                {label('URL QR')}
                <input type="url" value={form.qrCodeUrl} onChange={set('qrCodeUrl')} placeholder="https://..." className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={cancelar}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={pending}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
                {pending ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar sesión'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {initialSesiones.length === 0 && !showForm ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-medium text-slate-500">No hay sesiones registradas</p>
        </div>
      ) : initialSesiones.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Título', 'Fecha', 'Horario', 'Sala', 'Expositor', 'Track', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialSesiones.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.titulo}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.fecha}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.horaInicio} – {s.horaFin}</td>
                  <td className="px-4 py-3 text-slate-600">{s.salaNombre}</td>
                  <td className="px-4 py-3 text-slate-600">{s.expositorNombre}</td>
                  <td className="px-4 py-3">
                    {s.track ? <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.track}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => abrirEditar(s)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">Editar</button>
                      <button onClick={() => eliminar(s)} disabled={pending}
                        className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60">Eliminar</button>
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
