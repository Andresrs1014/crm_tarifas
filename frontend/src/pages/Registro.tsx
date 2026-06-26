import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRecord, getRecords } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import { SERVICIOS } from '../types'
import type { TipoRecord, RecordCreate, ContactoCreate, TipoCliente } from '../types'
import { PROSPECTO_FORM_OPTIONS, TIPO_CONTACTO_OPTIONS } from '../lib/htmlV6/domainConfig'

const ESTADOS_PROSPECTO = PROSPECTO_FORM_OPTIONS

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
    <div>
      <div className="section-title">
        ➕ Nuevo <span className="text-accent">Registro</span>
      </div>

      <div className="form-card">
        {/* Tipo — setTipo */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Tipo de Registro</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${
                tipo === 'prospecto'
                  ? 'active-prospecto'
                  : ''
              }`}
              onClick={() => setTipo('prospecto')}
            >
              🎯 Prospecto
            </button>
            <button
              type="button"
              className={`type-btn ${
                tipo === 'cliente'
                  ? 'active-cliente'
                  : ''
              }`}
              onClick={() => setTipo('cliente')}
            >
              🏢 Cliente
            </button>
          </div>
        </div>

        {/* Datos básicos */}
        <div className="form-grid">
          <div className="form-group"><label>Nombre de la Empresa *</label>
            <input placeholder="Ej: Comercial XYZ S.A.S." value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </div>
          <div className="form-group"><label>NIT / Identificación</label>
            <input placeholder="Ej: 900.123.456-7" value={nit} onChange={(e) => setNit(e.target.value)} />
          </div>
          <div className="form-group"><label>Ciudad</label>
            <input placeholder="Ej: Bogotá" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          </div>
          <div className="form-group full">
            <label>Dirección de la Empresa</label>
            <input placeholder="Ej: Cra. 15 #93-75, Bogotá" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="form-group"><label>Comercial Responsable *</label>
            <select value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha de Registro</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="form-group"><label>Categoría del Registro</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as '' | 'A' | 'B' | 'C')}>
              <option value="">— Sin categoría —</option>
              <option value="A">🏆 A — Más de $50M / mes</option>
              <option value="B">🥈 B — $10M a $50M / mes</option>
              <option value="C">🥉 C — Menos de $10M / mes</option>
            </select>
          </div>
        </div>

        {/* Clasificación cliente — section-tipo-cliente */}
        {tipo === 'cliente' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--accent)", marginBottom: 12 }}>🏷️ Clasificación del Cliente</div>
            <div className="form-grid">
              <div className="form-group"><label>Tipo de Cliente *</label>
                <select value={tipoCliente} onChange={(e) => onTipoClienteChange(e.target.value as TipoCliente)}>
                  <option value="directo">Directo</option>
                  <option value="indirecto">Intermediario</option>
                  <option value="referido">Referido</option>
                </select>
              </div>
              {tipoCliente === 'referido' && (
                <div className="form-group"><label>Cliente Indirecto que lo refiere</label>
                  <select value={clienteIndirectoId} onChange={(e) => setClienteInd(e.target.value)}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text)" }}>👤 Contactos de la Empresa</span>
            <button type="button" className="btn-secondary btn-sm text-xs border-accent text-accent" onClick={agregarContacto}>
              + Agregar Contacto
            </button>
          </div>
          <div>
            {contactos.map((c, i) => (
              <div key={i} className="contact-card">
                <div className="contact-card-header">
                  <span className="contact-card-label">
                    {i === 0 ? <span className="contact-principal-badge">Principal</span> : `Contacto ${i + 1}`}
                  </span>
                  {i > 0 && (
                    <button type="button" className="text-muted hover:text-danger text-lg leading-none" onClick={() => eliminarContacto(i)} title="Eliminar contacto">✕</button>
                  )}
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>Nombre</label>
                    <input placeholder="Nombre del contacto" value={c.nombre} onChange={(e) => updateContacto(i, 'nombre', e.target.value)} />
                  </div>
                  <div className="form-group"><label>Cargo</label>
                    <input placeholder="Ej: Gerente Logístico" value={c.cargo ?? ''} onChange={(e) => updateContacto(i, 'cargo', e.target.value)} />
                  </div>
                  <div className="form-group"><label>Teléfono</label>
                    <input placeholder="+57 300 000 0000" value={c.telefono ?? ''} onChange={(e) => updateContacto(i, 'telefono', e.target.value)} />
                  </div>
                  <div className="form-group"><label>Email</label>
                    <input type="email" placeholder="correo@empresa.com" value={c.email ?? ''} onChange={(e) => updateContacto(i, 'email', e.target.value)} />
                  </div>
                  <div className="form-group"><label>🎂 Fecha de Cumpleaños</label>
                    <input type="date" value={c.cumpleanos ?? ''} onChange={(e) => updateContacto(i, 'cumpleanos', e.target.value)} />
                  </div>
                  <div className="form-group"><label>🎁 ¿Puede recibir regalos?</label>
                    <select value={c.recibeRegalosSel} onChange={(e) => updateContacto(i, 'recibeRegalosSel', e.target.value)}>
                      <option value="">— Sin definir —</option>
                      <option value="si">✅ Sí</option>
                      <option value="no">❌ No</option>
                    </select>
                  </div>
                  <div className="form-group"><label>🏷️ Tipo de Contacto</label>
                    <select value={c.tipoContacto} onChange={(e) => updateContacto(i, 'tipoContacto', e.target.value)}>
                      {TIPO_CONTACTO_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Servicios — buildServiceChips */}
        <div className="form-group"><label>Servicios de Interés *</label>
          <div className="services-grid">
            {SERVICIOS.map((s) => (
              <button
                key={s}
                type="button"
                className={`service-chip ${
                  servicios.includes(s)
                    ? 'selected'
                    : ''
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
          <div>
            <div className="form-grid">
              <div className="form-group"><label>Estado del Prospecto</label>
                <select value={estadoProspecto} onChange={(e) => setEstadoP(e.target.value)}>
                  {ESTADOS_PROSPECTO.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div className="form-group"><label>¿Se realizó visita?</label>
                <select value={visita} onChange={(e) => setVisita(e.target.value as typeof visita)}>
                  <option value="no">No</option>
                  <option value="si">Sí — Visita Presencial</option>
                  <option value="virtual">Sí — Visita Virtual</option>
                  <option value="llamada">Sí — Llamada Comercial</option>
                </select>
              </div>
              <div className="form-group"><label>Fecha de Visita / Contacto</label>
                <input type="date" value={fechaVisita} onChange={(e) => setFechaV(e.target.value)} />
              </div>
              <div className="form-group"><label>Próximo Seguimiento</label>
                <input type="date" value={proxSeguimiento} onChange={(e) => setProxSeg(e.target.value)} />
              </div>
              <div className="form-group full">
                <label>💵 Ingresos Esperados por Mes</label>
                <input type="number" min={0} placeholder="Ej: 5000000" value={ingresosEsperados} onChange={(e) => setIngresos(e.target.value)} />
                {ingresosEsperados && (
                  <div className="mt-1 text-xl font-extrabold text-gold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmtMoneyPreview(ingresosEsperados)}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[10px] border border-gold/20 bg-gold/5 p-4">
              <div className="text-sm font-bold uppercase tracking-wider text-gold mb-3">💰 Facturación</div>
              <div className="form-group"><label>¿Se facturó?</label>
                <select style={{ maxWidth: 320 }} value={facturadoP} onChange={(e) => setFacturadoP(e.target.value as typeof facturadoP)}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
              {facturadoP !== 'no' && servicios.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gold/20">
                  <p className="text-xs text-muted mb-3">Ingresa el valor facturado por cada servicio de interés:</p>
                  <div className="form-grid">
                    {servicios.map((s) => (
                      <div key={s}>
                        <label>{s}</label>
                        <input type="number" min={0} style={{ textAlign: 'right' }} placeholder="0" value={billingP[s] ?? ''}
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

            <div className="form-group"><label>Observaciones del Prospecto</label>
              <textarea placeholder="Necesidades específicas, notas de la visita, acuerdos preliminares..."
                value={obsProspecto} onChange={(e) => setObsProspecto(e.target.value)} />
            </div>
          </div>
        )}

        {/* Sección cliente */}
        {tipo === 'cliente' && (
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--green)", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              📋 Gestión Cliente Activo
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Estado Relación</label>
                <select value={estadoCliente} onChange={(e) => setEstadoC(e.target.value as typeof estadoCliente)}>
                  <option value="activo">✅ Activo</option>
                  <option value="en-riesgo">⚠️ En Riesgo</option>
                  <option value="inactivo">💤 Inactivo</option>
                </select>
              </div>
              <div className="form-group"><label>¿Se realizó visita?</label>
                <select value={visitaCliente} onChange={(e) => setVisitaC(e.target.value as typeof visitaCliente)}>
                  <option value="no">No</option>
                  <option value="si">Sí — Presencial</option>
                  <option value="virtual">Sí — Virtual</option>
                </select>
              </div>
              <div className="form-group"><label>Fecha de Visita / Gestión</label>
                <input type="date" value={fechaVisitaCliente} onChange={(e) => setFechaVC(e.target.value)} />
              </div>
              <div className="form-group"><label>¿Se cerró un nuevo servicio?</label>
                <select value={nuevoServicio} onChange={(e) => setNuevoServicio(e.target.value as 'no' | 'si')}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                </select>
              </div>
              {nuevoServicio === 'si' && (
                <div className="form-group"><label>Servicio Cerrado</label>
                  <select value={servicioNuevo} onChange={(e) => setServicioNuevo(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label>¿Se facturó?</label>
                <select value={facturado} onChange={(e) => setFacturado(e.target.value as typeof facturado)}>
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
                <div className="form-grid">
                  {servicios.map((s) => (
                    <div key={s}>
                      <label>{s}</label>
                      <input type="number" min={0} style={{ textAlign: 'right' }} placeholder="0" value={billingC[s] ?? ''}
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

            <div className="form-group"><label>Gestión Realizada / Notas</label>
              <textarea placeholder="Descripción de la gestión realizada, acuerdos, compromisos..."
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
