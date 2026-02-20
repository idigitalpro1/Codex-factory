import { createContext, useContext, useState, useCallback } from 'react'
import { login as apiLogin } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cx-token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cx-user') || 'null') }
    catch { return null }
  })

  const login = useCallback(async (key) => {
    const { data } = await apiLogin(key)
    localStorage.setItem('cx-token', data.token)
    localStorage.setItem('cx-user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cx-token')
    localStorage.removeItem('cx-user')
    setToken('')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isAuthed: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
