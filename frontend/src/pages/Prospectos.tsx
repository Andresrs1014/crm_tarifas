import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getRecords, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import { exportRecordsExcel } from '../utils/exportExcel'

const ESTADOS: { value: string; label: string; badge: string }[] = [
  { value: '',                     label: 'Todos los estados',               badge: '' },
  { value: 'prospecto',            label: '🎯 Prospecto',                    badge: 'badge-blue' },
  { value: 'reconocimiento',       label: '🏢 Visita',                       badge: 'badge-purple' },
  { value: 'propuesta',            label: '📄 Propuesta Comercial',          badge: 'badge-gold' },
  { value: 'aceptacion_propuesta', label: '🤝 Aceptación Propuesta',         badge: 'badge-green' },
  { value: 'creacion_sop',         label: '📋 Creación Ficha Cliente',       badge: 'badge-gold' },
  { value: 'facturado',            label: '💰 Facturado',                    badge: 'badge-green' },
  { value: 'frio',                 label: '🧊 Frío',                         badge: 'badge-gray' },
  { value: 'perdido',              label: '❌ Perdido',                      badge: 'badge-red' },
]

const ESTADO_BADGE: Record<string, string> = {
  prospecto:            'badge-blue',
  reconocimiento:       'badge-purple',
  propuesta:            'badge-gold',
  aceptacion_propuesta: 'badge-green',
  creacion_sop:         'badge-gold',
  facturado:            'badge-green',
  frio:                 'badge-gray',
  perdido:              'badge-red',
}

function fmtEstado(value: string | undefined, map: { value: string; label: string }[]): string {
  if (!value) return '—'
  return map.find(e => e.value === value)?.label ?? value.replace(/_/g, ' ')
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function Prospectos() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [estado, setEstado]         = useState('')
  const [comercialId, setComercialId] = useState('')
  const [confirmId, setConfirmId]   = useState<string | null>(null)

  const { data: prospectos = [], isLoading } = useQuery({
    queryKey: ['records', 'prospecto', estado, comercialId, search],
    queryFn: () => getRecords({ tipo: 'prospecto', estado: estado || undefined, comercialId: comercialId || undefined, search: search || undefined }),
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const deleteMut = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Prospecto eliminado')
      setConfirmId(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  // Pipeline visual: conteo por estado
  const pipelineCount: Record<string, number> = {}
  prospectos.forEach((p) => {
    const e = p.estadoProspecto ?? 'prospecto'
    pipelineCount[e] = (pipelineCount[e] ?? 0) + 1
  })
  const total = prospectos.length || 1

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prospectos</h1>
          <p className="text-sm text-muted mt-0.5">{prospectos.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={() => exportRecordsExcel(prospectos, 'prospectos.xlsx')}
            disabled={prospectos.length === 0}
            title="Exportar a Excel"
          >
            ↓ Excel
          </button>
          <Link to="/registro" className="btn-primary btn-sm">
            + Nuevo prospecto
          </Link>
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="card p-4">
        <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-3">
          {ESTADOS.slice(1).map(({ value, badge }) => {
            const count = pipelineCount[value] ?? 0
            const pct = Math.round((count / total) * 100)
            const colorMap: Record<string, string> = {
              'badge-blue': '#00c2ff', 'badge-purple': '#a855f7',
              'badge-gold': '#f5a623', 'badge-green': '#00e676',
              'badge-gray': '#8899b4', 'badge-red': '#ff4444',
            }
            return pct > 0 ? (
              <div key={value} style={{ width: `${pct}%`, background: colorMap[badge] ?? '#8899b4' }} />
            ) : null
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {ESTADOS.slice(1).map(({ value, label }) => (
            <div key={value} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`inline-block w-2 h-2 rounded-full`}
                style={{ background: ESTADO_BADGE[value]?.includes('blue') ? '#00c2ff'
                  : ESTADO_BADGE[value]?.includes('gold') ? '#f5a623'
                  : ESTADO_BADGE[value]?.includes('green') ? '#00e676'
                  : ESTADO_BADGE[value]?.includes('purple') ? '#a855f7'
                  : '#8899b4' }} />
              <span>{label}</span>
              <span className="font-bold text-foreground">{pipelineCount[value] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="filter-input flex-1 min-w-48"
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
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
        ) : prospectos.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-semibold text-foreground mb-1">Sin prospectos</p>
            <p className="text-sm">Cambia los filtros o crea un nuevo prospecto.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Comercial</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th>Facturado</th>
                <th>Próx. Seguimiento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prospectos.map((p) => (
                <tr key={p.id} className="cursor-pointer" onClick={() => navigate(`/detalle/${p.id}`)}>
                  <td>
                    <div className="font-semibold text-foreground">{p.empresa}</div>
                    {p.nit && <div className="text-xs text-muted">NIT: {p.nit}</div>}
                  </td>
                  <td className="text-sm text-muted">
                    {p.contactos?.[0]?.nombre || '—'}
                    {p.contactos?.[0]?.cargo && (
                      <div className="text-xs text-muted/60">{p.contactos[0].cargo}</div>
                    )}
                  </td>
                  <td className="text-sm">{p.comercial?.nombre || '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(p.servicios as string[]).slice(0, 2).map((s) => (
                        <span key={s} className="stag">{s}</span>
                      ))}
                      {(p.servicios as string[]).length > 2 && (
                        <span className="stag">+{(p.servicios as string[]).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={ESTADO_BADGE[p.estadoProspecto ?? 'prospecto'] ?? 'badge-gray'}>
                      {fmtEstado(p.estadoProspecto ?? 'prospecto', ESTADOS)}
                    </span>
                  </td>
                  <td>
                    <span className={p.facturado === 'si' ? 'badge-green' : p.facturado === 'parcial' ? 'badge-gold' : 'badge-gray'}>
                      {p.facturado ?? 'no'}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap">
                    {p.proximoSeguimiento ? (
                      <span className={new Date(p.proximoSeguimiento) < new Date() ? 'text-danger font-semibold' : 'text-muted'}>
                        {new Date(p.proximoSeguimiento).toLocaleDateString('es-CO')}
                      </span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button
                        className="btn-ghost btn-sm px-2 py-1 text-xs"
                        onClick={() => navigate(`/detalle/${p.id}`)}
                      >
                        Ver
                      </button>
                      <button
                        className="btn-danger btn-sm px-2 py-1 text-xs"
                        onClick={() => setConfirmId(p.id)}
                      >
                        ×
                      </button>
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
            <h3 className="font-bold text-foreground">¿Eliminar prospecto?</h3>
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
