import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { getRecord, updateRecord, deleteRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import Badge from '../components/Badge'
import ServiceChip from '../components/ServiceChip'
import ContactosList from '../components/ContactosList'
import ActividadesTimeline from '../components/ActividadesTimeline'
import BillingLines from '../components/BillingLines'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import { fmtCOP, fmtDate } from '../utils/format'
import { SERVICIOS } from '../types'
import type { ContactoCreate } from '../types'

export default function Detalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToastStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Edit state
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [servicios, setServicios] = useState<string[]>([])
  const [contactos, setContactos] = useState<ContactoCreate[]>([])
  const [facturacionLineas, setFacturacionLineas] = useState<Record<string, number>>({})

  const { data: record, isLoading } = useQuery({
    queryKey: ['record', id],
    queryFn: () => getRecord(id!),
    enabled: !!id,
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateRecord(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.add('Registro actualizado')
      setEditing(false)
    },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecord(id!),
    onSuccess: () => {
      toast.add('Registro eliminado')
      navigate(record?.tipo === 'prospecto' ? '/prospectos' : '/clientes')
    },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  const startEdit = () => {
    if (!record) return
    setForm({
      empresa: record.empresa,
      nit: record.nit ?? '',
      ciudad: record.ciudad ?? '',
      comercial_id: record.comercial_id ?? '',
      tipo_cliente: record.tipo_cliente,
      comision: record.comision ?? '',
      observaciones: record.observaciones ?? '',
      fecha: record.fecha,
      estado_prospecto: record.estado_prospecto ?? '',
      visita: record.visita ?? '',
      facturado_p: record.facturado_p ?? '',
      valor_p: record.valor_p ?? '',
      proximo_seguimiento: record.proximo_seguimiento ?? '',
      estado_cliente: record.estado_cliente ?? '',
      visita_cliente: record.visita_cliente ?? '',
      nuevo_servicio: record.nuevo_servicio ?? '',
      servicio_nuevo: record.servicio_nuevo ?? '',
      facturado: record.facturado ?? '',
      valor: record.valor ?? '',
    })
    setServicios([...record.servicios])
    setContactos(record.contactos.map((c) => ({
      nombre: c.nombre,
      cargo: c.cargo ?? undefined,
      telefono: c.telefono ?? undefined,
      email: c.email ?? undefined,
      orden: c.orden,
    })))
    setFacturacionLineas({ ...record.facturacion_lineas })
    setEditing(true)
  }

  const handleSave = () => {
    const payload: Record<string, unknown> = { ...form, servicios, facturacion_lineas: facturacionLineas }
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === undefined) delete payload[k]
    })
    updateMutation.mutate(payload)
  }

  const setField = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const comercialNombre = (cid: string | null) =>
    comerciales.find((c) => c.id === cid)?.nombre ?? '—'

  if (isLoading) {
    return (
      <div className="p-6 text-muted">Cargando...</div>
    )
  }

  if (!record) {
    return (
      <div className="p-6 text-muted">Registro no encontrado.</div>
    )
  }

  const isProspecto = record.tipo === 'prospecto'

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isProspecto ? '/prospectos' : '/clientes')}
            className="text-muted hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
              {record.empresa}
            </h1>
            {record.nit && <p className="text-muted text-xs">NIT {record.nit}</p>}
          </div>
          <Badge value={isProspecto ? record.estado_prospecto : record.estado_cliente} />
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={startEdit}
                className="px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{ background: '#00c2ff', color: '#0a0e1a' }}
              >
                Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-lg text-sm text-muted hover:text-danger transition border border-border"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted hover:text-white transition border border-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ background: '#00c2ff', color: '#0a0e1a' }}
              >
                <Save size={14} /> Guardar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Columna izquierda: datos */}
        <div className="col-span-2 space-y-5">

          {/* Datos generales */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Datos generales</h2>
            {!editing ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Info label="Ciudad" value={record.ciudad} />
                <Info label="Comercial" value={comercialNombre(record.comercial_id)} />
                <Info label="Tipo cliente" value={record.tipo_cliente} />
                {record.comision && <Info label="Comisión" value={record.comision} />}
                <Info label="Fecha" value={fmtDate(record.fecha)} />
                <Info label="Actualizado" value={fmtDate(record.updated_at)} />
                {record.observaciones && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted uppercase tracking-wider font-condensed mb-1">Observaciones</p>
                    <p style={{ color: '#e8edf5' }}>{record.observaciones}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Empresa</label>
                  <input value={String(form.empresa ?? '')} onChange={(e) => setField('empresa', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">NIT</label>
                  <input value={String(form.nit ?? '')} onChange={(e) => setField('nit', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Ciudad</label>
                  <input value={String(form.ciudad ?? '')} onChange={(e) => setField('ciudad', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Comercial</label>
                  <select value={String(form.comercial_id ?? '')} onChange={(e) => setField('comercial_id', e.target.value)}>
                    <option value="">Sin asignar</option>
                    {comerciales.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Tipo cliente</label>
                  <select value={String(form.tipo_cliente ?? 'directo')} onChange={(e) => setField('tipo_cliente', e.target.value)}>
                    <option value="directo">Directo</option>
                    <option value="indirecto">Indirecto</option>
                    <option value="referido">Referido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Comisión</label>
                  <input value={String(form.comision ?? '')} onChange={(e) => setField('comision', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Observaciones</label>
                  <textarea
                    className="h-16 resize-none"
                    value={String(form.observaciones ?? '')}
                    onChange={(e) => setField('observaciones', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estado */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">
              {isProspecto ? 'Estado prospecto' : 'Estado cliente'}
            </h2>
            {!editing ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {isProspecto ? (
                  <>
                    <Info label="Estado" badge={record.estado_prospecto} />
                    <Info label="Visita" badge={record.visita} />
                    <Info label="Facturado" badge={record.facturado_p} />
                    <Info label="Valor" value={fmtCOP(record.valor_p)} />
                    <Info label="Próx. seguimiento" value={fmtDate(record.proximo_seguimiento)} />
                  </>
                ) : (
                  <>
                    <Info label="Estado" badge={record.estado_cliente} />
                    <Info label="Visita" badge={record.visita_cliente} />
                    <Info label="Nuevo servicio" badge={record.nuevo_servicio} />
                    {record.servicio_nuevo && <Info label="Servicio" value={record.servicio_nuevo} />}
                    <Info label="Facturado" badge={record.facturado} />
                    <Info label="Valor" value={fmtCOP(record.valor)} />
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {isProspecto ? (
                  <>
                    <SelectField label="Estado" value={String(form.estado_prospecto ?? '')} onChange={(v) => setField('estado_prospecto', v)}
                      options={[['', '—'], ['seguimiento', 'Seguimiento'], ['cerrado', 'Cerrado'], ['perdido', 'Perdido'], ['frio', 'Frío']]} />
                    <SelectField label="Visita" value={String(form.visita ?? '')} onChange={(v) => setField('visita', v)}
                      options={[['', '—'], ['no', 'No'], ['si', 'Sí'], ['virtual', 'Virtual'], ['llamada', 'Llamada']]} />
                    <SelectField label="Facturado" value={String(form.facturado_p ?? '')} onChange={(v) => setField('facturado_p', v)}
                      options={[['', '—'], ['no', 'No'], ['si', 'Sí'], ['parcial', 'Parcial']]} />
                    <div>
                      <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Próx. seguimiento</label>
                      <input type="date" value={String(form.proximo_seguimiento ?? '')} onChange={(e) => setField('proximo_seguimiento', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <SelectField label="Estado" value={String(form.estado_cliente ?? '')} onChange={(v) => setField('estado_cliente', v)}
                      options={[['', '—'], ['activo', 'Activo'], ['en-riesgo', 'En riesgo'], ['inactivo', 'Inactivo']]} />
                    <SelectField label="Visita" value={String(form.visita_cliente ?? '')} onChange={(v) => setField('visita_cliente', v)}
                      options={[['', '—'], ['no', 'No'], ['si', 'Sí'], ['virtual', 'Virtual'], ['llamada', 'Llamada']]} />
                    <SelectField label="Nuevo servicio" value={String(form.nuevo_servicio ?? '')} onChange={(v) => setField('nuevo_servicio', v)}
                      options={[['', '—'], ['si', 'Sí'], ['no', 'No']]} />
                    <div>
                      <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Servicio nuevo</label>
                      <input value={String(form.servicio_nuevo ?? '')} onChange={(e) => setField('servicio_nuevo', e.target.value)} />
                    </div>
                    <SelectField label="Facturado" value={String(form.facturado ?? '')} onChange={(v) => setField('facturado', v)}
                      options={[['', '—'], ['no', 'No'], ['si', 'Sí'], ['parcial', 'Parcial']]} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Servicios */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Servicios</h2>
            {!editing ? (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {record.servicios.map((s) => (
                    <ServiceChip key={s} label={s} selected onToggle={() => {}} />
                  ))}
                  {record.servicios.length === 0 && <p className="text-muted text-sm">Sin servicios</p>}
                </div>
                {Object.keys(record.facturacion_lineas).length > 0 && (
                  <div className="space-y-1 text-sm">
                    {Object.entries(record.facturacion_lineas).map(([svc, val]) => (
                      <div key={svc} className="flex justify-between text-muted">
                        <span>{svc}</span>
                        <span>{fmtCOP(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SERVICIOS.map((s) => (
                    <ServiceChip
                      key={s}
                      label={s}
                      selected={servicios.includes(s)}
                      onToggle={() =>
                        setServicios((prev) =>
                          prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                        )
                      }
                    />
                  ))}
                </div>
                {servicios.length > 0 && (
                  <BillingLines
                    servicios={servicios}
                    value={facturacionLineas}
                    onChange={setFacturacionLineas}
                  />
                )}
              </>
            )}
          </div>

          {/* Contactos (modo edición) */}
          {editing && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Contactos</h2>
              <ContactosList value={contactos} onChange={setContactos} />
            </div>
          )}
        </div>

        {/* Columna derecha: contactos + actividades */}
        <div className="space-y-5">
          {/* Contactos (vista) */}
          {!editing && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-3">Contactos</h2>
              {record.contactos.length === 0 ? (
                <p className="text-muted text-sm">Sin contactos</p>
              ) : (
                <div className="space-y-3">
                  {record.contactos.map((c) => (
                    <div key={c.id} className="text-sm">
                      <p className="font-medium" style={{ color: '#e8edf5' }}>{c.nombre}</p>
                      {c.cargo && <p className="text-xs text-muted">{c.cargo}</p>}
                      {c.email && <p className="text-xs text-muted">{c.email}</p>}
                      {c.telefono && <p className="text-xs text-muted">{c.telefono}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actividades */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <ActividadesTimeline recordId={record.id} actividades={record.actividades} />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        message="¿Eliminar este registro? Se eliminarán también sus contactos y actividades."
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// Helpers
function Info({ label, value, badge }: { label: string; value?: string | null; badge?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wider font-condensed mb-0.5">{label}</p>
      {badge !== undefined ? (
        <Badge value={badge} />
      ) : (
        <p style={{ color: '#e8edf5' }}>{value ?? '—'}</p>
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}
