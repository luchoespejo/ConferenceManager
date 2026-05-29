'use client';

import Link from 'next/link';
import { useState } from 'react';

interface SlugNavProps {
  slug: string;
  primary: string;
  logoSrc: string | null;
  nombre: string;
  tieneSesiones?: boolean;
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
  tieneSesiones,
  tieneExpositores,
  mostrarInscripciones,
  mostrarContacto,
  mostrarInformacion,
}: SlugNavProps) {
  const [open, setOpen] = useState(false);

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

      <div className="site-nav-spacer" />

      {/* Hamburger button — visible only on mobile via CSS */}
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

      {/* Links — always visible on desktop, toggled on mobile */}
      <div className={`site-nav-links${open ? ' site-nav-links--open' : ''}`}>
        {tieneSesiones && (
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
    </nav>
  );
}
