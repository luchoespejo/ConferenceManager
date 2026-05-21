import { apiFetch } from '@/lib/api';
import MaquetadorClient from './MaquetadorClient';

interface LayoutTemplateDto {
  id: string;
  nombre: string;
  layoutJson: string;
}

interface ConferenciaBasicDto {
  slug: string;
}

export default async function MaquetadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ layoutId?: string }>;
}) {
  const { id } = await params;
  const { layoutId } = await searchParams;

  let initialLayoutJson: string | null = null;
  let templateNombre: string | null = null;
  let slug: string | null = null;

  // Fetch slug
  try {
    const conf = await apiFetch<ConferenciaBasicDto>(`/api/dashboard/conferencias/${id}`);
    slug = conf.slug;
  } catch {
    // slug not critical — preview button just won't open
  }

  if (layoutId) {
    // Cargar template específico
    try {
      const tpl = await apiFetch<LayoutTemplateDto>(
        `/api/dashboard/conferencias/${id}/layouts/${layoutId}`
      );
      initialLayoutJson = tpl.layoutJson;
      templateNombre = tpl.nombre;
    } catch {
      // template not found — start fresh
    }
  }

  return (
    <MaquetadorClient
      congresoId={id}
      layoutId={layoutId ?? null}
      templateNombre={templateNombre}
      initialLayoutJson={initialLayoutJson}
      slug={slug}
    />
  );
}
