'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// ── Dynamic import — avoids SSR issues (Quill uses `document`) ────────────
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// ── Toolbar config — Gmail-style ───────────────────────────────────────────
const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['link'],
  ['clean'],
];

const MODULES = { toolbar: TOOLBAR };
const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align',
  'list',
  'size', 'link',
];

// ── Props — same interface as previous TipTap component ───────────────────
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
