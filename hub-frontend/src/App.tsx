import { ThemeProvider } from '@ui5/webcomponents-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { AuthProvider } from './auth/AuthContext'
import '@ui5/webcomponents-react/dist/Assets.js'
import './index.css'

const DashboardView = lazy(() => import('./pages/DashboardView'))
const ShipmentWorkspace = lazy(() => import('./pages/ShipmentWorkspace'))
const ShipmentDetail = lazy(() => import('./pages/ShipmentDetail'))
const PriceLedgerPage = lazy(() => import('./pages/PriceLedgerPage'))
const ContactsPage = lazy(() => import('./pages/ContactsPage'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppShell>
              <Suspense fallback={<p className="pad">Loading…</p>}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardView />} />
                  <Route path="/shipments" element={<ShipmentWorkspace />} />
                  <Route path="/shipments/:id" element={<ShipmentDetail />} />
                  <Route path="/price-ledger" element={<PriceLedgerPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                </Routes>
              </Suspense>
            </AppShell>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
