/**
 * Copy text to the clipboard, working in both secure and insecure contexts.
 *
 * The async Clipboard API (`navigator.clipboard`) is only defined in **secure
 * contexts** — HTTPS or `localhost`. When the app is served over plain HTTP on
 * a bare IP (e.g. a self-hosted `http://<ip>:<port>` deployment) `navigator.
 * clipboard` is `undefined`, so we fall back to the legacy
 * `document.execCommand('copy')` via an off-screen textarea.
 *
 * @param text the text to place on the clipboard
 * @returns `true` if the copy succeeded, `false` otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Preferred path: async Clipboard API (secure contexts only).
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the legacy path below.
    }
  }

  // Fallback: off-screen textarea + execCommand('copy') for insecure contexts.
  if (typeof document === 'undefined') return false
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    // Keep it out of view and unfocusable-looking without breaking selection.
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
