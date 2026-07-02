import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getRecords, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import { exportRecordsExcel } from '../utils/exportExcel'
import { fmtMoney } from '../utils/fmtMoney'
import {
  CATEGORIA_COLOR,
  CLIENTE_BADGE,
  CLIENTE_ESTADO_OPTIONS,
  COMPANIAS_FILTER_OPTIONS,
  FACTURADO_BADGE,
  recordMatchesCompaniaFilter,
} from '../lib/htmlV6/domainConfig'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'

const ESTADOS_CLIENTE = CLIENTE_ESTADO_OPTIONS

export default function Clientes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch]               = useState('')
  const [estado, setEstado]               = useState('')
  const [comercialId, setComercialId]     = useState('')
  const [facturadoFiltro, setFacturadoF]  = useState('')
  const [companiaFiltro, setCompaniaFiltro] = useState('')
  const [confirmId, setConfirmId]         = useState<string | null>(null)

  const { data: clientesRaw = [], isLoading } = useQuery({
    queryKey: ['records', 'cliente', estado, comercialId, search],
    queryFn: () => getRecords({ tipo: 'cliente', estado: estado || undefined, comercialId: comercialId || undefined, search: search || undefined }),
  })

  const clientes = clientesRaw
    .filter((c) => !facturadoFiltro || (facturadoFiltro === 'no' ? (!c.facturado || c.facturado === 'no') : c.facturado === facturadoFiltro))
    .filter((c) =>
      recordMatchesCompaniaFilter(
        (c.servicios ?? []) as string[],
        c.companias,
        companiaFiltro,
      ),
    )

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

  const facturacionTotal = clientes.reduce((s, c) => s + (c.valor ?? 0), 0)
  const enRiesgo = clientes.filter((c) => c.estadoCliente === 'en-riesgo').length

  const pagination = usePagination(clientes, {
    resetDeps: [search, estado, comercialId, facturadoFiltro, companiaFiltro],
  })

  return (
    <div className="space-y-5">
      <div className="section-title">{'\uD83C\uDFE2'} Clientes <span>Activos</span></div>
      {clientes.length > 0 && (
        <p className="text-sm text-muted" style={{ marginBottom: 16, marginTop: -8 }}>
          {clientes.length} clientes · {fmtMoney(facturacionTotal)} facturado
          {enRiesgo > 0 && <span className="ml-2 text-danger font-semibold">{'\u26A0'} {enRiesgo} en riesgo</span>}
        </p>
      )}

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state">
            <div className="empty-icon">{'\uD83C\uDFE2'}</div>
            <div className="empty-title">Sin clientes</div>
            <div>Cambia los filtros o crea un nuevo cliente.</div>
          </div>
        }
        header={
          <div className="table-header-2row">
            <div className="table-header-top">
              <div className="table-title">Lista de Clientes</div>
              <div className="table-header-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportRecordsExcel(clientes, 'clientes.xlsx')}
                  disabled={clientes.length === 0}
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
                <Link to="/registro" className="btn btn-primary btn-sm">
                  {'\u2795'} Nuevo cliente
                </Link>
              </div>
            </div>
            <div className="table-filters">
              <input
                className="filter-input"
                placeholder={'\uD83D\uDD0D Buscar empresa o NIT...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="filter-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_CLIENTE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              <select className="filter-select" value={facturadoFiltro} onChange={(e) => setFacturadoF(e.target.value)}>
                <option value="">Facturación: Todos</option>
                <option value="si">Facturado</option>
                <option value="no">No Facturado</option>
              </select>
              <select className="filter-select" value={companiaFiltro} onChange={(e) => setCompaniaFiltro(e.target.value)}>
                {COMPANIAS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
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
                  <th>Visita</th>
                  <th>Nuevo Servicio</th>
                  <th>Facturación</th>
                  <th>Estado</th>
                  <th>Cat.</th>
                  <th className="col-actions-sticky">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((c) => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/detalle/${c.id}`)}>
                    <td>
                      <strong>{c.empresa}</strong>
                      {c.nit && <><br /><span style={{ color: 'var(--text2)', fontSize: 11 }}>NIT: {c.nit}</span></>}
                    </td>
                    <td className="text-sm text-muted">
                      {c.contactos?.[0]?.nombre || '\u2014'}
                      {c.contactos?.[0]?.cargo && (
                        <div className="text-xs text-muted/60">{c.contactos[0].cargo}</div>
                      )}
                    </td>
                    <td className="text-sm">{c.comercial?.nombre || '\u2014'}</td>
                    <td>
                      <div className="service-tags">
                        {(c.servicios as string[]).slice(0, 2).map((s) => (
                          <span key={s} className="stag">{s}</span>
                        ))}
                        {(c.servicios as string[]).length > 2 && (
                          <span className="stag">+{(c.servicios as string[]).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.visitaCliente && c.visitaCliente !== 'no'
                        ? <span className="badge badge-green">{c.visitaCliente}</span>
                        : <span className="text-muted text-xs">{'\u2014'}</span>
                      }
                    </td>
                    <td className="text-sm">
                      {(c.nuevoServicio || c.servicioNuevo)
                        ? <span className="badge badge-blue">{c.nuevoServicio || c.servicioNuevo}</span>
                        : <span className="text-muted text-xs">{'\u2014'}</span>
                      }
                    </td>
                    <td>
                      <div className="money-gold">{fmtMoney(c.valor ?? 0)}</div>
                      <div className="mt-0.5">
                        <span className={'badge ' + (FACTURADO_BADGE[c.facturado ?? 'no'] ?? 'badge-gray')}>
                          {c.facturado ?? 'no'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={'badge ' + (CLIENTE_BADGE[c.estadoCliente ?? 'activo'] ?? 'badge-gray')}>
                        {c.estadoCliente ?? 'activo'}
                      </span>
                    </td>
                    <td>
                      {c.categoria ? (
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: `${CATEGORIA_COLOR[c.categoria]}20`, color: CATEGORIA_COLOR[c.categoria] }}
                        >
                          {c.categoria}
                        </span>
                      ) : <span className="text-muted text-xs">{'\u2014'}</span>}
                    </td>
                    <td className="col-actions-sticky" onClick={(e) => e.stopPropagation()}>
                      <div className="clientes-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/fichas/${c.id}`)}>
                          Ficha SOP
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/detalle/${c.id}`)}>Ver</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmId(c.id)} title="Eliminar cliente">{'\u00D7'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      </DataListPanel>

      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setConfirmId(null)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">{'\u00BFEliminar cliente?'}</h3>
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
