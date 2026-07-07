import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import { getFichaByRecord, updateFicha, getAnalistas, createAnalista, deleteAnalista } from '../api/fichas'
import { getRecord } from '../api/records'
import { getCotizaciones } from '../api/cotizaciones'
import { toast } from '../store/toastStore'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel, TableScrollArea } from '../components/ui/DataListPanel'

// Types
type TabId = 'info' | 'contactos' | 'facturacion' | 'operacion' | 'kickoff'

interface FichaContacto {
  cargo: string; tipo: string; nombre: string; email: string; tel: string; cel: string; aviso: boolean
}
interface KickoffAsistente {
  cargo: string; contacto: string
}

// Default empty data
const EMPTY_DATA = {
  // Info General
  tipoCliente: '', manejo: [] as string[], sector: '', canal: '',
  propuesta: '', enlace: '', propuestasIds: [] as string[],
  lineasNegocio: { deposito: false, zf: false, tlocal: false, cedi: false },
  fechaProceso: '', analistaId: '', obsGeneral: '',
  // Contactos
  contactos: [] as FichaContacto[],
  refEmpresa: '', refNit: '', refDir: '', refTel: '',
  // Facturación
  formaPago: '', fechaCierre: '', facturarA: '', buzon: '', pagoPor: '',
  telContacto: '', tipoTarifa: '', comision: '', seguro: '', contactoPago: '',
  almLg: { p1: '', p2: '' }, almIc: { p1: '', p2: '' }, almId: { p1: '', p2: '' },
  factLg: '', factIc: '', factId: '',
  pallet: '', palletIc: '', rotacion: '',
  formaFactLg: { forma: '', cantidad: '' },
  formaFactIc: { forma: '', cantidad: '' },
  formaFactId: { forma: '', cantidad: '' },
  // Operación
  tipoProducto: '', textil: '', reempaque: '', embalaje: '', controlInv: '',
  nacionaliza: '', procesoEsp: '', procesoDesc: '', manipulacion: '',
  despachos: '', salidasParciales: '', rotacionMerc: '', agencia: '', coordAduana: '',
  entregaTipo: '', horarios: '', escolta: '', vehiculo: '', citas: '',
  cargue: '', obsTransporte: '',
  // Kick Off
  asistentes: [] as KickoffAsistente[], obsKickoff: '',
}

type FichaData = typeof EMPTY_DATA

/** Paridad exacta HTML v6 fichaCalcPct(): 14 campos puntuales + fc-propuesta (legado oculto,
 *  el HTML nunca lo asigna desde ninguna UI visible — se replica igual, tope real ~93% salvo
 *  que el estado se marque "Completada", que fuerza 100%). */
function calcPct(d: FichaData, estado: string): number {
  if (estado === 'completada') return 100
  const checks = [
    d.tipoCliente, d.manejo.length > 0 ? 'ok' : '', d.sector, d.canal,
    '', // fc-propuesta (legado oculto, nunca asignado)
    d.formaPago, d.facturarA, d.buzon, d.tipoTarifa,
    d.tipoProducto, d.embalaje, d.controlInv, d.agencia, d.analistaId,
  ]
  const filled = checks.filter((v) => v.trim() !== '').length
  return Math.round((filled / checks.length) * 100)
}

const MANEJO_OPTIONS = ['Simple','Simple referenciado','Inventario','Paqueteo','Transporte local']
const SECTOR_OPTIONS = ['Textiles','Farmacéuticos','Tecnología','Dispositivos Médicos','Cosméticos','Juguetería','Electrodomésticos','Repuestos automotrices','Herramientas','Calzado','Industrial','Consumo masivo','Accesorios','Decoración','Hogar y cocina','Misceláneos','Alimentos secos','Bebidas','Papelería','Material POP']
const ALMACENAMIENTO_OPTIONS = ['','Ad valorem / Valor CIF de la mercancía','Posición Pallet','Metro cuadrado','Metro cúbico','Por contenedor','CIF - ALL IN Contenedor','ALL IN Contenedor']
const FACTURACION_OPTIONS = ['','Anticipada','Vencido','No Aplica']
const PALLET_OPTIONS = ['','Promedio Semanal','Promedio Quincenal','Pico más alto','No aplica']
const FORMA_FACT_LG_OPTIONS = ['','Por documento de transporte','Por periodo','Por ingreso (con el total de contenedores)']
const CANT_FACT_LG_OPTIONS = ['','Factura por documento de transporte','Factura Consolidada']
const CANT_FACT_IC_OPTIONS = ['','Factura por ingreso','Factura Consolidada','Factura por documento de transporte']

