import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV = [
  { to: '/',        label: 'Health',   icon: HeartIcon,   exact: true },
  { to: '/domains', label: 'Domains',  icon: GlobeIcon  },
  { to: '/brands',  label: 'Brands',   icon: BuildingIcon },
  { to: '/kits',    label: 'Kits',     icon: PackageIcon  },
  { to: '/billing', label: 'Billing',  icon: ReceiptIcon  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-cx-bg text-cx-text font-sans">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col bg-cx-panel border-r border-cx-border">
        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-cx-border">
          <div className="text-cx-blue font-bold text-xl tracking-tight">CODEX</div>
          <div className="text-cx-muted text-xs mt-0.5 font-mono">Factory Admin</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-r-2 ` +
                (isActive
                  ? 'text-cx-blue bg-cx-blue/10 border-cx-blue font-medium'
                  : 'text-cx-muted hover:text-cx-text hover:bg-white/5 border-transparent')
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-5 py-4 border-t border-cx-border">
          <div className="text-xs text-cx-muted mb-2 truncate">
            {user?.name || 'Admin'}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-cx-muted hover:text-cx-red transition-colors text-left"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Topbar */}
        <header className="h-12 border-b border-cx-border flex items-center px-6 gap-3 bg-cx-panel/50 backdrop-blur sticky top-0 z-10">
          <StatusDot />
          <span className="text-xs text-cx-muted font-mono">5280.menu</span>
        </header>

        <div className="p-6 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// ── Live health dot ──────────────────────────────────────────
function StatusDot() {
  const [ok, setOk] = useState(null)
  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => setOk(r.ok))
      .catch(() => setOk(false))
  }, [])
  return (
    <div
      title={ok === null ? 'Checking…' : ok ? 'Backend healthy' : 'Backend down'}
      className={`w-2 h-2 rounded-full ${
        ok === null ? 'bg-cx-muted animate-pulse' : ok ? 'bg-cx-green' : 'bg-cx-red'
      }`}
    />
  )
}

// ── Missing imports ──────────────────────────────────────────
import { useState, useEffect } from 'react'

// ── Inline SVG icon components ───────────────────────────────
function HeartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}
function GlobeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
    </svg>
  )
}
function BuildingIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )
}
function PackageIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}
function ReceiptIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}
