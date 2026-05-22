'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
  {
    href: '/admin', label: 'Mis congresos', exact: true,
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

const CONGRESO_TABS = [
  { key: 'maquetas',      label: 'Maquetas',      emoji: '🧱' },
  { key: 'configuracion', label: 'Configuración',  emoji: '⚙️' },
  { key: 'salas',         label: 'Salas',          emoji: '🚪' },
  { key: 'expositores',   label: 'Expositores',    emoji: '🎤' },
  { key: 'sesiones',      label: 'Sesiones',       emoji: '📅' },
  { key: 'participantes', label: 'Participantes',  emoji: '👥' },
  { key: 'avisos',        label: 'Avisos',         emoji: '🔔' },
];

const LS_KEY = 'admin-sidebar-collapsed';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect if we're inside a congreso
  const congresoMatch = pathname.match(/^\/admin\/congreso\/([^/]+)/);
  const congresoId = congresoMatch?.[1] ?? null;

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === '1') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem(LS_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Avoid layout shift on SSR — render expanded until mounted
  const isCollapsed = mounted && collapsed;

  return (
    <aside
      style={{ width: isCollapsed ? 60 : 224 }}
      className="min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width] duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className={`flex items-center border-b border-slate-100 h-14 px-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-slate-900 text-sm whitespace-nowrap overflow-hidden">CongressMgr</span>
          )}
        </div>
        <button
          onClick={toggle}
          className={`p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0 ${isCollapsed ? 'ml-0' : 'ml-1'}`}
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(({ href, label, icon, exact }) => {
          const active = exact ? pathname === href : (pathname.startsWith(href) && !congresoId);
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={`flex items-center rounded-lg transition-colors ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'} ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {icon}
              {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}

        {/* Congreso sub-section — visible when inside /admin/congreso/[id] */}
        {congresoId && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pb-1 pt-0.5">
                Congreso
              </p>
            )}
            {CONGRESO_TABS.map(({ key, label, emoji }) => {
              const href = `/admin/congreso/${congresoId}/${key}`;
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={key}
                  href={href}
                  title={isCollapsed ? label : undefined}
                  className={`flex items-center rounded-lg transition-colors ${
                    isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
                  } ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="text-base leading-none shrink-0">{emoji}</span>
                  {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
          className={`flex items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full transition-colors disabled:opacity-60 ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && (
            <span className="text-sm font-medium whitespace-nowrap">{loggingOut ? 'Saliendo...' : 'Cerrar sesión'}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
