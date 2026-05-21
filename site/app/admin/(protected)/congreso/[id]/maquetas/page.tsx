import { apiFetch } from '@/lib/api';
import { getLayoutTemplates, type LayoutTemplateDto } from './actions';
import MaquetasClient from './MaquetasClient';

export default async function MaquetasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let templates: LayoutTemplateDto[] = [];
  let slug = '';
  try {
    [templates] = await Promise.all([
      getLayoutTemplates(id),
    ]);
    const conf = await apiFetch<{ slug: string }>(`/api/dashboard/conferencias/${id}`);
    slug = conf.slug;
  } catch {
    // backend down or no templates yet
  }

  return <MaquetasClient congresoId={id} initial={templates} slug={slug} />;
}
