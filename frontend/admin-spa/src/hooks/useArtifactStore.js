/**
 * useArtifactStore — IndexedDB persistence for workspace artifacts.
 *
 * Database: "codex-workspace"  Version: 1
 * Object stores:
 *   artifacts  keyPath: id
 *   images     keyPath: id
 *   messages   keyPath: id
 *   prompts    keyPath: id  (saved scratchpad drafts)
 *
 * Usage (inside WorkspaceContext or any component):
 *   const db = useArtifactStore()
 *   await db.saveArtifact(artifact)
 *   const all = await db.loadArtifacts()
 */

import { useCallback, useEffect, useRef } from 'react'

const DB_NAME    = 'codex-workspace'
const DB_VERSION = 1
const STORES     = ['artifacts', 'images', 'messages', 'prompts']

// ── Open / upgrade ─────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = e.target.result
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' })
        }
      }
    }

    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}

// ── Low-level helpers ──────────────────────────────────────────
function tx(db, storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName)
}

function idbPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}

function getAll(db, storeName) {
  return idbPromise(tx(db, storeName).getAll())
}

function upsert(db, storeName, record) {
  return idbPromise(tx(db, storeName, 'readwrite').put(record))
}

function remove(db, storeName, id) {
  return idbPromise(tx(db, storeName, 'readwrite').delete(id))
}

function clearStore(db, storeName) {
  return idbPromise(tx(db, storeName, 'readwrite').clear())
}

// ── Hook ──────────────────────────────────────────────────────
export function useArtifactStore() {
  const dbRef = useRef(null)

  // Open once on mount
  useEffect(() => {
    openDB()
      .then((db) => { dbRef.current = db })
      .catch((err) => console.warn('[ArtifactStore] IndexedDB unavailable:', err))
    return () => {
      dbRef.current?.close()
      dbRef.current = null
    }
  }, [])

  const ensure = useCallback(() => {
    if (!dbRef.current) throw new Error('IndexedDB not ready')
    return dbRef.current
  }, [])

  // ── Artifacts ──────────────────────────────────────────────
  const loadArtifacts = useCallback(async () => {
    try { return await getAll(ensure(), 'artifacts') }
    catch { return [] }
  }, [ensure])

  const saveArtifact = useCallback(async (artifact) => {
    try { await upsert(ensure(), 'artifacts', artifact) }
    catch (e) { console.warn('[ArtifactStore] saveArtifact:', e) }
  }, [ensure])

  const deleteArtifact = useCallback(async (id) => {
    try { await remove(ensure(), 'artifacts', id) }
    catch (e) { console.warn('[ArtifactStore] deleteArtifact:', e) }
  }, [ensure])

  // ── Images ─────────────────────────────────────────────────
  const loadImages = useCallback(async () => {
    try { return await getAll(ensure(), 'images') }
    catch { return [] }
  }, [ensure])

  const saveImage = useCallback(async (image) => {
    try { await upsert(ensure(), 'images', image) }
    catch (e) { console.warn('[ArtifactStore] saveImage:', e) }
  }, [ensure])

  const deleteImage = useCallback(async (id) => {
    try { await remove(ensure(), 'images', id) }
    catch (e) { console.warn('[ArtifactStore] deleteImage:', e) }
  }, [ensure])

  // ── Messages ───────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try { return await getAll(ensure(), 'messages') }
    catch { return [] }
  }, [ensure])

  const saveMessage = useCallback(async (message) => {
    try { await upsert(ensure(), 'messages', message) }
    catch (e) { console.warn('[ArtifactStore] saveMessage:', e) }
  }, [ensure])

  const clearMessages = useCallback(async () => {
    try { await clearStore(ensure(), 'messages') }
    catch (e) { console.warn('[ArtifactStore] clearMessages:', e) }
  }, [ensure])

  // ── Prompts (saved scratchpad drafts) ──────────────────────
  const loadPrompts = useCallback(async () => {
    try { return await getAll(ensure(), 'prompts') }
    catch { return [] }
  }, [ensure])

  const savePrompt = useCallback(async (prompt) => {
    // prompt: { id, title, content, createdAt }
    try { await upsert(ensure(), 'prompts', prompt) }
    catch (e) { console.warn('[ArtifactStore] savePrompt:', e) }
  }, [ensure])

  const deletePrompt = useCallback(async (id) => {
    try { await remove(ensure(), 'prompts', id) }
    catch (e) { console.warn('[ArtifactStore] deletePrompt:', e) }
  }, [ensure])

  return {
    // Artifacts
    loadArtifacts,
    saveArtifact,
    deleteArtifact,
    // Images
    loadImages,
    saveImage,
    deleteImage,
    // Messages
    loadMessages,
    saveMessage,
    clearMessages,
    // Prompts
    loadPrompts,
    savePrompt,
    deletePrompt,
  }
}
