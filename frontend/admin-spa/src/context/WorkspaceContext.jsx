/**
 * WorkspaceContext — persistent workspace state across all navigation.
 * Backed by IndexedDB via useArtifactStore for durability across page reloads.
 *
 * Artifact shape:
 * {
 *   id:      string,
 *   type:    'text'|'code'|'image'|'invoice'|'kit'|'json'|'pdf'|'zip',
 *   title:   string,
 *   content: string | object,
 *   pinned:  boolean,
 *   meta: {
 *     createdAt:    string,     // ISO
 *     language?:    string,     // code
 *     mimeType?:    string,     // image/pdf/zip
 *     url?:         string,     // blob or data URL
 *     thumbnail?:   string,     // data URL preview (images)
 *     invoiceId?:   string,
 *     kitId?:       string,
 *     sourceRoute?: string,
 *     tags?:        string[],
 *   }
 * }
 *
 * Message shape:
 * { id, role: 'user'|'assistant'|'system', content, timestamp, artifactIds?, imageUrls?, assistant? }
 *
 * Image shape:
 * { id, name, url, thumbnail, timestamp }
 *
 * Prompt shape (saved drafts):
 * { id, title, content, createdAt }
 *
 * Assistant shape:
 * { id, name, color, icon }
 */

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import { useArtifactStore } from '../hooks/useArtifactStore'

// ── Assistants registry ───────────────────────────────────────
export const ASSISTANTS = [
  { id: 'claude',   name: 'Claude',   color: '#c8762a', icon: '◈' },
  { id: 'chatgpt',  name: 'ChatGPT',  color: '#10a37f', icon: '⊕' },
  { id: 'gemini',   name: 'Gemini',   color: '#4285f4', icon: '✦' },
  { id: 'manus',    name: 'Manus',    color: '#7c3aed', icon: '⟐' },
  { id: 'copilot',  name: 'Copilot',  color: '#0078d4', icon: '⊞' },
]

// ── ID generator ─────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

// ── Initial state ─────────────────────────────────────────────
const INIT = {
  messages:         [],
  artifacts:        {},
  artifactOrder:    [],    // string[] newest-first
  images:           [],
  savedPrompts:     [],
  scratchpad:       '',
  panelTab:         'history',
  panelOpen:        true,
  activeAssistant:  'claude',
  hydrated:         false,  // true once IndexedDB has loaded
}

// ── Reducer ───────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Hydration from IndexedDB on mount ────────────────────
    case 'HYDRATE': {
      const { messages, artifacts, images, prompts } = action.payload
      const artifactMap = {}
      const order = []
      for (const a of artifacts) {
        artifactMap[a.id] = a
        order.push(a.id)
      }
      return {
        ...state,
        messages,
        artifacts: artifactMap,
        artifactOrder: order,
        images,
        savedPrompts: prompts,
        hydrated: true,
      }
    }

    // ── Messages ─────────────────────────────────────────────
    case 'ADD_MESSAGE': {
      const msg = {
        id: uid(),
        timestamp: new Date().toISOString(),
        assistant: state.activeAssistant,
        ...action.payload,
      }
      return { ...state, messages: [...state.messages, msg] }
    }
    case 'CLEAR_HISTORY':
      return { ...state, messages: [] }

    // ── Artifacts ─────────────────────────────────────────────
    case 'ADD_ARTIFACT': {
      const id = action.payload.id || uid()
      const artifact = {
        pinned: false,
        ...action.payload,
        id,
        meta: { createdAt: new Date().toISOString(), ...action.payload.meta },
      }
      return {
        ...state,
        artifacts:     { ...state.artifacts, [id]: artifact },
        artifactOrder: [id, ...state.artifactOrder],
      }
    }
    case 'UPDATE_ARTIFACT': {
      const { id, ...patch } = action.payload
      if (!state.artifacts[id]) return state
      return {
        ...state,
        artifacts: { ...state.artifacts, [id]: { ...state.artifacts[id], ...patch } },
      }
    }
    case 'REMOVE_ARTIFACT': {
      const { [action.payload]: _x, ...rest } = state.artifacts
      return {
        ...state,
        artifacts:     rest,
        artifactOrder: state.artifactOrder.filter((i) => i !== action.payload),
      }
    }
    case 'PIN_ARTIFACT': {
      const a = state.artifacts[action.payload]
      if (!a) return state
      return {
        ...state,
        artifacts: { ...state.artifacts, [action.payload]: { ...a, pinned: !a.pinned } },
      }
    }

    // ── Images ───────────────────────────────────────────────
    case 'ADD_IMAGE': {
      const img = { id: uid(), timestamp: new Date().toISOString(), ...action.payload }
      return { ...state, images: [img, ...state.images] }
    }
    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter((i) => i.id !== action.payload) }

    // ── Saved prompts ─────────────────────────────────────────
    case 'SAVE_PROMPT': {
      const p = { id: uid(), createdAt: new Date().toISOString(), ...action.payload }
      return { ...state, savedPrompts: [p, ...state.savedPrompts] }
    }
    case 'DELETE_PROMPT':
      return { ...state, savedPrompts: state.savedPrompts.filter((p) => p.id !== action.payload) }

    // ── Scratchpad ────────────────────────────────────────────
    case 'SET_SCRATCHPAD':
      return { ...state, scratchpad: action.payload }

    // ── Panel ─────────────────────────────────────────────────
    case 'SET_PANEL_TAB':
      return { ...state, panelTab: action.payload }
    case 'TOGGLE_PANEL':
      return { ...state, panelOpen: !state.panelOpen }

    // ── Assistant ─────────────────────────────────────────────
    case 'SET_ASSISTANT':
      return { ...state, activeAssistant: action.payload }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────
