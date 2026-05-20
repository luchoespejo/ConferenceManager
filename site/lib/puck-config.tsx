import { DropZone, type Config, type CustomField } from '@puckeditor/core';

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

// ── Placeholder bloques dinámicos ────────────────────────────────────────────
function DynamicPlaceholder({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{
      border: '2px dashed #9c88ff', padding: '2rem 1.5rem', textAlign: 'center',
      background: '#f5f3ff', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#4c1d95', marginBottom: '.25rem' }}>{label}</div>
      <div style={{ color: '#7c3aed', fontSize: '.875rem', marginBottom: '.75rem' }}>{desc}</div>
      <div style={{ fontSize: '.75rem', color: '#6b7280', background: '#ede9fe', display: 'inline-block', padding: '2px 10px', borderRadius: '100px' }}>
        📦 Datos reales se inyectan en build
      </div>
    </div>
  );
}

// ── Google Fonts ─────────────────────────────────────────────────────────────
const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Raleway', 'Poppins', 'Merriweather', 'Playfair Display', 'Source Sans 3',
];

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
    layout:      { title: '📐 Layout',           components: ['SeccionFondo', 'DosColumnas', 'TresColumnas'] },
    basicos:     { title: '✏️ Básicos',           components: ['Heading', 'Parrafo', 'Imagen', 'Video', 'Boton', 'BandaColor', 'Separador'] },
    conferencia: { title: '🎪 Conferencia',       components: ['Hero', 'Stats'] },
    dinamicos:   { title: '📦 Dinámicos (build)', components: ['Agenda', 'Expositores', 'FechasImportantes', 'Organizadores', 'Contacto', 'Inscripciones'] },
  },

  components: {

    // ── LAYOUT ────────────────────────────────────────────────────────────────

    SeccionFondo: {
      label: '🎨 Sección con fondo',
      fields: {
        bgColor:  colorField('Color de fondo'),
        bgImage:  imageField('Imagen de fondo (opcional)'),
        padding:  { type: 'number', label: 'Padding vertical (px)' },
        maxWidth: { type: 'number', label: 'Ancho máximo contenido (px, 0=full)' },
      },
      defaultProps: { bgColor: '#ffffff', bgImage: '', padding: 48, maxWidth: 900 },
      render: ({ bgColor, bgImage, padding, maxWidth }) => (
        <section style={{
          background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bgColor,
          padding: `${padding}px 2rem`,
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
        gap:  { type: 'number', label: 'Espacio entre columnas (px)' },
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
      defaultProps: { gap: 32, ratio: '1fr 1fr', alignItems: 'flex-start' },
      render: ({ gap, ratio, alignItems }) => (
        <div style={{ display: 'grid', gridTemplateColumns: ratio, gap, alignItems, padding: '2rem' }}>
          <DropZone zone="left" />
          <DropZone zone="right" />
        </div>
      ),
    },

    TresColumnas: {
      label: '⬛⬛⬛ Tres columnas',
      fields: { gap: { type: 'number', label: 'Espacio entre columnas (px)' } },
      defaultProps: { gap: 24 },
      render: ({ gap }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap, padding: '2rem' }}>
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
        color:    colorField('Color texto'),
        bgColor:  colorField('Color de fondo'),
        fontSize: { type: 'number', label: 'Tamaño fuente (px, 0=auto)' },
        paddingV: { type: 'number', label: 'Padding vertical (px)' },
        paddingH: { type: 'number', label: 'Padding horizontal (px)' },
      },
      defaultProps: { texto: 'Título de sección', nivel: 'h2', alignment: 'left', color: '#111827', bgColor: 'transparent', fontSize: 0, paddingV: 16, paddingH: 32 },
      render: ({ texto, nivel, alignment, color, bgColor, fontSize, paddingV, paddingH }) => {
        const Tag = nivel as 'h1' | 'h2' | 'h3' | 'h4';
        const sizes: Record<string, string> = { h1: '2.5rem', h2: '1.875rem', h3: '1.375rem', h4: '1.125rem' };
        return (
          <div style={{ background: bgColor, padding: `${paddingV}px ${paddingH}px` }}>
            <Tag style={{
              margin: 0, textAlign: alignment as 'left' | 'center' | 'right',
              color, fontSize: fontSize ? `${fontSize}px` : sizes[nivel],
              fontWeight: 700, lineHeight: 1.25,
            }}>
              {texto}
            </Tag>
          </div>
        );
      },
    },

    Parrafo: {
      label: '¶ Párrafo',
      fields: {
        contenido: { type: 'textarea', label: 'Texto' },
        alignment: {
          type: 'radio', label: 'Alineación',
          options: [
            { label: 'Izq', value: 'left' }, { label: 'Centro', value: 'center' },
            { label: 'Der', value: 'right' }, { label: 'Just', value: 'justify' },
          ],
        },
        color:    colorField('Color texto'),
        bgColor:  colorField('Color de fondo'),
        fontSize: { type: 'number', label: 'Tamaño fuente (px)' },
        maxWidth: { type: 'number', label: 'Ancho máximo (px, 0=full)' },
        paddingV: { type: 'number', label: 'Padding vertical (px)' },
        paddingH: { type: 'number', label: 'Padding horizontal (px)' },
      },
      defaultProps: { contenido: 'Escribí tu texto acá...', alignment: 'left', color: '#374151', bgColor: 'transparent', fontSize: 16, maxWidth: 0, paddingV: 8, paddingH: 32 },
      render: ({ contenido, alignment, color, bgColor, fontSize, maxWidth, paddingV, paddingH }) => (
        <div style={{ background: bgColor, padding: `${paddingV}px ${paddingH}px` }}>
          <p style={{
            margin: 0, textAlign: alignment as 'left' | 'center' | 'right' | 'justify',
            color, fontSize, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            maxWidth: maxWidth || 'none',
          }}>
            {contenido}
          </p>
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
        align: {
          type: 'radio', label: 'Alineación',
          options: [
            { label: 'Izq', value: 'flex-start' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'flex-end' },
          ],
        },
        rounded: { type: 'number', label: 'Bordes redondeados (px)' },
        linkUrl: { type: 'text',   label: 'Link al hacer click (opcional)' },
      },
      defaultProps: { url: '', alt: '', width: '100%', maxHeight: 0, align: 'center', rounded: 0, linkUrl: '' },
      render: ({ url, alt, width, maxHeight, align, rounded, linkUrl }) => {
        const img = url
          ? <img src={url} alt={alt} style={{ width, maxHeight: maxHeight || 'none', objectFit: 'cover', borderRadius: rounded, display: 'block' }} />
          : <div style={{ padding: '2rem', textAlign: 'center', background: '#f3f4f6', color: '#9ca3af', borderRadius: rounded, width }}>
              🖼️ Configurá la URL de imagen
            </div>;
        return (
          <div style={{ display: 'flex', justifyContent: align }}>
            {linkUrl ? <a href={linkUrl} target="_blank" rel="noopener">{img}</a> : img}
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
        fontSize:  { type: 'number', label: 'Tamaño fuente (px)' },
        alignment: {
          type: 'radio', label: 'Alineación texto',
          options: [
            { label: 'Izq', value: 'left' }, { label: 'Centro', value: 'center' }, { label: 'Der', value: 'right' },
          ],
        },
      },
      defaultProps: { bgColor: '#4f46e5', texto: '', color: '#ffffff', height: 80, fontSize: 18, alignment: 'center' },
      render: ({ bgColor, texto, color, height, fontSize, alignment }) => (
        <div style={{
          background: bgColor, minHeight: height,
          display: 'flex', alignItems: 'center',
          justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
          padding: '1rem 2rem',
        }}>
          {texto && <p style={{ margin: 0, color, fontSize, fontWeight: 600, textAlign: alignment as 'left' | 'center' | 'right' }}>{texto}</p>}
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

    // ── DINÁMICOS ─────────────────────────────────────────────────────────────

    Agenda: {
      label: '📅 Agenda',
      fields: {
        titulo: { type: 'text', label: 'Título de sección' },
        displayMode: {
          type: 'radio', label: 'Vista',
          options: [
            { label: 'Lista', value: 'lista' }, { label: 'Tabs', value: 'tabs' }, { label: 'Acordeón', value: 'acordeon' },
          ],
        },
      },
      defaultProps: { titulo: 'Agenda', displayMode: 'lista' },
      render: ({ titulo }) => (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.875rem', fontWeight: 700 }}>{titulo}</h2>
          <DynamicPlaceholder icon="📅" label="Agenda" desc="Lista de sesiones del evento" />
        </div>
      ),
    },

    Expositores: {
      label: '👥 Expositores / Speakers',
      fields: {
        titulo:     { type: 'text',  label: 'Título de sección' },
        columnas:   { type: 'radio', label: 'Columnas', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }] },
        mostrarBio: { type: 'radio', label: 'Mostrar bio', options: [{ label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }] },
      },
      defaultProps: { titulo: 'Expositores', columnas: '3', mostrarBio: 'true' },
      render: ({ titulo }) => (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.875rem', fontWeight: 700 }}>{titulo}</h2>
          <DynamicPlaceholder icon="👥" label="Expositores" desc="Grilla de speakers" />
        </div>
      ),
    },

    FechasImportantes: {
      label: '📆 Fechas importantes',
      fields: { titulo: { type: 'text', label: 'Título de sección' } },
      defaultProps: { titulo: 'Fechas importantes' },
      render: ({ titulo }) => (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.875rem', fontWeight: 700 }}>{titulo}</h2>
          <DynamicPlaceholder icon="📆" label="Fechas importantes" desc="Fechas clave del evento" />
        </div>
      ),
    },

    Organizadores: {
      label: '🏢 Organizadores / Sponsors',
      fields: {
        titulo:   { type: 'text',  label: 'Título de sección' },
        columnas: { type: 'radio', label: 'Columnas', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '6', value: '6' }] },
      },
      defaultProps: { titulo: 'Organizadores', columnas: '4' },
      render: ({ titulo }) => (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.875rem', fontWeight: 700 }}>{titulo}</h2>
          <DynamicPlaceholder icon="🏢" label="Organizadores" desc="Logos de sponsors" />
        </div>
      ),
    },

    Contacto: {
      label: '📧 Contacto',
      fields: { titulo: { type: 'text', label: 'Título de sección' } },
      defaultProps: { titulo: 'Contacto' },
      render: ({ titulo }) => (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.875rem', fontWeight: 700 }}>{titulo}</h2>
          <DynamicPlaceholder icon="📧" label="Contacto" desc="Info de contacto y venue" />
        </div>
      ),
    },

    Inscripciones: {
      label: '✍️ Inscripciones',
      fields: { titulo: { type: 'text', label: 'Título de sección' } },
      defaultProps: { titulo: 'Inscripciones' },
      render: ({ titulo }) => (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.875rem', fontWeight: 700 }}>{titulo}</h2>
          <DynamicPlaceholder icon="✍️" label="Inscripciones" desc="Link y aranceles" />
        </div>
      ),
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
    { type: 'FechasImportantes', props: { id: 'fechas-1', titulo: 'Fechas importantes' } },
    { type: 'Agenda',            props: { id: 'agenda-1', titulo: 'Agenda', displayMode: 'lista' } },
    { type: 'Expositores',       props: { id: 'expo-1',   titulo: 'Expositores', columnas: '3', mostrarBio: 'true' } },
    { type: 'Organizadores',     props: { id: 'org-1',    titulo: 'Sponsors & Organizadores', columnas: '4' } },
    { type: 'Contacto',          props: { id: 'contacto-1', titulo: 'Contacto' } },
  ],
  root: { props: { fontFamily: 'system-ui, sans-serif' } },
};
