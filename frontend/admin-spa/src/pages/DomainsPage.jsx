import { useState, useEffect, useCallback } from 'react'
import { getDomains, createDomain, updateDomain } from '../api/endpoints'
import { Badge, Btn, PageHeader, AlertBar, Spinner, Card } from '../components/ui'

export default function DomainsPage() {
  const [domains, setDomains] = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert]     = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getDomains({ limit: 50 })
      setDomains(data.domains || [])
      setTotal(data.total || 0)
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <PageHeader
        title="Domain Registry"
        subtitle={`${total} ops domains tracked`}
        action={
          <>
            <Btn onClick={load} variant="ghost">↺ Refresh</Btn>
            <Btn onClick={() => setShowForm(!showForm)} variant="primary">+ Add Domain</Btn>
          </>
        }
      />

      <AlertBar {...(alert || {})} />

      {showForm && (
        <AddDomainForm
          onSaved={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
          setAlert={setAlert}
        />
      )}

      {loading ? (
        <Spinner />
      ) : domains.length === 0 ? (
        <p className="text-cx-muted text-sm italic">No domains configured.</p>
      ) : (
        <DomainTable domains={domains} onUpdate={load} setAlert={setAlert} />
      )}
    </div>
  )
}

// ── Domain table ──────────────────────────────────────────────
function DomainTable({ domains, onUpdate, setAlert }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cx-border">
            {['Domain', 'Brand', 'IP / Routing', 'DNS', 'SSL', 'API', 'Proxy', 'Actions'].map((h) => (
              <th key={h} className="pb-2.5 pr-3 text-left text-xs text-cx-muted uppercase tracking-wider font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <DomainRow key={d.id} domain={d} onUpdate={onUpdate} setAlert={setAlert} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DomainRow({ domain: d, onUpdate, setAlert }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ brand_slug: d.brand_slug || '', notes: d.notes || '' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateDomain(d.id, form)
      setAlert({ text: `Updated ${d.domain}`, type: 'success' })
      setEditing(false)
      onUpdate()
    } catch (e) {
      setAlert({ text: e.response?.data?.description || e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (ok) => (
    <Badge color={ok ? 'green' : 'red'}>{ok ? 'ok' : 'err'}</Badge>
  )

  return (
    <tr className="border-b border-cx-border/40 hover:bg-white/5 transition-colors group">
      <td className="py-2.5 pr-3">
        <span className="font-mono text-xs">{d.domain}</span>
        {d.homepage_url && (
          <a href={d.homepage_url} target="_blank" rel="noreferrer"
            className="ml-1 text-cx-muted hover:text-cx-blue text-xs">↗</a>
        )}
      </td>
      <td className="py-2.5 pr-3">
        {editing ? (
          <input
            value={form.brand_slug}
            onChange={(e) => setForm({ ...form, brand_slug: e.target.value })}
            className="w-24 bg-cx-bg border border-cx-border rounded px-2 py-1 text-xs font-mono text-cx-text focus:outline-none focus:border-cx-blue"
            placeholder="slug"
          />
        ) : (
          <span className="text-xs text-cx-muted">{d.brand_slug || '—'}</span>
        )}
      </td>
      <td className="py-2.5 pr-3 font-mono text-xs text-cx-muted">
        {d.ip || '—'}
      </td>
      <td className="py-2.5 pr-3">{statusBadge(d.dns_ok)}</td>
      <td className="py-2.5 pr-3">{statusBadge(d.ssl_ok)}</td>
      <td className="py-2.5 pr-3">
        <Badge color={d.api_ok ? 'green' : 'gray'}>{d.api_ok ? 'ok' : 'n/a'}</Badge>
      </td>
      <td className="py-2.5 pr-3">
        <Badge color={d.proxy_mode === 'plesk' ? 'blue' : 'gray'}>
          {d.proxy_mode || 'none'}
        </Badge>
      </td>
      <td className="py-2.5">
        {editing ? (
          <div className="flex gap-1">
            <Btn onClick={save} disabled={saving} variant="success">Save</Btn>
            <Btn onClick={() => setEditing(false)} variant="ghost">Cancel</Btn>
          </div>
        ) : (
          <Btn
            onClick={() => setEditing(true)}
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Edit
          </Btn>
        )}
      </td>
    </tr>
  )
}

// ── Add domain form ───────────────────────────────────────────
function AddDomainForm({ onSaved, onCancel, setAlert }) {
  const [form, setForm] = useState({ domain: '', brand_slug: '', ip: '', homepage_url: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createDomain(form)
      setAlert({ text: `Added ${form.domain}`, type: 'success' })
      onSaved()
    } catch (e) {
      setAlert({ text: e.response?.data?.description || e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <h3 className="text-sm font-semibold text-cx-text mb-3">Add Domain</h3>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        {[
          ['domain',       'Domain *',       'e.g. monarch.5280.menu', true],
          ['brand_slug',   'Brand Slug',     'e.g. monarch',           false],
          ['ip',           'IP Address',     '44.236.197.183',          false],
          ['homepage_url', 'Homepage URL',   'https://…',              false],
        ].map(([key, label, ph, req]) => (
          <div key={key}>
            <label className="block text-xs text-cx-muted mb-1">{label}</label>
            <input
              value={form[key]}
              onChange={set(key)}
              required={req}
              placeholder={ph}
              className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text
                         focus:outline-none focus:border-cx-blue font-mono"
            />
          </div>
        ))}
        <div className="col-span-2 flex gap-2 justify-end pt-1">
          <Btn onClick={onCancel} variant="ghost" type="button">Cancel</Btn>
          <Btn type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add Domain'}
          </Btn>
        </div>
      </form>
    </Card>
  )
}
