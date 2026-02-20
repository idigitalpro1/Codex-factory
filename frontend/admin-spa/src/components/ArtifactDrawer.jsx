/**
 * ArtifactDrawer — collapsible right-side artifact panel.
 * Persists across navigation. Never remounts.
 *
 * Tabs: History · Artifacts · Images · Prompts
 * Accepts drag-drop for images, kit zips, and uploaded files.
 *
 * Future: wire artifact actions to WebSocket streaming events.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace, ASSISTANTS } from '../context/WorkspaceContext'

// ── Artifact type color map ───────────────────────────────────
const TYPE_BADGE = {
  invoice: 'bg-amber-500/20 text-amber-400',
  code:    'bg-blue-500/20 text-blue-400',
  text:    'bg-emerald-500/20 text-emerald-400',
  image:   'bg-purple-500/20 text-purple-400',
  json:    'bg-orange-500/20 text-orange-400',
  kit:     'bg-pink-500/20 text-pink-400',
  pdf:     'bg-red-500/20 text-red-400',
  zip:     'bg-zinc-500/20 text-zinc-400',
}

const TABS = [
  { id: 'history',   label: 'History',   icon: '⏱' },
  { id: 'artifacts', label: 'Artifacts', icon: '◫' },
  { id: 'images',    label: 'Images',    icon: '⬜' },
  { id: 'prompts',   label: 'Prompts',   icon: '✏' },
]

export default function ArtifactDrawer() {
  const {
    panelOpen, panelTab, togglePanel, setPanelTab,
    messages, clearHistory, addMessage, activeAssistantDef,
    orderedArtifacts, removeArtifact, pinArtifact,
    images, addImage, removeImage, imageInputRef,
    scratchpad, setScratchpad, savePrompt, savedPrompts, deletePrompt,
  } = useWorkspace()

  return (
    <aside
      className={`
        shrink-0 flex flex-col border-l border-cx-border bg-cx-panel
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${panelOpen ? 'w-72' : 'w-10'}
        h-full
      `}
    >
      {/* ── Collapse strip / tab bar ─────────────────────────── */}
      <div className={`flex border-b border-cx-border shrink-0 ${panelOpen ? 'flex-row h-10' : 'flex-col py-2'}`}>

        {/* Toggle button */}
        <button
          onClick={togglePanel}
          title={panelOpen ? 'Hide drawer' : 'Open drawer'}
          className={`
            flex items-center justify-center text-cx-muted hover:text-cx-text transition-colors shrink-0
            ${panelOpen ? 'w-8 ml-1' : 'h-9 w-full mb-1'}
          `}
        >
          {panelOpen ? '›' : '‹'}
        </button>

        {/* Tabs */}
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { setPanelTab(id); if (!panelOpen) togglePanel() }}
            title={label}
            className={`
              flex items-center gap-1.5 transition-colors text-[11px] font-medium
              ${panelOpen
                ? 'flex-1 justify-center py-2 border-b-2'
                : 'justify-center h-9 w-full'
              }
              ${panelTab === id && panelOpen
                ? 'text-cx-blue border-cx-blue'
                : panelTab === id
                ? 'text-cx-blue'
                : 'text-cx-muted hover:text-cx-text border-transparent'
              }
            `}
          >
            <span>{icon}</span>
            {panelOpen && label}
          </button>
        ))}
      </div>

      {/* ── Tab bodies (only when open) ──────────────────────── */}
      {panelOpen && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {panelTab === 'history'   && (
            <HistoryTab
              messages={messages}
              clearHistory={clearHistory}
              addMessage={addMessage}
              activeAssistantDef={activeAssistantDef}
            />
          )}
          {panelTab === 'artifacts' && (
            <ArtifactsTab
              artifacts={orderedArtifacts}
              onPin={pinArtifact}
              onRemove={removeArtifact}
            />
          )}
          {panelTab === 'images' && (
            <ImagesTab
              images={images}
              addImage={addImage}
              removeImage={removeImage}
              fileInputRef={imageInputRef}
            />
          )}
          {panelTab === 'prompts' && (
            <PromptsTab
              scratchpad={scratchpad}
              setScratchpad={setScratchpad}
              addMessage={addMessage}
              savePrompt={savePrompt}
              savedPrompts={savedPrompts}
              deletePrompt={deletePrompt}
            />
          )}
        </div>
      )}
    </aside>
  )
}

