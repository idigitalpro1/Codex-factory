/**
 * Codex UI primitives — backed by Dashtail shadcn components.
 *
 * Pages import from here (Badge, Btn, Card…) and automatically get
 * the Dashtail/Radix implementations. Existing page code unchanged.
 */
import { cn } from '../lib/utils'
import { Button as DtButton } from './ui/button'
import { Badge as DtBadge } from './ui/badge'
import { Card as DtCard, CardContent } from './ui/card'
import { Skeleton } from './ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog'
import { Input }     from './ui/input'
import { Label }     from './ui/label'
import { Separator } from './ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

// ── Badge ─────────────────────────────────────────────────────────────
// Maps our color strings → Dashtail color + variant props
const BADGE_MAP = {
  green:  { color: 'success',     variant: 'soft' },
  red:    { color: 'destructive', variant: 'soft' },
  amber:  { color: 'warning',     variant: 'soft' },
  blue:   { color: 'info',        variant: 'soft' },
  gray:   { color: 'secondary',   variant: 'soft' },
  gold:   { color: 'warning',     variant: 'soft' },
}

export function Badge({ color = 'gray', children, className }) {
  const { color: dtColor, variant } = BADGE_MAP[color] ?? BADGE_MAP.gray
  return (
    <DtBadge color={dtColor} variant={variant} className={className}>
      {children}
    </DtBadge>
  )
}

// ── Btn ───────────────────────────────────────────────────────────────
const BTN_MAP = {
  primary: { color: 'primary' },
  success: { color: 'success' },
  danger:  { color: 'destructive' },
  ghost:   { color: 'secondary', variant: 'soft' },
  amber:   { color: 'warning' },
}

export function Btn({ onClick, disabled, variant = 'primary', size = 'sm', children, className = '', type = 'button' }) {
  const { color, variant: dtVariant } = BTN_MAP[variant] ?? BTN_MAP.primary
  const dtSize = { sm: 'xs', md: 'sm', lg: 'md' }[size] ?? 'xs'
  return (
    <DtButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      color={color}
      variant={dtVariant}
      size={dtSize}
      className={className}
    >
      {children}
    </DtButton>
  )
}

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return (
    <DtCard className={cn('bg-cx-card border-cx-border', className)}>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </DtCard>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────
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

// ── AlertBar ──────────────────────────────────────────────────────────
export function AlertBar({ text, type = 'info' }) {
  if (!text) return null
  const map = {
    info:    'bg-info/10    border-info/30    text-info',
    success: 'bg-success/10 border-success/30 text-success',
    error:   'bg-destructive/10 border-destructive/30 text-destructive',
    warn:    'bg-warning/10  border-warning/30  text-warning',
  }
  return (
    <div className={cn('mb-4 px-4 py-2.5 rounded border text-sm', map[type] ?? map.info)}>
      {text}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────
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

// ── Table ─────────────────────────────────────────────────────────────
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

// ── Re-export Dashtail primitives for direct use in pages ─────────────
export {
  Input, Label, Separator, Skeleton,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  cn,
}
