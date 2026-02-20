/**
 * WorkspaceLayout — the persistent operations shell.
 *
 * Zone map (nothing here ever unmounts between routes):
 *
 * ┌──────────────────────────────────────────────────────┐
 * │ AssistantSelector (top bar)                   h-12  │
 * ├──────────────┬───────────────────┬──────────────────┤
 * │ Left nav     │  Outlet           │  ArtifactDrawer  │
 * │ w-14 / w-56  │  flex-1           │  w-72 / w-10     │
 * │ (icon rail   │  only this        │  (history,       │
 * │  or labeled) │  area changes     │   artifacts,     │
 * │              │  on navigation    │   images,        │
 * │              │                   │   prompts)       │
 * └──────────────┴───────────────────┴──────────────────┘
 *
 * State persists across all routes via WorkspaceContext + IndexedDB.
 * Future: WebSocket / streaming updates via StreamDot in AssistantSelector.
 */

import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import AssistantSelector from './AssistantSelector'
import ArtifactDrawer from './ArtifactDrawer'

// ── Nav items ─────────────────────────────────────────────────
const NAV = [
  { to: '/',        label: 'Health',   Icon: HeartIcon,    exact: true },
  { to: '/domains', label: 'Domains',  Icon: GlobeIcon   },
  { to: '/brands',  label: 'Brands',   Icon: BuildingIcon },
  { to: '/kits',    label: 'Kits',     Icon: PackageIcon  },
  { to: '/billing', label: 'Billing',  Icon: ReceiptIcon  },
]

export default function WorkspaceLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [navExpanded, setNavExpanded] = useState(true)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cx-bg text-cx-text font-sans">

      {/* ── Top bar: assistant selector ───────────────────────── */}
      <AssistantSelector>
        {/* Wordmark slot */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNavExpanded(!navExpanded)}
            title={navExpanded ? 'Collapse nav' : 'Expand nav'}
            className="text-cx-muted hover:text-cx-text transition-colors p-1"
          >
            <MenuIcon className="w-4 h-4" />
          </button>
          {navExpanded && (
            <div>
              <div className="text-cx-blue font-bold text-base tracking-tight leading-none">CODEX</div>
              <div className="text-cx-muted text-[10px] font-mono">Admin</div>
            </div>
          )}
        </div>
      </AssistantSelector>

      {/* ── Main row: nav + content + drawer ─────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left nav sidebar ────────────────────────────────── */}
        <aside
          className={`
            shrink-0 flex flex-col bg-cx-panel border-r border-cx-border
            transition-[width] duration-200 ease-in-out overflow-hidden
            ${navExpanded ? 'w-52' : 'w-14'}
          `}
        >
          {/* Nav links */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {NAV.map(({ to, label, Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                title={!navExpanded ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-r-2 ` +
                  (isActive
                    ? 'text-cx-blue bg-cx-blue/10 border-cx-blue font-medium'
                    : 'text-cx-muted hover:text-cx-text hover:bg-white/5 border-transparent')
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {navExpanded && label}
              </NavLink>
            ))}
          </nav>

          {/* User strip */}
          <div className={`shrink-0 border-t border-cx-border p-3 ${!navExpanded ? 'text-center' : ''}`}>
            {navExpanded ? (
              <>
                <div className="text-xs text-cx-muted truncate mb-1">{user?.name ?? 'Admin'}</div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-cx-muted hover:text-cx-red transition-colors"
                >
                  Sign out →
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-full flex justify-center text-cx-muted hover:text-cx-red transition-colors"
              >
                <SignOutIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* ── Center: page content (Outlet only) ───────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* ── Right: artifact drawer ───────────────────────────── */}
        <ArtifactDrawer />
      </div>
    </div>
  )
}

// ── Status dot (used in topbar if needed) ─────────────────────
export function StatusDot() {
  const [ok, setOk] = useState(null)
  useEffect(() => {
    fetch('/api/v1/health').then((r) => setOk(r.ok)).catch(() => setOk(false))
  }, [])
  return (
    <div
      title={ok === null ? 'Checking…' : ok ? 'Backend healthy' : 'Backend down'}
      className={`w-2 h-2 rounded-full shrink-0 ${ok === null ? 'bg-cx-muted animate-pulse' : ok ? 'bg-cx-green' : 'bg-cx-red'}`}
    />
  )
}

// ── Icons ─────────────────────────────────────────────────────
function HeartIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
}
function GlobeIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" /></svg>
}
function BuildingIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" /></svg>
}
function PackageIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
}
function ReceiptIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" /></svg>
}
function SignOutIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
}
function MenuIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
}
