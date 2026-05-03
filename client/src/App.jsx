import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout          from './layouts/AppLayout'
import LoginPage          from './pages/LoginPage'
import SignupPage         from './pages/SignupPage'
import OrganizationsPage  from './pages/OrganizationsPage'
import OrganizationDetail from './pages/OrganizationDetail'
import ActivityPage       from './pages/ActivityPage'
import DashboardPage      from './pages/DashboardPage'
import ProjectPage        from './pages/ProjectPage'
import ProjectSettings    from './pages/ProjectSettings'
import ProfilePage        from './pages/ProfilePage'

// Redirect to /login when not authenticated; otherwise wrap in the shared layout.
function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth()
  if (!isAuthed) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

// Redirect already-authenticated users away from public pages.
function PublicRoute({ children }) {
  const { isAuthed } = useAuth()
  return isAuthed ? <Navigate to="/organizations" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────── */}
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

          {/* ── Protected (all wrapped in AppLayout via ProtectedRoute) */}
          <Route path="/organizations"        element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>} />
          <Route path="/org/:id"              element={<ProtectedRoute><OrganizationDetail /></ProtectedRoute>} />
          <Route path="/org/:id/activity"     element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="/dashboard"            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/project/:id"          element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
          <Route path="/project/:id/settings" element={<ProtectedRoute><ProjectSettings /></ProtectedRoute>} />
          <Route path="/profile"              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* ── Catch-all ───────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/organizations" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
