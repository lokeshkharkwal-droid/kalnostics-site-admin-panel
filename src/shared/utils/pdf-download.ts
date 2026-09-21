/**
 * PDF blob helpers for the Site Admin app.
 *
 * Chrome's built-in PDF viewer names a download after the blob URL's random id
 * and ignores `Content-Disposition`, so the filename must be controlled by us
 * (via an anchor `download` attribute). `openPdfBlob` opens the PDF in a new tab
 * that embeds it for viewing and offers a **Download** button named
 * `<Template Name>.pdf`. Mirrors `kaltros-fe/src/lib/print-templates` so both
 * apps behave the same.
 */

/** Escape a string for safe interpolation into HTML text / attributes. */
function escapeHtmlAttr(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c] as string,
  )
}

/**
 * Build a safe, human-friendly PDF filename from a template name. Strips
 * characters illegal in filenames, collapses whitespace, appends `.pdf`, and
 * falls back to `document.pdf` when the name is blank.
 */
export function pdfFilename(templateName?: string): string {
  const cleaned = (templateName ?? '')
    // Strip characters illegal in filenames + control chars (keep letters,
    // digits, spaces, hyphens, underscores, dots, etc.).
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return 'document.pdf'
  return /\.pdf$/i.test(cleaned) ? cleaned : `${cleaned}.pdf`
}

/**
 * Save a rendered PDF blob to disk as `filename`.
 */
export function downloadPdfBlob(blob: Blob, filename = 'document.pdf'): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Open a rendered PDF blob in a new browser tab with a reliable, named Download
 * button. Falls back to a direct named download if pop-ups are blocked.
 */
export function openPdfBlob(blob: Blob, filename = 'document.pdf'): void {
  const url = URL.createObjectURL(blob)
  const w = window.open('', '_blank')
  if (!w) {
    downloadPdfBlob(blob, filename)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }
  const safeName = escapeHtmlAttr(filename)
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeName}</title>
<style>
  html,body{margin:0;height:100%;background:#525659;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  .bar{display:flex;align-items:center;justify-content:space-between;gap:12px;height:44px;padding:0 14px;background:#323639;color:#fff;font-size:13px}
  .bar .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bar a{background:#2b6cb0;color:#fff;text-decoration:none;font-weight:600;padding:7px 14px;border-radius:6px;font-size:12px}
  .bar a:hover{background:#2c5282}
  embed{width:100%;height:calc(100% - 44px);border:0}
</style>
</head>
<body>
  <div class="bar">
    <span class="name">${safeName}</span>
    <a href="${url}" download="${safeName}">Download</a>
  </div>
  <embed src="${url}" type="application/pdf" />
</body>
</html>`)
  w.document.close()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
