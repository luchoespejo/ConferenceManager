'use client';

import { usePathname } from 'next/navigation';
import CongresoNav from './_components/CongresoNav';

interface Props {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  children: React.ReactNode;
}

export default function CongresoLayoutClient({ id, nombre, slug, estado, children }: Props) {
  const pathname = usePathname();
  const isMaquetador = pathname.includes('/maquetador');

  if (isMaquetador) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <CongresoNav id={id} nombre={nombre} slug={slug} estado={estado} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
