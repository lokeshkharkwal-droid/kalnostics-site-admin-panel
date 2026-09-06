'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, PageLoader, PdfPreviewOverlay, SelectField, TextArea } from '@/shared/ui'
import { cn } from '@/shared/utils'
import type { EditorTab, PdfTemplateForm, TemplateMeta } from '../interfaces'
import {
  createTemplate,
  fetchTemplateTypes,
  generatePreview,
  getTemplate,
  updateTemplate,
} from '../services/pdf-templates.api'
import {
  emptyTemplateForm,
  FONT_OPTIONS,
  mergeMeta,
  ORIENTATION_OPTIONS,
  PAGE_SIZE_OPTIONS,
} from '../utils/constants'
import { TemplateImageUpload } from './TemplateImageUpload'

/** Meta keys whose value is a plain string (everything except `images`). */
type StringMetaKey = {
  [K in keyof TemplateMeta]: TemplateMeta[K] extends string ? K : never
}[keyof TemplateMeta]

const TABS: { key: EditorTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'header', label: 'Header' },
  { key: 'body', label: 'Body' },
  { key: 'footer', label: 'Footer' },
]

const textareaMono = 'font-mono resize-y'

/**
 * Full-page create/edit editor for a global PDF report template. `id === 'new'`
 * creates; any other id edits. After a create, the URL is swapped in-place (no
 * route remount) so subsequent saves PATCH and Preview becomes available.
 */
