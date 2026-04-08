import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, Upload, Download, Users as UsersIcon } from 'lucide-react'
import { getRecords, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import { fmtCOP, fmtDate } from '../utils/format'
import { SERVICIO_COLORS } from '../types'
import { exportProspectos } from '../utils/exportExcel'

export default function Prospectos() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [comercialId, setComercialId] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const toast = useToastStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records', 'prospecto', search, estado, comercialId],
    queryFn: () => getRecords({
      tipo: 'prospecto',
      ...(search ? { search } : {}),
      ...(estado ? { estado_prospecto: estado } : {}),
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
      qc.invalidateQueries({ queryKey: ['records', 'prospecto'] })
      toast.add('Prospecto eliminado')
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
          Prospectos
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-muted text-sm">{records.length} registros</span>
          <button
            onClick={() => exportProspectos(records, comerciales)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white border border-border transition"
          >
            <Download size={14} /> Exportar Excel
          </button>
          <button
            onClick={() => navigate('/registro/importar?tipo=prospecto')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white border border-border transition"
          >
            <Upload size={14} /> Importar
          </button>
        </div>
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
          <option value="seguimiento">Seguimiento</option>
          <option value="cerrado">Cerrado</option>
          <option value="perdido">Perdido</option>
          <option value="frio">Frío</option>
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
                {['Empresa', 'Contacto', 'Comercial', 'Servicios', 'Visita', 'Estado', 'Facturado', 'Valor', 'Próx. Seguimiento', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-condensed uppercase text-muted tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {['70%', '45%', '55%', '80%', '40%', '50%', '45%', '55%', '60%', '20%'].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-surface2 rounded animate-pulse" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted">
                      <UsersIcon size={36} className="opacity-30" />
                      <p className="text-sm">No hay prospectos que mostrar</p>
                    </div>
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border hover:bg-surface2 transition cursor-pointer"
                  onClick={() => navigate(`/prospectos/${r.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: '#e8edf5' }}>{r.empresa}</p>
                      {r.categoria && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-condensed font-bold"
                          style={{ background: r.categoria === 'A' ? '#00c2ff22' : r.categoria === 'B' ? '#f59e0b22' : '#6b7280aa', color: r.categoria === 'A' ? '#00c2ff' : r.categoria === 'B' ? '#f59e0b' : '#d1d5db' }}>
                          {r.categoria}
                        </span>
                      )}
                    </div>
                    {r.nit && <p className="text-xs text-muted">NIT {r.nit}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.contacto_nombre ?? '—'}</td>
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
                  <td className="px-4 py-3"><Badge value={r.visita} /></td>
                  <td className="px-4 py-3"><Badge value={r.estado_prospecto} /></td>
                  <td className="px-4 py-3"><Badge value={r.facturado_p} /></td>
                  <td className="px-4 py-3 text-muted">{fmtCOP(r.valor_p)}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(r.proximo_seguimiento)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/prospectos/${r.id}`)}
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
        message="¿Eliminar este prospecto? Se eliminarán también sus contactos y actividades."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
