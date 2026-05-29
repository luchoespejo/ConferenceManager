'use client';

import { Render, type Config } from '@puckeditor/core';
import { puckConfig, toRem, toPaddingRem, getFontSizeClass } from '@/lib/puck-config';

// ── Tipos mínimos del conf que PuckRenderer necesita ─────────────────────────

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

export interface ConferenciaPublicData {
  slug: string;
  nombre: string;
  colorPrimario?: string;
  colorSecundario?: string;
  emailContacto?: string;
  instagram?: string;
  formularioInscripcionUrl?: string;
  contactoAdicional?: string;
  tieneSesiones: boolean;
  tieneExpositores: boolean;
  organizadores: Organizador[];
  fechasImportantes: FechaImportante[];
}

type PuckBlock = { type: string; props: Record<string, unknown> };

interface PuckData {
  content: PuckBlock[];
  root: { props: Record<string, unknown> };
  zones?: Record<string, PuckBlock[]>;
}

// ── Inline link → HTML converter ──────────────────────────────────────────────
// We bypass Puck's lazy RichTextRender entirely for Parrafo blocks and render
// our own HTML via dangerouslySetInnerHTML. This avoids dependency on TipTap's
// generateJSON/generateHTML preserving our injected <a> tags.
//
// globals.css: .puck-richtext a { color: inherit; text-decoration: underline; }

// Syntax: [[#url:https://...|Display]]  [[#mail:email@...|Display]]  [[#ig:@user|Display]]
// Value/display may contain inline HTML tags when the user bolded text in the editor.
// stripHtml() removes them before building the href/anchor text.
const IL_RE = /\[\[#(url|mail|ig):([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').trim();

type TipTapMark = { type: string; attrs?: Record<string, unknown> };
type TipTapNode = { type: string; text?: string; marks?: TipTapMark[]; content?: TipTapNode[] };

const htmlEsc = (s: string) =>
  s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function ilHref(tag: string, value: string): string {
  if (tag === 'mail') return `mailto:${value}`;
  if (tag === 'ig')   return `https://instagram.com/${value.replace(/^@/, '')}`;
  return value;
}

/** Convert a text string, replacing inline link tags with <a> HTML. */
function textToHtml(raw: string): string {
  const re = new RegExp(IL_RE.source, 'g');
  const parts: string[] = [];
  let last = 0, found = false, m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    found = true;
    if (m.index > last) parts.push(htmlEsc(raw.slice(last, m.index)));
    const tag = m[1], val = stripHtml(m[2]), disp = m[3] ? stripHtml(m[3]) : val;
    parts.push(`<a href="${htmlEsc(ilHref(tag, val))}" target="_blank" rel="noopener noreferrer">${htmlEsc(disp)}</a>`);
    last = m.index + m[0].length;
  }
  if (!found) return htmlEsc(raw);
  if (last < raw.length) parts.push(htmlEsc(raw.slice(last)));
  return parts.join('');
}

/** Convert a TipTap node tree to HTML, processing inline link tags in text. */
function tipTapToHtml(node: TipTapNode): string {
  if (node.type === 'text') {
    let html = textToHtml(node.text ?? '');
    for (const m of node.marks ?? []) {
      if (m.type === 'bold')           html = `<strong>${html}</strong>`;
      else if (m.type === 'italic')    html = `<em>${html}</em>`;
      else if (m.type === 'underline') html = `<u>${html}</u>`;
      else if (m.type === 'strike')    html = `<s>${html}</s>`;
      else if (m.type === 'link' && m.attrs?.href)
        html = `<a href="${htmlEsc(String(m.attrs.href))}" target="_blank" rel="noopener noreferrer">${html}</a>`;
    }
    return html;
  }
  const inner = (node.content ?? []).map(tipTapToHtml).join('');
  switch (node.type) {
    case 'doc':           return inner;
    case 'paragraph':     return `<p>${inner || '<br>'}</p>`;
    case 'hardBreak':     return '<br>';
    case 'horizontalRule':return '<hr>';
    case 'bulletList':    return `<ul>${inner}</ul>`;
    case 'orderedList':   return `<ol>${inner}</ol>`;
    case 'listItem':      return `<li>${inner}</li>`;
    case 'blockquote':    return `<blockquote>${inner}</blockquote>`;
    default:              return inner;
  }
}

/**
 * Convert any Puck richtext stored value to an HTML string with inline links.
 * Handles: TipTap JSON { type:"doc" }, HTML string, plain text string.
 */
function contenidoToHtml(value: unknown): string {
  if (typeof value === 'object' && value !== null && (value as TipTapNode).type === 'doc') {
    return tipTapToHtml(value as TipTapNode);
  }
  if (typeof value === 'string') {
    // HTML string (from getHTML()) — replace inline tags in-place without re-escaping HTML
    return value.replace(IL_RE, (_, tag, raw, display) => {
      const v = stripHtml(raw), d = htmlEsc(display ? stripHtml(display) : v);
      return `<a href="${htmlEsc(ilHref(tag, v))}" target="_blank" rel="noopener noreferrer">${d}</a>`;
    });
  }
  return '';
}

/** Add _html prop to Parrafo blocks so the render override can use it. */
function preprocessPuckData(data: PuckData): PuckData {
  const processBlock = (block: PuckBlock): PuckBlock => {
    if (block.type !== 'Parrafo') return block;
    const raw = block.props.contenido;
    const html = contenidoToHtml(raw);
    return { ...block, props: { ...block.props, _html: html } };
  };
  const processedZones = data.zones
    ? Object.fromEntries(Object.entries(data.zones).map(([k, v]) => [k, v.map(processBlock)]))
    : undefined;
  return { ...data, content: data.content.map(processBlock), ...(processedZones ? { zones: processedZones } : {}) };
}

interface Props {
  puckData: PuckData;
  conf: ConferenciaPublicData;
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtDateShort(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long',
  });
}

