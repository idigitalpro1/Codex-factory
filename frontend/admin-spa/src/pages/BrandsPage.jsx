import { useState, useEffect, useCallback } from 'react'
import { getBrands } from '../api/endpoints'
import { Badge, Btn, PageHeader, Card, Spinner } from '../components/ui'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getBrands()
      setBrands(data.brands || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <PageHeader
        title="Brand Registry"
        subtitle={`${brands.length} brands configured`}
        action={<Btn onClick={load} variant="ghost">↺ Refresh</Btn>}
      />

      {loading && <Spinner />}
      {error && <p className="text-cx-red text-sm">Error: {error}</p>}

      <div className="grid gap-3">
        {brands.map((b) => (
          <Card key={b.slug} className="flex items-start gap-4">
            {/* Color swatch / avatar */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
              style={{ background: b.primary_color || '#1a6aff' }}
            >
              {(b.logo_text || b.slug || '?')[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-cx-text">{b.name || b.slug}</span>
                <Badge color={b.enabled ? 'green' : 'gray'}>
                  {b.enabled ? 'enabled' : 'disabled'}
                </Badge>
                <span className="font-mono text-xs text-cx-muted">{b.slug}</span>
              </div>
              {b.tagline && (
                <p className="text-xs text-cx-muted">{b.tagline}</p>
              )}
              {b.site_domain && (
                <a
                  href={`https://${b.site_domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cx-blue hover:underline"
                >
                  {b.site_domain} ↗
                </a>
              )}
            </div>

            {/* Color chip */}
            <div className="shrink-0 text-right">
              <div
                className="inline-block w-5 h-5 rounded border border-cx-border"
                style={{ background: b.primary_color }}
                title={b.primary_color}
              />
              <div className="font-mono text-xs text-cx-muted mt-0.5">
                {b.primary_color || '—'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!loading && brands.length === 0 && (
        <p className="text-cx-muted text-sm italic">No brands registered.</p>
      )}
    </div>
  )
}
