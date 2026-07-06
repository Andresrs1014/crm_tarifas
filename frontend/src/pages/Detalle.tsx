import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import { getRecord, updateRecord, deleteRecord, convertToCliente } from '../api/records'
import { getCotizaciones } from '../api/cotizaciones'
import { createActividad, updateActividad, deleteActividad } from '../api/actividades'
import { toast } from '../store/toastStore'
import type { ActividadTipo, EstadoProspecto, EstadoCliente, TipoVisita, TipoFacturado } from '../types'
import { fmtEstado } from '../utils/fmtEstado'
import DetalleCrmPanel, { type DetalleEditState, canOpenFichaSop } from '../components/detalle/DetalleCrmPanel'
import {
  CLIENTE_BADGE,
  CLIENTE_ESTADO_OPTIONS,
  COTIZACION_BADGE,
  COTIZACION_ESTADO_OPTIONS,
  PROSPECTO_BADGE,
  PROSPECTO_FORM_OPTIONS,
} from '../lib/htmlV6/domainConfig'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'

const ESTADO_BADGE_P = PROSPECTO_BADGE
const ESTADO_BADGE_C = CLIENTE_BADGE
const ESTADOS_PROSPECTO = PROSPECTO_FORM_OPTIONS
const COT_BADGE = COTIZACION_BADGE

const ESTADOS_CLIENTE = CLIENTE_ESTADO_OPTIONS
const ESTADOS_COT = COTIZACION_ESTADO_OPTIONS

type Tab = 'info' | 'cotizaciones'

// â”€â”€â”€ Formulario actividad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ActForm {
  tipo: ActividadTipo
  descripcion: string
  fecha: string
  hora: string
  lugar: string
}

const EMPTY_ACT: ActForm = {
  tipo: 'llamada',
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  hora: '',
  lugar: '',
}