function fmtDateRange(fecha: string, fechaFin?: string) {
  if (!fechaFin) return fmtDate(fecha);
  const d1 = new Date(fecha + 'T12:00:00');
  const d2 = new Date(fechaFin + 'T12:00:00');
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    const mes = d1.toLocaleDateString('es-AR', { month: 'long' });
    return `${d1.getDate()} al ${d2.getDate()} de ${mes} de ${d1.getFullYear()}`;
  }
  return `${fmtDateShort(fecha)} — ${fmtDate(fechaFin)}`;
}

// ── Config pública: reemplaza los bloques dinámicos con datos reales ──────────

function createPublicConfig(conf: ConferenciaPublicData): Config {
  const primary = conf.colorPrimario ?? '#1a1a2e';
  const secondary = conf.colorSecundario ?? '#16213e';

  return {
    ...puckConfig,
    components: {
      ...puckConfig.components,

      // Fechas importantes → lista real
      FechasImportantes: {
        ...(puckConfig.components.FechasImportantes as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ titulo }: any) =>
          conf.fechasImportantes?.length > 0 ? (
            <div style={{ background: secondary, color: '#fff', padding: '3rem 1.5rem' }}>
              {titulo && (
                <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem', margin: '0 0 1.5rem' }}>
                  {titulo}
                </h2>
              )}
              <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {conf.fechasImportantes.map(f => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '.75rem 1rem', background: 'rgba(255,255,255,.08)',
                      borderRadius: '8px', gap: '.5rem', flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{f.descripcion}</span>
                    <span style={{ opacity: .85, fontSize: '.95rem', flexShrink: 0 }}>
                      {fmtDateRange(f.fecha, f.fechaFin ?? undefined)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null,
      } as Config['components'][string],

      // Organizadores → logos reales
      Organizadores: {
        ...(puckConfig.components.Organizadores as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ titulo, columnas }: any) =>
          conf.organizadores?.length > 0 ? (
            <div style={{ background: '#f1f5f9', padding: '2rem 1.5rem', textAlign: 'center' }}>
              {titulo && (
                <p style={{
                  fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.12em', color: '#64748b', margin: '0 0 1rem',
                }}>
                  {titulo}
                </p>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columnas ?? '4'}, 1fr)`,
                gap: '1.5rem', alignItems: 'center', maxWidth: '800px', margin: '0 auto',
              }}>
                {conf.organizadores.map(org => (
                  <div key={org.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px' }}>
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.nombre}
                        style={{ maxHeight: '44px', width: 'auto', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#475569' }}>{org.nombre}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null,
      } as Config['components'][string],

      // Contacto → datos reales del congreso
      Contacto: {
        ...(puckConfig.components.Contacto as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ titulo }: any) =>
          (conf.emailContacto || conf.instagram || conf.formularioInscripcionUrl || conf.contactoAdicional) ? (
            <div style={{ background: primary, color: '#fff', padding: '2rem 1.5rem', textAlign: 'center' }}>
              {titulo && (
                <p style={{
                  fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.12em', opacity: .65, margin: '0 0 1rem',
                }}>
                  {titulo}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.625rem 2rem', justifyContent: 'center', alignItems: 'center' }}>
                {conf.emailContacto && (
                  <a href={`mailto:${conf.emailContacto}`}
                    style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
                    {conf.emailContacto}
                  </a>
                )}
                {conf.instagram && (
                  <a href={`https://instagram.com/${conf.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
                    @{conf.instagram.replace(/^@/, '')}
                  </a>
                )}
                {conf.formularioInscripcionUrl && (
                  <a href={conf.formularioInscripcionUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      color: '#fff', fontWeight: 700, textDecoration: 'none',
                      background: 'rgba(255,255,255,.18)', padding: '6px 18px', borderRadius: '999px',
                    }}>
                    Inscribirse →
                  </a>
                )}
              </div>
              {conf.contactoAdicional && (
                <p style={{ marginTop: '.875rem', fontSize: '.9rem', opacity: .8, whiteSpace: 'pre-line' }}>
                  {conf.contactoAdicional}
                </p>
              )}
            </div>
          ) : null,
      } as Config['components'][string],

      // Inscripciones → link real
      Inscripciones: {
        ...(puckConfig.components.Inscripciones as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ titulo }: any) =>
          conf.formularioInscripcionUrl ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: '#f8fafc' }}>
              {titulo && (
                <h2 style={{ fontWeight: 700, fontSize: '1.5rem', margin: '0 0 1rem' }}>{titulo}</h2>
              )}
              <a
                href={conf.formularioInscripcionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', padding: '.875rem 2.5rem', background: primary,
                  color: '#fff', borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
                }}
              >
                Inscribirse →
              </a>
            </div>
          ) : null,
      } as Config['components'][string],

      // Agenda → link a /programa
      Agenda: {
        ...(puckConfig.components.Agenda as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ titulo }: any) =>
          conf.tieneSesiones ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              {titulo && (
                <h2 style={{ fontWeight: 700, fontSize: '1.5rem', margin: '0 0 1rem' }}>{titulo}</h2>
              )}
              <a
                href={`/${conf.slug}/programa`}
                style={{
                  display: 'inline-block', padding: '.75rem 2rem',
                  border: `2px solid ${primary}`, color: primary,
                  borderRadius: '8px', fontWeight: 700, textDecoration: 'none',
                }}
              >
                Ver programa completo →
              </a>
            </div>
          ) : null,
      } as Config['components'][string],

      // Expositores → link a /expositores
      Expositores: {
        ...(puckConfig.components.Expositores as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ titulo }: any) =>
          conf.tieneExpositores ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              {titulo && (
                <h2 style={{ fontWeight: 700, fontSize: '1.5rem', margin: '0 0 1rem' }}>{titulo}</h2>
              )}
              <a
                href={`/${conf.slug}/expositores`}
                style={{
                  display: 'inline-block', padding: '.75rem 2rem',
                  border: `2px solid ${primary}`, color: primary,
                  borderRadius: '8px', fontWeight: 700, textDecoration: 'none',
                }}
              >
                Ver expositores →
              </a>
            </div>
          ) : null,
      } as Config['components'][string],

      // Parrafo → bypass Puck's RichTextRender, use our own HTML with inline links
      Parrafo: {
        ...(puckConfig.components.Parrafo as object),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ({ _html, contenido, color, bgColor, fontSize, maxWidth, paddingV, paddingH }: any) => (
          <div style={{ background: bgColor, padding: toPaddingRem(paddingV, paddingH) }}>
            {_html ? (
              <div
                style={{ color, lineHeight: 1.7, maxWidth: maxWidth || 'none' }}
                className={`puck-richtext ${getFontSizeClass(fontSize, 'fs-base')}`}
                dangerouslySetInnerHTML={{ __html: _html }}
              />
            ) : (
              <div
                style={{ color, lineHeight: 1.7, maxWidth: maxWidth || 'none' }}
                className={`puck-richtext ${getFontSizeClass(fontSize, 'fs-base')}`}
              >
                {contenido}
              </div>
            )}
          </div>
        ),
      } as Config['components'][string],
    },
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PuckRenderer({ puckData, conf }: Props) {
  const publicConfig = createPublicConfig(conf);
  const processedData = preprocessPuckData(puckData);
  return <Render config={publicConfig} data={processedData} />;
}
