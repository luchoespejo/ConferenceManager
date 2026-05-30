import { notFound } from 'next/navigation';
import Link from 'next/link';
import PuckRenderer from './PuckRenderer';

export const dynamic = 'force-dynamic';

interface SeccionConfig {
  seccionKey: string;
  bgColor?: string | null;
  textoColor?: string | null;
  fontSize?: string | null;
  logoAltura?: number | null;
  logoColumnas?: number | null;
  paddingV?: number | null;
}

interface Organizador {
  id: string;
  nombre: string;
  logoUrl?: string;
  orden: number;
}

interface FechaImportante {
  id: string;
  descripcion: string;
  fecha: string;
  fechaFin?: string;
}

interface EjeTematico {
  id: string;
  nombre: string;
}

interface Conferencia {
  nombre: string;
  slug: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  logoUrl?: string;
  bannerUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  venueNombre?: string;
  venueDireccion?: string;
  venueLinkMaps?: string;
  subtitulo?: string;
  lema?: string;
  emailContacto?: string;
  instagram?: string;
  formularioInscripcionUrl?: string;
  contactoAdicional?: string;
  bannerModo: string;
  seccionConfigs: SeccionConfig[];
  mostrarFechas: boolean;
  mostrarDescripcion: boolean;
  mostrarOrganizadores: boolean;
  mostrarContacto: boolean;
  mostrarInscripciones: boolean;
  mostrarPrograma: boolean;
  tieneExpositores: boolean;
  layoutJson?: string | null;
  organizadores: Organizador[];
  fechasImportantes: FechaImportante[];
  ejesTematicos: EjeTematico[];
}

function parsePuckData(layoutJson?: string | null) {
  if (!layoutJson) return null;
  try {
    const parsed = JSON.parse(layoutJson);
    if (parsed.puckData?.content) return parsed.puckData;
    if (parsed.content) return parsed;
    return null;
  } catch { return null; }
}

