'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Puck, usePuck } from '@puckeditor/core';
import '@puckeditor/core/dist/index.css';
import { puckConfig, DEFAULT_PUCK_DATA } from '@/lib/puck-config';
import { createTemplateAction, updateTemplateAction, previewLayoutAction } from './actions';

interface Props {
  congresoId: string;
  layoutId: string | null;
  templateNombre: string | null;
  initialLayoutJson: string | null;
  slug: string | null;
}

const EMPTY_PUCK_DATA = { content: [], root: { props: { fontFamily: 'system-ui, sans-serif' } } };

function parsePuckData(layoutJson: string | null) {
  if (!layoutJson) return null;
  try {
    const parsed = JSON.parse(layoutJson);
    if (parsed.version && parsed.puckData) return parsed.puckData;
    if (parsed.content) return parsed;
    return null;
  } catch { return null; }
}

export default function MaquetadorClient({ congresoId, layoutId, templateNombre, initialLayoutJson, slug }: Props) {
  const router = useRouter();
  const existingData = parsePuckData(initialLayoutJson);

  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(layoutId);
  const [started, setStarted] = useState(existingData !== null || layoutId !== null);
  const [startEmpty, setStartEmpty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingData, setPendingData] = useState<unknown>(null);
  const [pendingNombre, setPendingNombre] = useState('');

  const MAX_PAYLOAD_MB = 8; // margen bajo el límite de 10MB del server action

  function checkPayloadSize(data: unknown): boolean {
    const json = JSON.stringify({ version: 1, puckData: data });
    const sizeMB = new Blob([json]).size / 1024 / 1024;
    if (sizeMB > MAX_PAYLOAD_MB) {
      setError(`El layout pesa ${sizeMB.toFixed(1)} MB y supera el límite de ${MAX_PAYLOAD_MB} MB. Reducí el tamaño de las imágenes.`);
      return false;
    }
    return true;
  }

  async function handlePreview(data: unknown) {
    if (!checkPayloadSize(data)) return;
    setPreviewing(true);
    setError(null);
    try {
      const resolvedSlug = await previewLayoutAction(congresoId, data);
      window.open(`/${resolvedSlug}`, '_blank');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar vista previa');
    } finally {
      setPreviewing(false);
    }
  }

  function handleSaveRequest(data: unknown) {
    if (!checkPayloadSize(data)) return;
    if (currentLayoutId) {
      // Actualizar template existente
      doSave(data, currentLayoutId, null);
    } else {
      // Nueva maqueta — pedir nombre
      setPendingData(data);
      setPendingNombre('');
      setShowNameModal(true);
    }
  }

  async function doSave(data: unknown, lId: string | null, nombre: string | null) {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      if (lId) {
        await updateTemplateAction(congresoId, lId, data);
      } else {
        const created = await createTemplateAction(congresoId, nombre!, data);
        setCurrentLayoutId(created.id);
        // Actualizar URL sin recargar
        router.replace(`/admin/congreso/${congresoId}/maquetador?layoutId=${created.id}`);
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function confirmSave() {
    const nombre = pendingNombre.trim();
    if (!nombre) return;
    setShowNameModal(false);
    doSave(pendingData, null, nombre);
  }

  // SaveBtn vive dentro del árbol de Puck para poder usar usePuck()
  function SaveBtn() {
    const { appState } = usePuck();
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => router.push(`/admin/congreso/${congresoId}/maquetas`)}
          style={{
            padding: '5px 12px',
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Maquetas
        </button>
        <button
          onClick={() => handlePreview(appState.data)}
          disabled={previewing || saving}
          title="Copia el estado actual al sitio público y abre una vista previa en nueva pestaña"
          style={{
            padding: '5px 12px',
            background: 'transparent',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: (previewing || saving) ? 'not-allowed' : 'pointer',
            opacity: (previewing || saving) ? 0.6 : 1,
          }}
        >
          {previewing ? '⏳ Abriendo...' : '👁 Vista previa'}
        </button>
        <button
          onClick={() => handleSaveRequest(appState.data)}
          disabled={saving}
          style={{
            padding: '6px 16px',
            background: savedOk ? '#16a34a' : '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'background 0.2s',
          }}
        >
          {saving ? '⏳ Guardando...' : savedOk ? '✓ Guardado' : currentLayoutId ? '💾 Guardar' : '💾 Guardar maqueta'}
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🧱</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nueva maqueta</h2>
          <p className="text-sm text-slate-500 mb-6">
            Empezá con la plantilla por defecto o desde cero.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setStartEmpty(false); setStarted(true); }}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Empezar con plantilla por defecto
            </button>
            <button
              onClick={() => { setStartEmpty(true); setStarted(true); }}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Empezar desde cero
            </button>
          </div>
          <button
            onClick={() => router.push(`/admin/congreso/${congresoId}/maquetas`)}
            className="mt-4 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← Volver a maquetas
          </button>
        </div>
      </div>
    );
  }

  const puckData = existingData ?? (startEmpty ? EMPTY_PUCK_DATA : DEFAULT_PUCK_DATA);

  return (
    <div className="relative">
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          ❌ {error}
        </div>
      )}

      {templateNombre && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
          {templateNombre}
        </div>
      )}

      <div style={{ height: 'calc(100vh - 56px)' }}>
        <Puck
          config={puckConfig}
          data={puckData}
          onPublish={handleSaveRequest}
          overrides={{
            headerActions: () => <SaveBtn />,
          }}
        />
      </div>

      {/* Modal nombre maqueta nueva */}
      {showNameModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowNameModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">Guardar maqueta</h3>
            <p className="text-sm text-slate-500 mb-5">Dale un nombre para identificarla</p>
            <input
              autoFocus
              value={pendingNombre}
              onChange={e => setPendingNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmSave(); if (e.key === 'Escape') setShowNameModal(false); }}
              placeholder="Ej: Diseño principal"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                disabled={!pendingNombre.trim() || saving}
                className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
