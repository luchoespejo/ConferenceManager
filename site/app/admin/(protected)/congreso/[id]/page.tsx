import { redirect } from 'next/navigation';

export default async function CongresoIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/congreso/${id}/maquetador`);
}
