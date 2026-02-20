import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      await login(key.trim())
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.description || err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cx-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="text-cx-blue font-bold text-3xl tracking-tight">CODEX</div>
          <div className="text-cx-muted text-sm mt-1">Factory Operations Panel</div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-cx-panel border border-cx-border rounded-card p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-cx-muted mb-1.5 uppercase tracking-wider">
              Admin Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••"
              autoFocus
              className="w-full bg-cx-bg border border-cx-border rounded px-3 py-2.5
                         text-cx-text font-mono text-sm
                         focus:outline-none focus:border-cx-blue transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded px-3 py-2 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full bg-cx-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium rounded py-2.5 text-sm transition-colors"
          >
            {loading ? 'Authenticating…' : 'Enter'}
          </button>
        </form>

        <p className="text-center text-cx-muted text-xs mt-4">
          5280.menu · Publishing Factory · Internal
        </p>
      </div>
    </div>
  )
}
