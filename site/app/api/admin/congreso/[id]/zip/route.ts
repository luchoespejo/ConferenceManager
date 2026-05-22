import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:5000';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const res = await fetch(
    `${BACKEND}/api/dashboard/conferencias/${id}/layouts/descargar-zip`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Error generando ZIP' }, { status: res.status });
  }

  const bytes = await res.arrayBuffer();
  const disposition = res.headers.get('Content-Disposition') ?? 'attachment; filename="sitio.zip"';

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': disposition,
    },
  });
}
