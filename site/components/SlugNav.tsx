'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface SlugNavProps {
  slug: string;
  primary: string;
  logoSrc: string | null;
  nombre: string;
  mostrarPrograma?: boolean;
  tieneExpositores?: boolean;
  mostrarInscripciones?: boolean;
  mostrarContacto?: boolean;
  mostrarInformacion?: boolean;
}

export default function SlugNav({
  slug,
  primary,
  logoSrc,
  nombre,
  mostrarPrograma,
  tieneExpositores,
  mostrarInscripciones,
  mostrarContacto,
  mostrarInformacion,
}: SlugNavProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <nav className="site-nav" style={{ background: primary }}>
      {/* Brand */}
      <Link href={`/${slug}`} className="site-nav-brand" onClick={() => setOpen(false)}>
        {logoSrc ? (
          <img src={logoSrc} alt={nombre} style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
        ) : (
          <span>Inicio</span>
        )}
      </Link>

      {/* Burger + dropdown — wrapper handles relative positioning */}
      <div ref={wrapperRef} style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
        <button
          className="site-nav-burger"
          aria-label="Menú"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* Dropdown — absolute, aligned to right of burger */}
        {open && (
          <div
            className="site-nav-links site-nav-links--open"
            style={{ background: primary }}
          >
            {mostrarPrograma && (
              <Link href={`/${slug}/programa`} className="site-nav-link" onClick={() => setOpen(false)}>Programa</Link>
            )}
            {tieneExpositores && (
              <Link href={`/${slug}/expositores`} className="site-nav-link" onClick={() => setOpen(false)}>Expositores</Link>
            )}
            {mostrarInscripciones && (
              <Link href={`/${slug}/inscripciones`} className="site-nav-link" onClick={() => setOpen(false)}>Inscripciones</Link>
            )}
            {mostrarInformacion && (
              <Link href={`/${slug}/informacion`} className="site-nav-link" onClick={() => setOpen(false)}>Información</Link>
            )}
            {mostrarContacto && (
              <Link href={`/${slug}/contacto`} className="site-nav-link" onClick={() => setOpen(false)}>Contacto</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
