'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExpositorSetPassword({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/public/${slug}/expositor/set-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Error al establecer contraseña');
      }

      setSuccess(true);
      setTimeout(() => router.push(`/${slug}/expositor/login`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>Crear contraseña</h1>

        {success ? (
          <div style={{ padding: '.875rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534' }}>
            ✓ Contraseña establecida. Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '.875rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '.875rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '.9rem' }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={loading} required
                style={{ width: '100%', padding: '.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '.9rem' }}>Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite tu contraseña" disabled={loading} required
                style={{ width: '100%', padding: '.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={loading}
              style={{ padding: '.75rem', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Estableciendo...' : 'Establecer contraseña'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.875rem' }}>
          ¿Ya tenés contraseña?{' '}
          <Link href={`/${slug}/expositor/login`} style={{ color: '#3b82f6', textDecoration: 'none' }}>Iniciá sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}
