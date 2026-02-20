/**
 * AssistantPanel — persistent right-side workspace panel.
 * Four tabs: History · Artifacts · Scratchpad · Images
 * Collapses to a slim icon rail when panelOpen=false.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'

// ── Tab definitions ────────────────────────────────────────────
const TABS = [
  { id: 'history',    label: 'History',    Icon: HistoryIcon    },
  { id: 'artifacts',  label: 'Artifacts',  Icon: LayersIcon     },
  { id: 'scratchpad', label: 'Scratchpad', Icon: PencilIcon     },
  { id: 'images',     label: 'Images',     Icon: ImageIcon      },
]

// ── Artifact type colors ───────────────────────────────────────
const TYPE_COLORS = {
  invoice:  'bg-cx-gold/20 text-cx-gold',
  code:     'bg-cx-blue/20 text-cx-blue',
  text:     'bg-cx-green/20 text-cx-green',
  image:    'bg-purple-500/20 text-purple-400',
  json:     'bg-orange-500/20 text-orange-400',
  kit:      'bg-pink-500/20 text-pink-400',
}

export default function AssistantPanel() {
  const {
    panelOpen, panelTab,
    togglePanel, setPanelTab,
    messages, clearHistory,
    orderedArtifacts, removeArtifact, pinArtifact,
    scratchpad, setScratchpad,
    images, addImage, removeImage, imageInputRef,
    addMessage,
  } = useWorkspace()

  const collapsed = !panelOpen

  return (
    <aside
      className={`
        shrink-0 flex flex-col border-l border-cx-border bg-cx-panel
        transition-[width] duration-200 ease-in-out
        ${collapsed ? 'w-10' : 'w-80'}
        h-full overflow-hidden
      `}
    >
      {/* ── Tab rail ──────────────────────────────────────────── */}
      <div className={`
        flex border-b border-cx-border shrink-0
        ${collapsed ? 'flex-col py-2' : 'flex-row'}
      `}>
        {/* Collapse / expand toggle */}
        <button
          onClick={togglePanel}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          className={`
            flex items-center justify-center text-cx-muted hover:text-cx-text
            transition-colors shrink-0
            ${collapsed ? 'h-9 w-10 mb-1' : 'h-9 w-9 ml-auto mr-1'}
          `}
        >
          {collapsed ? <PanelRightIcon className="w-4 h-4" /> : <PanelLeftIcon className="w-4 h-4" />}
        </button>

        {/* Tab buttons */}
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => { setPanelTab(id); if (collapsed) togglePanel() }}
            title={label}
            className={`
              flex items-center gap-2 transition-colors text-xs font-medium
              ${collapsed
                ? 'justify-center h-9 w-10'
                : 'flex-1 justify-center py-2.5 border-b-2'
              }
              ${panelTab === id && !collapsed
                ? 'text-cx-blue border-cx-blue'
                : 'text-cx-muted hover:text-cx-text border-transparent'
              }
              ${panelTab === id && collapsed ? 'text-cx-blue' : ''}
            `}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && label}
          </button>
        ))}
      </div>

      {/* ── Panel body ────────────────────────────────────────── */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {panelTab === 'history'    && <HistoryTab    messages={messages} clearHistory={clearHistory} addMessage={addMessage} />}
          {panelTab === 'artifacts'  && <ArtifactsTab  artifacts={orderedArtifacts} onPin={pinArtifact} onRemove={removeArtifact} />}
          {panelTab === 'scratchpad' && <ScratchpadTab scratchpad={scratchpad} setScratchpad={setScratchpad} addMessage={addMessage} />}
          {panelTab === 'images'     && <ImagesTab     images={images} addImage={addImage} removeImage={removeImage} fileInputRef={imageInputRef} />}
        </div>
      )}

      {/* Hidden file input for image uploads */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          for (const file of e.target.files) {
            const reader = new FileReader()
            reader.onload = (ev) => addImage({ name: file.name, url: ev.target.result })
            reader.readAsDataURL(file)
          }
          e.target.value = ''
        }}
      />
    </aside>
  )
}

