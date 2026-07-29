'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Heading from '@tiptap/extension-heading'
import FontFamily from '@tiptap/extension-font-family'
import { Extension } from '@tiptap/core'
import { useEffect, useRef } from 'react'

// Custom FontSize extension via TextStyle marks
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize || null,
            renderHTML: (attrs: { fontSize?: string | null }) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: { chain: () => import('@tiptap/core').ChainedCommands }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => import('@tiptap/core').ChainedCommands }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    } as never
  },
})

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const FONT_SIZES = ['10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']
const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]
const TEXT_COLORS = ['#000000', '#374151', '#DC2626', '#D97706', '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#FFFFFF']
const HIGHLIGHT_COLORS = ['#FEF08A', '#BBF7D0', '#BAE6FD', '#FCA5A5', '#DDD6FE', '#FED7AA']

/**
 * WYSIWYG HTML editor (Tiptap) used for email/HTML template bodies. Emits raw
 * HTML via `onChange`; ported from the legacy site-admin messaging-templates
 * editor with the accent adapted to the Notion palette.
 */
export function RichEditor({ value, onChange, placeholder, minHeight = 130 }: RichEditorProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3, 4] }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value && value !== undefined) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs)
      ? 'bg-notion-blue text-white border-notion-blue'
      : 'bg-white text-notion-sub border-notion-line2 hover:bg-notion-hover'

  const btn = (name: string, attrs?: Record<string, unknown>) =>
    `px-2 py-1 rounded text-xs border transition-colors ${active(name, attrs)}`

  const iconBtn = (isActive: boolean) =>
    `px-2 py-1 rounded text-xs border transition-colors ${isActive ? 'bg-notion-blue text-white border-notion-blue' : 'bg-white text-notion-sub border-notion-line2 hover:bg-notion-hover'}`

  const divider = <span className="mx-0.5 h-5 w-px shrink-0 bg-notion-line" />

  return (
    <div className="overflow-hidden rounded-md border border-notion-line2 focus-within:ring-2 focus-within:ring-notion-blue/30">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 border-b border-notion-line bg-notion-panel px-2 py-1.5">
        {/* Heading */}
        <select
          className="h-6 rounded border border-notion-line2 bg-white pr-1 text-xs text-notion-text focus:outline-none"
          value={
            editor.isActive('heading', { level: 1 })
              ? '1'
              : editor.isActive('heading', { level: 2 })
                ? '2'
                : editor.isActive('heading', { level: 3 })
                  ? '3'
                  : editor.isActive('heading', { level: 4 })
                    ? '4'
                    : ''
          }
          onChange={(e) => {
            const v = e.target.value
            if (!v) editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: +v as 1 | 2 | 3 | 4 }).run()
          }}
        >
          <option value="">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>

        {divider}

        {/* Font family */}
        <select
          className="h-6 max-w-28 rounded border border-notion-line2 bg-white pr-1 text-xs text-notion-text focus:outline-none"
          value={(editor.getAttributes('textStyle').fontFamily as string) ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (v) editor.chain().focus().setFontFamily(v).run()
            else editor.chain().focus().unsetFontFamily().run()
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {divider}

        {/* Font size */}
        <select
          className="h-6 w-16 rounded border border-notion-line2 bg-white pr-1 text-xs text-notion-text focus:outline-none"
          value={(editor.getAttributes('textStyle').fontSize as string) ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (v) (editor.chain().focus() as never as { setFontSize: (s: string) => { run: () => void } }).setFontSize(v).run()
            else (editor.chain().focus() as never as { unsetFontSize: () => { run: () => void } }).unsetFontSize().run()
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {divider}

        {/* Bold / Italic / Underline / Strike */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn('bold')}><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn('italic')}><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn('underline')}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn('strike')}><s>S</s></button>

        {divider}

        {/* Text colour — swatch that opens native colour picker */}
        <div className="relative flex items-center">
          <button
            type="button"
            title="Font colour"
            className="flex flex-col items-center gap-0.5 rounded border border-notion-line2 bg-white px-1.5 py-1 hover:bg-notion-hover"
            onClick={() => colorInputRef.current?.click()}
          >
            <span className="text-xs font-bold leading-none text-notion-text">A</span>
            <span
              className="h-1 w-4 rounded-sm"
              style={{ backgroundColor: (editor.getAttributes('textStyle').color as string) ?? '#000000' }}
            />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            value={(editor.getAttributes('textStyle').color as string) ?? '#000000'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
          {/* Preset swatches */}
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => editor.chain().focus().setColor(c).run()}
              className="ml-0.5 h-4 w-4 shrink-0 rounded-sm border border-notion-line2"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {divider}

        {/* Highlight */}
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={`Highlight ${c}`}
            onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
            className={`h-4 w-4 shrink-0 rounded-sm border ${editor.isActive('highlight', { color: c }) ? 'border-notion-blue ring-1 ring-notion-blue/40' : 'border-notion-line2'}`}
            style={{ backgroundColor: c }}
          />
        ))}

        {divider}

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn('bulletList')} title="Bullet list">• ≡</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn('orderedList')} title="Ordered list">1. ≡</button>

        {divider}

        {/* Alignment */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={iconBtn(editor.isActive({ textAlign: 'left' }))} title="Align left">⬅</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={iconBtn(editor.isActive({ textAlign: 'center' }))} title="Align centre">↔</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={iconBtn(editor.isActive({ textAlign: 'right' }))} title="Align right">➡</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={iconBtn(editor.isActive({ textAlign: 'justify' }))} title="Justify">⇔</button>

        {divider}

        {/* Undo / Redo */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={iconBtn(false)} title="Undo">↩</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={iconBtn(false)} title="Redo">↪</button>
      </div>

      {/* ── Editor area ──────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 text-sm text-notion-text focus:outline-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  )
}
