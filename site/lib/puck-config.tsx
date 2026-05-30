import { DropZone, type Config, type CustomField } from '@puckeditor/core';
import dynamic from 'next/dynamic';
import CountdownDisplay from './puck-components/CountdownDisplay';

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false });

// ── TipTap JSON → HTML (handles legacy data stored by Puck native richtext) ──
// Mirrors TipTapHtmlConverter.cs so old content stays visible in the canvas.
function tiptapToHtml(node: unknown): string {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;
  const type = n.type as string | undefined;
  const children = Array.isArray(n.content) ? (n.content as unknown[]).map(tiptapToHtml).join('') : '';

  if (type === 'text') {
    const raw = typeof n.text === 'string' ? n.text : '';
    let t = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const marks = Array.isArray(n.marks) ? n.marks as Array<{ type: string; attrs?: Record<string, string> }> : [];
    for (const m of marks) {
      switch (m.type) {
        case 'bold':      t = `<strong>${t}</strong>`; break;
        case 'italic':    t = `<em>${t}</em>`; break;
        case 'underline': t = `<u>${t}</u>`; break;
        case 'strike':    t = `<s>${t}</s>`; break;
        case 'link':      t = `<a href="${m.attrs?.href ?? '#'}" target="_blank" rel="noopener">${t}</a>`; break;
      }
    }
    return t;
  }

  switch (type) {
    case 'doc':         return children;
    case 'paragraph':   return `<p>${children}</p>`;
    case 'hardBreak':   return '<br>';
    case 'bulletList':  return `<ul>${children}</ul>`;
    case 'orderedList': return `<ol>${children}</ol>`;
    case 'listItem':    return `<li>${children}</li>`;
    case 'blockquote':  return `<blockquote>${children}</blockquote>`;
    case 'heading': {
      const level = (n.attrs as Record<string, number>)?.level ?? 2;
      return `<h${level}>${children}</h${level}>`;
    }
    default: return children;
  }
}

// Acepta tanto HTML string (Quill) como TipTap JSON object (legado Puck nativo)
function resolveRichText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return tiptapToHtml(value);
  return '';
}

// ── Campo color: swatch + hex input ─────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safe = value || '#4f46e5';
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 28, borderRadius: 6, border: '1px solid #d1d5db',
          background: safe, cursor: 'pointer',
        }} />
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#4f46e5"
        style={{
          flex: 1, padding: '4px 8px', border: '1px solid #e5e7eb',
          borderRadius: 6, fontFamily: 'monospace', fontSize: 13,
          background: '#fff', color: '#111',
        }}
      />
    </div>
  );
}

const colorField = (label: string): CustomField<string> => ({
  type: 'custom',
  label,
  render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => <ColorPicker value={value} onChange={onChange} />,
});

// ── Campo imagen: upload base64 + URL manual + preview ───────────────────────
function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
        border: '1px dashed #9ca3af', borderRadius: 6, cursor: 'pointer',
        background: '#f9fafb', fontSize: 12, color: '#6b7280',
      }}>
        <span>📁</span>
        <span>Subir imagen</span>
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      <input
        type="text"
        value={value?.startsWith('data:') ? '' : (value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder="O pegá una URL..."
        style={{
          padding: '4px 8px', border: '1px solid #e5e7eb',
          borderRadius: 6, fontSize: 13, background: '#fff', color: '#111',
        }}
      />
      {value && (
        <div style={{ position: 'relative' }}>
          <img src={value} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6 }} />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)',
              color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
              padding: '2px 6px', fontSize: 11,
            }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

const imageField = (label: string): CustomField<string> => ({
  type: 'custom',
  label,
  render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => <ImageField value={value} onChange={onChange} />,
});

// ── Campo richtext: Quill editor ─────────────────────────────────────────────
const richtextField = (label: string): CustomField<string> => ({
  type: 'custom',
  label,
  render: ({ value, onChange }: { value: unknown; onChange: (v: string) => void }) => (
    <RichTextEditor value={resolveRichText(value)} onChange={onChange} />
  ),
});


// ── Google Fonts ─────────────────────────────────────────────────────────────
const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Raleway', 'Poppins', 'Merriweather', 'Playfair Display', 'Source Sans 3',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
// Converts a stored value to rem. Values >4 are legacy px (divide by 16).
// Values ≤4 are already in rem (use directly). Zero means "auto".
export function toRem(v: number, fallback = '1rem'): string {
  if (!v) return fallback;
  return v > 4 ? `${v / 16}rem` : `${v}rem`;
}