// ══════════════════════════════════════════════════════════════
// History tab
// ══════════════════════════════════════════════════════════════
function HistoryTab({ messages, clearHistory, addMessage }) {
  const bottomRef = useRef(null)
  const [draft, setDraft] = useState('')

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendDraft() {
    const text = draft.trim()
    if (!text) return
    addMessage('user', text)
    setDraft('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cx-border shrink-0">
        <span className="text-xs text-cx-muted font-mono">{messages.length} messages</span>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-cx-muted hover:text-cx-red transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="w-6 h-6" />} text="No history yet" />
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick input */}
      <div className="shrink-0 border-t border-cx-border p-2 flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendDraft()}
          placeholder="Note…"
          className="flex-1 bg-cx-bg border border-cx-border rounded px-2 py-1.5 text-xs text-cx-text placeholder:text-cx-muted focus:outline-none focus:border-cx-blue"
        />
        <button
          onClick={sendDraft}
          disabled={!draft.trim()}
          className="px-2.5 py-1.5 rounded bg-cx-blue text-white text-xs font-medium disabled:opacity-40 hover:bg-cx-blue/80 transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'
  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-cx-muted italic">{msg.content}</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`
          max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-cx-blue text-white rounded-br-sm'
            : 'bg-cx-bg border border-cx-border text-cx-text rounded-bl-sm'
          }
        `}
      >
        {msg.content}
      </div>
      {msg.imageUrls?.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1">
          {msg.imageUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded border border-cx-border" />
          ))}
        </div>
      )}
      <span className="text-[10px] text-cx-muted">{time}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Artifacts tab
// ══════════════════════════════════════════════════════════════
function ArtifactsTab({ artifacts, onPin, onRemove }) {
  const [filter, setFilter] = useState('all')
  const types = ['all', 'text', 'code', 'image', 'invoice', 'kit', 'json']
  const visible = filter === 'all' ? artifacts : artifacts.filter((a) => a.type === filter)

  return (
    <div className="flex flex-col h-full">
      {/* Filter pills */}
      <div className="shrink-0 px-3 py-2 border-b border-cx-border flex gap-1 overflow-x-auto">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`
              shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium capitalize transition-colors
              ${filter === t ? 'bg-cx-blue text-white' : 'bg-cx-bg text-cx-muted hover:text-cx-text border border-cx-border'}
            `}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Artifact list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {visible.length === 0 ? (
          <EmptyState icon={<LayersIcon className="w-6 h-6" />} text="No artifacts yet" />
        ) : (
          visible.map((a) => (
            <ArtifactCard key={a.id} artifact={a} onPin={onPin} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  )
}

function ArtifactCard({ artifact, onPin, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = TYPE_COLORS[artifact.type] || 'bg-cx-muted/20 text-cx-muted'
  const preview = typeof artifact.content === 'string'
    ? artifact.content.slice(0, 120)
    : JSON.stringify(artifact.content).slice(0, 120)

  function copyContent() {
    const text = typeof artifact.content === 'string'
      ? artifact.content
      : JSON.stringify(artifact.content, null, 2)
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className={`
      rounded-lg border bg-cx-bg overflow-hidden
      ${artifact.pinned ? 'border-cx-gold/50' : 'border-cx-border'}
    `}>
      {/* Card header */}
      <div
        className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${colorClass}`}>
          {artifact.type}
        </span>
        <span className="flex-1 text-xs text-cx-text truncate font-medium">{artifact.title}</span>
        {artifact.pinned && <span className="text-cx-gold text-[10px]">📌</span>}
        <ChevronIcon className={`w-3 h-3 text-cx-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-cx-border">
          {artifact.type === 'image' && artifact.meta?.url ? (
            <img src={artifact.meta.url} alt={artifact.title} className="w-full h-40 object-contain bg-black/20" />
          ) : (
            <pre className="px-2.5 py-2 text-[10px] text-cx-muted font-mono whitespace-pre-wrap overflow-hidden max-h-32 overflow-y-auto">
              {preview}{preview.length >= 120 ? '…' : ''}
            </pre>
          )}
          {/* Actions */}
          <div className="flex gap-1 px-2.5 pb-2 pt-1 border-t border-cx-border/50">
            <ActionBtn onClick={() => onPin(artifact.id)} title={artifact.pinned ? 'Unpin' : 'Pin'}>
              {artifact.pinned ? 'Unpin' : 'Pin'}
            </ActionBtn>
            {artifact.type !== 'image' && (
              <ActionBtn onClick={copyContent} title="Copy">Copy</ActionBtn>
            )}
            <ActionBtn onClick={() => onRemove(artifact.id)} title="Remove" danger>✕</ActionBtn>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Scratchpad tab
// ══════════════════════════════════════════════════════════════
function ScratchpadTab({ scratchpad, setScratchpad, addMessage }) {
  const charCount = scratchpad.length

  function copyAll() {
    navigator.clipboard.writeText(scratchpad).catch(() => {})
  }

  function sendToHistory() {
    const text = scratchpad.trim()
    if (!text) return
    addMessage('user', text)
    setScratchpad('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-cx-border">
        <span className="text-[10px] text-cx-muted font-mono">{charCount} chars</span>
        <div className="flex gap-2">
          <button onClick={copyAll} className="text-[10px] text-cx-muted hover:text-cx-text transition-colors">
            Copy
          </button>
          <button onClick={() => setScratchpad('')} className="text-[10px] text-cx-muted hover:text-cx-red transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={scratchpad}
        onChange={(e) => setScratchpad(e.target.value)}
        placeholder="Draft a prompt, note, or command…"
        className="flex-1 bg-transparent resize-none px-3 py-3 text-xs text-cx-text placeholder:text-cx-muted/50 focus:outline-none leading-relaxed font-mono"
        spellCheck={false}
      />

      {/* Send strip */}
      <div className="shrink-0 border-t border-cx-border p-2 flex gap-1.5">
        <button
          onClick={sendToHistory}
          disabled={!scratchpad.trim()}
          className="flex-1 py-1.5 rounded bg-cx-blue text-white text-xs font-medium disabled:opacity-40 hover:bg-cx-blue/80 transition-colors"
        >
          → Send to History
        </button>
      </div>
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
    for (const file of e.dataTransfer.files) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = (ev) => addImage({ name: file.name, url: ev.target.result })
      reader.readAsDataURL(file)
    }
  }, [addImage])

  return (
    <div className="flex flex-col h-full">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef?.current?.click()}
        className={`
          shrink-0 mx-3 mt-3 rounded-lg border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center py-4 gap-1 transition-colors
          ${dragging
            ? 'border-cx-blue bg-cx-blue/10 text-cx-blue'
            : 'border-cx-border text-cx-muted hover:border-cx-blue/50 hover:text-cx-text'
          }
        `}
      >
        <ImageIcon className="w-5 h-5" />
        <span className="text-xs">Drop images or click to upload</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {images.length === 0 ? (
          <EmptyState icon={<ImageIcon className="w-6 h-6" />} text="No images yet" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-cx-border bg-cx-bg">
                <img src={img.url} alt={img.name} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] text-white/80 px-1 text-center truncate w-full text-center">
                    {img.name}
                  </span>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────
function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[120px] gap-2 text-cx-muted/50">
      {icon}
      <span className="text-xs">{text}</span>
    </div>
  )
}

function ActionBtn({ onClick, title, danger, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        text-[10px] px-2 py-0.5 rounded border transition-colors
        ${danger
          ? 'border-cx-red/30 text-cx-red hover:bg-cx-red/10'
          : 'border-cx-border text-cx-muted hover:text-cx-text hover:border-cx-blue/50'
        }
      `}
    >
      {children}
    </button>
  )
}

// ── Icons (inline SVG) ────────────────────────────────────────
function HistoryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function LayersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  )
}
function PencilIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}
function ImageIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}
function PanelLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}
function PanelRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}
function ChevronIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