export function PdfTemplateEditor({ id }: { id: string }) {
  const router = useRouter()
  const qc = useQueryClient()

  // Save target. Starts at the route id; after a create it becomes the new id.
  const [currentId, setCurrentId] = useState(id)
  const isNew = currentId === 'new'

  const [form, setForm] = useState<PdfTemplateForm>(emptyTemplateForm())
  const [tab, setTab] = useState<EditorTab>('general')
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [savingAndPreviewing, setSavingAndPreviewing] = useState(false)
  const busy = saving || previewing || savingAndPreviewing

  // Load the template for edit (disabled for the create route; the create→edit
  // URL swap uses the History API so the route id stays 'new' and never reloads).
  const { data: loaded, isLoading } = useQuery({
    queryKey: ['siteadmin', 'pdf-template', id],
    queryFn: () => getTemplate(id),
    enabled: id !== 'new',
  })

  const { data: typeData } = useQuery({
    queryKey: ['siteadmin', 'pdf-template-types'],
    queryFn: fetchTemplateTypes,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (loaded) {
      setForm({
        type: loaded.type,
        name: loaded.name,
        isActive: loaded.isActive,
        meta: mergeMeta(loaded.meta),
      })
    }
  }, [loaded])

  // Revoke any outstanding blob URL on unmount.
  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const typeOptions = useMemo(
    () => (typeData?.types ?? []).map((t) => ({ value: t, label: typeData?.labels[t] ?? t })),
    [typeData],
  )

  const setMeta =
    <K extends StringMetaKey>(key: K) =>
    (val: string) =>
      setForm((f) => ({ ...f, meta: { ...f.meta, [key]: val } as TemplateMeta }))

  /**
   * Register an uploaded image in the template's `meta.images` registry and
   * return its token id — the URL's last path segment (e.g. `uuid.png`), which
   * mirrors the legacy `{{image:<id>}}` shape.
   */
  const registerImage = (url: string): string => {
    const id = url.split('/').pop() || url
    setForm((f) => ({
      ...f,
      meta: { ...f.meta, images: { ...(f.meta.images ?? {}), [id]: url } },
    }))
    return id
  }

  /** Append an `{{image:<id>}}` token to a header/body/footer HTML field. */
  const appendToken = (
    key: 'header_html' | 'body_html' | 'footer_html',
    token: string,
  ) =>
    setForm((f) => ({
      ...f,
      meta: {
        ...f.meta,
        [key]: f.meta[key] ? `${f.meta[key]}\n${token}` : token,
      } as TemplateMeta,
    }))

  /** Copy an image's `{{image:<id>}}` token to the clipboard. */
  const copyToken = async (id: string) => {
    const token = `{{image:${id}}}`
    try {
      await navigator.clipboard.writeText(token)
      toast.success(`Copied ${token}`)
    } catch {
      toast.error('Copy failed — select and copy manually')
    }
  }

  /** Chips for every uploaded image; click a chip to copy its token. */
  const renderImageTokens = () => {
    const entries = Object.entries(form.meta.images ?? {})
    if (entries.length === 0) return null
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-notion-sub">
          Uploaded images — click a token to copy it, then paste into the HTML
        </p>
        <div className="flex flex-wrap gap-2">
          {entries.map(([id, url]) => (
            <button
              key={id}
              type="button"
              onClick={() => copyToken(id)}
              className="flex items-center gap-2 rounded-md border border-notion-line px-2 py-1 text-xs hover:bg-notion-hover"
              title="Click to copy token"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={id} className="h-6 w-6 rounded object-cover" />
              <code>{`{{image:${id}}}`}</code>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const invalidateList = () => qc.invalidateQueries({ queryKey: ['siteadmin', 'pdf-templates'] })

  /** Persist the form. Returns the saved id, or null if validation failed. */
  const doSave = async (): Promise<string | null> => {
    if (!form.name.trim() || !form.type) {
      toast.error('Name and type are required')
      return null
    }
    const dto = {
      type: form.type,
      name: form.name.trim(),
      isActive: form.isActive,
      meta: form.meta,
    }
    if (isNew) {
      const created = await createTemplate(dto)
      setCurrentId(created.id)
      // Swap the URL to the edit route without a route change (keeps this
      // component mounted so the preview overlay/state survives).
      window.history.replaceState(null, '', `/pdf-templates/${created.id}`)
      invalidateList()
      return created.id
    }
    await updateTemplate(currentId, dto)
    invalidateList()
    return currentId
  }

  const showPreview = async (targetId: string) => {
    const blob = await generatePreview(targetId)
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview({ url: URL.createObjectURL(blob), name: form.name || 'template' })
  }

  const onSaveOnly = async () => {
    setSaving(true)
    try {
      const savedId = await doSave()
      if (savedId) router.push('/pdf-templates')
    } catch {
      /* error toast handled globally */
    } finally {
      setSaving(false)
    }
  }

  const onPreviewOnly = async () => {
    setPreviewing(true)
    try {
      await showPreview(currentId)
    } catch {
      /* error toast handled globally */
    } finally {
      setPreviewing(false)
    }
  }

  const onSaveAndPreview = async () => {
    setSavingAndPreviewing(true)
    try {
      const savedId = await doSave()
      if (savedId) await showPreview(savedId)
    } catch {
      /* error toast handled globally */
    } finally {
      setSavingAndPreviewing(false)
    }
  }

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  const actionBar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => router.push('/pdf-templates')} disabled={busy}>
        Cancel
      </Button>
      {!isNew && (
        <Button variant="secondary" size="sm" loading={previewing} disabled={busy} onClick={onPreviewOnly}>
          Preview
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        loading={savingAndPreviewing}
        disabled={busy}
        onClick={onSaveAndPreview}
      >
        Save &amp; Preview
      </Button>
      <Button size="sm" loading={saving} disabled={busy} onClick={onSaveOnly}>
        {isNew ? 'Create' : 'Save Changes'}
      </Button>
    </div>
  )

  if (id !== 'new' && isLoading) {
    return (
      <div className="flex flex-col overflow-auto">
        <AdminHeader title="Edit PDF Template" subtitle="Loading…" />
        <main className="flex-1 p-6">
          <Card>
            <CardContent>
              <PageLoader />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={isNew ? 'New PDF Template' : 'Edit PDF Template'}
        subtitle="Design a global PDF report template"
        actions={actionBar}
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Top-level fields */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectField
                label="Type"
                value={form.type}
                options={typeOptions}
                onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              />
              <Input
                label="Name"
                placeholder="e.g. Lab Report Default"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <SelectField
                label="Status"
                value={form.isActive ? '1' : '0'}
                options={[
                  { value: '1', label: 'Active' },
                  { value: '0', label: 'Inactive' },
                ]}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v === '1' }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-notion-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'border-b-2 border-notion-blue text-notion-text'
                  : 'text-notion-sub hover:text-notion-text',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent>
            {tab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <SelectField
                    label="Orientation"
                    value={form.meta.orientation}
                    options={ORIENTATION_OPTIONS}
                    onChange={setMeta('orientation')}
                  />
                  <SelectField
                    label="Page Size"
                    value={form.meta.page_size}
                    options={PAGE_SIZE_OPTIONS}
                    onChange={setMeta('page_size')}
                  />
                  <Input
                    label="Default Font Size"
                    value={form.meta.default_font_size}
                    onChange={(e) => setMeta('default_font_size')(e.target.value)}
                  />
                  <SelectField
                    label="Default Font"
                    value={form.meta.default_font}
                    options={FONT_OPTIONS}
                    onChange={setMeta('default_font')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Input label="Margin Left (mm)" value={form.meta.margin_left} onChange={(e) => setMeta('margin_left')(e.target.value)} />
                  <Input label="Margin Right (mm)" value={form.meta.margin_right} onChange={(e) => setMeta('margin_right')(e.target.value)} />
                  <Input label="Margin Top (mm)" value={form.meta.margin_top} onChange={(e) => setMeta('margin_top')(e.target.value)} />
                  <Input label="Margin Bottom (mm)" value={form.meta.margin_bottom} onChange={(e) => setMeta('margin_bottom')(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Input label="Margin Header (mm)" value={form.meta.margin_header} onChange={(e) => setMeta('margin_header')(e.target.value)} />
                  <Input label="Margin Footer (mm)" value={form.meta.margin_footer} onChange={(e) => setMeta('margin_footer')(e.target.value)} />
                  <Input label="Watermark Text" value={form.meta.watermark_text} onChange={(e) => setMeta('watermark_text')(e.target.value)} />
                  <Input label="Template Version" value={form.meta.template_version} onChange={(e) => setMeta('template_version')(e.target.value)} />
                </div>
                <TextArea
                  label="Custom CSS"
                  rows={10}
                  className={textareaMono}
                  value={form.meta.custom_css}
                  onChange={(e) => setMeta('custom_css')(e.target.value)}
                />

                {/* Watermark image — applied automatically (wins over Watermark Text). */}
                <div className="space-y-2 border-t border-notion-line pt-4">
                  <p className="text-sm font-medium text-notion-text">Watermark Image</p>
                  <p className="text-xs text-notion-faint">
                    Upload an image to use as the PDF watermark. It is applied
                    automatically to every page (takes precedence over Watermark Text) —
                    no HTML needed.
                  </p>
                  <div className="flex items-center gap-3">
                    <TemplateImageUpload
                      label="Upload Watermark Image"
                      onUploaded={(url) => setMeta('watermark_image')(url)}
                    />
                    {form.meta.watermark_image && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMeta('watermark_image')('')}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {form.meta.watermark_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.meta.watermark_image}
                      alt="watermark"
                      className="mt-2 max-h-32 rounded border border-notion-line"
                    />
                  )}
                </div>
              </div>
            )}

            {tab === 'header' && (
              <div className="space-y-4">
                <Input label="Header Name" value={form.meta.header_name} onChange={(e) => setMeta('header_name')(e.target.value)} />
                <TextArea
                  label="Header HTML"
                  rows={20}
                  className={textareaMono}
                  value={form.meta.header_html}
                  onChange={(e) => setMeta('header_html')(e.target.value)}
                />
                <p className="text-xs text-notion-faint">
                  Template vars like <code>{'{hospital_name}'}</code>, <code>{'{hospital_address}'}</code>,{' '}
                  <code>{'{{image:ID}}'}</code> are replaced at render time.
                </p>
                <div className="flex items-center gap-3 border-t border-notion-line pt-4">
                  <TemplateImageUpload
                    label="Add Image"
                    onUploaded={(url) => copyToken(registerImage(url))}
                  />
                  <span className="text-xs text-notion-faint">
                    Uploads an image and copies its <code>{'{{image:ID}}'}</code> token —
                    paste it wherever you want the image in the Header HTML.
                  </span>
                </div>
                {renderImageTokens()}
              </div>
            )}

            {tab === 'body' && (
              <div className="space-y-4">
                <Input label="Body Name" value={form.meta.body_name} onChange={(e) => setMeta('body_name')(e.target.value)} />
                <TextArea
                  label="Body HTML"
                  rows={25}
                  className={textareaMono}
                  value={form.meta.body_html}
                  onChange={(e) => setMeta('body_html')(e.target.value)}
                />
                <Input
                  label="Associate Body Image"
                  value={form.meta.associate_body_image}
                  onChange={(e) => setMeta('associate_body_image')(e.target.value)}
                />
                <div className="space-y-1 text-xs text-notion-faint">
                  <p>Repeating sections:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>Lab Panel: repeat inside <code>{'<div id="panel_section">'}</code></li>
                    <li>Lab Test: repeat inside <code>{'<tbody>'}</code></li>
                    <li>Lab Bill Order: repeat inside <code>{'<tr id="order_test_section">'}</code></li>
                    <li>Signing authority: wrap in <code>{'<signing_authority_tag>'}</code></li>
                  </ul>
                </div>
                <div className="flex items-center gap-3 border-t border-notion-line pt-4">
                  <TemplateImageUpload
                    label="Add Image"
                    onUploaded={(url) => appendToken('body_html', `{{image:${registerImage(url)}}}`)}
                  />
                  <span className="text-xs text-notion-faint">
                    Uploads an image and appends its <code>{'{{image:ID}}'}</code> token to
                    the Body HTML above.
                  </span>
                </div>
                {renderImageTokens()}
              </div>
            )}

            {tab === 'footer' && (
              <div className="space-y-4">
                <Input label="Footer Name" value={form.meta.footer_name} onChange={(e) => setMeta('footer_name')(e.target.value)} />
                <TextArea
                  label="Footer HTML"
                  rows={20}
                  className={textareaMono}
                  value={form.meta.footer_html}
                  onChange={(e) => setMeta('footer_html')(e.target.value)}
                />
                <p className="text-xs text-notion-faint">
                  Use <code>{'<signing_authority_tag>'}</code> for signing sections.
                </p>
                <div className="flex items-center gap-3 border-t border-notion-line pt-4">
                  <TemplateImageUpload
                    label="Add Image"
                    onUploaded={(url) => appendToken('footer_html', `{{image:${registerImage(url)}}}`)}
                  />
                  <span className="text-xs text-notion-faint">
                    Uploads an image and appends its <code>{'{{image:ID}}'}</code> token to
                    the Footer HTML above.
                  </span>
                </div>
                {renderImageTokens()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom save bar */}
        {actionBar}
      </main>

      {preview && (
        <PdfPreviewOverlay url={preview.url} name={preview.name} onClose={closePreview} />
      )}
    </div>
  )
}