const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT)
  const db = useArtifactStore()
  const imageInputRef = useRef(null)

  // ── Hydrate from IndexedDB on mount ──────────────────────────
  useEffect(() => {
    async function hydrate() {
      const [messages, artifacts, images, prompts] = await Promise.all([
        db.loadMessages(),
        db.loadArtifacts(),
        db.loadImages(),
        db.loadPrompts(),
      ])
      dispatch({ type: 'HYDRATE', payload: { messages, artifacts, images, prompts } })
    }
    hydrate()
  }, []) // intentionally empty — runs once

  // ── Persist messages ──────────────────────────────────────────
  const prevMessageCount = useRef(0)
  useEffect(() => {
    if (!state.hydrated) return
    const msgs = state.messages
    // Only persist newly added messages (avoid re-saving all on every render)
    if (msgs.length > prevMessageCount.current) {
      const newMsgs = msgs.slice(prevMessageCount.current)
      for (const m of newMsgs) db.saveMessage(m)
    } else if (msgs.length === 0) {
      db.clearMessages()
    }
    prevMessageCount.current = msgs.length
  }, [state.messages, state.hydrated])

  // ── Persist artifacts ─────────────────────────────────────────
  useEffect(() => {
    if (!state.hydrated) return
    for (const a of Object.values(state.artifacts)) {
      db.saveArtifact(a)
    }
  }, [state.artifacts, state.hydrated])

  // ── Persist images ────────────────────────────────────────────
  useEffect(() => {
    if (!state.hydrated) return
    for (const img of state.images) {
      db.saveImage(img)
    }
  }, [state.images, state.hydrated])

  // ── Action creators ───────────────────────────────────────────
  const addMessage = useCallback((role, content, extras = {}) =>
    dispatch({ type: 'ADD_MESSAGE', payload: { role, content, ...extras } }), [])

  const clearHistory = useCallback(async () => {
    await db.clearMessages()
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [db])

  const addArtifact = useCallback((artifact) =>
    dispatch({ type: 'ADD_ARTIFACT', payload: artifact }), [])
  const updateArtifact = useCallback((id, patch) =>
    dispatch({ type: 'UPDATE_ARTIFACT', payload: { id, ...patch } }), [])
  const removeArtifact = useCallback(async (id) => {
    await db.deleteArtifact(id)
    dispatch({ type: 'REMOVE_ARTIFACT', payload: id })
  }, [db])
  const pinArtifact = useCallback((id) =>
    dispatch({ type: 'PIN_ARTIFACT', payload: id }), [])

  const addImage = useCallback((img) =>
    dispatch({ type: 'ADD_IMAGE', payload: img }), [])
  const removeImage = useCallback(async (id) => {
    await db.deleteImage(id)
    dispatch({ type: 'REMOVE_IMAGE', payload: id })
  }, [db])

  const savePrompt = useCallback((title, content) =>
    dispatch({ type: 'SAVE_PROMPT', payload: { title, content } }), [])
  const deletePrompt = useCallback(async (id) => {
    await db.deletePrompt(id)
    dispatch({ type: 'DELETE_PROMPT', payload: id })
  }, [db])

  const setScratchpad = useCallback((text) =>
    dispatch({ type: 'SET_SCRATCHPAD', payload: text }), [])
  const setPanelTab = useCallback((tab) =>
    dispatch({ type: 'SET_PANEL_TAB', payload: tab }), [])
  const togglePanel = useCallback(() =>
    dispatch({ type: 'TOGGLE_PANEL' }), [])
  const setAssistant = useCallback((id) =>
    dispatch({ type: 'SET_ASSISTANT', payload: id }), [])

  // ── Derived ───────────────────────────────────────────────────
  const orderedArtifacts = state.artifactOrder
    .map((id) => state.artifacts[id])
    .filter(Boolean)
  const pinnedArtifacts = orderedArtifacts.filter((a) => a.pinned)
  const activeAssistantDef = ASSISTANTS.find((a) => a.id === state.activeAssistant) || ASSISTANTS[0]

  return (
    <WorkspaceContext.Provider value={{
      ...state,
      orderedArtifacts,
      pinnedArtifacts,
      activeAssistantDef,
      imageInputRef,
      addMessage,
      clearHistory,
      addArtifact,
      updateArtifact,
      removeArtifact,
      pinArtifact,
      addImage,
      removeImage,
      savePrompt,
      deletePrompt,
      setScratchpad,
      setPanelTab,
      togglePanel,
      setAssistant,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be inside WorkspaceProvider')
  return ctx
}
