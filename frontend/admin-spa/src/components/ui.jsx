// Shared UI primitives

export function Badge({ color = 'gray', children }) {
  const map = {
    green:  'bg-green-900/30  text-green-400  border-green-800',
    red:    'bg-red-900/30    text-red-400    border-red-800',
    amber:  'bg-amber-900/30  text-amber-400  border-amber-800',
    blue:   'bg-blue-900/30   text-blue-400   border-blue-800',
    gray:   'bg-white/5       text-cx-muted   border-cx-border',
    gold:   'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[color] ?? map.gray}`}>
      {children}
    </span>
  )
}

export function Btn({ onClick, disabled, variant = 'primary', size = 'sm', children, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes  = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  const variants = {
    primary: 'bg-cx-blue    hover:bg-blue-600  text-white',
    success: 'bg-cx-green   hover:bg-green-700 text-white',
    danger:  'bg-cx-red     hover:bg-red-700   text-white',
    ghost:   'bg-white/5    hover:bg-white/10  text-cx-text  border border-cx-border',
    amber:   'bg-amber-700  hover:bg-amber-600 text-white',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size] ?? sizes.sm} ${variants[variant] ?? variants.primary} ${className}`}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-cx-card border border-cx-border rounded-card p-4 ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-cx-text">{title}</h1>
        {subtitle && <p className="text-cx-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  )
}

export function AlertBar({ text, type = 'info' }) {
  if (!text) return null
  const map = {
    info:    'bg-blue-900/20  border-blue-800  text-blue-300',
    success: 'bg-green-900/20 border-green-800 text-green-300',
    error:   'bg-red-900/20   border-red-800   text-red-300',
    warn:    'bg-amber-900/20 border-amber-800 text-amber-300',
  }
  return (
    <div className={`mb-4 px-4 py-2.5 rounded border text-sm ${map[type] ?? map.info}`}>
      {text}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-cx-muted text-sm">
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      Loading…
    </div>
  )
}

export function Table({ columns, rows, keyField = 'id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cx-border">
            {columns.map((col) => (
              <th key={col.key} className="pb-2.5 pr-4 text-left text-xs text-cx-muted uppercase tracking-wider font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} className="border-b border-cx-border/40 hover:bg-white/5 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 pr-4">
                  {col.render ? col.render(row) : (
                    <span className={col.mono ? 'font-mono text-xs' : 'text-sm'}>
                      {row[col.key] ?? '—'}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
