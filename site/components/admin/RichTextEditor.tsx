'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// ── Dynamic import — register custom formats before first mount ────────────
// Style-based size (px values → inline styles, no CSS classes needed).
// Custom lineheight format (block-level, inline style line-height).
const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import('react-quill-new');
    const { StyleAttributor, Scope } = await import('parchment');

    // Size — px-based, produces style="font-size:14px"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SizeStyle = Quill.import('attributors/style/size') as any;
    SizeStyle.whitelist = ['8px', '10px', '12px', '14px', '18px', '24px', '32px', '48px'];
    Quill.register(SizeStyle, true);

    // Line height — custom block attributor, produces style="line-height:1.5"
    const LineHeightStyle = new StyleAttributor('lineheight', 'line-height', {
      scope: Scope.BLOCK,
      whitelist: ['0.5', '0.75', '1', '1.15', '1.5', '1.75', '2', '2.5', '3'],
    });
    Quill.register(LineHeightStyle, true);

    return RQ;
  },
  { ssr: false }
);

// ── Toolbar ────────────────────────────────────────────────────────────────
const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ size: ['8px', '10px', '12px', '14px', false, '18px', '24px', '32px', '48px'] }],
  [{ lineheight: ['0.5', '0.75', '1', '1.15', '1.5', '1.75', '2', '2.5', '3'] }],
  ['link'],
  ['clean'],
];

const MODULES = { toolbar: TOOLBAR };
const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align',
  'list',
  'size', 'lineheight', 'link',
];

// ── Props ──────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="richtext-quill-wrap">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={MODULES}
        formats={FORMATS}
      />
    </div>
  );
}
