import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getRecords, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'

const ESTADOS_CLIENTE: { value: string; label: string }[] = [
  { value: '',          label: 'Todos los estados' },
  { value: 'activo',    label: 'Activo' },
  { value: 'en-riesgo', label: 'En riesgo' },
  { value: 'inactivo',  label: 'Inactivo' },
]

const ESTADO_BADGE: Record<string, string> = {
  activo:    'badge-green',
  'en-riesgo': 'badge-red',
  inactivo:  'badge-gray',
}

const FACTURADO_BADGE: Record<string, string> = {
  si:      'badge-green',
  parcial: 'badge-gold',
  no:      'badge-gray',
}

const CATEGORIA_COLOR: Record<string, string> = {
  A: '#f5a623',
  B: '#00c2ff',
  C: '#8899b4',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function Clientes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch]           = useState('')
  const [estado, setEstado]           = useState('')
  const [comercialId, setComercialId] = useState('')
  const [confirmId, setConfirmId]     = useState<string | null>(null)

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['records', 'cliente', estado, comercialId, search],
    queryFn: () => getRecords({ tipo: 'cliente', estado: estado || undefined, comercialId: comercialId || undefined, search: search || undefined }),
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const deleteMut = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Cliente eliminado')
      setConfirmId(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  // Totales rápidos
  const facturacionTotal = clientes.reduce((s, c) => s + (c.valor ?? 0), 0)
  const enRiesgo = clientes.filter((c) => c.estadoCliente === 'en-riesgo').length

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes Activos</h1>
          <p className="text-sm text-muted mt-0.5">
            {clientes.length} clientes · {fmt(facturacionTotal)} facturado
            {enRiesgo > 0 && <span className="ml-2 text-danger font-semibold">⚠ {enRiesgo} en riesgo</span>}
          </p>
        </div>
        <Link to="/registro" className="btn-primary btn-sm">
          + Nuevo cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="filter-input flex-1 min-w-48"
          placeholder="Buscar empresa o NIT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS_CLIENTE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select className="filter-select" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
          <option value="">Todos los comerciales</option>
          {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="table-card">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-surface2 rounded animate-pulse" />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-3">🏢</div>
            <p className="font-semibold text-foreground mb-1">Sin clientes</p>
            <p className="text-sm">Cambia los filtros o crea un nuevo cliente.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Comercial</th>
                <th>Estado</th>
                <th>Servicios</th>
                <th>Facturación</th>
                <th>Visita</th>
                <th>Cat.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/detalle/${c.id}`)}>
                  <td>
                    <div className="font-semibold text-foreground">{c.empresa}</div>
                    {c.nit && <div className="text-xs text-muted">NIT: {c.nit}</div>}
                  </td>
                  <td>
                    <span className="badge-gray capitalize">{c.tipoCliente}</span>
                  </td>
                  <td className="text-sm">{c.comercial?.nombre || '—'}</td>
                  <td>
                    <span className={ESTADO_BADGE[c.estadoCliente ?? 'activo'] ?? 'badge-gray'}>
                      {c.estadoCliente ?? 'activo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(c.servicios as string[]).slice(0, 2).map((s) => (
                        <span key={s} className="stag">{s}</span>
                      ))}
                      {(c.servicios as string[]).length > 2 && (
                        <span className="stag">+{(c.servicios as string[]).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="font-mono text-sm text-success">{fmt(c.valor ?? 0)}</div>
                    <div className="mt-0.5">
                      <span className={FACTURADO_BADGE[c.facturado ?? 'no'] ?? 'badge-gray'}>
                        {c.facturado ?? 'no'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {c.visitaCliente && c.visitaCliente !== 'no'
                      ? <span className="badge-green">{c.visitaCliente}</span>
                      : <span className="text-muted text-xs">—</span>
                    }
                  </td>
                  <td>
                    {c.categoria ? (
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${CATEGORIA_COLOR[c.categoria]}20`, color: CATEGORIA_COLOR[c.categoria] }}
                      >
                        {c.categoria}
                      </span>
                    ) : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-sm px-2 py-1 text-xs" onClick={() => navigate(`/detalle/${c.id}`)}>Ver</button>
                      <button className="btn-danger btn-sm px-2 py-1 text-xs" onClick={() => setConfirmId(c.id)}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirm delete */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setConfirmId(null)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">¿Eliminar cliente?</h3>
            <p className="text-sm text-muted">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn-sm" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button
                className="btn-danger btn-sm"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmId)}
              >
                {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
