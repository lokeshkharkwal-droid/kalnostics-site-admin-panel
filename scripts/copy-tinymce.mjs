/*
 * Copy the self-hosted TinyMCE distribution into `public/tinymce` so the editor
 * loads via `tinymceScriptSrc="/tinymce/tinymce.min.js"` with no Tiny Cloud API
 * key (GPL, self-hosted). Runs on `postinstall`; `public/tinymce` is generated
 * (git-ignored), so this must run in every build/CI environment too.
 */
import { cp, rm, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules', 'tinymce')
const dest = resolve(root, 'public', 'tinymce')

try {
  await access(src)
} catch {
  // tinymce not installed yet (e.g. first-ever install ordering) — skip quietly.
  console.warn('[copy-tinymce] node_modules/tinymce not found; skipping copy.')
  process.exit(0)
}

await rm(dest, { recursive: true, force: true })
await cp(src, dest, { recursive: true })
console.log('[copy-tinymce] copied node_modules/tinymce -> public/tinymce')
