import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    if (!data.success) throw new Error(data.message || 'Login failed')

    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user',  JSON.stringify(data.user))
    setToken(data.accessToken)
    setUser(data.user)
  }

  async function signup(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password })
    if (!data.success) throw new Error(data.message || 'Registration failed')
    // Auto-login after successful registration
    await login(email, password)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Always clear local state even if the server call fails
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken('')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
