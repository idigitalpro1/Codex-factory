import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import LoginPage       from './auth/LoginPage'
import WorkspaceLayout from './components/WorkspaceLayout'
import { Spinner }     from './components/ui'

// Eagerly loaded — always in initial bundle
import HealthPage from './pages/HealthPage'

// Lazy-loaded — fetched only when the user navigates to that route.
// WorkspaceLayout (shell) never remounts; only <Outlet /> swaps.
const DomainsPage         = lazy(() => import('./pages/DomainsPage'))
const BrandsPage          = lazy(() => import('./pages/BrandsPage'))
const KitsPage            = lazy(() => import('./pages/KitsPage'))
const BillingPage         = lazy(() => import('./pages/BillingPage'))
const ShopListingsPage    = lazy(() => import('./pages/ShopListingsPage'))
const PromptLibraryPage   = lazy(() => import('./pages/PromptLibraryPage'))
const ArtifactHistoryPage = lazy(() => import('./pages/ArtifactHistoryPage'))
const ImageLibraryPage    = lazy(() => import('./pages/ImageLibraryPage'))

function PageLoader() {
  return <div className="flex items-center justify-center py-16"><Spinner /></div>
}

function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth()
  return isAuthed ? children : <Navigate to="/login" replace />
}

function L({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        {/* WorkspaceProvider is outside BrowserRouter — context survives all route changes */}
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* All authenticated pages share one persistent WorkspaceLayout shell */}
            <Route
              path="/"
              element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}
            >
              {/* System */}
              <Route index              element={<HealthPage />} />

              {/* Publishing */}
              <Route path="domains"     element={<L><DomainsPage /></L>} />
              <Route path="brands"      element={<L><BrandsPage /></L>} />
              <Route path="kits"        element={<L><KitsPage /></L>} />

              {/* Commerce */}
              <Route path="billing"     element={<L><BillingPage /></L>} />
              <Route path="listings"    element={<L><ShopListingsPage /></L>} />

              {/* Workspace */}
              <Route path="prompts"     element={<L><PromptLibraryPage /></L>} />
              <Route path="artifacts"   element={<L><ArtifactHistoryPage /></L>} />
              <Route path="images"      element={<L><ImageLibraryPage /></L>} />

              <Route path="*"           element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  )
}
