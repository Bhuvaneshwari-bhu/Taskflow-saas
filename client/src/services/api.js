import axios from 'axios'

// In dev, Vite proxies /api → localhost:5000 (see vite.config.js).
// In production on Vercel, set VITE_API_URL=https://your-backend.railway.app/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh-token cookie on every request
})

// ── Request: attach access token ──────────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: silent token refresh on 401 ────────────────────────────────────
//
// When an access token expires the server responds with 401.
// We transparently call /auth/refresh (which uses the httpOnly cookie),
// store the new access token, then replay the original request.
//
// Concurrent requests that 401 while a refresh is in flight are queued
// and resolved/rejected together once the refresh settles.

let isRefreshing  = false
let pendingQueue  = []   // { resolve, reject }[]

function drainQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original       = error.config
    const status         = error.response?.status
    // Exclude all /auth/* routes — login/register 401s mean bad credentials,
    // not an expired token, so auto-refresh must never fire for them.
    const isAuthEndpoint = original.url?.startsWith('/auth/')
    const alreadyRetried = original._retry

    // Only intercept 401s that are not from any auth endpoint
    if (status !== 401 || isAuthEndpoint || alreadyRetried) {
      return Promise.reject(error)
    }

    // If a refresh is already running, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing    = true

    try {
      // Cookie is sent automatically (withCredentials: true)
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      const newToken = data.accessToken

      localStorage.setItem('token', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      drainQueue(null, newToken)

      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      drainQueue(refreshError, null)

      // Refresh failed — clear local state and force re-login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
