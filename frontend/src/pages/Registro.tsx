import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRecord, getRecords } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import { SERVICIOS } from '../types'
import type { TipoRecord, RecordCreate, ContactoCreate, TipoCliente } from '../types'

const ESTADOS_PROSPECTO = [
  { value: 'prospecto', label: '🎯 Prospecto' },
  { value: 'reconocimiento', label: '🏢 Visita' },
  { value: 'propuesta', label: '📄 Propuesta Comercial' },
  { value: 'aceptacion_propuesta', label: '🤝 Aceptación Propuesta Comercial' },
  { value: 'creacion_sop', label: '📋 Creación Ficha Cliente' },
  { value: 'facturado', label: '💰 Facturado' },
]

const TIPOS_CONTACTO = [
  { value: '', label: '— Sin definir —' },
  { value: 'principal', label: '⭐ Principal' },
  { value: 'comercial', label: '💼 Comercial' },
  { value: 'gestion-documental', label: '📁 Gestión Documental' },
  { value: 'financiero', label: '💰 Financiero' },
  { value: 'operativo', label: '⚙️ Operativo' },
]

type ContactoForm = ContactoCreate & {
  recibeRegalosSel: '' | 'si' | 'no'
  tipoContacto: string
}

const emptyContacto = (): ContactoForm => ({
  nombre: '', cargo: '', telefono: '', email: '',
  orden: 0, cumpleanos: '', recibeRegalos: false,
  recibeRegalosSel: '', tipoContacto: '',
})

function fmtMoneyPreview(val: string): string {
  const n = Number(val)
  if (!val || Number.isNaN(n)) return ''
  return '$' + n.toLocaleString('es-CO')
}

function billingTotal(billing: Record<string, string>): number {
  return Object.values(billing).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0)
}

