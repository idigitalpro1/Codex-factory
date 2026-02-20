import { useState, useEffect, useCallback } from 'react'
import { getHealth } from '../api/endpoints'
import { Badge, Btn, PageHeader, Card, Spinner } from '../components/ui'

export default function HealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getHealth()
      setHealth(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const ts = health?.timestamp
    ? new Date(health.timestamp).toLocaleString()
    : '—'

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Backend status · auto-refreshes every 30 s"
        action={<Btn onClick={load} variant="ghost">↺ Refresh</Btn>}
      />

      {loading && <Spinner />}
      {error && <p className="text-cx-red text-sm">Error: {error}</p>}

      {health && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <div className="text-xs text-cx-muted uppercase tracking-wider mb-2">Status</div>
            <Badge color={health.status === 'ok' ? 'green' : 'red'}>
              {health.status}
            </Badge>
          </Card>

          <Card>
            <div className="text-xs text-cx-muted uppercase tracking-wider mb-2">Service</div>
            <span className="font-mono text-sm text-cx-text">{health.service || '—'}</span>
          </Card>

          <Card>
            <div className="text-xs text-cx-muted uppercase tracking-wider mb-2">Last Checked</div>
            <span className="text-sm text-cx-text">{ts}</span>
          </Card>

          <Card className="col-span-3">
            <div className="text-xs text-cx-muted uppercase tracking-wider mb-2">Raw Response</div>
            <pre className="text-xs font-mono text-cx-muted overflow-auto whitespace-pre-wrap">
              {JSON.stringify(health, null, 2)}
            </pre>
          </Card>
        </div>
      )}

      {/* Endpoint checklist */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-cx-muted uppercase tracking-wider mb-3">
          Key Endpoints
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['/api/v1/health',             'Backend health'],
            ['/api/v1/brands',             'Brand registry'],
            ['/api/v1/admin/ops/domains',  'Domain registry'],
            ['/api/v1/kits',               'Campaign kits'],
            ['/api/v1/admin/articles',     'Article directory'],
            ['/campaign/',                 'Published campaigns'],
          ].map(([url, label]) => (
            <EndpointRow key={url} url={url} label={label} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EndpointRow({ url, label }) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch(url)
      .then((r) => setStatus(r.ok ? 'ok' : r.status))
      .catch(() => setStatus('err'))
  }, [url])

  return (
    <div className="flex items-center justify-between bg-cx-card border border-cx-border rounded px-3 py-2.5">
      <div>
        <div className="font-mono text-xs text-cx-text">{url}</div>
        <div className="text-xs text-cx-muted">{label}</div>
      </div>
      {status === null ? (
        <div className="w-2 h-2 rounded-full bg-cx-muted animate-pulse" />
      ) : (
        <Badge color={status === 'ok' ? 'green' : 'amber'}>
          {status}
        </Badge>
      )}
    </div>
  )
}