// ══════════════════════════════════════════════════════════════
// History tab
// ══════════════════════════════════════════════════════════════
function HistoryTab({ messages, clearHistory, addMessage, activeAssistantDef }) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    const t = draft.trim()
    if (!t) return
    addMessage('user', t)
    setDraft('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-cx-border">
        <span className="text-[10px] text-cx-muted font-mono">{messages.length} messages</span>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[10px] text-cx-muted hover:text-cx-red transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {messages.length === 0
          ? <EmptyState text="No conversation yet" />
          : messages.map((m) => <MessageBubble key={m.id} msg={m} />)
        }
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-cx-border p-2 flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Note to ${activeAssistantDef?.name ?? 'assistant'}…`}
          className="flex-1 bg-cx-bg border border-cx-border rounded px-2 py-1 text-xs text-cx-text placeholder:text-cx-muted/50 focus:outline-none focus:border-cx-blue"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="px-2.5 rounded text-xs font-bold text-white disabled:opacity-30 transition-colors"
          style={{ background: activeAssistantDef?.color ?? '#1a6aff' }}
        >
          →
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser  = msg.role === 'user'
  const isSystem = msg.role === 'system'
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  if (isSystem) {
    return <p className="text-center text-[10px] text-cx-muted/60 italic py-0.5">{msg.content}</p>
  }

  // Find assistant color for assistant messages
  const assistantColor = !isUser
    ? (ASSISTANTS.find((a) => a.id === msg.assistant)?.color ?? '#252535')
    : undefined

  return (
    <div className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`
          max-w-[93%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed whitespace-pre-wrap
          ${isUser ? 'text-white rounded-br-sm' : 'border border-cx-border text-cx-text rounded-bl-sm'}
        `}
        style={isUser ? { background: '#1a6aff' } : { background: assistantColor + '22' }}
      >
        {msg.content}
      </div>
      {msg.imageUrls?.map((url, i) => (
        <img key={i} src={url} alt="" className="h-14 w-14 rounded object-cover border border-cx-border mt-0.5" />
      ))}
      <span className="text-[9px] text-cx-muted">{time}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Artifacts tab
// ══════════════════════════════════════════════════════════════
function ArtifactsTab({ artifacts, onPin, onRemove }) {
  const [filter, setFilter] = useState('all')
  const types = ['all', 'text', 'code', 'invoice', 'kit', 'pdf', 'zip', 'json', 'image']
  const visible = filter === 'all' ? artifacts : artifacts.filter((a) => a.type === filter)

  return (
    <div className="flex flex-col h-full">
      {/* Filter pills */}
      <div className="shrink-0 flex gap-1 px-2 py-1.5 border-b border-cx-border overflow-x-auto">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`
              shrink-0 text-[9px] px-2 py-0.5 rounded-full font-semibold capitalize transition-colors
              ${filter === t
                ? 'bg-cx-blue text-white'
                : 'bg-cx-bg border border-cx-border text-cx-muted hover:text-cx-text'
              }
            `}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {visible.length === 0
          ? <EmptyState text="No artifacts yet" />
          : visible.map((a) => (
            <ArtifactCard key={a.id} artifact={a} onPin={onPin} onRemove={onRemove} />
          ))
        }
      </div>
    </div>
  )
}

function ArtifactCard({ artifact, onPin, onRemove }) {
  const [open, setOpen] = useState(false)
  const badge = TYPE_BADGE[artifact.type] || 'bg-cx-muted/20 text-cx-muted'

  const previewText = (() => {
    if (artifact.type === 'image') return null
    const raw = typeof artifact.content === 'string'
      ? artifact.content
      : JSON.stringify(artifact.content)
    return raw.slice(0, 200)
  })()

  function copy() {
    const txt = typeof artifact.content === 'string'
      ? artifact.content
      : JSON.stringify(artifact.content, null, 2)
    navigator.clipboard.writeText(txt).catch(() => {})
  }

  return (
    <div className={`rounded border overflow-hidden bg-cx-bg ${artifact.pinned ? 'border-amber-500/50' : 'border-cx-border'}`}>
      {/* Card header */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${badge}`}>
          {artifact.type}
        </span>
        <span className="flex-1 text-[11px] text-cx-text truncate">{artifact.title}</span>
        {artifact.pinned && <span className="text-amber-400 shrink-0">📌</span>}
        <span className="text-cx-muted text-[10px] shrink-0">{open ? '▴' : '▾'}</span>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-cx-border/60">
          {/* Image or thumbnail */}
          {artifact.type === 'image' && (artifact.meta?.thumbnail || artifact.meta?.url) && (
            <img
              src={artifact.meta.thumbnail || artifact.meta.url}
              alt={artifact.title}
              className="w-full max-h-40 object-contain bg-black/20"
            />
          )}

          {/* Text preview */}
          {previewText != null && (
            <pre className="px-2.5 py-2 text-[10px] text-cx-muted font-mono whitespace-pre-wrap overflow-y-auto max-h-32 leading-relaxed">
              {previewText}{previewText.length >= 200 ? '…' : ''}
            </pre>
          )}

          {/* PDF/ZIP download */}
          {(artifact.type === 'pdf' || artifact.type === 'zip') && artifact.meta?.url && (
            <a
              href={artifact.meta.url}
              download={artifact.title}
              className="block mx-2.5 mb-2 text-[10px] text-cx-blue hover:underline"
            >
              ↓ Download {artifact.type.toUpperCase()}
            </a>
          )}

          {/* Action row */}
          <div className="flex gap-1 px-2.5 pb-2 pt-1 border-t border-cx-border/40">
            <Chip onClick={() => onPin(artifact.id)}>{artifact.pinned ? 'Unpin' : 'Pin'}</Chip>
            {previewText != null && <Chip onClick={copy}>Copy</Chip>}
            <Chip onClick={() => onRemove(artifact.id)} danger>Remove</Chip>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Images tab
// ══════════════════════════════════════════════════════════════
function ImagesTab({ images, addImage, removeImage, fileInputRef }) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    ingestFiles(e.dataTransfer.files, addImage)
  }, [addImage])

  return (
    <div className="flex flex-col h-full">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef?.current?.click()}
        className={`
          shrink-0 mx-2 mt-2.5 mb-2 rounded-lg border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center py-4 gap-1.5 text-xs transition-colors select-none
          ${dragging
            ? 'border-cx-blue bg-cx-blue/10 text-cx-blue'
            : 'border-cx-border text-cx-muted hover:border-cx-blue/40 hover:text-cx-text'
          }
        `}
      >
        <span className="text-2xl leading-none">⬛</span>
        <span>Drop images or click to upload</span>
        <span className="text-[10px] opacity-60">PNG, JPG, WEBP, PDF, ZIP</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {images.length === 0
          ? <EmptyState text="No images uploaded" />
          : (
            <div className="grid grid-cols-2 gap-1.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded overflow-hidden border border-cx-border bg-cx-bg"
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                    <span className="text-[9px] text-white/80 text-center truncate w-full px-1">{img.name}</span>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Prompts tab (scratchpad + saved drafts)
// ══════════════════════════════════════════════════════════════
function PromptsTab({ scratchpad, setScratchpad, addMessage, savePrompt, savedPrompts, deletePrompt }) {
  const [view, setView] = useState('draft')

  function doSave() {
    if (!scratchpad.trim()) return
    const title = 'Draft ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    savePrompt(title, scratchpad)
  }

  function sendToHistory() {
    if (!scratchpad.trim()) return
    addMessage('user', scratchpad)
    setScratchpad('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab strip */}
      <div className="shrink-0 flex border-b border-cx-border">
        {[['draft', 'Scratchpad'], ['saved', `Saved (${savedPrompts.length})`]].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-1.5 text-[10px] font-medium border-b-2 transition-colors
              ${view === v ? 'text-cx-blue border-cx-blue' : 'text-cx-muted border-transparent'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'draft' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="shrink-0 flex items-center justify-between px-2 py-1 border-b border-cx-border/50">
            <span className="text-[10px] text-cx-muted font-mono">{scratchpad.length} chars</span>
            <div className="flex gap-2">
              <button onClick={doSave} className="text-[10px] text-cx-muted hover:text-cx-text transition-colors">Save</button>
              <button onClick={() => navigator.clipboard.writeText(scratchpad).catch(() => {})} className="text-[10px] text-cx-muted hover:text-cx-text transition-colors">Copy</button>
              <button onClick={() => setScratchpad('')} className="text-[10px] text-cx-muted hover:text-cx-red transition-colors">Clear</button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Draft a prompt, note, or command…&#10;&#10;Shift+Enter for new line, or use Send button below."
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[11px] text-cx-text placeholder:text-cx-muted/40 focus:outline-none font-mono leading-relaxed"
            spellCheck={false}
          />

          {/* Send */}
          <div className="shrink-0 border-t border-cx-border p-2">
            <button
              onClick={sendToHistory}
              disabled={!scratchpad.trim()}
              className="w-full py-1.5 rounded bg-cx-blue text-white text-xs font-medium disabled:opacity-40 hover:bg-cx-blue/80 transition-colors"
            >
              → Send to History
            </button>
          </div>
        </div>
      )}

      {view === 'saved' && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
          {savedPrompts.length === 0
            ? <EmptyState text="No saved prompts" />
            : savedPrompts.map((p) => (
              <div key={p.id} className="rounded border border-cx-border bg-cx-bg p-2.5">
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-[11px] text-cx-text font-medium leading-tight">{p.title}</span>
                  <button onClick={() => deletePrompt(p.id)} className="text-[10px] text-cx-muted hover:text-cx-red shrink-0">✕</button>
                </div>
                <pre className="text-[10px] text-cx-muted font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed mb-1.5">
                  {p.content}
                </pre>
                <button
                  onClick={() => { setScratchpad(p.content); setView('draft') }}
                  className="text-[10px] text-cx-blue hover:underline"
                >
                  Load into scratchpad →
                </button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── Utilities ─────────────────────────────────────────────────
function ingestFiles(fileList, addImage) {
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue
    const reader = new FileReader()
    reader.onload = (ev) =>
      addImage({ name: file.name, url: ev.target.result, mimeType: file.type })
    reader.readAsDataURL(file)
  }
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center min-h-[80px] text-[11px] text-cx-muted/50 italic">
      {text}
    </div>
  )
}

function Chip({ onClick, danger, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-0.5 rounded border transition-colors
        ${danger
          ? 'border-cx-red/30 text-cx-red hover:bg-cx-red/10'
          : 'border-cx-border text-cx-muted hover:text-cx-text hover:border-cx-muted/60'
        }`}
    >
      {children}
    </button>
  )
}
