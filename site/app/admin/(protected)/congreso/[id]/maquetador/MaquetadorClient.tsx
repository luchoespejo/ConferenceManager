'use client';

import { useState } from 'react';
import { Puck, usePuck } from '@puckeditor/core';
import '@puckeditor/core/dist/index.css';
import { puckConfig, DEFAULT_PUCK_DATA } from '@/lib/puck-config';
import { saveLayoutAction } from './actions';

interface Props {
  congresoId: string;
  initialLayoutJson: string | null;
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

export default function MaquetadorClient({ congresoId, initialLayoutJson }: Props) {
  const existingData = parsePuckData(initialLayoutJson);
  const [started, setStarted] = useState(existingData !== null);
  const [startEmpty, setStartEmpty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async (data: unknown) => {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      await saveLayoutAction(congresoId, data);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Definido dentro del componente para cerrar sobre saving/savedOk/handlePublish
  // usePuck() funciona porque este componente se renderiza dentro del árbol de <Puck>
  function SaveBtn() {
    const { appState } = usePuck();
    return (
      <button
        onClick={() => handlePublish(appState.data)}
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
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'background 0.2s',
        }}
      >
        {saving ? '⏳ Guardando...' : savedOk ? '✓ Guardado' : '💾 Guardar'}
      </button>
    );
  }

  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🧱</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Maquetador de página</h2>
          <p className="text-sm text-slate-500 mb-6">
            Todavía no configuraste el layout. Empezá con la plantilla por defecto o desde cero.
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

      <div style={{ height: 'calc(100vh - 120px)' }}>
        <Puck
          config={puckConfig}
          data={puckData}
          onPublish={handlePublish}
          overrides={{
            headerActions: () => <SaveBtn />,
          }}
        />
      </div>
    </div>
  );
}
