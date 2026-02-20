import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginPage from './auth/LoginPage'
import Layout from './components/Layout'
import HealthPage  from './pages/HealthPage'
import DomainsPage from './pages/DomainsPage'
import BrandsPage  from './pages/BrandsPage'
import KitsPage    from './pages/KitsPage'
import BillingPage from './pages/BillingPage'

function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth()
  return isAuthed ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index     element={<HealthPage  />} />
            <Route path="domains" element={<DomainsPage />} />
            <Route path="brands"  element={<BrandsPage  />} />
            <Route path="kits"    element={<KitsPage    />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="*"       element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
