import { useState, useEffect, useCallback } from 'react'
import { getListings, createListing, updateListing, deleteListing } from '../api/endpoints'
import { Badge, Btn, PageHeader, AlertBar, Spinner, Card, Table } from '../components/ui'

const CATEGORIES = [
  'Restaurant', 'Retail', 'Services', 'Entertainment',
  'Healthcare', 'Automotive', 'Real Estate', 'Education', 'Other',
]

const STATUS_COLORS = { active: 'green', pending: 'amber', inactive: 'gray' }

export default function ShopListingsPage() {
  const [listings, setListings] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [alert, setAlert]       = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filter, setFilter]     = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getListings()
      setListings(data.listings || [])
      setTotal(data.total || 0)
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove listing for "${name}"?`)) return
    try {
      await deleteListing(id)
      setAlert({ text: `Removed "${name}"`, type: 'success' })
      load()
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'active' ? 'inactive' : 'active'
    try {
      await updateListing(item.id, { status: next })
      setAlert({ text: `${item.name} → ${next}`, type: 'success' })
      load()
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    }
  }

  const visible = filter === 'all'
    ? listings
    : listings.filter((l) => l.status === filter)

  const counts = {
    active:   listings.filter((l) => l.status === 'active').length,
    pending:  listings.filter((l) => l.status === 'pending').length,
    inactive: listings.filter((l) => l.status === 'inactive').length,
  }

  return (
    <div>
      <PageHeader
        title="Shop Local Listings"
        subtitle={`${total} businesses · Colorado mountain communities`}
        action={
          <>
            <Btn onClick={load} variant="ghost">↺ Refresh</Btn>
            <Btn onClick={() => { setEditItem(null); setShowForm(true) }} variant="primary">
              + Add Listing
            </Btn>
          </>
        }
      />

      <AlertBar {...(alert || {})} />

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ['Total',    total,          'all'],
          ['Active',   counts.active,  'active'],
          ['Pending',  counts.pending, 'pending'],
          ['Inactive', counts.inactive,'inactive'],
        ].map(([label, val, f]) => (
          <button
            key={label}
            onClick={() => setFilter(f)}
            className={`text-center py-3 rounded-lg border transition-colors ${
              filter === f ? 'border-cx-blue bg-cx-blue/10' : 'border-cx-border bg-cx-card hover:border-cx-blue/40'
            }`}
          >
            <div className="text-2xl font-bold text-cx-text">{val}</div>
            <div className="text-xs text-cx-muted mt-0.5 uppercase tracking-wider">{label}</div>
          </button>
        ))}
      </div>

      {/* Create / edit form */}
      {showForm && (
        <ListingForm
          initial={editItem}
          onSaved={() => { setShowForm(false); setEditItem(null); load() }}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
          setAlert={setAlert}
        />
      )}

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <p className="text-cx-muted text-sm italic">No listings{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
      ) : (
        <Table
          keyField="id"
          columns={[
            { key: 'name',     label: 'Business' },
            { key: 'category', label: 'Category', render: (r) => <span className="text-xs text-cx-muted">{r.category}</span> },
            { key: 'address',  label: 'Address',  render: (r) => <span className="text-xs font-mono text-cx-muted">{r.address || '—'}</span> },
            { key: 'phone',    label: 'Phone',    render: (r) => <span className="text-xs font-mono">{r.phone || '—'}</span> },
            { key: 'status',   label: 'Status',   render: (r) => <Badge color={STATUS_COLORS[r.status] || 'gray'}>{r.status}</Badge> },
            {
              key: '_actions', label: 'Actions',
              render: (r) => (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Btn variant="ghost" onClick={() => { setEditItem(r); setShowForm(true) }}>Edit</Btn>
                  <Btn variant="ghost" onClick={() => handleStatusToggle(r)}>
                    {r.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Btn>
                  <Btn variant="danger" onClick={() => handleDelete(r.id, r.name)}>✕</Btn>
                </div>
              ),
            },
          ]}
          rows={visible}
        />
      )}
    </div>
  )
}

// ── Listing create/edit form ───────────────────────────────────
function ListingForm({ initial, onSaved, onCancel, setAlert }) {
  const [form, setForm] = useState({
    name: '', category: 'Restaurant', address: '', phone: '',
    website: '', hours: '', description: '', logo_url: '',
    status: 'active',
    ...initial,
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial?.id) {
        await updateListing(initial.id, form)
        setAlert({ text: `Updated "${form.name}"`, type: 'success' })
      } else {
        await createListing(form)
        setAlert({ text: `Added "${form.name}"`, type: 'success' })
      }
      onSaved()
    } catch (e) {
      setAlert({ text: e.response?.data?.description || e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const field = (key, label, placeholder, opts = {}) => (
    <div key={key} className={opts.full ? 'col-span-2' : ''}>
      <label className="block text-xs text-cx-muted mb-1">{label}</label>
      {opts.textarea ? (
        <textarea
          value={form[key]}
          onChange={set(key)}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue resize-none"
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={form[key]}
          onChange={set(key)}
          required={opts.required}
          placeholder={placeholder}
          className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
        />
      )}
    </div>
  )

  return (
    <Card className="mb-5">
      <h3 className="text-sm font-semibold text-cx-text mb-4">
        {initial ? 'Edit Listing' : 'New Business Listing'}
      </h3>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        {field('name',        'Business Name *',  'e.g. Black Hawk Grill',         { required: true })}
        <div>
          <label className="block text-xs text-cx-muted mb-1">Category</label>
          <select
            value={form.category}
            onChange={set('category')}
            className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {field('address',     'Address',          '123 Main St, Black Hawk, CO')}
        {field('phone',       'Phone',            '(303) 555-0100')}
        {field('website',     'Website',          'https://…')}
        {field('hours',       'Hours',            'Mon–Fri 11am–9pm')}
        {field('logo_url',    'Logo URL',         'https://…/logo.png')}
        <div>
          <label className="block text-xs text-cx-muted mb-1">Status</label>
          <select
            value={form.status}
            onChange={set('status')}
            className="w-full bg-cx-bg border border-cx-border rounded px-2.5 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          >
            <option value="active">Active</option>
            <option value="pending">Pending review</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {field('description', 'Description',      'Brief description of the business…', { full: true, textarea: true })}
        <div className="col-span-2 flex justify-end gap-2 pt-1">
          <Btn onClick={onCancel} variant="ghost" type="button">Cancel</Btn>
          <Btn type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Update Listing' : 'Add Listing'}
          </Btn>
        </div>
      </form>
    </Card>
  )
}