// â”€â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Detalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [tab, setTab] = useState<Tab>('info')
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmConvert, setConfirmConvert] = useState(false)
  const [showActForm, setShowActForm] = useState(false)
  const [actForm, setActForm] = useState<ActForm>(EMPTY_ACT)
  const [obsText, setObsText] = useState('')

  // â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const { data: record, isLoading } = useQuery({
    queryKey: ['record', id],
    queryFn: () => getRecord(id!),
    enabled: !!id,
  })

  // Sincronizar obsText cuando cambia el record cargado
  useEffect(() => {
    if (record) setObsText(record.observaciones ?? '')
  }, [record?.id])

  const { data: cotizaciones = [] } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: () => getCotizaciones(),
    select: (data) => data.filter((c) => c.recordId === id),
    enabled: tab === 'cotizaciones',
  })

  const cotPagination = usePagination(cotizaciones, { resetDeps: [id] })

  // â”€â”€ Estado ediciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [edit, setEdit] = useState({
    empresa: '',
    nit: '',
    ciudad: '',
    direccion: '',
    observaciones: '',
    proximoSeguimiento: '',
    estadoProspecto: '' as EstadoProspecto | '',
    estadoCliente: '' as EstadoCliente | '',
    visita: '' as TipoVisita | '',
    visitaCliente: '' as TipoVisita | '',
    facturado: '' as TipoFacturado | '',
    valor: '',
    ingresosEsperados: '',
    servicios: [] as string[],
    facturacionLineas: {} as Record<string, string>,
  })

  function startEdit() {
    if (!record) return
    setEdit({
      empresa: record.empresa,
      nit: record.nit ?? '',
      ciudad: record.ciudad ?? '',
      direccion: record.direccion ?? '',
      observaciones: obsText,
      proximoSeguimiento: record.proximoSeguimiento?.slice(0, 10) ?? '',
      estadoProspecto: record.estadoProspecto ?? '',
      estadoCliente: record.estadoCliente ?? '',
      visita: record.visita ?? '',
      visitaCliente: record.visitaCliente ?? '',
      facturado: record.facturadoP ?? record.facturado ?? '',
      valor: record.valor?.toString() ?? '',
      ingresosEsperados: record.ingresosEsperados?.toString() ?? '',
      servicios: [...record.servicios],
      facturacionLineas: Object.fromEntries(
        Object.entries(record.facturacionLineas ?? {}).map(([k, v]) => [k, String(v)])
      ),
    })
    setEditing(true)
  }

  // â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const updateMut = useAppMutation({
    mutationFn: () => {
      const facturadoActivo = edit.facturado && edit.facturado !== 'no'
      const lineasFacturacion = facturadoActivo
        ? Object.fromEntries(
            edit.servicios.map((s) => [s, Number(edit.facturacionLineas[s]) || 0])
          )
        : {}
      const totalFacturado = Object.values(lineasFacturacion).reduce((s, v) => s + v, 0)

      return updateRecord(id!, {
      empresa: edit.empresa,
      nit: edit.nit || undefined,
      ciudad: edit.ciudad || undefined,
      direccion: edit.direccion || undefined,
      observaciones: obsText || undefined,
      proximoSeguimiento: edit.proximoSeguimiento || undefined,
      estadoProspecto: edit.estadoProspecto || undefined,
      estadoCliente: edit.estadoCliente || undefined,
      visita: edit.visita || undefined,
      visitaCliente: edit.visitaCliente || undefined,
      facturado: edit.facturado || undefined,
      facturadoP: record?.tipo === 'prospecto' ? edit.facturado || undefined : undefined,
      valor: record?.tipo === 'cliente' && facturadoActivo ? totalFacturado : edit.valor ? Number(edit.valor) : undefined,
      valorP: record?.tipo === 'prospecto' && facturadoActivo ? totalFacturado : undefined,
      ingresosEsperados: edit.ingresosEsperados ? Number(edit.ingresosEsperados) : undefined,
      servicios: edit.servicios,
      facturacionLineas: facturadoActivo ? lineasFacturacion : {},
    })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Registro actualizado')
      setEditing(false)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const deleteMut = useAppMutation({
    mutationFn: () => deleteRecord(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Registro eliminado')
      navigate(record?.tipo === 'cliente' ? '/clientes' : '/prospectos')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const convertMut = useAppMutation({
    mutationFn: () => convertToCliente(id!),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['records'] })
      qc.invalidateQueries({ queryKey: ['record', id] })
      toast.success(`${updated.empresa} ahora es cliente activo`)
      setConfirmConvert(false)
      setEditing(false)
    },
    onError: () => toast.error('No se pudo convertir a cliente'),
  })

  const createActMut = useAppMutation({
    mutationFn: () => createActividad(id!, {
      tipo: actForm.tipo,
      descripcion: actForm.descripcion,
      fecha: actForm.fecha,
      hora: actForm.hora || undefined,
      lugar: actForm.lugar || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      toast.success('Actividad registrada')
      setShowActForm(false)
      setActForm(EMPTY_ACT)
    },
    onError: () => toast.error('Error al registrar'),
  })

  const toggleHechoMut = useAppMutation({
    mutationFn: ({ actId, hecho }: { actId: string; hecho: boolean }) =>
      updateActividad(actId, { hecho }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['record', id] }),
    onError: () => toast.error('Error al actualizar'),
  })

  const deleteActMut = useAppMutation({
    mutationFn: (actId: string) => deleteActividad(actId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      toast.success('Actividad eliminada')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const obsMut = useAppMutation({
    mutationFn: () => updateRecord(id!, { observaciones: obsText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Observaciones guardadas')
    },
    onError: () => toast.error('Error al guardar observaciones'),
  })

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-64 bg-surface2 rounded animate-pulse" />
        <div className="card p-6 h-48 animate-pulse bg-surface2" />
        <div className="card p-6 h-64 animate-pulse bg-surface2" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="empty-state p-12">
        <div className="text-4xl mb-3">ðŸ”</div>
        <p className="font-semibold text-foreground mb-1">Registro no encontrado</p>
        <Link to="/prospectos" className="btn-primary btn-sm mt-2">Volver</Link>
      </div>
    )
  }

  const isProspecto = record.tipo === 'prospecto'
  const estadoBadge = isProspecto
    ? ESTADO_BADGE_P[record.estadoProspecto ?? 'prospecto']
    : ESTADO_BADGE_C[record.estadoCliente ?? 'activo']
  const estadoLabel = isProspecto
    ? fmtEstado(record.estadoProspecto, ESTADOS_PROSPECTO)
    : fmtEstado(record.estadoCliente, ESTADOS_CLIENTE)

  const actividadesOrdenadas = [...record.actividades].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="detalle-crm">

      <div className="detalle-top-bar">
        <div className="detalle-tabs">
          <button
            type="button"
            className={`detalle-tab${tab !== 'cotizaciones' ? ' detalle-tab--active' : ''}`}
            onClick={() => setTab('info')}
          >
            Información
          </button>
          <button
            type="button"
            className={`detalle-tab${tab === 'cotizaciones' ? ' detalle-tab--active' : ''}`}
            onClick={() => setTab('cotizaciones')}
          >
            Cotizaciones
          </button>
        </div>
        {canOpenFichaSop(record, isProspecto) && (
          <Link
            to={`/fichas/${id}`}
            className="btn btn-primary btn-sm detalle-ficha-link"
            title="Documentación SOP — se crea automáticamente si no existe"
          >
            Ficha SOP
          </Link>
        )}
      </div>

      {tab !== 'cotizaciones' && (
        <DetalleCrmPanel
          record={record}
          isProspecto={isProspecto}
          estadoBadge={estadoBadge ?? 'badge-gray'}
          estadoLabel={estadoLabel}
          editing={editing}
          edit={edit}
          setEdit={setEdit as Dispatch<SetStateAction<DetalleEditState>>}
          showActForm={showActForm}
          setShowActForm={setShowActForm}
          actForm={actForm}
          setActForm={setActForm}
          actividadesOrdenadas={actividadesOrdenadas}
          onBack={() => navigate(-1)}
          onStartEdit={startEdit}
          onCancelEdit={() => setEditing(false)}
          onSave={() => updateMut.mutate()}
          saving={updateMut.isPending}
          onDelete={() => setConfirmDel(true)}
          onConvertToCliente={() => setConfirmConvert(true)}
          converting={convertMut.isPending}
          onCreateAct={() => createActMut.mutate()}
          creatingAct={createActMut.isPending}
          onToggleHecho={(actId, hecho) => toggleHechoMut.mutate({ actId, hecho })}
          onDeleteAct={(actId) => deleteActMut.mutate(actId)}
          obsText={obsText}
          setObsText={setObsText}
          onSaveObs={() => obsMut.mutate()}
          obsSaving={obsMut.isPending}
        />
      )}


      {/* â”€â”€ TAB: COTIZACIONES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === 'cotizaciones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              to={`/cotizaciones/nueva?recordId=${id}`}
              className="btn-primary btn-sm"
            >
              + Nueva cotizaciÃ³n
            </Link>
          </div>

          {cotPagination.totalItems === 0 ? (
            <div className="empty-state">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-foreground mb-1">Sin cotizaciones</p>
              <p className="text-sm">Crea la primera cotización para este cliente.</p>
            </div>
          ) : (
            <DataListPanel pagination={cotPagination}>
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Estado</th>
                    <th>Líneas</th>
                    <th>Comercial</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cotPagination.pageItems.map((cot) => (
                    <tr key={cot.id}>
                      <td className="font-mono text-accent font-semibold">{cot.numero}</td>
                      <td>
                        <span className={COT_BADGE[cot.estado] ?? 'badge-gray'}>{fmtEstado(cot.estado, ESTADOS_COT)}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {cot.lineas.slice(0, 2).map((l) => (
                            <span key={l} className="stag">{l}</span>
                          ))}
                          {cot.lineas.length > 2 && <span className="stag">+{cot.lineas.length - 2}</span>}
                        </div>
                      </td>
                      <td className="text-sm text-muted">{cot.comercial}</td>
                      <td className="text-xs text-muted">
                        {new Date(cot.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td>
                        <Link
                          to={`/cotizaciones/${cot.id}`}
                          className="btn-ghost btn-sm px-2 py-1 text-xs"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataListPanel>
          )}
        </div>
      )}

      {/* Modal: confirmar conversión a cliente */}
      {confirmConvert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => !convertMut.isPending && setConfirmConvert(false)}>
          <div className="card p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">¿Convertir {record.empresa} a cliente?</h3>
            <p className="text-sm text-muted">
              El prospecto pasará a clientes activos. Se copiarán visita, facturación y valor;
              se creará la matriz de riesgos y quedará registrada una actividad de conversión.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="btn-secondary btn-sm"
                disabled={convertMut.isPending}
                onClick={() => setConfirmConvert(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-green btn-sm"
                disabled={convertMut.isPending}
                onClick={() => convertMut.mutate()}
              >
                {convertMut.isPending ? 'Convirtiendo...' : '🏢 Convertir a Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar eliminación */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setConfirmDel(false)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">Â¿Eliminar {record.empresa}?</h3>
            <p className="text-sm text-muted">Se eliminarÃ¡n todos los contactos y actividades asociados. Esta acciÃ³n no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn-sm" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button
                className="btn-danger btn-sm"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
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
