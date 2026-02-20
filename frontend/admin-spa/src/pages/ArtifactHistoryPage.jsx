/**
 * ArtifactHistoryPage — full-page view of the IndexedDB artifact store.
 * Reads from WorkspaceContext (same data as the ArtifactDrawer tab).
 * Navigation does NOT reset assistant context or artifact state.
 */

import { useState, useMemo } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { Badge, Btn, PageHeader, AlertBar, Card } from '../components/ui'

const TYPE_COLORS = {
  invoice: 'gold',
  code:    'blue',
  text:    'green',
  image:   'amber',
  json:    'amber',
  kit:     'blue',
  pdf:     'red',
  zip:     'gray',
}

const TYPE_LABELS = {
  invoice: 'Invoice',
  code:    'Code',
  text:    'Text',
  image:   'Image',
  json:    'JSON',
  kit:     'Kit',
  pdf:     'PDF',
  zip:     'ZIP',
}

const ALL_TYPES = ['all', 'invoice', 'code', 'text', 'image', 'pdf', 'kit', 'zip', 'json']

export default function ArtifactHistoryPage() {
  const { orderedArtifacts, removeArtifact, pinArtifact, addArtifact } = useWorkspace()

  const [alert, setAlert]     = useState(null)
  const [typeFilter, setType] = useState('all')
  const [search, setSearch]   = useState('')
  const [preview, setPreview] = useState(null) // artifact being previewed

  const visible = useMemo(() => {
    let list = orderedArtifacts
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        (typeof a.content === 'string' && a.content.toLowerCase().includes(q))
      )
    }
    return list
  }, [orderedArtifacts, typeFilter, search])

  const pinned   = orderedArtifacts.filter((a) => a.pinned)
  const unpinned = visible.filter((a) => !a.pinned)

  async function handleRemove(id, title) {
    await removeArtifact(id)
    setAlert({ text: `Removed "${title}"`, type: 'success' })
    if (preview?.id === id) setPreview(null)
  }

  function handlePin(id) {
    pinArtifact(id)
  }

  function copyContent(artifact) {
    const text = typeof artifact.content === 'string'
      ? artifact.content
      : JSON.stringify(artifact.content, null, 2)
    navigator.clipboard.writeText(text).catch(() => {})
    setAlert({ text: 'Copied to clipboard', type: 'success' })
  }

  return (
    <div>
      <PageHeader
        title="Artifact History"
        subtitle={`${orderedArtifacts.length} artifacts · ${pinned.length} pinned · IndexedDB-persisted`}
        action={
          <Btn onClick={() => setAlert(null)} variant="ghost">↺ Refresh</Btn>
        }
      />

      <AlertBar {...(alert || {})} />

      {/* Search + type filter */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search artifacts…"
          className="flex-1 min-w-48 bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm
                     text-cx-text placeholder:text-cx-muted focus:outline-none focus:border-cx-blue"
        />
        <div className="flex gap-1.5 flex-wrap">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize transition-colors
                ${typeFilter === t
                  ? 'bg-cx-blue text-white border-cx-blue'
                  : 'border-cx-border text-cx-muted hover:text-cx-text'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {ALL_TYPES.filter((t) => t !== 'all').map((t) => {
          const count = orderedArtifacts.filter((a) => a.type === t).length
          if (count === 0) return null
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`text-center py-2 rounded border transition-colors
                ${typeFilter === t ? 'border-cx-blue bg-cx-blue/10' : 'border-cx-border bg-cx-card hover:border-cx-blue/40'}`}
            >
              <div className="text-lg font-bold text-cx-text">{count}</div>
              <div className="text-[10px] text-cx-muted uppercase tracking-wider">{TYPE_LABELS[t] || t}</div>
            </button>
          )
        })}
      </div>

      {orderedArtifacts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Pinned section */}
          {pinned.length > 0 && typeFilter === 'all' && !search && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-cx-muted uppercase tracking-widest mb-2">📌 Pinned</h2>
              <div className="grid grid-cols-1 gap-2">
                {pinned.map((a) => (
                  <ArtifactRow
                    key={a.id}
                    artifact={a}
                    onPin={handlePin}
                    onRemove={handleRemove}
                    onCopy={copyContent}
                    onPreview={setPreview}
                    isPreview={preview?.id === a.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All / filtered */}
          <div>
            {typeFilter === 'all' && !search && pinned.length > 0 && (
              <h2 className="text-xs font-semibold text-cx-muted uppercase tracking-widest mb-2">All Artifacts</h2>
            )}
            {unpinned.length === 0 && visible.length > 0 ? null : (
              <div className="grid grid-cols-1 gap-2">
                {(typeFilter === 'all' && !search ? unpinned : visible.filter((a) => !a.pinned || typeFilter !== 'all')).map((a) => (
                  <ArtifactRow
                    key={a.id}
                    artifact={a}
                    onPin={handlePin}
                    onRemove={handleRemove}
                    onCopy={copyContent}
                    onPreview={setPreview}
                    isPreview={preview?.id === a.id}
                  />
                ))}
              </div>
            )}
            {visible.length === 0 && (
              <p className="text-cx-muted text-sm italic">No artifacts match your filter.</p>
            )}
          </div>
        </>
      )}

      {/* Preview panel */}
      {preview && (
        <PreviewPanel artifact={preview} onClose={() => setPreview(null)} onCopy={copyContent} />
      )}
    </div>
  )
}

// ── Artifact row ──────────────────────────────────────────────
function ArtifactRow({ artifact: a, onPin, onRemove, onCopy, onPreview, isPreview }) {
  const date = a.meta?.createdAt ? new Date(a.meta.createdAt).toLocaleDateString() : ''
  const preview = typeof a.content === 'string'
    ? a.content.slice(0, 120)
    : JSON.stringify(a.content).slice(0, 120)

  return (
    <div
      className={`rounded-lg border bg-cx-card overflow-hidden transition-colors
        ${a.pinned ? 'border-amber-500/40' : isPreview ? 'border-cx-blue/50' : 'border-cx-border'}`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Badge color={TYPE_COLORS[a.type] || 'gray'}>{a.type}</Badge>
        <span className="flex-1 text-sm font-medium text-cx-text truncate">{a.title}</span>
        {a.pinned && <span className="text-amber-400 text-xs">📌</span>}
        <span className="text-xs text-cx-muted font-mono shrink-0">{date}</span>
        {(a.meta?.tags || []).map((t) => (
          <Badge key={t} color="gray">{t}</Badge>
        ))}
        <div className="flex gap-1 shrink-0">
          <Btn onClick={() => onPreview(isPreview ? null : a)} variant="ghost">
            {isPreview ? 'Close' : 'View'}
          </Btn>
          <Btn onClick={() => onPin(a.id)} variant="ghost">
            {a.pinned ? 'Unpin' : 'Pin'}
          </Btn>
          {a.type !== 'image' && (
            <Btn onClick={() => onCopy(a)} variant="ghost">Copy</Btn>
          )}
          <Btn onClick={() => onRemove(a.id, a.title)} variant="danger">✕</Btn>
        </div>
      </div>

      {/* Inline preview strip */}
      {a.type === 'image' ? (
        a.meta?.url && (
          <img
            src={a.meta.thumbnail || a.meta.url}
            alt={a.title}
            className="w-full max-h-32 object-contain bg-black/10 border-t border-cx-border"
          />
        )
      ) : (
        preview && (
          <div className="border-t border-cx-border/50 px-4 py-2 bg-black/10">
            <pre className="text-[10px] text-cx-muted font-mono leading-relaxed truncate">
              {preview}{preview.length >= 120 ? '…' : ''}
            </pre>
          </div>
        )
      )}
    </div>
  )
}

// ── Full preview panel ─────────────────────────────────────────
function PreviewPanel({ artifact: a, onClose, onCopy }) {
  const text = typeof a.content === 'string'
    ? a.content
    : JSON.stringify(a.content, null, 2)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-cx-panel border border-cx-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-cx-border">
          <div className="flex items-center gap-2">
            <Badge color={TYPE_COLORS[a.type] || 'gray'}>{a.type}</Badge>
            <span className="text-sm font-semibold text-cx-text">{a.title}</span>
          </div>
          <div className="flex gap-2">
            {a.type !== 'image' && <Btn onClick={() => onCopy(a)} variant="ghost">Copy</Btn>}
            <Btn onClick={onClose} variant="ghost">✕ Close</Btn>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {a.type === 'image' && a.meta?.url ? (
            <img src={a.meta.url} alt={a.title} className="max-w-full rounded" />
          ) : (
            <pre className="text-xs text-cx-text font-mono whitespace-pre-wrap leading-relaxed">
              {text}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20 text-cx-muted">
      <div className="text-4xl mb-3">◫</div>
      <div className="text-sm font-medium mb-1">No artifacts yet</div>
      <div className="text-xs">
        Artifacts created in the drawer or sent from pages appear here.<br />
        They persist across sessions via IndexedDB.
      </div>
    </div>
  )
}
