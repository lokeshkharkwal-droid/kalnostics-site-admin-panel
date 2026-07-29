'use client'

import { Editor } from '@tinymce/tinymce-react'
import type { Editor as TinyMCEEditor } from 'tinymce'

interface HtmlEditorProps {
  /** Current HTML. */
  value: string
  /** Fired with the editor's HTML on every change. */
  onChange: (html: string) => void
  readOnly?: boolean
  minHeight?: number
  placeholder?: string
}

/**
 * Reusable WYSIWYG HTML editor built on **TinyMCE Community (self-hosted, GPL)**.
 *
 * Self-hosted so there is no Tiny Cloud API key: the distribution is copied to
 * `public/tinymce` by `scripts/copy-tinymce.mjs` (postinstall) and loaded via
 * `tinymceScriptSrc`; `licenseKey="gpl"` declares the GPL terms. Emits plain
 * HTML via `onChange`, which is exactly what we persist — TinyMCE round-trips
 * HTML losslessly, including through its Source Code dialog.
 *
 * Client-only (touches `window`), so mount it via `next/dynamic` with
 * `ssr: false`.
 */
export function HtmlEditor({ value, onChange, readOnly = false, minHeight = 420, placeholder }: HtmlEditorProps) {
  return (
    <>
      {/*
       * Shrink the TinyMCE toolbar icons for a tighter, more professional look.
       * TinyMCE 8's icons are 24x24 SVGs with NO viewBox, so resizing them via
       * CSS width/height CROPS (zooms) the icon instead of scaling it. Scale
       * them down with a transform instead; `transform-box: fill-box` +
       * `transform-origin: center` keep each icon centred in its button. The
       * toolbar lives in the light DOM (only the content is in the iframe), so
       * this global stylesheet reaches it. Injected as a plain <style> (not
       * styled-jsx) so it needs no build-time type augmentation.
       */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            '.tox-tinymce .tox-tbtn svg{transform:scale(0.66);transform-box:fill-box;transform-origin:center}',
        }}
      />
      <Editor
      // Self-hosted TinyMCE lives in `public/tinymce`, which Next serves UNDER
      // the app's basePath (e.g. `/admin/tinymce/...`). A bare `/tinymce/...`
      // would resolve at the origin root and hit the Kaltros SPA instead, so
      // we prefix the basePath. `NEXT_PUBLIC_BASE_PATH` is inlined at build.
      tinymceScriptSrc={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/tinymce/tinymce.min.js`}
      licenseKey="gpl"
      value={value}
      // Lock the content via TinyMCE's readonly *mode* rather than the `disabled`
      // prop: readonly keeps the text crisp and readable (right for a View screen)
      // and reliably makes the editable body non-editable on mount, whereas the
      // `disabled` prop greys the content and can miss the initial lock. Toolbar
      // and menubar are already hidden below when `readOnly`.
      onInit={(_evt, editor: TinyMCEEditor) => editor.mode.set(readOnly ? 'readonly' : 'design')}
      onEditorChange={(html: string) => onChange(html)}
      init={{
        height: minHeight,
        menubar: readOnly ? false : 'edit view insert format tools table',
        placeholder,
        branding: false,
        promotion: false,
        statusbar: true,
        // Community (free) plugins only. `code` = Source Code dialog (HTML
        // round-trip); `searchreplace` = Find & Replace. `hr` plugin was removed
        // in TinyMCE 6+, so we register a custom toolbar button below.
        plugins:
          'advlist autolink lists link image table code codesample searchreplace wordcount fullscreen visualblocks charmap insertdatetime',
        // A `toolbar` array renders one row per entry — this pins it to exactly
        // three rows (format · align/structure · insert/tools). `wrap` mode is a
        // safety net so a narrow viewport wraps rather than hiding buttons.
        toolbar: readOnly
          ? false
          : [
              'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor removeformat',
              'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote hr',
              'link image table codesample charmap insertdatetime | code searchreplace fullscreen',
            ],
        toolbar_mode: 'wrap',
        // Responsive images + tables, and a readable content font.
        content_style:
          'body{font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#37352f;line-height:1.6} ' +
          'img{max-width:100%;height:auto} ' +
          'table{width:100%;border-collapse:collapse} ' +
          'table td,table th{border:1px solid #e3e2e0;padding:6px 8px} ' +
          'blockquote{border-left:3px solid #e3e2e0;margin:0;padding-left:12px;color:#787774}',
        image_dimensions: true,
        image_advtab: true,
        image_caption: true,
        table_sizing_mode: 'responsive',
        // Preserve pasted HTML formatting rather than stripping to plain text.
        paste_as_text: false,
        setup: (editor: TinyMCEEditor) => {
          editor.ui.registry.addButton('hr', {
            icon: 'horizontal-rule',
            tooltip: 'Horizontal line',
            onAction: () => editor.execCommand('InsertHorizontalRule'),
          })
        },
      }}
      />
    </>
  )
}
