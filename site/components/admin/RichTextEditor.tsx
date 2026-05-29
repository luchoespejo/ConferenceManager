'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────

const BoldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
);

const BulletListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="6" x2="20" y2="6"/>
    <line x1="9" y1="12" x2="20" y2="12"/>
    <line x1="9" y1="18" x2="20" y2="18"/>
    <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

const OrderedListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 10h2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M6 14H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4 19h2M4 17c0 1 2 2 2 2H4" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const UnlinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

// ── Toolbar button ─────────────────────────────────────────────────────────

function Btn({
  active = false,
  disabled = false,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick(); }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 5,
        border: 'none',
        background: active ? '#dde6f0' : 'transparent',
        color: active ? '#1e40af' : '#475569',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.35 : 1,
        transition: 'background .1s, color .1s',
      }}
      onMouseEnter={e => {
        if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = '#e9eef5';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? '#dde6f0' : 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <span style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 3px', flexShrink: 0 }} />
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      Link.configure({ openOnClick: false, autolink: false }),
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || '';
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  // Focus link input when popover opens
  useEffect(() => {
    if (linkPopoverOpen) {
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  }, [linkPopoverOpen]);

  const openLinkPopover = () => {
    if (!editor) return;
    const current = editor.getAttributes('link').href as string | undefined;
    setLinkInputValue(current ?? '');
    setLinkPopoverOpen(true);
  };

  const applyLink = () => {
    if (!editor) return;
    const url = linkInputValue.trim();
    if (url) {
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkPopoverOpen(false);
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkPopoverOpen(false);
  };

  if (!editor) return null;

  const isLinkActive = editor.isActive('link');
  const hasSelection = !editor.state.selection.empty;
  const isEmpty = !editor.getText().trim();

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '4px 6px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'nowrap',
      }}>
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita (Ctrl+B)">
          <BoldIcon />
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva (Ctrl+I)">
          <ItalicIcon />
        </Btn>
        <Divider />
        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista con viñetas">
          <BulletListIcon />
        </Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <OrderedListIcon />
        </Btn>
        <Divider />
        <Btn
          active={isLinkActive || linkPopoverOpen}
          disabled={!isLinkActive && !hasSelection}
          onClick={openLinkPopover}
          title={isLinkActive ? 'Editar enlace' : hasSelection ? 'Insertar enlace' : 'Seleccioná texto primero para crear un enlace'}
        >
          <LinkIcon />
        </Btn>
        {isLinkActive && (
          <Btn active={false} onClick={removeLink} title="Quitar enlace">
            <UnlinkIcon />
          </Btn>
        )}
      </div>

      {/* Link popover */}
      {linkPopoverOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          background: '#f0f4ff',
          borderBottom: '1px solid #c7d5f0',
        }}>
          <input
            ref={linkInputRef}
            type="url"
            value={linkInputValue}
            onChange={e => setLinkInputValue(e.target.value)}
            placeholder="https://..."
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') setLinkPopoverOpen(false);
            }}
            style={{
              flex: 1,
              border: '1px solid #a5b4fc',
              borderRadius: 5,
              padding: '4px 8px',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#fff',
            }}
          />
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); applyLink(); }}
            style={{ padding: '4px 10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 5, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Guardar
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setLinkPopoverOpen(false); }}
            style={{ padding: '4px 8px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 5, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor area */}
      <div style={{ position: 'relative' }}>
        {isEmpty && placeholder && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 12,
            color: '#94a3b8',
            fontSize: '0.875rem',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {placeholder}
          </div>
        )}
        <EditorContent
          editor={editor}
          style={{ padding: '10px 12px', minHeight: 90, fontSize: '0.875rem', lineHeight: 1.65, color: '#1e293b' }}
        />
      </div>
    </div>
  );
}
