export function getSlug(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const extracted = host.split('.')[0];

  if (['localhost', 'www', 'tuplataforma'].includes(extracted)) {
    return 'reactconf';
  }

  return extracted || 'reactconf';
}