async function fetchConferencia(slug: string): Promise<Conferencia | null> {
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  try {
    const res = await fetch(`${backend}/api/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ConferenciaHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const conf = await fetchConferencia(slug);

  if (!conf) notFound();

  // Layout-driven rendering: si hay un layoutJson guardado en el maquetador, usarlo
  const puckData = parsePuckData(conf.layoutJson);
  if (puckData) {
    return (
      <PuckRenderer
        puckData={puckData}
        conf={{
          slug: conf.slug,
          nombre: conf.nombre,
          colorPrimario: conf.colorPrimario,
          colorSecundario: conf.colorSecundario,
          emailContacto: conf.emailContacto,
          instagram: conf.instagram,
          formularioInscripcionUrl: conf.formularioInscripcionUrl,
          contactoAdicional: conf.contactoAdicional,
          mostrarPrograma: conf.mostrarPrograma,
          tieneExpositores: conf.tieneExpositores,
          organizadores: conf.organizadores,
          fechasImportantes: conf.fechasImportantes.map(f => ({
            id: f.id,
            descripcion: f.descripcion,
            fecha: String(f.fecha),
            fechaFin: f.fechaFin ? String(f.fechaFin) : undefined,
          })),
        }}
      />
    );
  }

  const primary = conf.colorPrimario ?? '#1a1a2e';
  const secondary = conf.colorSecundario ?? '#16213e';
  const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';
  const esDecorativo = conf.bannerModo === 'decorativo';

  const secciones = Object.fromEntries((conf.seccionConfigs ?? []).map(s => [s.seccionKey, s]));
  const sc = (key: string) => secciones[key] ?? {};

  const resolveSrc = (url?: string) =>
    url ? (url.startsWith('http') ? url : `${backend}${url}`) : null;

  const logoSrc = resolveSrc(conf.logoUrl);
  const bannerSrc = resolveSrc(conf.bannerUrl);

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  const fmtDateShort = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

  const fmtDateRange = (fecha: string, fechaFin?: string) => {
    if (!fechaFin) return fmtDate(fecha);
    const d1 = new Date(fecha + 'T12:00:00');
    const d2 = new Date(fechaFin + 'T12:00:00');
    if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
      const mes = d1.toLocaleDateString('es-AR', { month: 'long' });
      return `${d1.getDate()} al ${d2.getDate()} de ${mes} de ${d1.getFullYear()}`;
    }
    return `${fmtDateShort(fecha)} — ${fmtDate(fechaFin)}`;
  };

  const btnBase = {
    display: 'inline-block' as const, fontWeight: 700, padding: '11px 28px',
    borderRadius: '8px', textDecoration: 'none', fontSize: '.95rem',
    boxSizing: 'border-box' as const,
  };
  const btnSolid = { ...btnBase, background: esDecorativo ? primary : '#fff', color: esDecorativo ? '#fff' : primary, border: '2px solid transparent' };
  const btnOutline = { ...btnBase, background: 'transparent', border: `2px solid ${esDecorativo ? primary : 'rgba(255,255,255,.85)'}`, color: esDecorativo ? primary : '#fff' };

  const heroBtns = conf.mostrarPrograma ? (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
      <Link href={`/${slug}/programa`} style={btnSolid}>Ver Programa</Link>
    </div>
  ) : null;

  return (
    <div>
      {esDecorativo ? (
        /* Hero claro: fondo blanco, texto oscuro, banner como imagen decorativa */
        <div style={{ background: sc('hero').bgColor ?? '#fff', padding: sc('hero').paddingV != null ? `${sc('hero').paddingV}px 1.5rem 0` : '3.5rem 1.5rem 0', textAlign: 'center', fontSize: sc('hero').fontSize ?? undefined }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {logoSrc && (
              <img src={logoSrc} alt={conf.nombre} style={{ height: '80px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', objectFit: 'contain' }} />
            )}
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, margin: '0 0 .4rem', lineHeight: 1.25, color: sc('hero').textoColor ?? '#0f172a' }}>
              {conf.nombre}
            </h1>
            {conf.subtitulo && (
              <p style={{ fontSize: 'clamp(.9rem, 2vw, 1.1rem)', fontWeight: 600, maxWidth: '700px', margin: '0 auto .6rem', color: sc('hero').textoColor ?? '#334155', lineHeight: 1.4 }}>
                {conf.subtitulo}
              </p>
            )}
            {conf.lema && (
              <p style={{ fontSize: 'clamp(.95rem, 2vw, 1.15rem)', fontStyle: 'italic', maxWidth: '700px', margin: '0 auto .75rem', color: '#475569', lineHeight: 1.5 }}>
                &ldquo;{conf.lema}&rdquo;
              </p>
            )}
            {bannerSrc && (
              <div style={{ borderRadius: '10px', overflow: 'hidden', margin: '1.5rem 0', lineHeight: 0, background: sc('hero').bgColor ?? '#fff' }}>
                <img src={bannerSrc} alt="" aria-hidden="true"
                  style={{ width: '100%', height: 'auto', display: 'block', clipPath: 'inset(1% 1% 1% 1%)' }} />
              </div>
            )}
            <div style={{ background: primary, color: '#fff', borderRadius: '8px', padding: '1.25rem 2rem', margin: '0 auto 1.5rem', display: 'inline-block', minWidth: '280px' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>
                {fmtDateRange(conf.fechaInicio, conf.fechaInicio !== conf.fechaFin ? conf.fechaFin : undefined)}
              </p>
              {conf.venueNombre && (
                <p style={{ margin: '.25rem 0 0', fontSize: '.95rem', opacity: .85 }}>
                  {conf.venueNombre}{conf.venueDireccion ? ` · ${conf.venueDireccion}` : ''}
                </p>
              )}
            </div>
            {heroBtns}
            <div style={{ height: '2.5rem' }} />
          </div>
        </div>
      ) : (
        /* Hero oscuro: banner como fondo con overlay, texto blanco */
        <div style={{
          background: bannerSrc
            ? `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url('${bannerSrc}') center/cover`
            : sc('hero').bgColor ?? primary,
          color: sc('hero').textoColor ?? '#fff',
          padding: sc('hero').paddingV != null ? `${sc('hero').paddingV}px 1.5rem` : '5rem 1.5rem',
          textAlign: 'center',
          fontSize: sc('hero').fontSize ?? undefined,
        }}>
          {logoSrc && (
            <img src={logoSrc} alt={conf.nombre} style={{ height: '72px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', objectFit: 'contain' }} />
          )}
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 700, margin: '0 0 .4rem', lineHeight: 1.2 }}>
            {conf.nombre}
          </h1>
          {conf.subtitulo && (
            <p style={{ fontSize: 'clamp(.9rem, 2vw, 1.1rem)', fontWeight: 600, maxWidth: '700px', margin: '0 auto .5rem', opacity: .9, lineHeight: 1.4 }}>
              {conf.subtitulo}
            </p>
          )}
          {conf.lema && (
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontStyle: 'italic', maxWidth: '700px', margin: '0 auto 1.5rem', opacity: .9, lineHeight: 1.5 }}>
              &ldquo;{conf.lema}&rdquo;
            </p>
          )}
          <p style={{ fontSize: '1rem', opacity: .85, margin: '0 0 .5rem' }}>
            {fmtDateRange(conf.fechaInicio, conf.fechaInicio !== conf.fechaFin ? conf.fechaFin : undefined)}
          </p>
          {conf.venueNombre && (
            <p style={{ fontSize: '.95rem', opacity: .75, margin: '0 0 2rem' }}>
              {conf.venueNombre}{conf.venueDireccion ? ` · ${conf.venueDireccion}` : ''}
            </p>
          )}
          {heroBtns}
        </div>
      )}

      {/* Fechas importantes */}
      {conf.mostrarFechas && conf.fechasImportantes?.length > 0 && (
        <div style={{ background: sc('fechas').bgColor ?? secondary, color: sc('fechas').textoColor ?? '#fff', padding: sc('fechas').paddingV != null ? `${sc('fechas').paddingV}px 1.5rem` : '3rem 1.5rem', fontSize: sc('fechas').fontSize ?? undefined }}>
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {conf.fechasImportantes.map(f => (
              <div key={f.id} style={{
                display: 'flex',
                flexDirection: f.descripcion ? 'row' : 'column',
                justifyContent: f.descripcion ? 'space-between' : 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '.75rem 1rem',
                background: 'rgba(255,255,255,.08)',
                borderRadius: '8px',
                gap: '.5rem'
              }}>
                {f.descripcion && <span style={{ fontWeight: 600 }}>{f.descripcion}</span>}
                <span style={{ opacity: .85, fontSize: '.95rem' }}>
                  {fmtDateRange(f.fecha, f.fechaFin ?? undefined)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descripción + Ejes temáticos */}
      {conf.mostrarDescripcion && (conf.descripcion || conf.ejesTematicos?.length > 0) && (
        <div style={{ padding: sc('descripcion').paddingV != null ? `${sc('descripcion').paddingV}px 1.5rem` : '2.25rem 1.5rem', background: sc('descripcion').bgColor ?? '#f8fafc', fontSize: sc('descripcion').fontSize ?? undefined }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {conf.descripcion && (
              <p style={{ fontSize: sc('descripcion').fontSize ?? '1.05rem', lineHeight: 1.7, color: sc('descripcion').textoColor ?? '#334155', marginBottom: conf.ejesTematicos?.length > 0 ? '1.5rem' : 0, textAlign: 'justify' }}>
                {conf.descripcion}
              </p>
            )}
            {conf.ejesTematicos?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1rem' }}>
                  Ejes temáticos
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  {conf.ejesTematicos.map(e => (
                    <span key={e.id} style={{
                      background: primary,
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '.875rem',
                      fontWeight: 500
                    }}>
                      {e.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organizado por — strip centrado */}
      {conf.mostrarOrganizadores && conf.organizadores?.length > 0 && (
        <div style={{ background: sc('organizadores').bgColor ?? '#f1f5f9', borderTop: '1px solid rgba(0,0,0,.08)', borderBottom: '1px solid rgba(0,0,0,.08)', padding: sc('organizadores').paddingV != null ? `${sc('organizadores').paddingV}px 2rem` : '1.25rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: sc('organizadores').textoColor ?? '#64748b', margin: '0 0 .75rem' }}>
            Organizado por
          </p>
          {sc('organizadores').logoColumnas ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sc('organizadores').logoColumnas}, 1fr)`, gap: '1.5rem', alignItems: 'center', maxWidth: '700px', margin: '0 auto' }}>
              {conf.organizadores.map(org => {
                const logoH = sc('organizadores').logoAltura ?? 44;
                return (
                  <div key={org.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${logoH}px` }}>
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl.startsWith('http') ? org.logoUrl : `${backend}${org.logoUrl}`}
                        alt={org.nombre}
                        style={{ maxHeight: `${logoH}px`, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <span style={{ fontSize: sc('organizadores').fontSize ?? '.8rem', fontWeight: 600, color: sc('organizadores').textoColor ?? '#475569' }}>
                        {org.nombre}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
            {conf.organizadores.map(org => {
              const logoH = sc('organizadores').logoAltura ?? 44;
              return (
                <div key={org.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${logoH}px` }}>
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl.startsWith('http') ? org.logoUrl : `${backend}${org.logoUrl}`}
                      alt={org.nombre}
                      style={{ maxHeight: `${logoH}px`, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: sc('organizadores').fontSize ?? '.8rem', fontWeight: 600, color: sc('organizadores').textoColor ?? '#475569' }}>
                      {org.nombre}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Informes / Contacto */}
      {conf.mostrarContacto && (conf.emailContacto || conf.instagram || conf.contactoAdicional || conf.formularioInscripcionUrl) && (
        <div style={{ background: sc('contacto').bgColor ?? primary, color: sc('contacto').textoColor ?? '#fff', padding: sc('contacto').paddingV != null ? `${sc('contacto').paddingV}px 1.5rem` : '1.75rem 1.5rem', fontSize: sc('contacto').fontSize ?? undefined }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', opacity: .65, margin: '0 0 .875rem', textAlign: 'center' }}>
              Informes y contacto
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.625rem 2rem', justifyContent: 'center', alignItems: 'center' }}>
              {conf.emailContacto && (
                <a href={`mailto:${conf.emailContacto}`}
                  style={{ color: sc('contacto').textoColor ?? '#fff', fontWeight: 700, fontSize: sc('contacto').fontSize ?? '1rem', textDecoration: 'none' }}>
                  {conf.emailContacto}
                </a>
              )}
              {conf.instagram && (
                <a
                  href={`https://instagram.com/${conf.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: sc('contacto').textoColor ?? '#fff', fontWeight: 700, fontSize: sc('contacto').fontSize ?? '1rem', textDecoration: 'none' }}
                >
                  @{conf.instagram}
                </a>
              )}
              {conf.formularioInscripcionUrl && (
                <a
                  href={conf.formularioInscripcionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: sc('contacto').textoColor ?? '#fff', fontWeight: 700, fontSize: sc('contacto').fontSize ?? '1rem', textDecoration: 'none',
                    background: 'rgba(255,255,255,.18)', padding: '6px 18px', borderRadius: '999px' }}
                >
                  Inscribirse →
                </a>
              )}
            </div>
            {conf.contactoAdicional && (
              <p style={{ marginTop: '.875rem', fontSize: sc('contacto').fontSize ?? '.9rem', opacity: .8, whiteSpace: 'pre-line', textAlign: 'center' }}>
                {conf.contactoAdicional}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
