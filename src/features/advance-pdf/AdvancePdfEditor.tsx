'use client';

/**
 * Visual 3-pane editor for the Advance PDF Template module.
 *
 * Pure UI: every doc operation is an immutable transform via the
 * shared `utils/document-ops` helpers, every render goes through the
 * backend `/pdf-v2/preview-html` round-trip. Both site-admin and
 * business-admin mount this — the `basePath` prop drives the back
 * button and any router pushes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { copyToClipboard } from '@/shared/utils';
import {
  getTemplate,
  saveDoc,
  saveName,
  activateTemplate,
  duplicateTemplate,
  renderPdf,
  fetchPreviewHtml,
  toContextType,
  type AdvanceTemplateFull as AdvanceTemplate,
} from './services/advance-pdf.api';

import type { AdvanceDocument, Block, BlockType, DocPath, PageSettings, Theme } from '@/lib/pdf-v2-types';
import { THEME_PRESETS, matchPreset } from './utils/theme-presets';
import { BlockTree } from './components/BlockTree';
import { BlockPalette } from './components/BlockPalette';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ImageUploadButton } from './components/ImageUploadButton';
import {
  appendBlock, blockChildArrayPaths, clone, duplicateBlockAt,
  moveBlock, moveBlockAcross, pathsEqual, readPath, removeBlockAt, reorderBlocks, setPath,
  splitBlockPath,
} from './utils/document-ops';
import { newBlock } from './utils/block-defaults';
import { validateTokens, type ValidationIssue } from './utils/validate-tokens';
import { importHtml } from './utils/html-import';

/**
 * Visual 3-pane editor.
 *
 * Layout:
 *   ┌─────────────┬───────────────────────────┬─────────────────┐
 *   │  Tree +     │  Live preview (iframe)    │  Properties +   │
 *   │  Palette    │                           │  Style          │
 *   └─────────────┴───────────────────────────┴─────────────────┘
 *
 * State flow: every edit produces a new doc via immutable doc-ops, the
 * page POSTs the saved doc to /pdf-v2/templates/:id (debounced) and
 * fetches the rendered HTML for the iframe. The "active path" tracks
 * which block the right pane is editing — `null` falls back to a
 * Page Settings panel.
 */

export interface AdvancePdfEditorProps {
  /** Listing URL prefix — e.g. `/business-admin/templates/advance-pdf`. */
  basePath: string;
}

