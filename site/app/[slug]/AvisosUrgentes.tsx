'use client';

import { useEffect, useState } from 'react';

interface Aviso {
  id: string;
  mensaje: string;
}

export default function AvisosUrgentes({ slug }: { slug: string }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

    const load = () => {
      fetch(`${apiUrl}/api/public/${slug}/avisos`)
        .then(r => r.ok ? r.json() : [])
        .then(setAvisos)
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [slug]);

  if (avisos.length === 0) return null;

  return (
    <div style={{ background: '#fef3c7', borderBottom: '1px solid #f59e0b' }}>
      {avisos.map(a => (
        <div key={a.id} style={{ padding: '10px 1.5rem', fontSize: '.9rem', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>⚠️</span>
          <span>{a.mensaje}</span>
        </div>
      ))}
    </div>
  );
}
