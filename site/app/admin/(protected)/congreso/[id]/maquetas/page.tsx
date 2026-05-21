import { getLayoutTemplates } from './actions';
import MaquetasClient from './MaquetasClient';

export default async function MaquetasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let templates = [];
  try {
    templates = await getLayoutTemplates(id);
  } catch {
    // backend down or no templates yet
  }

  return <MaquetasClient congresoId={id} initial={templates} />;
}
