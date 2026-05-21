import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:5000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servidor' }, { status: 503 });
  }

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const { accessToken, expiresIn, usuario } = data as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    usuario: { id: string; email: string; nombre: string; organizacion: string };
  };

  const response = NextResponse.json({ usuario });

  response.cookies.set('admin_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn,
    path: '/',
  });

  return response;
}
