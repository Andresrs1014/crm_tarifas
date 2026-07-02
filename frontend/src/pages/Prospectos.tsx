import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getRecords, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import { exportRecordsExcel } from '../utils/exportExcel'
import { fmtEstado } from '../utils/fmtEstado'
import { PROSPECTO_BADGE, PROSPECTO_FILTER_OPTIONS } from '../lib/htmlV6/domainConfig'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'

export default function Prospectos() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [comercialId, setComercialId] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: prospectos = [], isLoading } = useQuery({
    queryKey: ['records', 'prospecto', estado, comercialId, search],
    queryFn: () => getRecords({
      tipo: 'prospecto',
      estado: estado || undefined,
      comercialId: comercialId || undefined,
      search: search || undefined,
    }),
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

  const pagination = usePagination(prospectos, {
    resetDeps: [search, estado, comercialId],
  })

  return (
    <div className="space-y-5">
      <div className="section-title">{'\uD83C\uDFAF'} <span>Prospectos</span></div>

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state">
            <div className="empty-icon">{'\uD83C\uDFAF'}</div>
            <div className="empty-title">Sin prospectos</div>
            <div>Registra tu primer prospecto</div>
          </div>
        }
        header={
          <div className="table-header-2row">
            <div className="table-header-top">
              <div className="table-title">Lista de Prospectos</div>
              <div className="table-header-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportRecordsExcel(prospectos, 'prospectos.xlsx')}
                  disabled={prospectos.length === 0}
                  title="Exportar a Excel"
                >
                  {'\u2B07\uFE0F'} Exportar Excel
                </button>
                <Link
                  to="/registro/importar"
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                >
                  {'\uD83D\uDCE4'} Carga Masiva
                </Link>
              </div>
            </div>
            <div className="table-filters">
              <input
                className="filter-input"
                placeholder={'\uD83D\uDD0D Buscar empresa...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="filter-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {PROSPECTO_FILTER_OPTIONS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              <select className="filter-select" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
                <option value="">Todos los comerciales</option>
                {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        }
      >
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Comercial</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th>Facturado</th>
                <th>{'Pr\u00F3x. Seguimiento'}</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((p) => {
                  const servicios = (p.servicios ?? []) as string[]
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => navigate('/detalle/' + p.id)}>
                      <td>
                        <strong>{p.empresa}</strong>
                        {p.nit && <><br /><span style={{ color: 'var(--text2)', fontSize: 11 }}>NIT: {p.nit}</span></>}
                      </td>
                      <td className="text-sm text-muted">
                        {p.contactos?.[0]?.nombre || '\u2014'}
                        {p.contactos?.[0]?.cargo && (
                          <div className="text-xs text-muted/60">{p.contactos[0].cargo}</div>
                        )}
                      </td>
                      <td className="text-sm">{p.comercial?.nombre || '\u2014'}</td>
                      <td>
                        <div className="service-tags">
                          {servicios.slice(0, 2).map((s) => (
                            <span key={s} className="stag">{s}</span>
                          ))}
                          {servicios.length > 2 && (
                            <span className="stag">+{servicios.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={'badge ' + (PROSPECTO_BADGE[p.estadoProspecto ?? 'prospecto'] ?? 'badge-gray')}>
                          {fmtEstado(p.estadoProspecto ?? 'prospecto', PROSPECTO_FILTER_OPTIONS)}
                        </span>
                      </td>
                      <td>
                        <span className={'badge ' + (p.facturado === 'si' ? 'badge-green' : p.facturado === 'parcial' ? 'badge-gold' : 'badge-gray')}>
                          {p.facturado ?? 'no'}
                        </span>
                      </td>
                      <td className="text-xs whitespace-nowrap">
                        {p.proximoSeguimiento ? (
                          <span className={new Date(p.proximoSeguimiento) < new Date() ? 'text-danger font-semibold' : 'text-muted'}>
                            {new Date(p.proximoSeguimiento).toLocaleDateString('es-CO')}
                          </span>
                        ) : <span className="text-muted">{'\u2014'}</span>}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/detalle/' + p.id)}
                          >
                            Ver
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmId(p.id)}
                            title="Eliminar prospecto"
                          >
                            {'\u00D7'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
      </DataListPanel>

      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setConfirmId(null)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">{'\u00BFEliminar prospecto?'}</h3>
            <p className="text-sm text-muted">Esta acci{'\u00F3'}n no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button
                className="btn btn-danger btn-sm"
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
