import { useState, useEffect, useCallback, useRef } from 'react'
import { getKits, importKit, publishKit } from '../api/endpoints'
import { Badge, Btn, PageHeader, AlertBar, Card, Spinner } from '../components/ui'

export default function KitsPage() {
  const [kits, setKits] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getKits()
      setKits(data.kits || [])
      setTotal(data.total || 0)
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(file) {
    if (!file?.name.endsWith('.zip')) {
      setAlert({ text: 'Only .zip files accepted', type: 'error' })
      return
    }
    setUploading(true)
    setAlert(null)
    try {
      const { data } = await importKit(file)
      const v = data.validation
      setAlert({
        text: v.passed
          ? `✓ Imported "${data.slug}" — ${v.banner_count} banners, ${v.email_count} emails, ${v.editorial_count} editorial files`
          : `Imported with validation errors: ${(v.errors || []).join('; ')}`,
        type: v.passed ? 'success' : 'warn',
      })
      load()
    } catch (e) {
      setAlert({ text: e.response?.data?.description || e.message, type: 'error' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handlePublish(id, slug) {
    setAlert(null)
    try {
      await publishKit(id)
      setAlert({ text: `✓ Published — live at /campaign/${slug}/`, type: 'success' })
      load()
    } catch (e) {
      setAlert({ text: e.response?.data?.description || e.message, type: 'error' })
    }
  }

  // Drag & drop state
  const [dragging, setDragging] = useState(false)

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div>
      <PageHeader
        title="Campaign Kits"
        subtitle={`${total} kits · Manus campaign packages`}
        action={<Btn onClick={load} variant="ghost">↺ Refresh</Btn>}
      />

      <AlertBar {...(alert || {})} />

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`mb-5 border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors
          ${dragging ? 'border-cx-blue bg-cx-blue/5' : 'border-cx-border hover:border-cx-blue/50'}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
        <div className="text-3xl mb-2">📦</div>
        <div className="text-sm text-cx-text font-medium mb-1">
          {uploading ? 'Uploading…' : 'Drop or click to upload campaign-kit.zip'}
        </div>
        <div className="text-xs text-cx-muted">
          Requires: landing/ · banners/ (6+) · email/ (2+) · editorial/ (2 md) · seo/ · manifest.json
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : kits.length === 0 ? (
        <p className="text-cx-muted text-sm italic">No kits imported yet.</p>
      ) : (
        <div className="grid gap-3">
          {kits.map((kit) => (
            <KitCard key={kit.id} kit={kit} onPublish={handlePublish} />
          ))}
        </div>
      )}
    </div>
  )
}

function KitCard({ kit, onPublish }) {
  const v = kit.validation || {}
  const pub = kit.status === 'published'

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-cx-text">{kit.slug}</span>
            <Badge color={pub ? 'green' : 'gray'}>{kit.status}</Badge>
          </div>
          <div className="text-xs text-cx-muted font-mono">{kit.filename} · {kit.timestamp}</div>
        </div>
      </div>

      {/* Validation summary */}
      {v.passed ? (
        <div className="text-xs text-green-400 mb-3">
          ✓ Validation passed · {v.banner_count} banners · {v.email_count} emails · {v.editorial_count} editorial
        </div>
      ) : (
        <div className="mb-3">
          {(v.errors || []).map((e, i) => (
            <div key={i} className="text-xs text-cx-red">✗ {e}</div>
          ))}
          {(v.warnings || []).map((w, i) => (
            <div key={i} className="text-xs text-cx-amber">⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Live links */}
      {pub && (
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            [`/campaign/${kit.slug}/`,                'Landing'],
            [`/campaign/${kit.slug}/banners/`,         'Banners'],
            [`/campaign/${kit.slug}/email/`,           'Email'],
            [`/campaign/${kit.slug}/press-release/`,   'Press Release'],
            [`/campaign/${kit.slug}/sponsored-article/`,'Sponsored Article'],
          ].map(([href, label]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer"
              className="text-xs text-cx-blue hover:underline">
              {label} ↗
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Btn
          onClick={() => onPublish(kit.id, kit.slug)}
          variant={pub ? 'ghost' : 'success'}
        >
          {pub ? '↺ Re-publish' : !v.passed ? 'Publish ⚠' : 'Publish'}
        </Btn>
        <a href={`/api/v1/kits/${kit.id}/status`} target="_blank" rel="noreferrer">
          <Btn variant="ghost">Manifest ↗</Btn>
        </a>
      </div>
    </Card>
  )
}