export function AdvancePdfEditor({ basePath }: AdvancePdfEditorProps) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { toast, toasts, dismiss } = useToast();

  const [tpl,       setTpl]       = useState<AdvanceTemplate | null>(null);
  const [doc,       setDoc]       = useState<AdvanceDocument | null>(null);
  const [name,      setName]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [selectedPath, setSelectedPath] = useState<DocPath | null>(null);
  const [insertRegion, setInsertRegion] = useState<'header' | 'body' | 'footer'>('body');
  const [validationOpen, setValidationOpen] = useState(false);
  const [htmlImportOpen, setHtmlImportOpen] = useState(false);
  const [htmlImportText, setHtmlImportText] = useState('');
  const [htmlImportTarget, setHtmlImportTarget] = useState<'append' | 'replace'>('append');
  const [jsonViewOpen, setJsonViewOpen] = useState(false);
  const [jsonText,    setJsonText]    = useState('');
  const [jsonError,   setJsonError]   = useState<string | null>(null);
  const [jsonCopied,  setJsonCopied]  = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const importInputRef   = useRef<HTMLInputElement>(null);

  // ── Undo / redo history ────────────────────────────────────────────
  // Bounded ring buffer of doc snapshots. Pushes coalesce when fired
  // within COALESCE_MS so that fast-typing in a TextField doesn't
  // produce one undo entry per keystroke.
  const HISTORY_MAX  = 100;
  const COALESCE_MS  = 350;
  const historyRef   = useRef<AdvanceDocument[]>([]);
  const pointerRef   = useRef<number>(-1);
  const lastPushAtRef = useRef<number>(0);
  const [historyVer, setHistoryVer] = useState(0);   // bumps when pointer/length change → toolbar re-renders

  const resetHistory = useCallback((initial: AdvanceDocument) => {
    historyRef.current   = [initial];
    pointerRef.current   = 0;
    lastPushAtRef.current = 0;
    setHistoryVer((v) => v + 1);
  }, []);

  /**
   * Record a new doc snapshot. Drops any forward states (so a fresh
   * edit after an undo branches the timeline at the current pointer).
   */
  const trackDoc = useCallback((next: AdvanceDocument) => {
    const now = Date.now();
    const hist = historyRef.current;
    const ptr  = pointerRef.current;
    const coalesce = (now - lastPushAtRef.current) < COALESCE_MS && ptr >= 0;
    if (coalesce) {
      hist[ptr] = next;
    } else {
      const truncated = hist.slice(0, ptr + 1);
      truncated.push(next);
      while (truncated.length > HISTORY_MAX) truncated.shift();
      historyRef.current = truncated;
      pointerRef.current = truncated.length - 1;
    }
    lastPushAtRef.current = now;
    setHistoryVer((v) => v + 1);
  }, []);

  /** Tracked doc setter — every editor action funnels through this. */
  const applyDoc = useCallback((next: AdvanceDocument) => {
    setDoc(next);
    trackDoc(next);
  }, [trackDoc]);

  const canUndo = pointerRef.current > 0;
  const canRedo = pointerRef.current >= 0 && pointerRef.current < historyRef.current.length - 1;
  void historyVer; // keep React aware that this is a render-time read

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return;
    pointerRef.current -= 1;
    const snap = historyRef.current[pointerRef.current];
    setDoc(snap);
    lastPushAtRef.current = 0;     // never coalesce with the next push
    setHistoryVer((v) => v + 1);
  }, []);
  const redo = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return;
    pointerRef.current += 1;
    const snap = historyRef.current[pointerRef.current];
    setDoc(snap);
    lastPushAtRef.current = 0;
    setHistoryVer((v) => v + 1);
  }, []);

  // ── Load ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getTemplate(id);
      setTpl(t);
      setName(t.name);
      setDoc(t.doc);
      resetHistory(t.doc);
    } catch {
      toast('Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // ── Save + preview round-trip (debounced) ──────────────────────────
  const lastSavedDocRef = useRef<string | null>(null);
  useEffect(() => {
    if (!doc || !tpl) return;
    const json = JSON.stringify(doc);
    if (json === lastSavedDocRef.current) return;
    const timer = setTimeout(async () => {
      setPreviewBusy(true);
      try {
        await saveDoc(id, doc);
        lastSavedDocRef.current = json;
        setPreviewHtml(await fetchPreviewHtml(id));
      } catch (e) {
        toast(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? 'Preview failed',
          'error',
        );
      } finally {
        setPreviewBusy(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, tpl, id]);

  // Pipe preview HTML into the iframe via blob URL. The hash anchors
  // the view to the active Insert-Into region — the preview HTML uses
  // `:target` to highlight the matching `<section id="pdfv2-region-…">`
  // band and the browser auto-scrolls to it on load.
  useEffect(() => {
    const iframe = previewIframeRef.current;
    if (!iframe) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    iframe.src = `${url}#pdfv2-region-${insertRegion}`;
    return () => URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewHtml]);

  // When the user toggles Header / Body / Footer (without doc changes),
  // just update the iframe hash so the existing document re-targets
  // the new region — no re-fetch, no full reload.
  useEffect(() => {
    const iframe = previewIframeRef.current;
    const win    = iframe?.contentWindow;
    if (!iframe || !win) return;
    try {
      win.location.hash = `pdfv2-region-${insertRegion}`;
    } catch {
      /* iframe document not yet ready — the previewHtml effect above
         will pick the hash up on first load. */
    }
  }, [insertRegion]);

  // ── Selected block accessor ────────────────────────────────────────
  const selectedBlock = useMemo<Block | null>(() => {
    if (!doc || !selectedPath) return null;
    return readPath(doc, selectedPath) as Block | null;
  }, [doc, selectedPath]);

  // ── Doc mutations ──────────────────────────────────────────────────
  const updateBlockAt = (path: DocPath, next: Block) => {
    if (!doc) return;
    applyDoc(setPath(doc, path, next));
  };
  const handleMove = (parent: DocPath, index: number, delta: -1 | 1) => {
    if (!doc) return;
    applyDoc(moveBlock(doc, parent, index, delta));
    // Keep selection on the moved block.
    if (selectedPath && pathsEqual(selectedPath.slice(0, -1), parent)
        && Number(selectedPath[selectedPath.length - 1]) === index) {
      setSelectedPath([...parent, index + delta]);
    }
  };
  const handleDuplicate = (parent: DocPath, index: number) => {
    if (!doc) return;
    applyDoc(duplicateBlockAt(doc, parent, index));
    setSelectedPath([...parent, index + 1]);
  };
  const handleDelete = (parent: DocPath, index: number) => {
    if (!doc) return;
    applyDoc(removeBlockAt(doc, parent, index));
    setSelectedPath(null);
  };
  const handleReorder = (parent: DocPath, fromIndex: number, toIndex: number) => {
    if (!doc) return;
    applyDoc(reorderBlocks(doc, parent, fromIndex, toIndex));
    // Carry selection along when the dragged row was selected.
    if (selectedPath && pathsEqual(selectedPath.slice(0, -1), parent)
        && Number(selectedPath[selectedPath.length - 1]) === fromIndex) {
      setSelectedPath([...parent, toIndex]);
    }
  };
  const handleMoveAcross = (
    fromParent: DocPath, fromIndex: number,
    toParent:   DocPath, toIndex:   number,
  ) => {
    if (!doc) return;
    applyDoc(moveBlockAcross(doc, fromParent, fromIndex, toParent, toIndex));
    // Selection follows the dragged block when the user had it active.
    if (selectedPath && pathsEqual(selectedPath.slice(0, -1), fromParent)
        && Number(selectedPath[selectedPath.length - 1]) === fromIndex) {
      setSelectedPath([...toParent, toIndex]);
    } else {
      // Selection inside the source array but past fromIndex shifts up
      // by one when the source was removed.
      if (selectedPath && pathsEqual(selectedPath.slice(0, -1), fromParent)) {
        const cur = Number(selectedPath[selectedPath.length - 1]);
        if (cur > fromIndex) setSelectedPath([...fromParent, cur - 1]);
      }
    }
  };

  /**
   * Insert target picker: when a container block is selected, new
   * blocks are appended into its first child-array. Otherwise we use
   * the explicit Header/Body/Footer toggle. Falls back to Body.
   */
  const insertTargetPath = (): DocPath => {
    if (selectedPath && selectedBlock) {
      const childPaths = blockChildArrayPaths(selectedBlock);
      if (childPaths.length > 0) {
        return [...selectedPath, ...childPaths[0]];
      }
    }
    return [insertRegion, 'blocks'];
  };

  const handleInsert = (type: BlockType) => {
    if (!doc) return;
    const target = insertTargetPath();
    const block  = newBlock(type);
    const next   = appendBlock(doc, target, block);
    applyDoc(next);
    // Compute the path of the just-inserted block to auto-select it.
    const newArr = readPath(next, target) as Block[];
    setSelectedPath([...target, newArr.length - 1]);
  };

  // ── Toolbar actions ────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!name.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      await saveName(id, name.trim());
      toast('Saved', 'success');
    } catch {
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!tpl) return;
    try {
      await activateTemplate(id);
      setTpl({ ...tpl, status: 1 });
      toast('This template is now active for ' + tpl.type, 'success');
    } catch {
      toast('Could not activate template', 'error');
    }
  };

  const handleDownloadPdf = async () => {
    if (!tpl) return;
    try {
      const blob = await renderPdf(id);
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      toast(`Download failed: ${(e as Error).message}`, 'error');
    }
  };

  // Save-as: server-side duplicate, then jump into the new template.
  // Reuses the duplicate endpoint so there's a single create path.
  const handleSaveAs = async () => {
    try {
      const newId = await duplicateTemplate(id);
      if (!newId) throw new Error('Duplicate did not return an id');
      toast('Cloned. Opening new template…', 'success');
      router.push(`${basePath}/${newId}`);
    } catch {
      toast('Could not clone template', 'error');
    }
  };

  const openJsonView = () => {
    if (!doc) return;
    setJsonText(JSON.stringify(doc, null, 2));
    setJsonError(null);
    setJsonCopied(false);
    setJsonViewOpen(true);
  };

  const handleCopyJson = async () => {
    const ok = await copyToClipboard(jsonText);
    if (!ok) {
      toast('Could not copy — select the text manually.', 'error');
      return;
    }
    setJsonCopied(true);
    // Reset the "Copied!" affordance after a beat so the user can copy again.
    setTimeout(() => setJsonCopied(false), 1500);
  };

  const handleApplyJson = () => {
    if (!doc) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setJsonError(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    // Same shape gate as Import JSON — full schema validation lives on
    // the backend; this just rejects obvious nonsense before the doc
    // lands in undo history.
    if (!parsed || typeof parsed !== 'object'
        || !(parsed as Record<string, unknown>).body
        || !(parsed as Record<string, unknown>).page
        || !(parsed as Record<string, unknown>).theme) {
      setJsonError('JSON does not look like an advance document — needs page / theme / body / header / footer.');
      return;
    }
    setJsonError(null);
    applyDoc(parsed as AdvanceDocument);
    setJsonViewOpen(false);
    toast('Document updated from JSON.', 'success');
  };

  const handleExportJson = () => {
    if (!doc || !tpl) return;
    const safeName = (tpl.name || 'advance-template').replace(/[^A-Za-z0-9_.-]+/g, '_');
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${safeName}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const handleHtmlImportConfirm = () => {
    if (!doc) return;
    const trimmed = htmlImportText.trim();
    if (!trimmed) { toast('Paste some HTML first', 'warning'); return; }
    const { blocks, warnings } = importHtml(trimmed);
    if (blocks.length === 0) { toast('No supported blocks found in that HTML', 'warning'); return; }
    const next: AdvanceDocument = {
      ...doc,
      body: {
        blocks: htmlImportTarget === 'replace' ? blocks : [...doc.body.blocks, ...blocks],
      },
    };
    applyDoc(next);
    setHtmlImportOpen(false);
    setHtmlImportText('');
    if (warnings.length > 0) {
      toast(`Imported ${blocks.length} block${blocks.length === 1 ? '' : 's'} — ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`, 'warning');
    } else {
      toast(`Imported ${blocks.length} block${blocks.length === 1 ? '' : 's'}.`, 'success');
    }
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? ''));
        // Light shape check — full schema validation lives on the backend.
        if (!parsed || typeof parsed !== 'object' || !parsed.body || !parsed.page || !parsed.theme) {
          throw new Error('JSON does not look like an advance document');
        }
        applyDoc(parsed as AdvanceDocument);
        toast('Imported. Review the preview before saving.', 'success');
      } catch (e) {
        toast(`Import failed: ${(e as Error).message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Cmd/Ctrl-Z to undo, Cmd/Ctrl-Shift-Z (or Cmd/Ctrl-Y) to redo.
  // Skip when focus is in a text field — browsers' built-in undo is
  // expected there.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Validation issues — recomputed only when the user opens the panel
  // so we don't pay the walk cost on every keystroke.
  const issues = useMemo<ValidationIssue[]>(
    () => (validationOpen && doc && tpl ? validateTokens(doc, toContextType(tpl.type)) : []),
    [validationOpen, doc, tpl],
  );

  if (loading || !tpl || !doc) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  // ── Render ─────────────────────────────────────────────────────────
  const treeBlocks = {
    header: doc.header.blocks,
    body:   doc.body.blocks,
    footer: doc.footer.blocks,
  };
  const insertHint =
    selectedBlock && blockChildArrayPaths(selectedBlock).length > 0
      ? `Inserting into selected ${selectedBlock.type} →`
      : `Inserting into ${insertRegion} →`;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <input
          type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSaveName}
          className="flex-1 max-w-md h-8 px-2 rounded border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <span className="text-xs text-slate-400">Type: <b className="text-slate-700">{tpl.type}</b></span>
        <span className="text-xs text-slate-400">Scope: <b className="text-slate-700">{tpl.scope}</b></span>
        {tpl.status === 1 ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-wide">Active</span>
        ) : (
          <button onClick={handleActivate}
            className="px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-semibold uppercase tracking-wide">
            Make active
          </button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <button type="button" title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo}
            onClick={undo}
            className="text-xs px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent">↶</button>
          <button type="button" title="Redo (Ctrl/Cmd+Shift+Z)" disabled={!canRedo}
            onClick={redo}
            className="text-xs px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent">↷</button>
        </div>
        <button onClick={() => setValidationOpen((v) => !v)}
          className={`text-xs underline ${validationOpen ? 'text-amber-700' : 'text-slate-600 hover:text-slate-800'}`}>
          {validationOpen ? 'Hide issues' : 'Validate'}
        </button>
        <button onClick={handleSaveAs} className="text-xs text-slate-600 hover:text-slate-800 underline">Save as…</button>
        <button onClick={openJsonView} className="text-xs text-slate-600 hover:text-slate-800 underline">View JSON</button>
        <button onClick={handleExportJson} className="text-xs text-slate-600 hover:text-slate-800 underline">Export JSON</button>
        <button onClick={() => importInputRef.current?.click()}
          className="text-xs text-slate-600 hover:text-slate-800 underline">Import JSON</button>
        <button onClick={() => { setHtmlImportText(''); setHtmlImportTarget('append'); setHtmlImportOpen(true); }}
          className="text-xs text-slate-600 hover:text-slate-800 underline">Import HTML</button>
        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportJson(f);
            e.target.value = '';
          }}
        />
        <button onClick={handleDownloadPdf} className="text-xs text-sky-600 hover:text-sky-800 underline">Open PDF</button>
        <Button onClick={handleSaveName} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>

      {validationOpen && (
        <div className="border-b border-slate-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 max-h-32 overflow-y-auto shrink-0">
          {issues.length === 0 ? (
            <span className="text-emerald-700">No unknown tokens detected for context type <b>{tpl.type}</b>.</span>
          ) : (
            <>
              <div className="font-semibold mb-1">{issues.length} unknown token{issues.length === 1 ? '' : 's'}:</div>
              <ul className="space-y-0.5">
                {issues.map((iss, i) => (
                  <li key={i} className="flex gap-2">
                    <code className="font-mono text-amber-800">{iss.token}</code>
                    <span className="text-slate-600">in</span>
                    <span className="text-slate-700">{iss.location}</span>
                    <span className="text-slate-500 italic">— {iss.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* ── 3-pane layout ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Left: tree + palette */}
        <div className="w-72 border-r border-slate-200 bg-slate-50 overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Document</p>
            <BlockTree
              blocks={treeBlocks}
              selectedPath={selectedPath}
              onSelect={(p) => setSelectedPath(p)}
              onMove={handleMove}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onMoveAcross={handleMoveAcross}
            />
          </div>
          <div className="p-3 border-b border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Insert into</p>
            <div className="flex gap-1 mb-2">
              {(['header', 'body', 'footer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInsertRegion(r)}
                  className={`flex-1 px-2 py-1 rounded text-[11px] capitalize ${
                    insertRegion === r ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >{r}</button>
              ))}
            </div>
            <BlockPalette onInsert={handleInsert} hint={insertHint} />
          </div>
        </div>

        {/* Center: live preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-200">
          <div className="px-3 py-2 text-xs text-slate-500 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span>Preview (sample data)</span>
            {previewBusy && <Spinner />}
          </div>
          <iframe ref={previewIframeRef} className="flex-1 w-full bg-white" title="Preview" />
        </div>

        {/* Right: properties / page settings */}
        <div className="w-[22rem] border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span>{selectedBlock ? 'Block properties' : 'Page settings'}</span>
            {selectedBlock && (
              <button onClick={() => setSelectedPath(null)}
                className="text-[11px] text-slate-400 hover:text-slate-700 underline">
                Deselect
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {selectedBlock ? (
              <PropertiesPanel
                block={selectedBlock}
                onChange={(next) => selectedPath && updateBlockAt(selectedPath, next)}
                contextType={toContextType(tpl.type)}
              />
            ) : (
              <PageSettingsPanel
                page={doc.page}
                theme={doc.theme}
                onChange={(next) => applyDoc({ ...doc, page: next })}
                onThemeChange={(next, mirrorTextColor) =>
                  applyDoc({
                    ...doc,
                    theme: next,
                    page: mirrorTextColor
                      ? { ...doc.page, default_font: { ...doc.page.default_font, color: next.colors.text } }
                      : doc.page,
                  })
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* HTML import — paste HTML and convert to advance blocks. Useful
          for migrating legacy `pdf_template` HTML or for power users
          who keep designs outside this editor. */}
      {htmlImportOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setHtmlImportOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col"
            style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-100 bg-sky-50 rounded-t-xl flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sky-700">Import HTML</h2>
              <button onClick={() => setHtmlImportOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <p className="text-xs text-slate-500">
                Paste HTML below — the importer maps headings, paragraphs, tables, images,
                lists, and flex containers to advance blocks. Inline <code>style</code> attributes
                become block-style overrides. <code>{'{tokens}'}</code> in text are preserved as-is.
              </p>
              <textarea
                value={htmlImportText}
                onChange={(e) => setHtmlImportText(e.target.value)}
                placeholder={'<h1>Lab Report</h1>\n<p>Patient: {patient.full_name}</p>\n<table>…</table>'}
                spellCheck={false}
                className="w-full h-64 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <fieldset className="text-xs text-slate-700">
                <legend className="font-semibold mb-1">Insert mode</legend>
                <label className="flex items-center gap-2 mb-1">
                  <input type="radio" name="html-target" value="append"
                    checked={htmlImportTarget === 'append'}
                    onChange={() => setHtmlImportTarget('append')} />
                  Append to body (keeps existing blocks)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="html-target" value="replace"
                    checked={htmlImportTarget === 'replace'}
                    onChange={() => setHtmlImportTarget('replace')} />
                  <span>Replace body <span className="text-rose-600">(existing body blocks will be removed)</span></span>
                </label>
              </fieldset>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setHtmlImportOpen(false)}
                className="h-9 px-4 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <Button onClick={handleHtmlImportConfirm} disabled={!htmlImportText.trim()}>Import</Button>
            </div>
          </div>
        </div>
      )}

      {/* View / edit the live AdvanceDocument JSON. Edits land via
          applyDoc so undo recovers a botched paste. Apply rejects
          invalid JSON or anything that doesn't look like an advance
          document (must carry page / theme / body / header / footer). */}
      {jsonViewOpen && doc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setJsonViewOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col"
            style={{ maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-100 bg-sky-50 rounded-t-xl flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sky-700">Document JSON</h2>
              <button onClick={() => setJsonViewOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 flex-1 overflow-hidden flex flex-col">
              <p className="text-xs text-slate-500 mb-2">
                Edit directly and click <b>Apply</b> to update the document, or hit <b>Copy</b> to grab the current text.
                Apply lands through the editor&apos;s undo history, so Ctrl/Cmd-Z reverts.
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); if (jsonError) setJsonError(null); }}
                spellCheck={false}
                className="flex-1 min-h-[40vh] px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {jsonError && (
                <p className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2 py-1">{jsonError}</p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={handleCopyJson}
                className="h-9 px-4 rounded-lg text-sm text-slate-600 hover:bg-slate-100">{jsonCopied ? 'Copied!' : 'Copy'}</button>
              <button type="button" onClick={() => setJsonViewOpen(false)}
                className="h-9 px-4 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <Button onClick={handleApplyJson} disabled={!jsonText.trim()}>Apply</Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ─── Page settings panel ────────────────────────────────────────────────

function PageSettingsPanel({
  page, theme, onChange, onThemeChange,
}: {
  page:           PageSettings;
  theme:          Theme;
  onChange:       (next: PageSettings) => void;
  onThemeChange:  (next: Theme, mirrorTextColor?: boolean) => void;
}) {
  const upd = (patch: Partial<PageSettings>) => onChange({ ...page, ...patch });
  const updMargin = (k: 'top' | 'right' | 'bottom' | 'left', v: string) =>
    onChange({ ...page, margins: { ...page.margins, [k]: v } });
  const updFont = (patch: Partial<PageSettings['default_font']>) =>
    onChange({ ...page, default_font: { ...page.default_font, ...patch } });
  const updBg = (patch: Partial<NonNullable<PageSettings['background']>>) =>
    onChange({ ...page, background: { ...(page.background ?? {}), ...patch } });

  return (
    <div className="space-y-4">
      <header className="space-y-1 pb-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">Page Settings</h3>
        <p className="text-[11px] text-slate-500 italic">Default font, margins, page size, background — applied to every page.</p>
      </header>

      <div className="space-y-2">
        <Label>Format</Label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Size">
            <select value={page.size} onChange={(e) => upd({ size: e.target.value as PageSettings['size'] })} className={inputCls}>
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </Field>
          <Field label="Orientation">
            <select value={page.orientation} onChange={(e) => upd({ orientation: e.target.value as PageSettings['orientation'] })} className={inputCls}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Margins</Label>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Top">    <input type="text" value={page.margins.top}    onChange={(e) => updMargin('top',    e.target.value)} className={inputCls} /></Field>
          <Field label="Right">  <input type="text" value={page.margins.right}  onChange={(e) => updMargin('right',  e.target.value)} className={inputCls} /></Field>
          <Field label="Bottom"> <input type="text" value={page.margins.bottom} onChange={(e) => updMargin('bottom', e.target.value)} className={inputCls} /></Field>
          <Field label="Left">   <input type="text" value={page.margins.left}   onChange={(e) => updMargin('left',   e.target.value)} className={inputCls} /></Field>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Default font</Label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Family">
            <input type="text" value={page.default_font.family} onChange={(e) => updFont({ family: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Size (pt)">
            <input type="number" value={page.default_font.size} onChange={(e) => updFont({ size: Number(e.target.value) || 11 })} className={inputCls} />
          </Field>
          <Field label="Color">
            <div className="flex gap-1">
              <input type="color" value={page.default_font.color} onChange={(e) => updFont({ color: e.target.value })} className="h-7 w-7 p-0 rounded border border-slate-200 cursor-pointer shrink-0" />
              <input type="text" value={page.default_font.color} onChange={(e) => updFont({ color: e.target.value })} className={inputCls} />
            </div>
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Background</Label>
        <Field label="Image URL (optional)">
          <div className="flex items-center gap-1">
            <input type="text" value={page.background?.image ?? ''}
              onChange={(e) => updBg({ image: e.target.value || undefined })}
              className={inputCls} placeholder="https://… or upload →" />
            <ImageUploadButton
              label="Upload"
              onUploaded={(url) => updBg({ image: url })}
            />
          </div>
          {page.background?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.background.image} alt="" className="mt-1 h-16 w-full rounded border border-slate-200 object-cover bg-slate-50" />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Color">
            <div className="flex gap-1">
              <input type="color" value={page.background?.color || '#ffffff'}
                onChange={(e) => updBg({ color: e.target.value })}
                className="h-7 w-7 p-0 rounded border border-slate-200 cursor-pointer shrink-0" />
              <input type="text" value={page.background?.color ?? ''}
                onChange={(e) => updBg({ color: e.target.value || undefined })}
                className={inputCls} placeholder="#ffffff" />
            </div>
          </Field>
          <Field label="Image fit">
            <select value={page.background?.fit ?? ''}
              onChange={(e) => updBg({ fit: e.target.value === '' ? undefined : (e.target.value as 'cover' | 'contain') })}
              className={inputCls}>
              <option value="">—</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Field>
        </div>
      </div>

      <ThemeSection theme={theme} onChange={onThemeChange} />
    </div>
  );
}

// ─── Theme section ──────────────────────────────────────────────────────

function ThemeSection({
  theme, onChange,
}: {
  theme:    Theme;
  onChange: (next: Theme, mirrorTextColor?: boolean) => void;
}) {
  const matched = matchPreset(theme);
  const updColor = (k: keyof Theme['colors'], v: string) =>
    onChange({ ...theme, colors: { ...theme.colors, [k]: v } });
  const updFont = (k: keyof Theme['fonts'], v: string) =>
    onChange({ ...theme, fonts: { ...theme.fonts, [k]: v } });

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200">
      <Label>Theme preset</Label>
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((p) => {
          const active = matched?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.theme, true)}
              className={`text-left rounded border p-2 transition-colors ${
                active
                  ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              title={p.hint}
            >
              <div className="flex items-center gap-1 mb-1">
                {(['brand', 'success', 'warning', 'danger', 'muted'] as const).map((c) => (
                  <span
                    key={c}
                    className="w-3 h-3 rounded-full border border-slate-200"
                    style={{ backgroundColor: p.theme.colors[c] }}
                  />
                ))}
              </div>
              <div className="text-[11px] font-semibold text-slate-700">{p.label}</div>
              <div className="text-[10px] text-slate-500 leading-tight truncate">{p.hint}</div>
            </button>
          );
        })}
      </div>
      {!matched && (
        <p className="text-[10px] text-slate-500 italic">Custom palette — pick a preset above to reset.</p>
      )}

      <div className="space-y-2">
        <Label>Colors</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(theme.colors) as Array<keyof Theme['colors']>).map((k) => (
            <Field key={k} label={k}>
              <div className="flex gap-1">
                <input type="color" value={theme.colors[k]} onChange={(e) => updColor(k, e.target.value)}
                  className="h-7 w-7 p-0 rounded border border-slate-200 cursor-pointer shrink-0" />
                <input type="text" value={theme.colors[k]} onChange={(e) => updColor(k, e.target.value)}
                  className={inputCls} />
              </div>
            </Field>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fonts</Label>
        <div className="grid grid-cols-1 gap-2">
          <Field label="Heading">
            <input type="text" value={theme.fonts.heading} onChange={(e) => updFont('heading', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Body">
            <input type="text" value={theme.fonts.body} onChange={(e) => updFont('body', e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// Local form atoms (mirror PropertiesPanel without importing from there).
const inputCls =
  'w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{children}</label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] text-slate-500 mb-0.5">{label}</span>
      {children}
    </label>
  );
}

// keep `clone` imported so future "reset to default" can use it without re-import.
void clone;
void splitBlockPath;
