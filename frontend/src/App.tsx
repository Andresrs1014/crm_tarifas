import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useSSOToken } from './hooks/useSSOToken'
import Layout from './components/layout/Layout'
import ToastContainer from './components/ui/ToastContainer'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Registro from './pages/Registro'
import Prospectos from './pages/Prospectos'
import CRMKanban from './pages/CRMKanban'
import Clientes from './pages/Clientes'
import Detalle from './pages/Detalle'
import Equipo from './pages/Equipo'
import Cotizaciones from './pages/Cotizaciones'
import CotPublica from './pages/CotPublica'
import Biblioteca from './pages/Biblioteca'
import SAC from './pages/SAC'
import Usuarios from './pages/Usuarios'
import ImportWizard from './pages/ImportWizard'
import WizardLayout from './pages/wizard/WizardLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireSuperadmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'superadmin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function SSOHandler() {
  useSSOToken()
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SSOHandler />
        <ToastContainer />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cot/:numero" element={<CotPublica />} />

          {/* Authenticated app */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="registro" element={<Registro />} />
            <Route path="registro/importar" element={<ImportWizard />} />
            <Route path="prospectos" element={<Prospectos />} />
            <Route path="prospectos/:id" element={<Detalle />} />
            <Route path="detalle/:id" element={<Detalle />} />
            <Route path="crm" element={<CRMKanban />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<Detalle />} />
            <Route path="equipo" element={<Equipo />} />
            <Route path="cotizaciones" element={<Cotizaciones />} />
            <Route path="cotizaciones/nueva" element={<WizardLayout />} />
            <Route path="cotizaciones/:id/editar" element={<WizardLayout />} />
            <Route path="biblioteca" element={<Biblioteca />} />
            <Route path="sac" element={<SAC />} />
            <Route
              path="admin/usuarios"
              element={
                <RequireSuperadmin>
                  <Usuarios />
                </RequireSuperadmin>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
