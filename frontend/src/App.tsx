import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prospectos from './pages/Prospectos'
import Clientes from './pages/Clientes'
import Equipo from './pages/Equipo'
import Registro from './pages/Registro'
import Detalle from './pages/Detalle'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

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
          <Route path="prospectos" element={<Prospectos />} />
          <Route path="prospectos/:id" element={<Detalle />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<Detalle />} />
          <Route path="equipo" element={<Equipo />} />
          {/* Phases 8+9 — placeholder */}
          <Route path="cotizaciones" element={<ComingSoon label="Cotizaciones" />} />
          <Route path="biblioteca" element={<ComingSoon label="Biblioteca" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="p-6">
      <h1 className="font-condensed font-bold text-2xl mb-2" style={{ color: '#e8edf5' }}>{label}</h1>
      <p className="text-muted">Próximamente — Fase 8/9</p>
    </div>
  )
}
