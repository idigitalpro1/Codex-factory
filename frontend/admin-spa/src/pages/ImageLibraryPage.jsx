/**
 * ImageLibraryPage — full-page view of the IndexedDB image store.
 * Reads/writes from WorkspaceContext (same images as the drawer tab).
 * Drag-drop and click-to-upload both work here.
 * Navigation does NOT reset assistant context or image state.
 */

import { useCallback, useState } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import { Btn, PageHeader, AlertBar } from '../components/ui'

export default function ImageLibraryPage() {
  const { images, addImage, removeImage, imageInputRef } = useWorkspace()

  const [alert, setAlert]     = useState(null)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState(null)
  const [view, setView]         = useState('grid') // 'grid' | 'list'

  const ingest = useCallback((files) => {
    let count = 0
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = (ev) => {
        addImage({ name: file.name, url: ev.target.result, mimeType: file.type, size: file.size })
        count++
      }
      reader.readAsDataURL(file)
    }
    if (count === 0) setAlert({ text: 'No supported image files found', type: 'warn' })
  }, [addImage])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    ingest(e.dataTransfer.files)
  }, [ingest])

  async function handleRemove(id, name) {
    await removeImage(id)
    setAlert({ text: `Removed "${name}"`, type: 'success' })
    if (selected?.id === id) setSelected(null)
  }

  function copyDataUrl(img) {
    navigator.clipboard.writeText(img.url).catch(() => {})
    setAlert({ text: 'Data URL copied', type: 'success' })
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  return (
    <div>
      <PageHeader
        title="Image Library"
        subtitle={`${images.length} images · stored in IndexedDB`}
        action={
          <div className="flex gap-2">
            <Btn
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              variant="ghost"
            >
              {view === 'grid' ? '≡ List' : '⊞ Grid'}
            </Btn>
            <Btn onClick={() => imageInputRef?.current?.click()} variant="primary">
              ↑ Upload Images
            </Btn>
          </div>
        }
      />

      <AlertBar {...(alert || {})} />

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => imageInputRef?.current?.click()}
        className={`
          mb-5 border-2 border-dashed rounded-xl py-10 text-center cursor-pointer
          transition-colors select-none
          ${dragging
            ? 'border-cx-blue bg-cx-blue/8 text-cx-blue'
            : 'border-cx-border text-cx-muted hover:border-cx-blue/50 hover:text-cx-text'
          }
        `}
      >
        <div className="text-3xl mb-2">🖼</div>
        <div className="text-sm font-medium mb-1">Drop images here or click to browse</div>
        <div className="text-xs opacity-60">PNG, JPG, WEBP, GIF — stored locally in browser</div>
      </div>

      {/* Image display */}
      {images.length === 0 ? (
        <p className="text-cx-muted text-sm italic text-center py-8">No images yet.</p>
      ) : view === 'grid' ? (
        <GridView
          images={images}
          selected={selected}
          onSelect={setSelected}
          onRemove={handleRemove}
          onCopy={copyDataUrl}
          formatSize={formatSize}
        />
      ) : (
        <ListView
          images={images}
          onRemove={handleRemove}
          onCopy={copyDataUrl}
          formatSize={formatSize}
        />
      )}

      {/* Lightbox */}
      {selected && (
        <Lightbox
          image={selected}
          onClose={() => setSelected(null)}
          onRemove={handleRemove}
          onCopy={copyDataUrl}
          formatSize={formatSize}
        />
      )}
    </div>
  )
}

// ── Grid view ─────────────────────────────────────────────────
function GridView({ images, selected, onSelect, onRemove, onCopy, formatSize }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((img) => (
        <div
          key={img.id}
          className={`relative group rounded-xl overflow-hidden border cursor-pointer transition-all
            ${selected?.id === img.id ? 'border-cx-blue ring-1 ring-cx-blue' : 'border-cx-border hover:border-cx-blue/50'}`}
          onClick={() => onSelect(img)}
        >
          <div className="aspect-square bg-black/20">
            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
            <span className="text-[11px] text-white font-medium text-center line-clamp-2">{img.name}</span>
            {img.size && <span className="text-[10px] text-white/60">{formatSize(img.size)}</span>}
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onCopy(img) }}
                className="text-[10px] text-white/80 hover:text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors"
              >
                Copy URL
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(img.id, img.name) }}
                className="text-[10px] text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 px-2 py-0.5 rounded transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────
function ListView({ images, onRemove, onCopy, formatSize }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cx-border">
            {['Preview', 'Name', 'Type', 'Size', 'Added', 'Actions'].map((h) => (
              <th key={h} className="pb-2.5 pr-4 text-left text-xs text-cx-muted uppercase tracking-wider font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {images.map((img) => (
            <tr key={img.id} className="border-b border-cx-border/40 hover:bg-white/5 transition-colors group">
              <td className="py-2 pr-4">
                <img src={img.url} alt="" className="h-10 w-10 object-cover rounded border border-cx-border" />
              </td>
              <td className="py-2 pr-4">
                <span className="text-xs text-cx-text font-medium truncate max-w-[200px] block">{img.name}</span>
              </td>
              <td className="py-2 pr-4">
                <span className="text-xs text-cx-muted">{img.mimeType || 'image'}</span>
              </td>
              <td className="py-2 pr-4">
                <span className="text-xs font-mono text-cx-muted">{formatSize(img.size)}</span>
              </td>
              <td className="py-2 pr-4">
                <span className="text-xs text-cx-muted font-mono">
                  {img.timestamp ? new Date(img.timestamp).toLocaleDateString() : '—'}
                </span>
              </td>
              <td className="py-2">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Btn onClick={() => onCopy(img)} variant="ghost">Copy URL</Btn>
                  <Btn onClick={() => onRemove(img.id, img.name)} variant="danger">✕</Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ image, onClose, onRemove, onCopy, formatSize }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-cx-panel border border-cx-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cx-border">
          <div>
            <div className="text-sm font-semibold text-cx-text">{image.name}</div>
            <div className="text-xs text-cx-muted">
              {image.mimeType || 'image'}{image.size ? ` · ${formatSize(image.size)}` : ''}
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={() => onCopy(image)} variant="ghost">Copy URL</Btn>
            <Btn onClick={() => { onRemove(image.id, image.name); }} variant="danger">Remove</Btn>
            <Btn onClick={onClose} variant="ghost">✕</Btn>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-black/30 p-4">
          <img
            src={image.url}
            alt={image.name}
            className="max-w-full max-h-full rounded object-contain"
          />
        </div>
      </div>
    </div>
  )
}
