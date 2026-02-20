/**
 * AssistantSelector — top bar assistant selector.
 * Persists which AI assistant is active across navigation.
 * Designed to extend: WebSocket / streaming status per assistant.
 *
 * Layout position: sticky top, inside the workspace shell.
 */

import { useWorkspace, ASSISTANTS } from '../context/WorkspaceContext'

export default function AssistantSelector({ children }) {
  const { activeAssistant, activeAssistantDef, setAssistant } = useWorkspace()

  return (
    <header className="h-12 shrink-0 flex items-center px-4 gap-3 border-b border-cx-border bg-cx-panel/80 backdrop-blur z-20">

      {/* Left: logo slot (children = wordmark or back button from parent) */}
      <div className="flex items-center gap-2 shrink-0 w-44">
        {children}
      </div>

      {/* Center: assistant pills */}
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        <span className="text-[10px] text-cx-muted font-mono shrink-0 mr-1">Model:</span>
        {ASSISTANTS.map((a) => {
          const active = activeAssistant === a.id
          return (
            <button
              key={a.id}
              onClick={() => setAssistant(a.id)}
              title={a.name}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                border transition-all shrink-0 whitespace-nowrap
                ${active
                  ? 'text-white border-transparent shadow-sm'
                  : 'text-cx-muted border-cx-border hover:text-cx-text hover:border-cx-muted/60'
                }
              `}
              style={active ? { background: a.color, borderColor: a.color } : undefined}
            >
              <span className="text-[11px] leading-none">{a.icon}</span>
              {a.name}
              {/* Future: streaming indicator dot */}
              {active && <StreamDot />}
            </button>
          )
        })}
      </div>

      {/* Right: active badge + status */}
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-[10px] text-cx-muted hidden sm:block font-mono">
          {activeAssistantDef.name} active
        </span>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: activeAssistantDef.color }}
          title="Ready"
        />
      </div>
    </header>
  )
}

/**
 * StreamDot — future hook point for WebSocket / streaming indicator.
 * Currently renders a static ready dot. Replace with streaming animation
 * when real-time assistant connections are wired up.
 */
function StreamDot() {
  // TODO: subscribe to a WebSocket session store here.
  // isStreaming = useAssistantStream(assistantId)
  const isStreaming = false

  if (!isStreaming) return null

  return (
    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
  )
}
