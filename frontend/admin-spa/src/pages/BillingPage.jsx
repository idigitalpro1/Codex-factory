import { useState, useEffect, useCallback } from 'react'
import { getInvoices, createInvoice, updateInvoice, sendInvoice, getInvoicePdf } from '../api/endpoints'
import { Badge, Btn, PageHeader, AlertBar, Spinner, Card } from '../components/ui'

const STATUS_COLORS = { draft: 'amber', sent: 'blue', paid: 'green', void: 'gray' }

// Next N Thursdays from today
function nextThursdays(n = 14) {
  const results = []
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  while (results.length < n) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 4) results.push(d.toISOString().slice(0, 10))
  }
  return results
}

// Rates
const FIRST_LINE   = 0.43
const ADDL_LINE    = 0.38
const ORIG_FEE     = 25.00

function calcTotal(lineCount, runs) {
  const lc = parseInt(lineCount) || 0
  const r  = parseInt(runs) || 0
  if (lc === 0 || r === 0) return 0
  return ORIG_FEE + r * FIRST_LINE + r * Math.max(0, lc - 1) * ADDL_LINE
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [alert, setAlert]       = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editInv, setEditInv]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getInvoices({ limit: 100 })
      setInvoices(data.invoices || [])
      setTotal(data.total || 0)
    } catch (e) {
      setAlert({ text: `Auth required — ${e.response?.status === 401 ? 'visit /invoices/ to authenticate' : e.message}`, type: 'warn' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSend(id) {
    try {
      await sendInvoice(id)
      setAlert({ text: 'Invoice sent by email', type: 'success' })
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    }
  }

  async function handleStatus(id, status) {
    try {
      await updateInvoice(id, { status })
      setAlert({ text: `Marked ${status}`, type: 'success' })
      load()
    } catch (e) {
      setAlert({ text: e.message, type: 'error' })
    }
  }

  return (
    <div>
      <PageHeader
        title="Billing & Invoicing"
        subtitle={`${total} invoices · RegisterCall classified ads`}
        action={
          <>
            <Btn onClick={load} variant="ghost">↺ Refresh</Btn>
            <a href="/invoices/" target="_blank">
              <Btn variant="ghost">Full UI ↗</Btn>
            </a>
            <Btn onClick={() => { setEditInv(null); setShowForm(true) }} variant="primary">+ New Invoice</Btn>
          </>
        }
      />

      <AlertBar {...(alert || {})} />

      {showForm && (
        <InvoiceForm
          initial={editInv}
          onSaved={() => { setShowForm(false); setEditInv(null); load() }}
          onCancel={() => { setShowForm(false); setEditInv(null) }}
          setAlert={setAlert}
        />
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          ['Total', invoices.length],
          ['Draft',  invoices.filter((i) => i.status === 'draft').length],
          ['Sent',   invoices.filter((i) => i.status === 'sent').length],
          ['Paid',   invoices.filter((i) => i.status === 'paid').length],
        ].map(([label, val]) => (
          <Card key={label} className="text-center py-3">
            <div className="text-2xl font-bold text-cx-text">{val}</div>
            <div className="text-xs text-cx-muted mt-0.5 uppercase tracking-wider">{label}</div>
          </Card>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <p className="text-cx-muted text-sm italic">No invoices yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cx-border">
                {['Client', 'Date', 'Runs', 'Lines', 'Total', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="pb-2.5 pr-3 text-left text-xs text-cx-muted uppercase tracking-wider font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-cx-border/40 hover:bg-white/5 transition-colors group">
                  <td className="py-2.5 pr-3 font-medium text-sm">{inv.client}</td>
                  <td className="py-2.5 pr-3 text-xs text-cx-muted font-mono">{inv.date}</td>
                  <td className="py-2.5 pr-3 text-xs">{inv.runs}</td>
                  <td className="py-2.5 pr-3 text-xs">{inv.lineCount}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-cx-gold">
                    ${(inv.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge color={STATUS_COLORS[inv.status] || 'gray'}>{inv.status}</Badge>
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={getInvoicePdf(inv.id)} target="_blank" rel="noreferrer">
                        <Btn variant="ghost">PDF</Btn>
                      </a>
                      {inv.status !== 'paid' && (
                        <Btn onClick={() => handleSend(inv.id)} variant="ghost">Email</Btn>
                      )}
                      {inv.status === 'sent' && (
                        <Btn onClick={() => handleStatus(inv.id, 'paid')} variant="success">Paid</Btn>
                      )}
                      {inv.status === 'draft' && (
                        <Btn onClick={() => { setEditInv(inv); setShowForm(true) }} variant="ghost">Edit</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Invoice creation / edit form ──────────────────────────────
function InvoiceForm({ initial, onSaved, onCancel, setAlert }) {
  const thursdays = nextThursdays(14)
  const [form, setForm] = useState({
    client: '',
    date: thursdays[0],
    lineCount: 1,
    runs: 1,
    firstLineRate: FIRST_LINE,
    additionalLineRate: ADDL_LINE,
    originationFee: ORIG_FEE,
    runDates: [thursdays[0]],
    isArapahoeCounty: false,
    notes: '',
    ...initial,
  })

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const total = calcTotal(form.lineCount, form.runs)
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial?.id) {
        await updateInvoice(initial.id, form)
        setAlert({ text: 'Invoice updated', type: 'success' })
      } else {
        await createInvoice(form)
        setAlert({ text: 'Invoice created', type: 'success' })
      }
      onSaved()
    } catch (e) {
      setAlert({ text: e.response?.data?.description || e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-5">
      <h3 className="text-sm font-semibold text-cx-text mb-4">
        {initial ? 'Edit Invoice' : 'New Invoice'}
      </h3>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        {/* Client */}
        <div className="col-span-2">
          <label className="block text-xs text-cx-muted mb-1">Client Name *</label>
          <input
            value={form.client}
            onChange={set('client')}
            required
            placeholder="Business or individual name"
            className="w-full bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          />
        </div>

        {/* Publication date */}
        <div>
          <label className="block text-xs text-cx-muted mb-1">Publication Date</label>
          <select
            value={form.date}
            onChange={set('date')}
            className="w-full bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          >
            {thursdays.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Runs */}
        <div>
          <label className="block text-xs text-cx-muted mb-1">Number of Runs</label>
          <input
            type="number"
            min={1}
            value={form.runs}
            onChange={set('runs')}
            className="w-full bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          />
        </div>

        {/* Line count */}
        <div>
          <label className="block text-xs text-cx-muted mb-1">Line Count</label>
          <input
            type="number"
            min={1}
            value={form.lineCount}
            onChange={set('lineCount')}
            className="w-full bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue"
          />
        </div>

        {/* Arapahoe county flag */}
        <div className="flex items-center gap-2 pt-5">
          <input
            id="arap"
            type="checkbox"
            checked={form.isArapahoeCounty}
            onChange={set('isArapahoeCounty')}
            className="rounded"
          />
          <label htmlFor="arap" className="text-sm text-cx-text">Arapahoe County Legal</label>
        </div>

        {/* Live total */}
        <div className="col-span-2 bg-cx-bg rounded px-4 py-3 flex justify-between items-center">
          <div className="text-xs text-cx-muted">
            Orig. Fee ${ORIG_FEE.toFixed(2)} + {form.runs} run(s) × line rates
          </div>
          <div className="text-xl font-bold text-cx-gold font-mono">
            ${total.toFixed(2)}
          </div>
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="block text-xs text-cx-muted mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            className="w-full bg-cx-bg border border-cx-border rounded px-3 py-2 text-sm text-cx-text focus:outline-none focus:border-cx-blue resize-none"
          />
        </div>

        <div className="col-span-2 flex gap-2 justify-end">
          <Btn onClick={onCancel} variant="ghost" type="button">Cancel</Btn>
          <Btn type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Update Invoice' : 'Create Invoice'}
          </Btn>
        </div>
      </form>
    </Card>
  )
}
