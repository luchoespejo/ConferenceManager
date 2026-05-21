'use client';

import { useState } from 'react';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Imagen' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Full = ev.target?.result as string;
        const [prefix, base64] = base64Full.split(',');
        const contentType = prefix.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, contentType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Error al subir imagen');
        onChange(data.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative w-24 h-24">
          <img src={value} alt={label} className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >✕</button>
        </div>
      )}
      <label className={`flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {uploading ? 'Subiendo...' : `Subir ${label}`}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      {!value && (
        <input
          type="url"
          placeholder="O pegá una URL..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          onChange={e => onChange(e.target.value || null)}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