// Maps a fontSize prop to one of the fs-* CSS classes defined in globals.css.
// Handles both new string values ("fs-2xl") and legacy numeric values (1.5, 24).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFontSizeClass(fontSize: any, fallback: string): string {
  if (!fontSize) return fallback;
  if (typeof fontSize === 'string' && fontSize.startsWith('fs-')) return fontSize;
  const num = typeof fontSize === 'number' ? fontSize : parseFloat(String(fontSize));
  if (isNaN(num) || num === 0) return fallback;
  const rem = num > 4 ? num / 16 : num;
  if (rem <= 0.8125) return 'fs-xs';
  if (rem <= 0.9375) return 'fs-sm';
  if (rem <= 1.0625) return 'fs-base';
  if (rem <= 1.25)   return 'fs-lg';
  if (rem <= 1.625)  return 'fs-xl';
  if (rem <= 2.125)  return 'fs-2xl';
  if (rem <= 2.75)   return 'fs-3xl';
  return 'fs-4xl';
}
export function toPaddingRem(v: number, h: number): string {
  return `${toRem(v, '0rem')} ${toRem(h, '0rem')}`;
}
function toGapRem(v: number): string {
  return v > 4 ? `${v / 16}rem` : `${v}rem`;
}

// ── Config ───────────────────────────────────────────────────────────────────
export const puckConfig: Config = {
  root: {
    fields: {
      fontFamily: {
        type: 'select',
        label: 'Fuente del sitio',
        options: [
          { label: 'System UI (default)', value: 'system-ui, sans-serif' },
          ...GOOGLE_FONTS.map(f => ({ label: f, value: `'${f}', sans-serif` })),
          { label: 'Georgia (serif)',     value: 'Georgia, serif' },
          { label: 'Times New Roman',     value: "'Times New Roman', serif" },
        ],
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: ({ children, fontFamily }: any) => {
      const font = (fontFamily as string)?.split("'")[1] || (fontFamily as string)?.split(',')[0];
      const isGoogle = GOOGLE_FONTS.includes(font);
      return (
        <>
          {isGoogle && (
            <link
              href={`https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700;900&display=swap`}
              rel="stylesheet"
            />
          )}
          <div style={{ fontFamily: fontFamily || 'system-ui, sans-serif' }}>
            {children}
          </div>
        </>
      );
    },
  },

  categories: {
    layout:      { title: '📐 Layout',      components: ['SeccionFondo', 'DosColumnas', 'TresColumnas'] },
    basicos:     { title: '✏️ Básicos',      components: ['Heading', 'Parrafo', 'GaleriaLogos', 'Imagen', 'Video', 'Boton', 'BandaColor', 'Separador', 'Mapa'] },
    conferencia: { title: '🎪 Conferencia', components: ['Hero', 'Stats', 'CuentaRegresiva'] },
  },

  components: {

    // ── LAYOUT ────────────────────────────────────────────────────────────────

    SeccionFondo: {
      label: '🎨 Sección con fondo',
      fields: {
        bgColor:  colorField('Color de fondo'),
        bgImage:  imageField('Imagen de fondo (opcional)'),
        padding:  { type: 'number', label: 'Padding vertical (rem)' },
        maxWidth: { type: 'number', label: 'Ancho máximo contenido (px, 0=full)' },
      },
      defaultProps: { bgColor: '#ffffff', bgImage: '', padding: 3, maxWidth: 900 },
      render: ({ bgColor, bgImage, padding, maxWidth }) => (
        <section style={{
          background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bgColor,
          padding: `${toRem(padding, '3rem')} 2rem`,
        }}>
          <div style={{ maxWidth: maxWidth || '100%', margin: '0 auto' }}>
            <DropZone zone="content" />
          </div>
        </section>
      ),
    },

    DosColumnas: {
      label: '⬛⬛ Dos columnas',
      fields: {
        gap:  { type: 'number', label: 'Espacio entre columnas (rem)' },
        paddingV: { type: 'number', label: 'Padding vertical (rem)' },
        paddingH: { type: 'number', label: 'Padding horizontal (rem)' },
        ratio: {
          type: 'radio', label: 'Proporción',
          options: [
            { label: '50/50', value: '1fr 1fr' },
            { label: '60/40', value: '3fr 2fr' },
            { label: '40/60', value: '2fr 3fr' },
            { label: '70/30', value: '7fr 3fr' },
          ],
        },
        alignItems: {
          type: 'radio', label: 'Alineación vertical',
          options: [
            { label: 'Top',    value: 'flex-start' },
            { label: 'Centro', value: 'center' },
            { label: 'Bottom', value: 'flex-end' },
          ],
        },
      },
      defaultProps: { gap: 2, paddingV: 2, paddingH: 2, ratio: '1fr 1fr', alignItems: 'flex-start' },
      render: ({ gap, paddingV, paddingH, ratio, alignItems }) => (
        <div style={{ display: 'grid', gridTemplateColumns: ratio, gap: toGapRem(gap), alignItems, padding: toPaddingRem(paddingV, paddingH) }}>
          <DropZone zone="left" />
          <DropZone zone="right" />
        </div>
      ),
    },

    TresColumnas: {
      label: '⬛⬛⬛ Tres columnas',
      fields: {
        gap: { type: 'number', label: 'Espacio entre columnas (rem)' },
        paddingV: { type: 'number', label: 'Padding vertical (rem)' },
        paddingH: { type: 'number', label: 'Padding horizontal (rem)' },
      },
      defaultProps: { gap: 1.5, paddingV: 2, paddingH: 2 },
      render: ({ gap, paddingV, paddingH }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: toGapRem(gap), padding: toPaddingRem(paddingV, paddingH) }}>
          <DropZone zone="col1" />
          <DropZone zone="col2" />
          <DropZone zone="col3" />
        </div>
      ),
    },

    // ── BÁSICOS ───────────────────────────────────────────────────────────────

    Heading: {
      label: 'H Título / Heading',
      fields: {
        texto:    { type: 'text', label: 'Texto' },
        nivel: {
          type: 'radio', label: 'Nivel',
          options: [
            { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' },
          ],
        },
        alignment: {
          type: 'radio', label: 'Alineación',
          options: [
            { label: 'Izq', value: 'left' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'right' },
          ],
        },
        negrita: {
          type: 'radio', label: 'Negrita',
          options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }],
        },
        cursiva: {
          type: 'radio', label: 'Cursiva',
          options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }],
        },
        subrayado: {
          type: 'radio', label: 'Subrayado',
          options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }],
        },
        fontFamily: {
          type: 'select', label: 'Tipografía',
          options: [
            { label: 'Heredar del sitio', value: '' },
            { label: 'System UI', value: 'system-ui, sans-serif' },
            ...GOOGLE_FONTS.map(f => ({ label: f, value: `'${f}', sans-serif` })),
            { label: 'Georgia (serif)', value: 'Georgia, serif' },
            { label: 'Times New Roman', value: "'Times New Roman', serif" },
          ],
        },
        color:    colorField('Color texto'),
        bgColor:  colorField('Color de fondo'),
        fontSize: {
          type: 'select', label: 'Tamaño fuente',
          options: [
            { label: 'Auto (según nivel H1/H2…)', value: '' },
            { label: 'xs — muy pequeño',          value: 'fs-xs'   },
            { label: 'sm — pequeño',              value: 'fs-sm'   },
            { label: 'base — normal',             value: 'fs-base' },
            { label: 'lg — grande',               value: 'fs-lg'   },
            { label: 'xl — título chico',         value: 'fs-xl'   },
            { label: '2xl — título',              value: 'fs-2xl'  },
            { label: '3xl — título grande',       value: 'fs-3xl'  },
            { label: '4xl — título enorme',       value: 'fs-4xl'  },
          ],
        },
        paddingV: { type: 'number', label: 'Padding vertical (rem)' },
        paddingH: { type: 'number', label: 'Padding horizontal (rem)' },
      },
      defaultProps: { texto: 'Título de sección', nivel: 'h2', alignment: 'left', negrita: 'si', cursiva: 'no', subrayado: 'no', fontFamily: '', color: '#111827', bgColor: 'transparent', fontSize: '', paddingV: 1, paddingH: 2 },
      render: ({ texto, nivel, alignment, negrita, cursiva, subrayado, fontFamily, color, bgColor, fontSize, paddingV, paddingH }) => {
        const Tag = nivel as 'h1' | 'h2' | 'h3' | 'h4';
        const levelDefaults: Record<string, string> = { h1: 'fs-4xl', h2: 'fs-3xl', h3: 'fs-2xl', h4: 'fs-xl' };
        const fsClass = getFontSizeClass(fontSize, levelDefaults[nivel] || 'fs-2xl');
        const font = fontFamily ? (fontFamily as string).split("'")[1] || (fontFamily as string).split(',')[0] : null;
        const isGoogle = font && GOOGLE_FONTS.includes(font);
        return (
          <div style={{ background: bgColor, padding: toPaddingRem(paddingV, paddingH) }}>
            {isGoogle && (
              <link href={`https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700&display=swap`} rel="stylesheet" />
            )}
            <Tag
              className={fsClass}
              style={{
                margin: 0,
                textAlign: alignment as 'left' | 'center' | 'right',
                color,
                fontWeight: negrita === 'si' ? 700 : 400,
                fontStyle: cursiva === 'si' ? 'italic' : 'normal',
                textDecoration: subrayado === 'si' ? 'underline' : 'none',
                fontFamily: fontFamily || undefined,
                lineHeight: 1.25,
              }}
            >
              {texto}
            </Tag>
          </div>
        );
      },
    },

    Parrafo: {
      label: '¶ Párrafo',
      fields: {
        contenido: richtextField('Texto'),
        color:    colorField('Color texto'),
        bgColor:  colorField('Color de fondo'),
        fontSize: {
          type: 'select', label: 'Tamaño fuente',
          options: [
            { label: 'xs — muy pequeño',    value: 'fs-xs'   },
            { label: 'sm — pequeño',        value: 'fs-sm'   },
            { label: 'base — normal',       value: 'fs-base' },
            { label: 'lg — grande',         value: 'fs-lg'   },
            { label: 'xl — título chico',   value: 'fs-xl'   },
            { label: '2xl — título',        value: 'fs-2xl'  },
            { label: '3xl — título grande', value: 'fs-3xl'  },
            { label: '4xl — título enorme', value: 'fs-4xl'  },
          ],
        },
        maxWidth: { type: 'number', label: 'Ancho máximo (px, 0=full)' },
        paddingV: { type: 'number', label: 'Padding vertical (rem)' },
        paddingH: { type: 'number', label: 'Padding horizontal (rem)' },
      },
      defaultProps: { contenido: '<p>Escribí tu texto acá...</p>', color: '#374151', bgColor: 'transparent', fontSize: 'fs-base', maxWidth: 0, paddingV: 0.5, paddingH: 2 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ contenido, color, bgColor, fontSize, maxWidth, paddingV, paddingH }: any) => (
        <div style={{ background: bgColor, padding: toPaddingRem(paddingV, paddingH) }}>
          <div
            style={{ color, lineHeight: 1.7, maxWidth: maxWidth || 'none' }}
            className={`puck-richtext ${getFontSizeClass(fontSize, 'fs-base')}`}
            dangerouslySetInnerHTML={{ __html: resolveRichText(contenido) }}
          />
        </div>
      ),
    },

    Imagen: {
      label: '🖼️ Imagen',
      fields: {
        url:       imageField('Imagen'),
        alt:       { type: 'text',   label: 'Texto alternativo' },
        width:     { type: 'text',   label: "Ancho (px, % o 'auto')" },
        maxHeight: { type: 'number', label: 'Alto máximo (px, 0=auto)' },
        fit: {
          type: 'radio', label: 'Ajuste de imagen',
          options: [
            { label: 'Contener', value: 'contain' }, { label: 'Recortar', value: 'cover' },
          ],
        },
        align: {
          type: 'radio', label: 'Alineación',
          options: [
            { label: 'Izq', value: 'flex-start' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'flex-end' },
          ],
        },
        rounded: { type: 'number', label: 'Bordes redondeados (px)' },
        bgColor:  colorField('Color del marco'),
        cardPadding: { type: 'number', label: 'Espacio del marco (rem)' },
        shadow: {
          type: 'radio', label: 'Sombra del marco',
          options: [
            { label: 'Ninguna', value: 'none' }, { label: 'Suave', value: 'subtle' },
          ],
        },
        paddingV: { type: 'number', label: 'Padding vertical (rem)' },
        paddingH: { type: 'number', label: 'Padding horizontal (rem)' },
        linkUrl: { type: 'text',   label: 'Link al hacer click (opcional)' },
      },
      defaultProps: { url: '', alt: '', width: '100%', maxHeight: 0, fit: 'contain', align: 'center', rounded: 12, bgColor: '#ffffff', cardPadding: 1, shadow: 'subtle', paddingV: 0.5, paddingH: 0, linkUrl: '' },
      render: ({ url, alt, width, maxHeight, fit, align, rounded, bgColor, cardPadding, shadow, paddingV, paddingH, linkUrl }) => {
        const objectFit = fit ?? 'cover';
        const cardPad = toRem(cardPadding ?? 0, '0rem');
        const boxShadow = (shadow ?? 'none') === 'subtle' ? '0 1px 4px rgba(0,0,0,.12)' : 'none';
        const img = url
          ? <img src={url} alt={alt} style={{ width: '100%', maxHeight: maxHeight || 'none', objectFit, borderRadius: rounded, display: 'block' }} />
          : <div style={{ padding: '2rem', textAlign: 'center', background: '#f3f4f6', color: '#9ca3af', borderRadius: rounded, width: '100%' }}>
              🖼️ Configurá la URL de imagen
            </div>;
        const card = (
          <div style={{ display: 'inline-block', width, boxSizing: 'border-box', background: bgColor, padding: cardPad, borderRadius: rounded, boxShadow }}>
            {linkUrl ? <a href={linkUrl} target="_blank" rel="noopener">{img}</a> : img}
          </div>
        );
        return (
          <div style={{ padding: toPaddingRem(paddingV, paddingH), display: 'flex', justifyContent: align }}>
            {card}
          </div>
        );
      },
    },

    Video: {
      label: '▶️ Video (YouTube / Vimeo)',
      fields: {
        url:    { type: 'text',   label: 'URL del video (YouTube o Vimeo)' },
        height: { type: 'number', label: 'Alto (px)' },
      },
      defaultProps: { url: '', height: 400 },
      render: ({ url, height }) => {
        const getEmbedUrl = (raw: string) => {
          const ytMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
          if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
          const vmMatch = raw.match(/vimeo\.com\/(\d+)/);
          if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
          return raw;
        };
        return url
          ? <div style={{ width: '100%', height }}>
              <iframe src={getEmbedUrl(url)} width="100%" height={height}
                style={{ border: 'none', display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          : <div style={{ padding: '2rem', textAlign: 'center', background: '#f3f4f6', color: '#9ca3af', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ▶️ Configurá la URL del video (YouTube o Vimeo)
            </div>;
      },
    },

    GaleriaLogos: {
      label: '🖼️ Galería de logos / imágenes',
      fields: {
        imagenes: {
          type: 'array',
          label: 'Imágenes',
          arrayFields: {
            url:     imageField('Imagen / Logo'),
            alt:     { type: 'text', label: 'Texto alternativo' },
            linkUrl: { type: 'text', label: 'Link al hacer click (opcional)' },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultItemProps: { url: '', alt: '', linkUrl: '' } as any,
        },
        columnas: {
          type: 'radio', label: 'Columnas',
          options: [
            { label: '2', value: '2' }, { label: '3', value: '3' },
            { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
          ],
        },
        alturaLogo: { type: 'number', label: 'Altura máxima (px)' },
        gap:        { type: 'number', label: 'Espacio entre imágenes (px)' },
        bgColor:    colorField('Color de fondo'),
        paddingV:   { type: 'number', label: 'Padding vertical (px)' },
      },
      defaultProps: {
        imagenes: [
          { url: '', alt: 'Logo 1', linkUrl: '' },
          { url: '', alt: 'Logo 2', linkUrl: '' },
          { url: '', alt: 'Logo 3', linkUrl: '' },
        ],
        columnas: '3', alturaLogo: 48, gap: 24, bgColor: '#f1f5f9', paddingV: 32,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ imagenes, columnas, alturaLogo, gap, bgColor, paddingV }: any) => (
        <div style={{ background: bgColor, padding: `${paddingV}px 2rem` }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columnas}, 1fr)`,
            gap,
            alignItems: 'center',
            maxWidth: '960px',
            margin: '0 auto',
          }}>
            {(imagenes as { url: string; alt: string; linkUrl: string }[]).map((img, i) => {
              const imgEl = img.url
                ? <img key={i} src={img.url} alt={img.alt} style={{ maxHeight: alturaLogo, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                : <div key={i} style={{ height: alturaLogo, background: '#e2e8f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>Logo {i + 1}</div>;
              return img.linkUrl
                ? <a key={i} href={img.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{imgEl}</a>
                : <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{imgEl}</div>;
            })}
          </div>
        </div>
      ),
    },

    Boton: {
      label: '🔘 Botón / CTA',
      fields: {
        label:   { type: 'text', label: 'Texto del botón' },
        url:     { type: 'text', label: 'URL de destino' },
        color:   colorField('Color'),
        size: {
          type: 'radio', label: 'Tamaño',
          options: [
            { label: 'Chico', value: 'sm' }, { label: 'Normal', value: 'md' }, { label: 'Grande', value: 'lg' },
          ],
        },
        variant: {
          type: 'radio', label: 'Estilo',
          options: [{ label: 'Sólido', value: 'solid' }, { label: 'Contorno', value: 'outline' }],
        },
        align: {
          type: 'radio', label: 'Alineación',
          options: [
            { label: 'Izq', value: 'flex-start' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'flex-end' },
          ],
        },
      },
      defaultProps: { label: 'Inscribirse', url: '#', color: '#4f46e5', size: 'md', variant: 'solid', align: 'center' },
      render: ({ label, url, color, size, variant, align }) => {
        const pads: Record<string, string> = { sm: '.5rem 1.25rem', md: '.75rem 2rem', lg: '1rem 2.75rem' };
        const fonts: Record<string, string> = { sm: '.8125rem', md: '1rem', lg: '1.125rem' };
        return (
          <div style={{ display: 'flex', justifyContent: align, padding: '.5rem 0' }}>
            <a href={url} style={{
              padding: pads[size], borderRadius: 8, border: `2px solid ${color}`,
              background: variant === 'solid' ? color : 'transparent',
              color: variant === 'solid' ? '#fff' : color,
              fontWeight: 700, fontSize: fonts[size], textDecoration: 'none', display: 'inline-block',
            }}>
              {label}
            </a>
          </div>
        );
      },
    },

    BandaColor: {
      label: '🎨 Banda de color',
      fields: {
        bgColor:   colorField('Color de fondo'),
        texto:     { type: 'text',   label: 'Texto (opcional)' },
        color:     colorField('Color texto'),
        height:    { type: 'number', label: 'Alto mínimo (px)' },
        fontSize: {
          type: 'select', label: 'Tamaño fuente',
          options: [
            { label: 'xs — muy pequeño',    value: 'fs-xs'   },
            { label: 'sm — pequeño',        value: 'fs-sm'   },
            { label: 'base — normal',       value: 'fs-base' },
            { label: 'lg — grande',         value: 'fs-lg'   },
            { label: 'xl — título chico',   value: 'fs-xl'   },
            { label: '2xl — título',        value: 'fs-2xl'  },
            { label: '3xl — título grande', value: 'fs-3xl'  },
            { label: '4xl — título enorme', value: 'fs-4xl'  },
          ],
        },
        alignment: {
          type: 'radio', label: 'Alineación texto',
          options: [
            { label: 'Izq', value: 'left' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'right' },
          ],
        },
      },
      defaultProps: { bgColor: '#4f46e5', texto: '', color: '#ffffff', height: 80, fontSize: 'fs-lg', alignment: 'center' },
      render: ({ bgColor, texto, color, height, fontSize, alignment }) => (
        <div style={{
          background: bgColor, minHeight: height,
          display: 'flex', alignItems: 'center',
          justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
          padding: '1rem 2rem',
        }}>
          {texto && <p className={getFontSizeClass(fontSize, 'fs-lg')} style={{ margin: 0, color, fontWeight: 600, textAlign: alignment as 'left' | 'center' | 'right' }}>{texto}</p>}
        </div>
      ),
    },

    Separador: {
      label: '── Separador',
      fields: {
        height: { type: 'number', label: 'Espacio (px)' },
        line: {
          type: 'radio', label: 'Mostrar línea',
          options: [{ label: 'No', value: 'none' }, { label: 'Sí', value: 'solid' }],
        },
        color: colorField('Color línea'),
      },
      defaultProps: { height: 48, line: 'none', color: '#e5e7eb' },
      render: ({ height, line, color }) => (
        <div style={{ height, display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
          {line !== 'none' && <hr style={{ width: '100%', border: 'none', borderTop: `1px ${line} ${color}`, margin: 0 }} />}
        </div>
      ),
    },

    // ── CONFERENCIA ───────────────────────────────────────────────────────────

    Hero: {
      label: '🖼️ Hero / Cabecera',
      fields: {
        titulo:      { type: 'text', label: 'Título' },
        subtitulo:   { type: 'text', label: 'Subtítulo' },
        lema:        { type: 'text', label: 'Lema / tagline' },
        color:       colorField('Color de fondo'),
        logoUrl:     imageField('Logo'),
        bannerUrl:   imageField('Imagen de fondo (banner)'),
        fechaInicio: { type: 'text', label: 'Fecha inicio' },
        fechaFin:    { type: 'text', label: 'Fecha fin' },
        lugar:       { type: 'text', label: 'Lugar / sede' },
      },
      defaultProps: {
        titulo: 'Nombre del Congreso', subtitulo: 'Subtítulo del evento', lema: '',
        color: '#1e3a5f', logoUrl: '', bannerUrl: '', fechaInicio: '', fechaFin: '', lugar: '',
      },
      render: ({ titulo, subtitulo, lema, color, logoUrl, bannerUrl, fechaInicio, fechaFin, lugar }) => (
        <section style={{
          background: bannerUrl
            ? `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)), url(${bannerUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${color} 0%, #0f172a 100%)`,
          minHeight: '65vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center', color: '#fff',
        }}>
          <div style={{ maxWidth: 800 }}>
            {logoUrl && <img src={logoUrl} alt="logo" style={{ maxHeight: 80, marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }} />}
            <h1 style={{ fontSize: '2.75rem', margin: '0 0 1rem', fontWeight: 900, lineHeight: 1.15 }}>{titulo}</h1>
            {subtitulo && <p style={{ fontSize: '1.25rem', opacity: .9, margin: '0 0 .5rem' }}>{subtitulo}</p>}
            {lema      && <p style={{ fontStyle: 'italic', opacity: .75, margin: '0 0 1.5rem' }}>{lema}</p>}
            {(fechaInicio || lugar) && (
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                {fechaInicio && <span style={{ opacity: .9, fontSize: '.95rem' }}>📅 {fechaInicio}{fechaFin ? ` – ${fechaFin}` : ''}</span>}
                {lugar       && <span style={{ opacity: .9, fontSize: '.95rem' }}>📍 {lugar}</span>}
              </div>
            )}
          </div>
        </section>
      ),
    },

    Stats: {
      label: '📊 Stats / Números destacados',
      fields: {
        stat1valor: { type: 'text', label: 'Stat 1 — Valor' },
        stat1label: { type: 'text', label: 'Stat 1 — Etiqueta' },
        stat2valor: { type: 'text', label: 'Stat 2 — Valor' },
        stat2label: { type: 'text', label: 'Stat 2 — Etiqueta' },
        stat3valor: { type: 'text', label: 'Stat 3 — Valor' },
        stat3label: { type: 'text', label: 'Stat 3 — Etiqueta' },
        stat4valor: { type: 'text', label: 'Stat 4 — Valor (opcional)' },
        stat4label: { type: 'text', label: 'Stat 4 — Etiqueta' },
        color:      colorField('Color número'),
        bgColor:    colorField('Color fondo'),
      },
      defaultProps: {
        stat1valor: '300+', stat1label: 'Asistentes',
        stat2valor: '20',   stat2label: 'Ponentes',
        stat3valor: '3',    stat3label: 'Días',
        stat4valor: '',     stat4label: '',
        color: '#4f46e5', bgColor: '#f5f3ff',
      },
      render: ({ stat1valor, stat1label, stat2valor, stat2label, stat3valor, stat3label, stat4valor, stat4label, color, bgColor }) => {
        const stats = [
          { v: stat1valor, l: stat1label },
          { v: stat2valor, l: stat2label },
          { v: stat3valor, l: stat3label },
          ...(stat4valor ? [{ v: stat4valor, l: stat4label }] : []),
        ];
        return (
          <div style={{ background: bgColor, padding: '3rem 2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '1rem', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: '.875rem', color: '#6b7280', marginTop: '.25rem', fontWeight: 500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },

    // ── MAPA ──────────────────────────────────────────────────────────────────

    Mapa: {
      label: '🗺️ Mapa (Google Maps)',
      fields: {
        query:  { type: 'text',   label: 'Dirección o nombre del lugar' },
        height: { type: 'number', label: 'Alto del mapa (px)' },
        zoom:   { type: 'number', label: 'Zoom (1–20)' },
      },
      defaultProps: { query: '', height: 400, zoom: 14 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ({ query, height, zoom }: any) => {
        if (!query) {
          return (
            <div style={{ height, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              🗺️ Configurá la dirección del lugar
            </div>
          );
        }
        const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
        return (
          <iframe
            src={src}
            width="100%"
            height={height}
            style={{ border: 'none', display: 'block' }}
            loading="lazy"
            allowFullScreen
            title="Mapa de ubicación"
          />
        );
      },
    },

    // ── CUENTA REGRESIVA ──────────────────────────────────────────────────────

    CuentaRegresiva: {
      label: '⏱ Cuenta regresiva',
      fields: {
        targetDate:       { type: 'text',   label: 'Fecha/hora del evento (YYYY-MM-DDTHH:MM)' },
        titulo:           { type: 'text',   label: 'Título (opcional)' },
        mostrarDias:      { type: 'radio',  label: 'Mostrar días',     options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }] },
        mostrarHoras:     { type: 'radio',  label: 'Mostrar horas',    options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }] },
        mostrarMinutos:   { type: 'radio',  label: 'Mostrar minutos',  options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }] },
        mostrarSegundos:  { type: 'radio',  label: 'Mostrar segundos', options: [{ label: 'Sí', value: 'si' }, { label: 'No', value: 'no' }] },
        labelDias:        { type: 'text',   label: 'Etiqueta días' },
        labelHoras:       { type: 'text',   label: 'Etiqueta horas' },
        labelMinutos:     { type: 'text',   label: 'Etiqueta minutos' },
        labelSegundos:    { type: 'text',   label: 'Etiqueta segundos' },
        color:            colorField('Color de los números'),
        colorLabel:       colorField('Color de las etiquetas'),
        bgColor:          colorField('Color de fondo'),
        paddingV:         { type: 'number', label: 'Padding vertical (rem)' },
        fontSize:         { type: 'number', label: 'Tamaño números (rem)' },
        tituloFontSize:   { type: 'number', label: 'Tamaño título (rem)' },
        tituloColor:      colorField('Color título'),
        fontFamily: {
          type: 'select', label: 'Tipografía',
          options: [
            { label: 'Heredar del sitio', value: '' },
            { label: 'System UI', value: 'system-ui, sans-serif' },
            ...GOOGLE_FONTS.map(f => ({ label: f, value: `'${f}', sans-serif` })),
            { label: 'Georgia (serif)', value: 'Georgia, serif' },
          ],
        },
        alineacion: {
          type: 'radio', label: 'Alineación',
          options: [{ label: 'Izq', value: 'left' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'right' }],
        },
      },
      defaultProps: {
        targetDate: '',
        titulo: '⏳ El evento comienza en',
        mostrarDias: 'si', mostrarHoras: 'si', mostrarMinutos: 'si', mostrarSegundos: 'si',
        labelDias: 'días', labelHoras: 'horas', labelMinutos: 'min', labelSegundos: 'seg',
        color: '#1e3a5f', colorLabel: '#64748b', bgColor: '#f8fafc',
        paddingV: 3, fontSize: 3.5, tituloFontSize: 1.125, tituloColor: '#334155',
        fontFamily: '', alineacion: 'center',
      },
      render: ({ targetDate, titulo, mostrarDias, mostrarHoras, mostrarMinutos, mostrarSegundos,
                  labelDias, labelHoras, labelMinutos, labelSegundos,
                  color, colorLabel, bgColor, paddingV, fontSize, tituloFontSize, tituloColor,
                  fontFamily, alineacion }) => {
        const isGoogle = fontFamily && GOOGLE_FONTS.includes(fontFamily);
        return (
          <>
            {isGoogle && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`} />}
            <CountdownDisplay
              targetDate={targetDate} titulo={titulo}
              mostrarDias={mostrarDias} mostrarHoras={mostrarHoras}
              mostrarMinutos={mostrarMinutos} mostrarSegundos={mostrarSegundos}
              labelDias={labelDias} labelHoras={labelHoras}
              labelMinutos={labelMinutos} labelSegundos={labelSegundos}
              color={color} colorLabel={colorLabel} bgColor={bgColor}
              paddingV={paddingV} fontSize={fontSize}
              tituloFontSize={tituloFontSize} tituloColor={tituloColor}
              fontFamily={fontFamily} alineacion={alineacion}
            />
          </>
        );
      },
    },

  },
};

// ── Layout inicial por defecto ────────────────────────────────────────────────
export const DEFAULT_PUCK_DATA = {
  content: [
    {
      type: 'Hero',
      props: {
        id: 'hero-1',
        titulo: 'Nombre del Congreso', subtitulo: 'Subtítulo del evento', lema: '',
        color: '#1e3a5f', logoUrl: '', bannerUrl: '', fechaInicio: '', fechaFin: '', lugar: '',
      },
    },
    {
      type: 'Parrafo',
      props: {
        id: 'desc-1',
        contenido: '<p>Describí tu congreso acá. Podés usar <strong>negrita</strong>, <em>cursiva</em> y listas.</p>',
        color: '#374151', bgColor: 'transparent', fontSize: 1.125, maxWidth: 800, paddingV: 3, paddingH: 2,
      },
    },
  ],
  root: { props: { fontFamily: 'system-ui, sans-serif' } },
};