export default function Registro() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tipo, setTipoState] = useState<TipoRecord>('prospecto')
  const [contactos, setContactos] = useState<ContactoForm[]>([emptyContacto()])

  const [empresa, setEmpresa] = useState('')
  const [nit, setNit] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [direccion, setDireccion] = useState('')
  const [comercialId, setComercialId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria] = useState<'A' | 'B' | 'C' | ''>('')
  const [servicios, setServicios] = useState<string[]>([])

  const [estadoProspecto, setEstadoP] = useState('prospecto')
  const [visita, setVisita] = useState<'no' | 'si' | 'virtual' | 'llamada'>('no')
  const [fechaVisita, setFechaV] = useState('')
  const [proxSeguimiento, setProxSeg] = useState('')
  const [ingresosEsperados, setIngresos] = useState('')
  const [facturadoP, setFacturadoP] = useState<'no' | 'si' | 'parcial'>('no')
  const [billingP, setBillingP] = useState<Record<string, string>>({})
  const [obsProspecto, setObsProspecto] = useState('')

  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('directo')
  const [clienteIndirectoId, setClienteInd] = useState('')
  const [estadoCliente, setEstadoC] = useState<'activo' | 'en-riesgo' | 'inactivo'>('activo')
  const [visitaCliente, setVisitaC] = useState<'no' | 'si' | 'virtual'>('no')
  const [fechaVisitaCliente, setFechaVC] = useState('')
  const [nuevoServicio, setNuevoServicio] = useState<'no' | 'si'>('no')
  const [servicioNuevo, setServicioNuevo] = useState('')
  const [facturado, setFacturado] = useState<'no' | 'si' | 'parcial'>('no')
  const [billingC, setBillingC] = useState<Record<string, string>>({})
  const [obsCliente, setObsCliente] = useState('')

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const { data: allRecords = [] } = useQuery({
    queryKey: ['records-aliados'],
    queryFn: () => getRecords(),
  })

  const aliadosIndirectos = allRecords.filter((r) => r.tipoCliente === 'indirecto')

  const createMut = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Registro guardado exitosamente')
      setTimeout(() => navigate('/dashboard'), 1200)
    },
    onError: () => toast.error('Error al crear el registro'),
  })

  function setTipo(t: TipoRecord) {
    setTipoState(t)
    if (t === 'cliente') onTipoClienteChange(tipoCliente)
  }

  function onTipoClienteChange(val: TipoCliente) {
    setTipoCliente(val)
    if (val !== 'referido') setClienteInd('')
  }

  function toggleServicio(s: string) {
    setServicios((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
      return next
    })
  }

  useEffect(() => {
    if (facturadoP !== 'no' && servicios.length) {
      setBillingP((prev) => {
        const next = { ...prev }
        servicios.forEach((s) => { if (!(s in next)) next[s] = '' })
        return next
      })
    }
  }, [servicios, facturadoP])

  useEffect(() => {
    if (facturado !== 'no' && servicios.length) {
      setBillingC((prev) => {
        const next = { ...prev }
        servicios.forEach((s) => { if (!(s in next)) next[s] = '' })
        return next
      })
    }
  }, [servicios, facturado])

  function agregarContacto() {
    setContactos((prev) => [...prev, { ...emptyContacto(), orden: prev.length }])
  }

  function eliminarContacto(i: number) {
    setContactos((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateContacto(i: number, field: keyof ContactoForm, value: string) {
    setContactos((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function clearForm() {
    setEmpresa(''); setNit(''); setCiudad(''); setDireccion('')
    setComercialId(''); setCategoria(''); setServicios([])
    setObsProspecto(''); setObsCliente('')
    setFecha(new Date().toISOString().split('T')[0])
    setTipoCliente('directo'); setClienteInd('')
    setEstadoP('prospecto'); setVisita('no'); setFechaV(''); setProxSeg(''); setIngresos('')
    setFacturadoP('no'); setBillingP({})
    setEstadoC('activo'); setVisitaC('no'); setFechaVC('')
    setNuevoServicio('no'); setServicioNuevo('')
    setFacturado('no'); setBillingC({})
    setContactos([emptyContacto()])
    setTipo('prospecto')
  }

  function getContactosPayload(): ContactoCreate[] {
    return contactos
      .filter((c) => c.nombre.trim())
      .map(({ recibeRegalosSel, tipoContacto, recibeRegalos: _r, ...rest }, i) => ({
        ...rest,
        orden: i,
        tipo: tipoContacto || undefined,
        recibeRegalos: recibeRegalosSel === 'si',
      }))
  }

  function handleSave() {
    if (!empresa.trim()) { toast.error('Ingresa el nombre de la empresa'); return }
    if (!comercialId) { toast.error('Selecciona un comercial responsable'); return }
    if (servicios.length === 0) { toast.error('Selecciona al menos un servicio'); return }

    const payload: RecordCreate = {
      tipo,
      empresa: empresa.trim(),
      nit: nit || undefined,
      ciudad: ciudad || undefined,
      direccion: direccion || undefined,
      comercialId,
      fecha,
      categoria: categoria || undefined,
      servicios,
      contactos: getContactosPayload(),
    }

    if (tipo === 'prospecto') {
      Object.assign(payload, {
        estadoProspecto: estadoProspecto as RecordCreate['estadoProspecto'],
        visita,
        fechaVisita: fechaVisita || undefined,
        proximoSeguimiento: proxSeguimiento || undefined,
        ingresosEsperados: ingresosEsperados ? Number(ingresosEsperados) : 0,
        observaciones: obsProspecto || undefined,
        facturadoP,
        facturacionLineas: facturadoP !== 'no'
          ? Object.fromEntries(
              Object.entries(billingP)
                .filter(([, v]) => parseInt(v, 10) > 0)
                .map(([k, v]) => [k, parseInt(v, 10)]),
            )
          : {},
        valorP: facturadoP !== 'no' ? billingTotal(billingP) : 0,
      })
    } else {
      Object.assign(payload, {
        tipoCliente,
        clienteIndirectoId: tipoCliente === 'referido' && clienteIndirectoId ? clienteIndirectoId : undefined,
        estadoCliente,
        visitaCliente,
        fechaVisitaCliente: fechaVisitaCliente || undefined,
        nuevoServicio,
        servicioNuevo: servicioNuevo || undefined,
        facturado,
        observaciones: obsCliente || undefined,
        facturacionLineas: facturado !== 'no'
          ? Object.fromEntries(
              Object.entries(billingC)
                .filter(([, v]) => parseInt(v, 10) > 0)
                .map(([k, v]) => [k, parseInt(v, 10)]),
            )
          : {},
        valor: facturado !== 'no' ? billingTotal(billingC) : 0,
      })
    }

    createMut.mutate(payload)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="section-title text-2xl font-bold mb-6">
        ➕ Nuevo <span className="text-accent">Registro</span>
      </div>

      <div className="card p-6 space-y-6">
        {/* Tipo — setTipo */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Registro</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`type-btn px-5 py-2.5 rounded-lg font-semibold text-sm border transition-all ${
                tipo === 'prospecto'
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'border-border text-muted hover:text-foreground'
              }`}
              onClick={() => setTipo('prospecto')}
            >
              🎯 Prospecto
            </button>
            <button
              type="button"
              className={`type-btn px-5 py-2.5 rounded-lg font-semibold text-sm border transition-all ${
                tipo === 'cliente'
                  ? 'bg-success/15 border-success text-success'
                  : 'border-border text-muted hover:text-foreground'
              }`}
              onClick={() => setTipo('cliente')}
            >
              🏢 Cliente
            </button>
          </div>
        </div>

        {/* Datos básicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Nombre de la Empresa *</label>
            <input className="input" placeholder="Ej: Comercial XYZ S.A.S." value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">NIT / Identificación</label>
            <input className="input" placeholder="Ej: 900.123.456-7" value={nit} onChange={(e) => setNit(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Ciudad</label>
            <input className="input" placeholder="Ej: Bogotá" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted mb-1">Dirección de la Empresa</label>
            <input className="input" placeholder="Ej: Cra. 15 #93-75, Bogotá" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Comercial Responsable *</label>
            <select className="input" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Fecha de Registro</label>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Categoría del Registro</label>
            <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value as '' | 'A' | 'B' | 'C')}>
              <option value="">— Sin categoría —</option>
              <option value="A">🏆 A — Más de $50M / mes</option>
              <option value="B">🥈 B — $10M a $50M / mes</option>
              <option value="C">🥉 C — Menos de $10M / mes</option>
            </select>
          </div>
        </div>

        {/* Clasificación cliente — section-tipo-cliente */}
        {tipo === 'cliente' && (
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm font-bold uppercase tracking-wider text-accent mb-3">🏷️ Clasificación del Cliente</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Tipo de Cliente *</label>
                <select className="input" value={tipoCliente} onChange={(e) => onTipoClienteChange(e.target.value as TipoCliente)}>
                  <option value="directo">Directo</option>
                  <option value="indirecto">Intermediario</option>
                  <option value="referido">Referido</option>
                </select>
              </div>
              {tipoCliente === 'referido' && (
                <div>
                  <label className="block text-xs text-muted mb-1">Cliente Indirecto que lo refiere</label>
                  <select className="input" value={clienteIndirectoId} onChange={(e) => setClienteInd(e.target.value)}>
                    <option value="">— Seleccionar aliado —</option>
                    {aliadosIndirectos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.empresa} ({r.tipo === 'prospecto' ? 'Prospecto' : 'Cliente'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contactos — antes de servicios (HTML v6) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold uppercase tracking-wider">👤 Contactos de la Empresa</span>
            <button type="button" className="btn-secondary btn-sm text-xs border-accent text-accent" onClick={agregarContacto}>
              + Agregar Contacto
            </button>
          </div>
          <div className="space-y-4">
            {contactos.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface2 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-muted">
                    {i === 0 ? '⭐ Principal' : `Contacto ${i + 1}`}
                  </span>
                  {i > 0 && (
                    <button type="button" className="text-muted hover:text-danger text-lg leading-none" onClick={() => eliminarContacto(i)} title="Eliminar contacto">✕</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Nombre</label>
                    <input className="input" placeholder="Nombre del contacto" value={c.nombre} onChange={(e) => updateContacto(i, 'nombre', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Cargo</label>
                    <input className="input" placeholder="Ej: Gerente Logístico" value={c.cargo ?? ''} onChange={(e) => updateContacto(i, 'cargo', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Teléfono</label>
                    <input className="input" placeholder="+57 300 000 0000" value={c.telefono ?? ''} onChange={(e) => updateContacto(i, 'telefono', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Email</label>
                    <input type="email" className="input" placeholder="correo@empresa.com" value={c.email ?? ''} onChange={(e) => updateContacto(i, 'email', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">🎂 Fecha de Cumpleaños</label>
                    <input type="date" className="input" value={c.cumpleanos ?? ''} onChange={(e) => updateContacto(i, 'cumpleanos', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">🎁 ¿Puede recibir regalos?</label>
                    <select className="input" value={c.recibeRegalosSel} onChange={(e) => updateContacto(i, 'recibeRegalosSel', e.target.value)}>
                      <option value="">— Sin definir —</option>
                      <option value="si">✅ Sí</option>
                      <option value="no">❌ No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">🏷️ Tipo de Contacto</label>
                    <select className="input" value={c.tipoContacto} onChange={(e) => updateContacto(i, 'tipoContacto', e.target.value)}>
                      {TIPOS_CONTACTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Servicios — buildServiceChips */}
        <div>
          <label className="block text-sm font-medium mb-2">Servicios de Interés *</label>
          <div className="flex flex-wrap gap-2">
            {SERVICIOS.map((s) => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  servicios.includes(s)
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'border-border text-muted hover:border-muted'
                }`}
                onClick={() => toggleServicio(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Sección prospecto */}
        {tipo === 'prospecto' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Estado del Prospecto</label>
                <select className="input" value={estadoProspecto} onChange={(e) => setEstadoP(e.target.value)}>
                  {ESTADOS_PROSPECTO.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">¿Se realizó visita?</label>
                <select className="input" value={visita} onChange={(e) => setVisita(e.target.value as typeof visita)}>
                  <option value="no">No</option>
                  <option value="si">Sí — Visita Presencial</option>
                  <option value="virtual">Sí — Visita Virtual</option>
                  <option value="llamada">Sí — Llamada Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Fecha de Visita / Contacto</label>
                <input type="date" className="input" value={fechaVisita} onChange={(e) => setFechaV(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Próximo Seguimiento</label>
                <input type="date" className="input" value={proxSeguimiento} onChange={(e) => setProxSeg(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted mb-1">💵 Ingresos Esperados por Mes</label>
                <input type="number" min={0} className="input" placeholder="Ej: 5000000" value={ingresosEsperados} onChange={(e) => setIngresos(e.target.value)} />
                {ingresosEsperados && (
                  <div className="mt-1 text-xl font-extrabold text-gold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmtMoneyPreview(ingresosEsperados)}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[10px] border border-gold/20 bg-gold/5 p-4">
              <div className="text-sm font-bold uppercase tracking-wider text-gold mb-3">💰 Facturación</div>
              <div>
                <label className="block text-xs text-muted mb-1">¿Se facturó?</label>
                <select className="input max-w-xs" value={facturadoP} onChange={(e) => setFacturadoP(e.target.value as typeof facturadoP)}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
              {facturadoP !== 'no' && servicios.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gold/20">
                  <p className="text-xs text-muted mb-3">Ingresa el valor facturado por cada servicio de interés:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {servicios.map((s) => (
                      <div key={s}>
                        <label className="block text-xs text-muted mb-1">{s}</label>
                        <input type="number" min={0} className="input text-right" placeholder="0" value={billingP[s] ?? ''}
                          onChange={(e) => setBillingP((prev) => ({ ...prev, [s]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <span className="text-xs uppercase text-muted font-semibold">Total Facturado</span>
                    <span className="text-2xl font-extrabold text-gold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ${billingTotal(billingP).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Observaciones del Prospecto</label>
              <textarea className="input min-h-24 resize-none" placeholder="Necesidades específicas, notas de la visita, acuerdos preliminares..."
                value={obsProspecto} onChange={(e) => setObsProspecto(e.target.value)} />
            </div>
          </div>
        )}

        {/* Sección cliente */}
        {tipo === 'cliente' && (
          <div className="space-y-4">
            <div className="text-base font-bold uppercase tracking-wider text-success border-b border-border pb-2">
              📋 Gestión Cliente Activo
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Estado Relación</label>
                <select className="input" value={estadoCliente} onChange={(e) => setEstadoC(e.target.value as typeof estadoCliente)}>
                  <option value="activo">✅ Activo</option>
                  <option value="en-riesgo">⚠️ En Riesgo</option>
                  <option value="inactivo">💤 Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">¿Se realizó visita?</label>
                <select className="input" value={visitaCliente} onChange={(e) => setVisitaC(e.target.value as typeof visitaCliente)}>
                  <option value="no">No</option>
                  <option value="si">Sí — Presencial</option>
                  <option value="virtual">Sí — Virtual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Fecha de Visita / Gestión</label>
                <input type="date" className="input" value={fechaVisitaCliente} onChange={(e) => setFechaVC(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">¿Se cerró un nuevo servicio?</label>
                <select className="input" value={nuevoServicio} onChange={(e) => setNuevoServicio(e.target.value as 'no' | 'si')}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
              {nuevoServicio === 'si' && (
                <div>
                  <label className="block text-xs text-muted mb-1">Servicio Cerrado</label>
                  <select className="input" value={servicioNuevo} onChange={(e) => setServicioNuevo(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-muted mb-1">¿Se facturó?</label>
                <select className="input" value={facturado} onChange={(e) => setFacturado(e.target.value as typeof facturado)}>
                  <option value="no">No</option>
                  <option value="si">Sí — Facturado</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
            </div>

            {facturado !== 'no' && servicios.length > 0 && (
              <div className="rounded-[10px] border border-gold/20 bg-gold/5 p-4">
                <div className="text-sm font-bold uppercase tracking-wider text-gold mb-1">💰 Facturación por Línea de Negocio</div>
                <p className="text-xs text-muted mb-3">Ingresa el valor facturado por cada servicio de interés:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicios.map((s) => (
                    <div key={s}>
                      <label className="block text-xs text-muted mb-1">{s}</label>
                      <input type="number" min={0} className="input text-right" placeholder="0" value={billingC[s] ?? ''}
                        onChange={(e) => setBillingC((prev) => ({ ...prev, [s]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <span className="text-xs uppercase text-muted font-semibold">Total Facturado</span>
                  <span className="text-2xl font-extrabold text-gold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ${billingTotal(billingC).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-muted mb-1">Gestión Realizada / Notas</label>
              <textarea className="input min-h-24 resize-none" placeholder="Descripción de la gestión realizada, acuerdos, compromisos..."
                value={obsCliente} onChange={(e) => setObsCliente(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-5 border-t border-border">
          <button type="button" className="btn-secondary" onClick={clearForm}>Limpiar</button>
          <button type="button" className="btn-primary" disabled={createMut.isPending} onClick={handleSave}>
            {createMut.isPending ? 'Guardando...' : '💾 Guardar Registro'}
          </button>
        </div>
      </div>
    </div>
  )
}
