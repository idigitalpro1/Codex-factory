/**
 * PromptLibraryPage — manage saved prompt drafts.
 * Reads/writes from WorkspaceContext (IndexedDB-persisted).
 * Navigation to this page does NOT reset assistant context.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { Badge, Btn, PageHeader, AlertBar, Card } from '../components/ui'

const TAGS = ['all', 'invoice', 'editorial', 'campaign', 'domain', 'seo', 'legal', 'other']

export default function PromptLibraryPage() {
  const { savedPrompts, savePrompt, deletePrompt, setScratchpad, setPanelTab, panelOpen, togglePanel } = useWorkspace()
  const navigate = useNavigate()

  const [alert, setAlert]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [tag, setTag]       = useState('all')

  const visible = useMemo(() => {
    let list = savedPrompts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
      )
    }
    if (tag !== 'all') {
      list = list.filter((p) => (p.tags || []).includes(tag))
    }
    return list
  }, [savedPrompts, search, tag])

  function openInScratchpad(prompt) {
    setScratchpad(prompt.content)
    if (!panelOpen) togglePanel()
    setPanelTab('prompts')
    setAlert({ text: `"${prompt.title}" loaded into scratchpad`, type: 'success' })
  }

  async function handleDelete(id, title) {
    await deletePrompt(id)
    setAlert({ text: `Deleted "${title}"`, type: 'success' })
  }

  return (
    <div>
      <PageHeader
        title="Prompt Library"
        subtitle={`${savedPrompts.length} saved prompts · persisted to IndexedDB`}
        action={
          <Btn onClick={() => setShowForm(!showForm)} variant="primary">
            + New Prompt
          </Btn>
        }
      />

      <AlertBar {...(alert || {})} />

      {/* New prompt form */}
      {showForm && (
        <NewPromptForm
          onSaved={(title, content, tags) => {
            savePrompt(title, content, tags)
            setShowForm(false)
            setAlert({ text: `Saved "${title}"`, type: 'success' })
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search + filter */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompts…"
          className="flex-1 bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm text-cx-text
                     placeholder:text-cx-muted focus:outline-none focus:border-cx-blue"
        />
        <div className="flex gap-1.5 flex-wrap">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors capitalize
                ${tag === t
                  ? 'bg-cx-blue text-white border-cx-blue'
                  : 'border-cx-border text-cx-muted hover:text-cx-text'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt grid */}
      {savedPrompts.length === 0 ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : visible.length === 0 ? (
        <p className="text-cx-muted text-sm italic">No prompts match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onLoad={openInScratchpad}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Prompt card ───────────────────────────────────────────────
function PromptCard({ prompt, onLoad, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const date = prompt.createdAt
    ? new Date(prompt.createdAt).toLocaleDateString()
    : ''
  const preview = prompt.content?.slice(0, 200) ?? ''

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-cx-text">{prompt.title}</span>
            {(prompt.tags || []).map((t) => (
              <Badge key={t} color="blue">{t}</Badge>
            ))}
          </div>
          <div className="text-xs text-cx-muted font-mono mb-2">{date}</div>
          <pre
            className={`text-xs text-cx-muted font-mono whitespace-pre-wrap leading-relaxed overflow-hidden transition-all
              ${expanded ? 'max-h-none' : 'max-h-16'}`}
          >
            {preview}{preview.length >= 200 && !expanded ? '…' : ''}
          </pre>
          {prompt.content?.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-cx-blue hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Btn onClick={() => onLoad(prompt)} variant="primary">Load →</Btn>
          <Btn
            onClick={() => navigator.clipboard.writeText(prompt.content).catch(() => {})}
            variant="ghost"
          >
            Copy
          </Btn>
          <Btn onClick={() => onDelete(prompt.id, prompt.title)} variant="danger">✕</Btn>
        </div>
      </div>
    </Card>
  )
}

// ── New prompt form ───────────────────────────────────────────
function NewPromptForm({ onSaved, onCancel }) {
  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [tags,    setTags]    = useState([])

  function submit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSaved(title.trim(), content.trim(), tags)
  }

  function toggleTag(t) {
    setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])
  }

  return (
    <Card className="mb-5">
      <h3 className="text-sm font-semibold text-cx-text mb-4">New Prompt</h3>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-cx-muted mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Describe this prompt…"
            className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-cx-muted mb-1">Prompt *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            placeholder="Write your prompt here…"
            className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text
                       focus:outline-none focus:border-cx-blue resize-none font-mono"
            spellCheck={false}
          />
          <div className="text-right text-[10px] text-cx-muted mt-0.5">{content.length} chars</div>
        </div>
        <div>
          <label className="block text-xs text-cx-muted mb-1.5">Tags</label>
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.filter((t) => t !== 'all').map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`text-xs px-2 py-0.5 rounded border capitalize transition-colors
                  ${tags.includes(t)
                    ? 'bg-cx-blue/20 border-cx-blue text-cx-blue'
                    : 'border-cx-border text-cx-muted hover:text-cx-text'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Btn onClick={onCancel} variant="ghost" type="button">Cancel</Btn>
          <Btn type="submit" variant="primary">Save Prompt</Btn>
        </div>
      </form>
    </Card>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="text-center py-20 text-cx-muted">
      <div className="text-4xl mb-3">✏</div>
      <div className="text-sm font-medium mb-1">No saved prompts yet</div>
      <div className="text-xs mb-4">
        Prompts saved in the scratchpad drawer appear here.<br />
        They persist across sessions via IndexedDB.
      </div>
      <Btn onClick={onNew} variant="primary">+ Create First Prompt</Btn>
    </div>
  )
}