const COMPROMISOS = [
  { compromiso: 'Garantizar el correcto manejo de la operación', responsable: 'Operaciones', fecha: 'Inmediato' },
  { compromiso: 'Realizar facturación conforme propuesta comercial', responsable: 'Facturación', fecha: 'Inmediato' },
  { compromiso: 'Condiciones comerciales vs Oferta comercial', responsable: 'Comercial', fecha: 'Inmediato' },
]

export default function FichaDetalle() {
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabId>('info')
  const [data, setData] = useState<FichaData>(EMPTY_DATA)
  const [estado, setEstado] = useState('pendiente')
  const [fichaId, setFichaId] = useState('')
  const [showAnalistaForm, setShowAnalistaForm] = useState(false)
  const [newAnalista, setNewAnalista] = useState({ nombre: '', email: '', tel: '' })

  const { data: ficha, isLoading } = useQuery({
    queryKey: ['ficha', recordId],
    queryFn: () => getFichaByRecord(recordId!),
    enabled: !!recordId,
  })

  const { data: record } = useQuery({
    queryKey: ['record', recordId],
    queryFn: () => getRecord(recordId!),
    enabled: !!recordId,
  })

  const { data: analistas = [] } = useQuery({
    queryKey: ['analistas'],
    queryFn: getAnalistas,
  })

  const { data: cotizacionesAll = [] } = useQuery({
    queryKey: ['cotizaciones-all-ficha'],
    queryFn: () => getCotizaciones(),
  })

  useEffect(() => {
    if (ficha) {
      qc.invalidateQueries({ queryKey: ['fichas'] })
      qc.invalidateQueries({ queryKey: ['fichas-all'] })
      setFichaId(ficha.id)
      setEstado(ficha.estado)
      const merged = { ...EMPTY_DATA, ...(ficha.data as Partial<FichaData>) }
      setData(merged)
    }
  }, [ficha])

  const pct = calcPct(data, estado)

  const contactosPagination = usePagination(data.contactos, { resetDeps: [tab] })
  const asistentesPagination = usePagination(data.asistentes, { resetDeps: [tab] })
  const compromisosPagination = usePagination(COMPROMISOS, { resetDeps: [tab], pageSize: 10 })

  const saveMut = useAppMutation({
    mutationFn: () => updateFicha(fichaId, { estado, pct, data: data as unknown as Record<string, unknown> }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fichas'] })
      toast.success('Ficha guardada')
    },
    onError: () => toast.error('Error al guardar'),
  })

  const createAnalistaMut = useAppMutation({
    mutationFn: () => createAnalista(newAnalista),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analistas'] })
      setShowAnalistaForm(false)
      setNewAnalista({ nombre: '', email: '', tel: '' })
      toast.success('Analista creado')
    },
    onError: () => toast.error('Error al crear analista'),
  })

  const deleteAnalistaMut = useAppMutation({
    mutationFn: (id: string) => deleteAnalista(id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['analistas'] })
      if (data.analistaId === variables) setData((d) => ({ ...d, analistaId: '' }))
      toast.success('Analista eliminado')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const upd = useCallback(<K extends keyof FichaData>(key: K, val: FichaData[K]) => {
    setData((d) => ({ ...d, [key]: val }))
  }, [])

  function addContacto() {
    setData((d) => ({
      ...d,
      contactos: [...d.contactos, { cargo: '', tipo: '', nombre: '', email: '', tel: '', cel: '', aviso: false }],
    }))
  }
  function removeContacto(i: number) {
    setData((d) => ({ ...d, contactos: d.contactos.filter((_, idx) => idx !== i) }))
  }
  function updContacto(i: number, field: keyof FichaContacto, val: string | boolean) {
    setData((d) => {
      const c = [...d.contactos]
      c[i] = { ...c[i], [field]: val }
      return { ...d, contactos: c }
    })
  }

  function addAsistente() {
    setData((d) => ({ ...d, asistentes: [...d.asistentes, { cargo: '', contacto: '' }] }))
  }
  function removeAsistente(i: number) {
    setData((d) => ({ ...d, asistentes: d.asistentes.filter((_, idx) => idx !== i) }))
  }
  function updAsistente(i: number, field: keyof KickoffAsistente, val: string) {
    setData((d) => {
      const a = [...d.asistentes]
      a[i] = { ...a[i], [field]: val }
      return { ...d, asistentes: a }
    })
  }

  function toggleCotizacion(cotId: string) {
    setData((d) => ({
      ...d,
      propuestasIds: d.propuestasIds.includes(cotId)
        ? d.propuestasIds.filter((id) => id !== cotId)
        : [...d.propuestasIds, cotId],
    }))
  }

  function copiarLinkCotizacion(numero: string) {
    const url = `${window.location.origin}/cot/${numero}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado'))
  }

  const analistaActual = analistas.find((a) => a.id === data.analistaId)
  const empresaNombre = (record?.empresa ?? '').toLowerCase()
  const cotizacionesCliente = empresaNombre
    ? cotizacionesAll.filter((c) => {
        const emp = (c.empresa ?? '').toLowerCase()
        return emp.includes(empresaNombre) || empresaNombre.includes(emp)
      })
    : []
  const cotizacionesOrdenadas = [...cotizacionesCliente].sort((a, b) => {
    const aActiva = data.propuestasIds.includes(a.id) ? 0 : 1
    const bActiva = data.propuestasIds.includes(b.id) ? 0 : 1
    return aActiva - bActiva
  })
  const lineasActivas = [
    data.lineasNegocio.deposito && '📦 Depósito Aduanero',
    data.lineasNegocio.zf && '🏛 Zona Franca',
    data.lineasNegocio.tlocal && '🚚 Transporte Local',
    data.lineasNegocio.cedi && '🏭 CEDI IMC',
  ].filter(Boolean) as string[]

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-10 w-64 bg-surface2 rounded animate-pulse" />
      <div className="h-64 bg-surface2 rounded-xl animate-pulse" />
    </div>
  )

  const TABS: { id: TabId; label: string }[] = [
    { id: 'info',        label: '🏢 Info General'  },
    { id: 'contactos',   label: '👥 Contactos'      },
    { id: 'facturacion', label: '💳 Facturación'    },
    { id: 'operacion',   label: '⚙️ Operación'     },
    { id: 'kickoff',     label: '🚀 Kick Off'       },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* Sticky header */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-b border-border bg-surface2 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fichas')} className="btn-secondary btn-sm flex items-center gap-1">← Volver</button>
          <div>
            <div className="font-bold text-foreground text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22 }}>
              {record?.empresa ?? 'Ficha Cliente'}
            </div>
            <div className="text-xs text-muted mt-0.5">{record?.ciudad ?? ''}</div>
          </div>
        </div>
        <button className="btn-primary btn-sm" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? 'Guardando...' : '💾 Guardar Ficha'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 border-b border-border bg-surface">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted font-semibold">Progreso creación ficha</span>
          <span className="text-sm font-bold text-accent">{pct}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full">
          <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Tab bar */}
      <TableScrollArea className="ficha-tabs-scroll">
      <div className="flex border-b border-border bg-surface2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      </TableScrollArea>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── TAB: INFO GENERAL ─────────────────────────────── */}
        {tab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">

            <Field label="Tipo de cliente">
              <select className="input w-full" value={data.tipoCliente} onChange={(e) => upd('tipoCliente', e.target.value)}>
                <option value="">— Seleccionar —</option>
                <option>Directo</option><option>Intermediario</option><option>Referido</option>
              </select>
            </Field>

            <Field label="Manejo">
              <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                {MANEJO_OPTIONS.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.manejo.includes(m)}
                      onChange={(e) => upd('manejo', e.target.checked ? [...data.manejo, m] : data.manejo.filter((x) => x !== m))}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Sector / Tipo de Mercancía">
              <select className="input w-full" value={data.sector} onChange={(e) => upd('sector', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {SECTOR_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Canal de comunicación">
              <select className="input w-full" value={data.canal} onChange={(e) => upd('canal', e.target.value)}>
                <option value="">— Seleccionar —</option>
                <option>Directo</option><option>Intermediario</option><option>Referido</option>
              </select>
            </Field>

            <Field label="Propuestas Comerciales Activas" className="md:col-span-2">
              <div className="rounded-lg border border-border overflow-hidden mt-1">
                {cotizacionesOrdenadas.length === 0 ? (
                  <p className="text-2xs text-muted p-3">No hay propuestas creadas para este cliente</p>
                ) : (
                  <TableScrollArea>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface2">
                          <th className="w-8 p-2"></th>
                          <th className="text-left p-2 text-2xs text-muted uppercase tracking-widest">N° Cotización</th>
                          <th className="text-left p-2 text-2xs text-muted uppercase tracking-widest">Servicios</th>
                          <th className="text-left p-2 text-2xs text-muted uppercase tracking-widest">Fecha</th>
                          <th className="text-center p-2 text-2xs text-muted uppercase tracking-widest">Estado</th>
                          <th className="w-12 p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cotizacionesOrdenadas.map((c) => {
                          const activa = data.propuestasIds.includes(c.id)
                          return (
                            <tr key={c.id} className={activa ? 'bg-accent/5' : ''}>
                              <td className="text-center p-2">
                                <input type="checkbox" checked={activa} onChange={() => toggleCotizacion(c.id)} />
                              </td>
                              <td className={`p-2 font-bold ${activa ? 'text-accent' : 'text-foreground'}`}>{c.numero || 'BORRADOR'}</td>
                              <td className="p-2 text-muted truncate max-w-[180px]">{(c.lineas ?? []).join(', ') || '—'}</td>
                              <td className="p-2 text-muted whitespace-nowrap">{c.fecha?.slice(0, 10) ?? '—'}</td>
                              <td className="text-center p-2">
                                {activa ? <span className="badge-blue">✓ Activa</span> : <span className="badge-gray">Inactiva</span>}
                              </td>
                              <td className="text-center p-2">
                                <Link to={`/cotizaciones/${c.id}/editar`} className="btn-secondary btn-sm text-2xs px-2 py-0.5">👁</Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </TableScrollArea>
                )}
              </div>
            </Field>

            <Field label="Enlace Propuesta" className="md:col-span-2">
              <div className="flex flex-col gap-1.5 mt-1">
                {data.propuestasIds.length === 0 && (
                  <p className="text-2xs text-muted italic">Los enlaces se generan automáticamente al seleccionar propuestas activas</p>
                )}
                {data.propuestasIds.map((cotId) => {
                  const cot = cotizacionesAll.find((c) => c.id === cotId)
                  if (!cot) return null
                  const link = `${window.location.origin}/cot/${cot.numero}`
                  return (
                    <div key={cotId} className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-2xs font-bold text-accent mb-0.5">{cot.numero || 'BORRADOR'}</div>
                        <div className="text-2xs text-muted truncate">{link}</div>
                      </div>
                      <button type="button" className="btn-secondary btn-sm text-2xs px-2 py-1 flex-shrink-0" onClick={() => copiarLinkCotizacion(cot.numero)}>
                        📋 Copiar
                      </button>
                    </div>
                  )
                })}
              </div>
            </Field>

            <Field label="Líneas de negocio" className="md:col-span-2">
              <div className="flex gap-3 flex-wrap mt-1">
                {[
                  { key: 'deposito', label: '📦 Depósito Aduanero' },
                  { key: 'zf',       label: '🏛 Zona Franca' },
                  { key: 'tlocal',   label: '🚚 Transporte Local' },
                  { key: 'cedi',     label: '🏭 CEDI IMC' },
                ].map(({ key, label }) => (
                  <label key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-semibold transition-all ${
                    data.lineasNegocio[key as keyof typeof data.lineasNegocio]
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted'
                  }`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={data.lineasNegocio[key as keyof typeof data.lineasNegocio]}
                      onChange={(e) => upd('lineasNegocio', { ...data.lineasNegocio, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
                {lineasActivas.length === 0 && <span className="text-xs text-muted italic">Sin líneas de negocio registradas</span>}
              </div>
            </Field>

            <Field label="Fecha tentativa 1er proceso">
              <input type="date" className="input w-full" value={data.fechaProceso} onChange={(e) => upd('fechaProceso', e.target.value)} />
            </Field>

            <Field label="Analista de operaciones">
              <div className="flex gap-2">
                <select className="input flex-1" value={data.analistaId} onChange={(e) => upd('analistaId', e.target.value)}>
                  <option value="">— Seleccionar analista —</option>
                  {analistas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
                <button className="btn-sm px-3 py-1.5 text-xs font-bold rounded-lg border border-success/40 text-success bg-success/10"
                  onClick={() => setShowAnalistaForm(!showAnalistaForm)}>➕ Nuevo</button>
                {data.analistaId && (
                  <button className="btn-sm px-3 py-1.5 text-xs font-bold rounded-lg border border-danger/40 text-danger bg-danger/5"
                    onClick={() => deleteAnalistaMut.mutate(data.analistaId)}>🗑</button>
                )}
              </div>
              {analistaActual && (
                <div className="text-xs text-muted mt-1.5 bg-surface border border-border rounded-lg px-3 py-2">
                  <span className="text-accent">{analistaActual.email ?? '—'}</span>
                  {analistaActual.tel && <> · {analistaActual.tel}</>}
                </div>
              )}
              {showAnalistaForm && (
                <div className="mt-2 border border-border rounded-lg p-4 bg-surface space-y-3">
                  <p className="text-xs font-bold text-accent uppercase tracking-widest">Nuevo Analista</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">Nombre</label>
                      <input className="input w-full" value={newAnalista.nombre} onChange={(e) => setNewAnalista((a) => ({ ...a, nombre: e.target.value }))} /></div>
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">Email</label>
                      <input type="email" className="input w-full" value={newAnalista.email} onChange={(e) => setNewAnalista((a) => ({ ...a, email: e.target.value }))} /></div>
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">Teléfono</label>
                      <input className="input w-full" value={newAnalista.tel} onChange={(e) => setNewAnalista((a) => ({ ...a, tel: e.target.value }))} /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="btn-secondary btn-sm" onClick={() => setShowAnalistaForm(false)}>Cancelar</button>
                    <button className="btn-primary btn-sm" disabled={!newAnalista.nombre || createAnalistaMut.isPending}
                      onClick={() => createAnalistaMut.mutate()}>💾 Guardar</button>
                  </div>
                </div>
              )}
            </Field>

            <Field label="Observaciones generales" className="md:col-span-2">
              <textarea className="input w-full h-20 resize-y" placeholder="Observaciones..." value={data.obsGeneral} onChange={(e) => upd('obsGeneral', e.target.value)} />
            </Field>

          </div>
        )}

        {/* ── TAB: CONTACTOS ──────────────────────────────────── */}
        {tab === 'contactos' && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Matriz de contactos</h3>
              <button className="btn-secondary btn-sm" onClick={addContacto}>➕ Agregar contacto</button>
            </div>
            <DataListPanel pagination={contactosPagination} hidePagination={data.contactos.length <= 10}>
              <table>
                <thead>
                  <tr>
                    <th>Cargo</th><th>Tipo</th><th>Contacto</th><th>Email</th><th>Teléfono</th><th>Celular</th><th className="text-center">Aviso</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.contactos.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-muted text-sm py-6">Sin contactos. Usa "Agregar contacto".</td></tr>
                  )}
                  {contactosPagination.pageItems.map((c, pageIdx) => {
                    const i = contactosPagination.startIndex - 1 + pageIdx
                    return (
                    <tr key={i}>
                      <td><input className="input w-full text-xs" value={c.cargo} onChange={(e) => updContacto(i, 'cargo', e.target.value)} /></td>
                      <td><input className="input w-full text-xs" value={c.tipo} onChange={(e) => updContacto(i, 'tipo', e.target.value)} /></td>
                      <td><input className="input w-full text-xs" value={c.nombre} onChange={(e) => updContacto(i, 'nombre', e.target.value)} /></td>
                      <td><input className="input w-full text-xs" type="email" value={c.email} onChange={(e) => updContacto(i, 'email', e.target.value)} /></td>
                      <td><input className="input w-full text-xs" value={c.tel} onChange={(e) => updContacto(i, 'tel', e.target.value)} /></td>
                      <td><input className="input w-full text-xs" value={c.cel} onChange={(e) => updContacto(i, 'cel', e.target.value)} /></td>
                      <td className="text-center"><input type="checkbox" checked={c.aviso} onChange={(e) => updContacto(i, 'aviso', e.target.checked)} /></td>
                      <td><button className="text-danger/60 hover:text-danger text-xs" onClick={() => removeContacto(i)}>×</button></td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </DataListPanel>
            {(data.tipoCliente === 'Intermediario' || data.tipoCliente === 'Referido') && (
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Cliente que refiere</h3>
                <div className="space-y-1"><label className="text-xs text-muted uppercase tracking-widest">Empresa Intermediaria</label>
                  <input className="input w-full" placeholder="Nombre de la empresa..." value={data.refEmpresa} onChange={(e) => upd('refEmpresa', e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><label className="text-xs text-muted uppercase tracking-widest">NIT</label>
                    <input className="input w-full" value={data.refNit} onChange={(e) => upd('refNit', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-xs text-muted uppercase tracking-widest">Dirección</label>
                    <input className="input w-full" value={data.refDir} onChange={(e) => upd('refDir', e.target.value)} /></div>
                  <div className="space-y-1"><label className="text-xs text-muted uppercase tracking-widest">Teléfono</label>
                    <input className="input w-full" value={data.refTel} onChange={(e) => upd('refTel', e.target.value)} /></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: FACTURACIÓN ─────────────────────────────────── */}
        {tab === 'facturacion' && (
          <div className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Forma de pago">
                <select className="input w-full" value={data.formaPago} onChange={(e) => upd('formaPago', e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  <option>Contado</option><option>Crédito a 15 días</option><option>Crédito a 30 días</option><option>Crédito a 60 días</option>
                </select>
              </Field>
              <Field label="Fecha de cierre de facturación">
                <input className="input w-full" placeholder="Ej: Último día del mes..." value={data.fechaCierre} onChange={(e) => upd('fechaCierre', e.target.value)} />
              </Field>
              <Field label="Facturar a">
                <input className="input w-full" placeholder="Razón social..." value={data.facturarA} onChange={(e) => upd('facturarA', e.target.value)} />
              </Field>
              <Field label="Buzón para facturación electrónica">
                <input type="email" className="input w-full" placeholder="email@empresa.com" value={data.buzon} onChange={(e) => upd('buzon', e.target.value)} />
              </Field>
              <Field label="Pago realizado por">
                <input className="input w-full" placeholder="Nombre empresa..." value={data.pagoPor} onChange={(e) => upd('pagoPor', e.target.value)} />
              </Field>
              <Field label="Teléfono Contacto">
                <input className="input w-full" value={data.telContacto} onChange={(e) => upd('telContacto', e.target.value)} />
              </Field>
              <Field label="Tipo de tarifa">
                <select className="input w-full" value={data.tipoTarifa} onChange={(e) => upd('tipoTarifa', e.target.value)}>
                  <option value="">— Seleccionar —</option><option>Neta</option><option>Venta</option>
                </select>
              </Field>
              <Field label="Aplica comisión">
                <select className="input w-full" value={data.comision} onChange={(e) => upd('comision', e.target.value)}>
                  <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
                </select>
              </Field>
              <Field label="Aplica cobro seguro">
                <select className="input w-full" value={data.seguro} onChange={(e) => upd('seguro', e.target.value)}>
                  <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
                </select>
              </Field>
              <Field label="Contacto para pago a proveedores">
                <input className="input w-full" value={data.contactoPago} onChange={(e) => upd('contactoPago', e.target.value)} />
              </Field>
              <Field label="Conteo de Pallet — Logimat">
                <select className="input w-full" value={data.pallet} onChange={(e) => upd('pallet', e.target.value)}>
                  {PALLET_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Conteo de Pallet — IMCC Cargo">
                <select className="input w-full" value={data.palletIc} onChange={(e) => upd('palletIc', e.target.value)}>
                  {PALLET_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Rotación">
                <select className="input w-full" value={data.rotacion} onChange={(e) => upd('rotacion', e.target.value)}>
                  <option value="">— Seleccionar —</option><option>Semanal</option><option>Quincenal</option><option>Mensual</option>
                </select>
              </Field>
            </div>

            {/* Tipo almacenamiento */}
            <div>
              <p className="text-xs text-muted uppercase tracking-widest font-bold mb-3">Tipo de almacenamiento</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'LOGIMAT',      obj: data.almLg, set: (v: { p1: string; p2: string }) => upd('almLg', v) },
                  { label: 'IMCC CARGO',   obj: data.almIc, set: (v: { p1: string; p2: string }) => upd('almIc', v) },
                  { label: 'IMC DEPÓSITO', obj: data.almId, set: (v: { p1: string; p2: string }) => upd('almId', v) },
                ].map(({ label, obj, set }) => (
                  <div key={label} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                    <div className="text-xs font-bold text-accent tracking-widest uppercase">{label}</div>
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">Primer mes</label>
                      <select className="input w-full text-xs" value={obj.p1} onChange={(e) => set({ ...obj, p1: e.target.value })}>
                        {ALMACENAMIENTO_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">A partir del 2do mes</label>
                      <select className="input w-full text-xs" value={obj.p2} onChange={(e) => set({ ...obj, p2: e.target.value })}>
                        {ALMACENAMIENTO_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo facturación */}
            <div>
              <p className="text-xs text-muted uppercase tracking-widest font-bold mb-3">Tipo de facturación</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'LOGIMAT',      val: data.factLg, set: (v: string) => upd('factLg', v) },
                  { label: 'IMCC CARGO',   val: data.factIc, set: (v: string) => upd('factIc', v) },
                  { label: 'IMC DEPÓSITO', val: data.factId, set: (v: string) => upd('factId', v) },
                ].map(({ label, val, set }) => (
                  <div key={label} className="rounded-lg border border-border bg-surface p-4 space-y-2">
                    <div className="text-xs font-bold text-accent tracking-widest uppercase">{label}</div>
                    <select className="input w-full text-xs" value={val} onChange={(e) => set(e.target.value)}>
                      {FACTURACION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Forma de facturación */}
            <div>
              <p className="text-xs text-muted uppercase tracking-widest font-bold mb-3">Forma de Facturación / Cantidad de Facturas</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'LOGIMAT',      obj: data.formaFactLg, set: (v: { forma: string; cantidad: string }) => upd('formaFactLg', v),
                    formaOpts: FORMA_FACT_LG_OPTIONS, cantOpts: CANT_FACT_LG_OPTIONS },
                  { label: 'IMCC CARGO',   obj: data.formaFactIc, set: (v: { forma: string; cantidad: string }) => upd('formaFactIc', v),
                    formaOpts: FORMA_FACT_LG_OPTIONS, cantOpts: CANT_FACT_IC_OPTIONS },
                  { label: 'IMC DEPÓSITO', obj: data.formaFactId, set: (v: { forma: string; cantidad: string }) => upd('formaFactId', v),
                    formaOpts: FORMA_FACT_LG_OPTIONS, cantOpts: ['', 'Factura por documento de transporte'] },
                ].map(({ label, obj, set, formaOpts, cantOpts }) => (
                  <div key={label} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                    <div className="text-xs font-bold text-accent tracking-widest uppercase">{label}</div>
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">Forma de facturación</label>
                      <select className="input w-full text-xs" value={obj.forma} onChange={(e) => set({ ...obj, forma: e.target.value })}>
                        {formaOpts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs text-muted uppercase">Cantidad de facturas</label>
                      <select className="input w-full text-xs" value={obj.cantidad} onChange={(e) => set({ ...obj, cantidad: e.target.value })}>
                        {cantOpts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: OPERACIÓN ──────────────────────────────────── */}
        {tab === 'operacion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
            <Field label="Tipo de producto" className="md:col-span-2">
              <input className="input w-full" placeholder="Descripción del producto..." value={data.tipoProducto} onChange={(e) => upd('tipoProducto', e.target.value)} />
            </Field>
            <Field label="Aplica para producto textil">
              <select className="input w-full" value={data.textil} onChange={(e) => upd('textil', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Si — Inspección</option><option>No</option>
              </select>
            </Field>
            <Field label="Aplica reempaque pallets">
              <select className="input w-full" value={data.reempaque} onChange={(e) => upd('reempaque', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
              </select>
            </Field>
            <Field label="Embalaje de mercancía" className="md:col-span-2">
              <input className="input w-full" placeholder="Cajas, Huacales, bultos..." value={data.embalaje} onChange={(e) => upd('embalaje', e.target.value)} />
            </Field>
            <Field label="Control de inventario" className="md:col-span-2">
              <input className="input w-full" placeholder="Caja master, unidades, fecha vencimiento..." value={data.controlInv} onChange={(e) => upd('controlInv', e.target.value)} />
            </Field>
            <Field label="Nacionaliza">
              <select className="input w-full" value={data.nacionaliza} onChange={(e) => upd('nacionaliza', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Parcial</option><option>Completo</option>
              </select>
            </Field>
            <Field label="Proceso especial / adicionales">
              <select className="input w-full" value={data.procesoEsp} onChange={(e) => upd('procesoEsp', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
              </select>
            </Field>
            <Field label="Descripción proceso especial" className="md:col-span-2">
              <input className="input w-full" placeholder="Cuáles procesos especiales..." value={data.procesoDesc} onChange={(e) => upd('procesoDesc', e.target.value)} />
            </Field>
            <Field label="Manipulación / almacenamiento especial" className="md:col-span-2">
              <textarea className="input w-full h-16 resize-y" placeholder="Describa el tipo de manipulación..." value={data.manipulacion} onChange={(e) => upd('manipulacion', e.target.value)} />
            </Field>

            <div className="md:col-span-2 border-t border-border pt-4">
              <p className="text-sm font-bold text-foreground mb-4">Despachos</p>
            </div>

            <Field label="Detalle general de despachos" className="md:col-span-2">
              <textarea className="input w-full h-16 resize-y" placeholder="Descripción general..." value={data.despachos} onChange={(e) => upd('despachos', e.target.value)} />
            </Field>
            <Field label="Realizan salidas parciales">
              <select className="input w-full" value={data.salidasParciales} onChange={(e) => upd('salidasParciales', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
              </select>
            </Field>
            <Field label="Rotación de mercancía">
              <select className="input w-full" value={data.rotacionMerc} onChange={(e) => upd('rotacionMerc', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Semanal</option><option>Quincenal</option><option>Mensual</option>
              </select>
            </Field>
            <Field label="Agencia de Aduanas">
              <input className="input w-full" placeholder="Nombre de la agencia..." value={data.agencia} onChange={(e) => upd('agencia', e.target.value)} />
            </Field>
            <Field label="Coordinador importaciones Aduana">
              <input className="input w-full" placeholder="Nombre del coordinador..." value={data.coordAduana} onChange={(e) => upd('coordAduana', e.target.value)} />
            </Field>

            <div className="md:col-span-2 border-t border-border pt-4">
              <p className="text-sm font-bold text-foreground mb-4">Transporte de Mercancía</p>
            </div>

            <Field label="Tipo de entrega servicio masivo" className="md:col-span-2">
              <input className="input w-full" placeholder="Punto a punto, Ruta, varios puntos..." value={data.entregaTipo} onChange={(e) => upd('entregaTipo', e.target.value)} />
            </Field>
            <Field label="Horarios de entrega">
              <input className="input w-full" placeholder="8am - 5pm..." value={data.horarios} onChange={(e) => upd('horarios', e.target.value)} />
            </Field>
            <Field label="Requiere escolta">
              <select className="input w-full" value={data.escolta} onChange={(e) => upd('escolta', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
              </select>
            </Field>
            <Field label="Tipología de vehículo">
              <input className="input w-full" placeholder="Camión, Tractocamión, Van..." value={data.vehiculo} onChange={(e) => upd('vehiculo', e.target.value)} />
            </Field>
            <Field label="Requiere citas para entrega">
              <select className="input w-full" value={data.citas} onChange={(e) => upd('citas', e.target.value)}>
                <option value="">— Seleccionar —</option><option>Si</option><option>No</option>
              </select>
            </Field>
            <Field label="Requerimientos cargue/descargue" className="md:col-span-2">
              <input className="input w-full" placeholder="Auxiliar, montacargas, rampa..." value={data.cargue} onChange={(e) => upd('cargue', e.target.value)} />
            </Field>
            <Field label="Observaciones transporte" className="md:col-span-2">
              <textarea className="input w-full h-16 resize-y" placeholder="Observaciones adicionales..." value={data.obsTransporte} onChange={(e) => upd('obsTransporte', e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── TAB: KICK OFF ───────────────────────────────────── */}
        {tab === 'kickoff' && (
          <div className="space-y-6 max-w-4xl">
            {/* Asistentes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-foreground">Asistentes Kick Off</h3>
                <button className="btn-secondary btn-sm" onClick={addAsistente}>➕ Agregar asistente</button>
              </div>
              <DataListPanel pagination={asistentesPagination} hidePagination={data.asistentes.length <= 10}>
                <table>
                  <thead><tr><th>Cargo</th><th>Contacto</th><th></th></tr></thead>
                  <tbody>
                    {data.asistentes.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted text-sm py-4">Sin asistentes registrados.</td></tr>
                    )}
                    {asistentesPagination.pageItems.map((a, pageIdx) => {
                      const i = asistentesPagination.startIndex - 1 + pageIdx
                      return (
                      <tr key={i}>
                        <td><input className="input w-full text-xs" value={a.cargo} onChange={(e) => updAsistente(i, 'cargo', e.target.value)} /></td>
                        <td><input className="input w-full text-xs" value={a.contacto} onChange={(e) => updAsistente(i, 'contacto', e.target.value)} /></td>
                        <td><button className="text-danger/60 hover:text-danger text-xs" onClick={() => removeAsistente(i)}>×</button></td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </DataListPanel>
            </div>

            {/* Compromisos */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Compromisos</h3>
              <DataListPanel pagination={compromisosPagination} hidePagination>
                <table>
                  <thead><tr><th>Compromiso</th><th>Responsable</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {compromisosPagination.pageItems.map((c, i) => (
                      <tr key={i}>
                        <td className="text-sm">{c.compromiso}</td>
                        <td className="text-sm text-muted">{c.responsable}</td>
                        <td><span className="text-accent font-semibold text-xs">{c.fecha}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataListPanel>
            </div>

            {/* Obs + Estado */}
            <Field label="Observaciones Kick Off">
              <textarea className="input w-full h-20 resize-y" placeholder="Notas de la reunión Kick Off..." value={data.obsKickoff} onChange={(e) => upd('obsKickoff', e.target.value)} />
            </Field>
            <Field label="Estado de la ficha">
              <select className="input w-full" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="en_proceso">🔄 En Proceso</option>
                <option value="completada">✅ Completada</option>
              </select>
            </Field>
          </div>
        )}

      </div>
    </div>
  )
}

// Helper component
function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs text-muted font-bold uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}
