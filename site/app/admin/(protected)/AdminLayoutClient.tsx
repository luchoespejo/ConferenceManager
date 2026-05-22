'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from './_components/AdminSidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMaquetador = pathname.includes('/maquetador');

  useEffect(() => {
    // Force HTML and Body scrollbars to hidden to ensure internal layout scrolls exclusively
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origHtmlHeight = document.documentElement.style.height;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.documentElement.style.height = origHtmlHeight;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.height = origBodyHeight;
    };
  }, []);

  if (isMaquetador) {
    return (
      <div
        style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}
        className="bg-white"
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      style={{ height: '100vh', display: 'flex', overflow: 'hidden' }} 
      className="bg-slate-50"
    >
      <AdminSidebar />
      <main 
        style={{ flex: '1 1 0%', minWidth: 0, overflowY: 'auto' }} 
        className="relative"
      >
        {children}
      </main>
    </div>
  );
}

