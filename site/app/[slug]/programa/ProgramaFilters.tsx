'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Sesion {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  track?: string;
  salaNombre: string;
  expositorNombre: string;
}

export default function ProgramaFilters({ sesiones, slug }: { sesiones: Sesion[]; slug: string }) {
  const [filterTrack, setFilterTrack] = useState('');
  const [filterExpositor, setFilterExpositor] = useState('');

  const tracks = Array.from(new Set(sesiones.map(s => s.track).filter(Boolean))) as string[];
  const expositores = Array.from(new Set(sesiones.map(s => s.expositorNombre)));

  const filtered = sesiones.filter(s => {
    if (filterTrack && s.track !== filterTrack) return false;
    if (filterExpositor && s.expositorNombre !== filterExpositor) return false;
    return true;
  });

  const byDate = filtered.reduce<Record<string, Sesion[]>>((acc, s) => {
    const key = s.fecha.slice(0, 10);
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort();

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      {(tracks.length > 0 || expositores.length > 1) && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
          {tracks.length > 0 && (
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>TRACK</label>
              <select
                value={filterTrack}
                onChange={e => setFilterTrack(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '.9rem' }}
              >
                <option value="">Todos</option>
                {tracks.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {expositores.length > 1 && (
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>EXPOSITOR</label>
              <select
                value={filterExpositor}
                onChange={e => setFilterExpositor(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '.9rem' }}
              >
                <option value="">Todos</option>
                {expositores.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {sortedDates.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>No hay sesiones con los filtros seleccionados.</p>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize', color: '#64748b', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '.5rem' }}>
              {fmtDate(date)}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {byDate[date].map(s => (
                <Link key={s.id} href={`/${slug}/s/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: '#fff', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)', transition: 'box-shadow .15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{s.titulo}</h3>
                      {s.track && (
                        <span style={{ background: '#f1f5f9', borderRadius: '20px', padding: '2px 12px', fontSize: '.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {s.track}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '.4rem 0 0', color: '#64748b', fontSize: '.875rem' }}>
                      ⏰ {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)} · 📍 {s.salaNombre} · 👤 {s.expositorNombre}
                    </p>
                    {s.descripcion && (
                      <p style={{ margin: '.5rem 0 0', color: '#555', fontSize: '.85rem', lineHeight: 1.5 }}>{s.descripcion}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
