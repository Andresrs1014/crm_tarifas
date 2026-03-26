import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import { getRecords, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import { fmtCOP, fmtDate } from '../utils/format'
import { SERVICIO_COLORS } from '../types'

export default function Clientes() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [comercialId, setComercialId] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const toast = useToastStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records', 'cliente', search, estado, comercialId],
    queryFn: () => getRecords({
      tipo: 'cliente',
      ...(search ? { search } : {}),
      ...(estado ? { estado_cliente: estado } : {}),
      ...(comercialId ? { comercial_id: comercialId } : {}),
    }),
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', 'cliente'] })
      toast.add('Cliente eliminado')
      setDeleteId(null)
    },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  const comercialNombre = (id: string | null) =>
    comerciales.find((c) => c.id === id)?.nombre ?? '—'

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Clientes
        </h1>
        <span className="text-muted text-sm">{records.length} registros</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar por empresa o NIT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="w-44" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="en-riesgo">En riesgo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select className="w-44" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
          <option value="">Todos los comerciales</option>
          {comerciales.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Empresa', 'Ciudad', 'Comercial', 'Servicios', 'Visita', 'Estado', 'Facturado', 'Valor', 'Últ. Actualización', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-condensed uppercase text-muted tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-muted">Cargando...</td>
                </tr>
              )}
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-muted">Sin clientes</td>
                </tr>
              )}
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border hover:bg-surface2 transition cursor-pointer"
                  onClick={() => navigate(`/clientes/${r.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: '#e8edf5' }}>{r.empresa}</p>
                    {r.nit && <p className="text-xs text-muted">NIT {r.nit}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.ciudad ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{comercialNombre(r.comercial_id)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.servicios.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: SERVICIO_COLORS[s] + '22', color: SERVICIO_COLORS[s] }}
                        >
                          {s}
                        </span>
                      ))}
                      {r.servicios.length > 3 && (
                        <span className="text-xs text-muted">+{r.servicios.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge value={r.visita_cliente} /></td>
                  <td className="px-4 py-3"><Badge value={r.estado_cliente} /></td>
                  <td className="px-4 py-3"><Badge value={r.facturado} /></td>
                  <td className="px-4 py-3 text-muted">{fmtCOP(r.valor)}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(r.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/clientes/${r.id}`)}
                        className="text-muted hover:text-accent transition"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="text-muted hover:text-danger transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        message="¿Eliminar este cliente? Se eliminarán también sus contactos y actividades."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
