import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import type { ActividadTipo, CRMRecord, EstadoCliente, EstadoProspecto, TipoFacturado, TipoVisita } from '../../types'
import {
  ACTIVIDAD_TIPO_ICON,
  ACTIVIDAD_TIPO_OPTIONS,
  CLIENTE_ESTADO_OPTIONS,
  DETALLE_PIPELINE_STAGES,
  FACTURADO_OPTIONS,
  HTML_SERVICES,
  PROSPECTO_FORM_OPTIONS,
  PROSPECTO_LABEL,
  PROSPECTO_STAGE_COLOR,
  VISITA_OPTIONS,
} from '../../lib/htmlV6/domainConfig'
import { SVC_COLORS } from '../../lib/htmlV6/constants'
import { fmtMoney } from '../../utils/fmtMoney'

function billingTotal(lines: Record<string, string | number>): number {
  return Object.values(lines).reduce((sum: number, v) => sum + (Number(v) || 0), 0)
}

function moveInList<T>(list: T[], from: number, direction: -1 | 1): T[] {
  const to = from + direction
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

function moveServicioToIndex(list: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function DetalleServiciosEditor({
  servicios,
  setEdit,
}: {
  servicios: string[]
  setEdit: Dispatch<SetStateAction<DetalleEditState>>
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function toggleServicio(s: string) {
    setEdit((prev) => {
      const selected = prev.servicios.includes(s)
      const nextServicios = selected
        ? prev.servicios.filter((x) => x !== s)
        : [...prev.servicios, s]
      const facturacionLineas = { ...prev.facturacionLineas }
      if (selected) delete facturacionLineas[s]
      return { ...prev, servicios: nextServicios, facturacionLineas }
    })
  }

  function reorderServicios(from: number, to: number) {
    setEdit((prev) => ({
      ...prev,
      servicios: moveServicioToIndex(prev.servicios, from, to),
    }))
  }

  return (
    <div className="space-y-3">
      <div className="services-grid services-grid--compact">
        {HTML_SERVICES.map((s: string) => (
          <button
            key={s}
            type="button"
            className={`service-chip${servicios.includes(s) ? ' selected' : ''}`}
            onClick={() => toggleServicio(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {servicios.length > 0 && (
        <div className="detalle-servicios-orden">
          <div className="detalle-field-label">
            Orden de servicios — arrastra ⠿ o usa ▲ ▼
          </div>
          {servicios.map((s, index) => (
            <div
              key={s}
              className={`detalle-servicio-orden-row${overIndex === index ? ' detalle-servicio-orden-row--over' : ''}${dragIndex === index ? ' detalle-servicio-orden-row--drag' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragIndex(index)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(index))
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setOverIndex(index)
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const from = dragIndex ?? Number(e.dataTransfer.getData('text/plain'))
                if (!Number.isNaN(from) && from !== index) reorderServicios(from, index)
                setDragIndex(null)
                setOverIndex(null)
              }}
            >
              <span className="bib-grupo-drag" title="Arrastrar para reordenar">⠿</span>
              <div className="detalle-servicio-orden-actions">
                <button
                  type="button"
                  className="detalle-servicio-orden-btn"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEdit((prev) => ({ ...prev, servicios: moveInList(prev.servicios, index, -1) }))
                  }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="detalle-servicio-orden-btn"
                  disabled={index === servicios.length - 1}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEdit((prev) => ({ ...prev, servicios: moveInList(prev.servicios, index, 1) }))
                  }}
                >
                  ▼
                </button>
              </div>
              <span
                className="detalle-billing-svc-dot"
                style={{ background: SVC_COLORS[s] ?? 'var(--accent)' }}
              />
              <span className="text-sm font-medium flex-1">{s}</span>
              <span className="text-2xs text-muted">#{index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function comercialInitials(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export interface DetalleEditState {
  empresa: string
  nit: string
  ciudad: string
  observaciones: string
  proximoSeguimiento: string
  estadoProspecto: EstadoProspecto | ''
  estadoCliente: EstadoCliente | ''
  visita: TipoVisita | ''
  visitaCliente: TipoVisita | ''
  facturado: TipoFacturado | ''
  ingresosEsperados: string
  valor: string
  servicios: string[]
  facturacionLineas: Record<string, string>
}

export interface ActFormState {
  tipo: ActividadTipo
  descripcion: string
  fecha: string
  hora: string
  lugar: string
}

interface Props {
  record: CRMRecord
  isProspecto: boolean
  estadoBadge: string
  estadoLabel: string
  editing: boolean
  edit: DetalleEditState
  setEdit: Dispatch<SetStateAction<DetalleEditState>>
  showActForm: boolean
  setShowActForm: (v: boolean) => void
  actForm: ActFormState
  setActForm: React.Dispatch<React.SetStateAction<ActFormState>>
  actividadesOrdenadas: CRMRecord['actividades']
  onBack: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  saving: boolean
  onDelete: () => void
  onConvertToCliente?: () => void
  converting?: boolean
  onCreateAct: () => void
  creatingAct: boolean
  onToggleHecho: (actId: string, hecho: boolean) => void
  onDeleteAct: (actId: string) => void
  obsText: string
  setObsText: Dispatch<SetStateAction<string>>
  onSaveObs: () => void
  obsSaving: boolean
}

function canOpenFichaSop(record: CRMRecord, isProspecto: boolean): boolean {
  if (!isProspecto) return true
  const stage = record.estadoProspecto
  return stage === 'creacion_sop' || stage === 'facturado'
}

export { canOpenFichaSop }

function DetalleField({
  label,
  children,
  fullWidth = false,
}: {
  label: string
  children: ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={`detalle-field${fullWidth ? ' detalle-field--full' : ''}`}>
      <div className="detalle-field-label">{label}</div>
      <div className="detalle-field-body">{children}</div>
    </div>
  )
}

export default function DetalleCrmPanel({
  record,
  isProspecto,
  estadoBadge,
  estadoLabel,
  editing,
  edit,
  setEdit,
  showActForm,
  setShowActForm,
  actForm,
  setActForm,
  actividadesOrdenadas,
  onBack,
  onStartEdit,
  onCancelEdit,
  onSave,
  saving,
  onDelete,
  onConvertToCliente,
  converting = false,
  onCreateAct,
  creatingAct,
  onToggleHecho,
  onDeleteAct,
  obsText,
  setObsText,
  onSaveObs,
  obsSaving,
}: Props) {
  const principalContact = record.contactos?.[0]

  return (
    <>
      <div className="detalle-header">
        <div className="detalle-header-left">
          <button type="button" onClick={onBack} className="detalle-back">← Volver</button>
          {editing ? (
            <input
              className="filter-input"
              value={edit.empresa}
              onChange={(e) => setEdit((s) => ({ ...s, empresa: e.target.value }))}
              style={{ minWidth: 280 }}
            />
          ) : (
            <h1 className="detalle-title">{record.empresa}</h1>
          )}
        </div>
        <div className="detalle-header-actions">
          {!editing ? (
            <>
              {canOpenFichaSop(record, isProspecto) && (
                <Link
                  to={`/fichas/${record.id}`}
                  className="btn btn-primary btn-sm"
                  title="Documentación SOP — crea la ficha si aún no existe"
                >
                  Ficha SOP
                </Link>
              )}
              {isProspecto && onConvertToCliente && (
                <button
                  type="button"
                  className="btn-green"
                  disabled={converting}
                  onClick={onConvertToCliente}
                  title="Pasar este prospecto a clientes activos"
                >
                  {converting ? 'Convirtiendo...' : '🏢 Convertir a Cliente'}
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={onStartEdit}>Editar</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>Eliminar</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onCancelEdit}>Cancelar</button>
              <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={onSave}>
                {saving ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>

      {isProspecto && (
        <div className="detalle-pipeline">
          {DETALLE_PIPELINE_STAGES.map((stage) => {
            const isActive = record.estadoProspecto === stage.value
            return (
              <div
                key={stage.value}
                className={`detalle-pipeline-stage${isActive ? ' detalle-pipeline-stage--active' : ''}`}
              >
                <div className="detalle-pipeline-label">{stage.label}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="detalle-panel">
        <div className="detalle-info-grid">
          <DetalleField label="Contacto">
            <div className="detalle-field-value">{principalContact?.nombre || '—'}</div>
          </DetalleField>

          <DetalleField label="Comercial">
            <div className="detalle-comercial-row">
              {record.comercial?.nombre && (
                <span className="detalle-comercial-avatar">{comercialInitials(record.comercial.nombre)}</span>
              )}
              <div className="detalle-field-value">{record.comercial?.nombre || '—'}</div>
            </div>
          </DetalleField>

          <DetalleField label="Email">
            {principalContact?.email ? (
              <a href={`mailto:${principalContact.email}`} className="detalle-field-value detalle-field-value--link">
                {principalContact.email}
              </a>
            ) : (
              <div className="detalle-field-value">—</div>
            )}
          </DetalleField>

          <DetalleField label="Fecha ingreso">
            <div className="detalle-field-value">{new Date(record.fecha).toLocaleDateString('es-CO')}</div>
          </DetalleField>

          <DetalleField label="Teléfono">
            <div className="detalle-field-value">{principalContact?.telefono || '—'}</div>
          </DetalleField>

          {isProspecto ? (
            <DetalleField label="Ingresos esperados">
              {editing ? (
                <input type="number" className="filter-input detalle-inline-input" value={edit.ingresosEsperados}
                  onChange={(e) => setEdit((s) => ({ ...s, ingresosEsperados: e.target.value }))} />
              ) : (
                <div className="detalle-field-value detalle-field-value--money">
                  {record.ingresosEsperados ? fmtMoney(record.ingresosEsperados) : '$ 0.00'}
                </div>
              )}
            </DetalleField>
          ) : (
            <DetalleField label="Facturación">
              {editing ? (
                <input type="number" className="filter-input detalle-inline-input" value={edit.valor}
                  onChange={(e) => setEdit((s) => ({ ...s, valor: e.target.value }))} />
              ) : (
                <div className="detalle-field-value detalle-field-value--money">
                  {record.valor ? fmtMoney(record.valor) : '$ 0.00'}
                </div>
              )}
            </DetalleField>
          )}

          <DetalleField label="Ciudad">
            {editing ? (
              <input className="filter-input detalle-inline-input" value={edit.ciudad}
                onChange={(e) => setEdit((s) => ({ ...s, ciudad: e.target.value }))} />
            ) : (
              <div className="detalle-field-value">{record.ciudad || '—'}</div>
            )}
          </DetalleField>

          {record.companias && record.companias.length > 0 ? (
            <DetalleField label="Compañías">
              <div className="detalle-tags">
                {record.companias.map((c) => <span key={c} className="stag">{c}</span>)}
              </div>
            </DetalleField>
          ) : (
            <div className="detalle-field detalle-field--spacer" aria-hidden="true" />
          )}

          <DetalleField label="Servicios" fullWidth>
            {editing ? (
              <DetalleServiciosEditor servicios={edit.servicios} setEdit={setEdit} />
            ) : (
              <div className="detalle-tags">
                {record.servicios.length > 0
                  ? record.servicios.map((s) => <span key={s} className="stag">{s}</span>)
                  : <span className="detalle-field-value">—</span>}
              </div>
            )}
          </DetalleField>
        </div>

        <div className="detalle-meta-row">
          <DetalleField label="Estado">
            {editing ? (
              isProspecto ? (
                <select className="filter-select detalle-inline-input" value={edit.estadoProspecto}
                  onChange={(e) => setEdit((s) => ({ ...s, estadoProspecto: e.target.value as EstadoProspecto }))}>
                  {PROSPECTO_FORM_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <select className="filter-select detalle-inline-input" value={edit.estadoCliente}
                  onChange={(e) => setEdit((s) => ({ ...s, estadoCliente: e.target.value as EstadoCliente }))}>
                  {CLIENTE_ESTADO_OPTIONS.filter((opt) => opt.value).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )
            ) : (
              <span className={'badge ' + estadoBadge}>{estadoLabel}</span>
            )}
          </DetalleField>

          <DetalleField label="Visita">
            {editing ? (
              <select className="filter-select detalle-inline-input" value={isProspecto ? edit.visita : edit.visitaCliente}
                onChange={(e) => setEdit((s) => isProspecto
                  ? { ...s, visita: e.target.value as TipoVisita }
                  : { ...s, visitaCliente: e.target.value as TipoVisita })}>
                <option value="">Sin definir</option>
                {VISITA_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <div className="detalle-field-value">{(isProspecto ? record.visita : record.visitaCliente) || '\u2014'}</div>
            )}
          </DetalleField>

          <DetalleField label="Facturado">
            {editing ? (
              <select className="filter-select detalle-inline-input" value={edit.facturado}
                onChange={(e) => setEdit((s) => ({ ...s, facturado: e.target.value as TipoFacturado }))}>
                <option value="">Sin definir</option>
                {FACTURADO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <div className="detalle-field-value">{record.facturadoP ?? record.facturado ?? '\u2014'}</div>
            )}
          </DetalleField>

          <DetalleField label="Próximo seguimiento">
            {editing ? (
              <input type="date" className="filter-input detalle-inline-input" value={edit.proximoSeguimiento}
                onChange={(e) => setEdit((s) => ({ ...s, proximoSeguimiento: e.target.value }))} />
            ) : (
              <div className="detalle-field-value">{record.proximoSeguimiento?.slice(0, 10) || '\u2014'}</div>
            )}
          </DetalleField>

          {(editing || record.nit) && (
            <DetalleField label="NIT">
              {editing ? (
                <input className="filter-input detalle-inline-input" value={edit.nit}
                  onChange={(e) => setEdit((s) => ({ ...s, nit: e.target.value }))} />
              ) : (
                <div className="detalle-field-value">{record.nit}</div>
              )}
            </DetalleField>
          )}
        </div>

        {(editing ? edit.facturado && edit.facturado !== 'no' : (record.facturadoP ?? record.facturado) && (record.facturadoP ?? record.facturado) !== 'no') && (
          <div className="detalle-billing-wrap">
            <div className="detalle-billing-title">💰 Facturación por línea</div>
            {editing ? (
              edit.servicios.length === 0 ? (
                <p className="text-sm text-muted">Selecciona servicios de interés primero.</p>
              ) : (
                <>
                  <div className="detalle-billing-grid">
                    {edit.servicios.map((s) => (
                      <div key={s} className="detalle-billing-field">
                        <label>
                          <span className="detalle-billing-svc-dot" style={{ background: SVC_COLORS[s] ?? 'var(--accent)' }} />
                          {s}
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="filter-input detalle-billing-input"
                          placeholder="0"
                          value={edit.facturacionLineas[s] ?? ''}
                          onChange={(e) => setEdit((prev) => ({
                            ...prev,
                            facturacionLineas: { ...prev.facturacionLineas, [s]: e.target.value },
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="detalle-billing-total-row">
                    <span className="detalle-billing-total-label">Total</span>
                    <span className="detalle-billing-total-value">
                      ${billingTotal(edit.facturacionLineas).toLocaleString('es-CO')}
                    </span>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="detalle-billing-grid">
                  {(record.servicios.length > 0 ? record.servicios : Object.keys(record.facturacionLineas ?? {})).map((s) => {
                    const val = record.facturacionLineas?.[s] ?? 0
                    if (!val && !record.servicios.includes(s)) return null
                    return (
                      <div key={s} className="detalle-billing-field">
                        <label>
                          <span className="detalle-billing-svc-dot" style={{ background: SVC_COLORS[s] ?? 'var(--accent)' }} />
                          {s}
                        </label>
                        <div className="detalle-field-value detalle-field-value--money" style={{ textAlign: 'right' }}>
                          {fmtMoney(val)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="detalle-billing-total-row">
                  <span className="detalle-billing-total-label">Total</span>
                  <span className="detalle-billing-total-value">
                    {fmtMoney(billingTotal(record.facturacionLineas ?? {}))}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="detalle-observaciones">
          <div className="detalle-observaciones-header">
            <div className="detalle-section-title">📝 Observaciones</div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={obsSaving || obsText === (record.observaciones ?? '')}
              onClick={onSaveObs}
              title="Guardar observaciones sin entrar en modo edición"
            >
              {obsSaving ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
          <textarea
            className="filter-input detalle-observaciones-textarea"
            value={obsText}
            placeholder="Notas de gestión, acuerdos, próximos pasos..."
            onChange={(e) => setObsText(e.target.value)}
          />
        </div>

        {isProspecto && (record.stageHistory?.length > 0 || record.estadoProspecto) && (
          <div className="detalle-stage-section">
            <div className="detalle-section-title">⏱ Tiempos en etapas</div>
            <div className="detalle-stage-history">
              {(() => {
                const history = record.stageHistory ?? []
                const entries = history.length > 0
                  ? history
                  : record.estadoProspecto
                    ? [{ stage: record.estadoProspecto, desde: record.createdAt, hasta: null }]
                    : []
                return entries.map((e, i) => {
                  const desde = new Date(e.desde)
                  const hasta = e.hasta ? new Date(e.hasta) : new Date()
                  const dias = Math.max(1, Math.ceil((hasta.getTime() - desde.getTime()) / (86400000)))
                  const color = PROSPECTO_STAGE_COLOR[e.stage] ?? '#8899b4'
                  const isActual = e.hasta === null
                  return (
                    <div key={i} className="detalle-stage-chip" style={{ background: `${color}12`, borderColor: `${color}55` }}>
                      <div className="text-sm font-bold" style={{ color }}>{PROSPECTO_LABEL[e.stage] ?? e.stage}</div>
                      <div className="text-xs" style={{ color: 'var(--text2)' }}>
                        {dias} {dias === 1 ? 'día' : 'días'}{isActual ? ' (actual)' : ''}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        <div className="detalle-actividades">
          <div className="detalle-actividades-header">
            <h3 className="detalle-section-title">📅 Actividades programadas</h3>
            <button type="button" className="btn-green btn-sm" onClick={() => setShowActForm(!showActForm)}>
              {showActForm ? 'Cancelar' : '+ Nueva actividad'}
            </button>
          </div>

          {showActForm && (
            <div className="detalle-act-form">
              <div className="detalle-act-form-title">+ Nueva actividad</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="detalle-field-label">Tipo de actividad</div>
                  <select className="filter-select w-full" value={actForm.tipo}
                    onChange={(e) => setActForm((s) => ({ ...s, tipo: e.target.value as ActividadTipo }))}>
                    {ACTIVIDAD_TIPO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{ACTIVIDAD_TIPO_ICON[opt.value]} {opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="detalle-field-label">Fecha</div>
                  <input type="date" className="filter-input w-full" value={actForm.fecha}
                    onChange={(e) => setActForm((s) => ({ ...s, fecha: e.target.value }))} />
                </div>
                <div>
                  <div className="detalle-field-label">Descripción</div>
                  <input className="filter-input w-full" placeholder="¿Qué se va a hacer?"
                    value={actForm.descripcion}
                    onChange={(e) => setActForm((s) => ({ ...s, descripcion: e.target.value }))} />
                </div>
              </div>
              {actForm.tipo === 'visita' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="detalle-field-label">Hora</div>
                    <input type="time" className="filter-input w-full" value={actForm.hora}
                      onChange={(e) => setActForm((s) => ({ ...s, hora: e.target.value }))} />
                  </div>
                  <div>
                    <div className="detalle-field-label">Lugar</div>
                    <input className="filter-input w-full" placeholder="Dirección o lugar" value={actForm.lugar}
                      onChange={(e) => setActForm((s) => ({ ...s, lugar: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActForm(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary btn-sm"
                  disabled={!actForm.descripcion.trim() || creatingAct} onClick={onCreateAct}>
                  {creatingAct ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </div>
          )}

          <div className="detalle-act-list">
            {actividadesOrdenadas.length === 0 ? (
              <div className="detalle-act-empty">
                <div>📅</div>
                <p className="font-semibold">Sin actividades</p>
                <p className="text-sm">Registra llamadas, reuniones, visitas...</p>
              </div>
            ) : (
              actividadesOrdenadas.map((act) => (
                <div key={act.id} className={`detalle-act-item${act.hecho ? ' detalle-act-item--done' : ''}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                        {ACTIVIDAD_TIPO_ICON[act.tipo as ActividadTipo] ?? '📌'} {act.tipo}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text2)' }}>
                        {new Date(act.fecha).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-secondary btn-sm"
                        onClick={() => onToggleHecho(act.id, !act.hecho)}>
                        {act.hecho ? '✓ Hecho' : 'Completar'}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteAct(act.id)}>×</button>
                    </div>
                  </div>
                  <p className="detalle-field-value" style={{ marginTop: 6, fontWeight: 500 }}>{act.descripcion}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {record.contactos.length > 1 && (
          <div className="detalle-contactos-extra">
            <div className="detalle-section-title">Contactos adicionales</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {record.contactos.slice(1).map((c) => (
                <div key={c.id} className="detalle-act-item">
                  <div className="detalle-field-value">{c.nombre}</div>
                  {c.cargo && <div className="text-sm" style={{ color: 'var(--text2)' }}>{c.cargo}</div>}
                  {c.email && <a href={`mailto:${c.email}`} className="text-sm detalle-field-value--link">{c.email}</a>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
