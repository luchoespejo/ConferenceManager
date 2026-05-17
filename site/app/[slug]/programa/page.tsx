import ProgramaFilters from './ProgramaFilters';

export const revalidate = 300;

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

async function fetchSesiones(slug: string): Promise<Sesion[]> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}/programa`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Programa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sesiones = await fetchSesiones(slug);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Programa</h1>
        <ProgramaFilters sesiones={sesiones} slug={slug} />
      </div>
    </div>
  );
}
