export function getSlug(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  // Vercel preview URLs (conference-manager-xxx.vercel.app) → default slug
  if (host.endsWith('.vercel.app') || host.endsWith('vercel.app')) {
    return 'reactconf';
  }

  const extracted = host.split('.')[0];

  if (['localhost', 'www', 'tuplataforma'].includes(extracted)) {
    return 'reactconf';
  }

  return extracted || 'reactconf';
}
