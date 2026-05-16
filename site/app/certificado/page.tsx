'use client';

import { useState, FormEvent } from 'react';
import { getSlug } from '@/lib/getSlug';

export default function Certificado() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const slug = getSlug();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const url = `${apiUrl}/api/public/${slug}/certificado?email=${encodeURIComponent(email)}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const html = await res.text();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
        }
      } else if (res.status === 404) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === 'CONFERENCIA_NOT_FOUND'
            ? 'El congreso no fue encontrado.'
            : 'No se encontró un participante con ese email o no está habilitado para generar certificado.'
        );
      } else {
        setError('Ocurrió un error. Intentá de nuevo.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '.5rem' }}>
        Obtener Certificado
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '.95rem', lineHeight: 1.6 }}>
        Ingresá el email con el que te registraste para descargar tu certificado de participación.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '.9rem' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="tucorreo@ejemplo.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '.875rem'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#1a1a2e',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Buscando...' : 'Ver certificado'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '.8rem', color: '#9ca3af', textAlign: 'center' }}>
        El certificado se abrirá en una nueva pestaña. Usá Imprimir para guardarlo como PDF.
      </p>
    </div>
  );
}
