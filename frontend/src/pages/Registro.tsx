import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import { SERVICIOS } from '../types'
import type { TipoRecord, RecordCreate, ContactoCreate } from '../types'

const ESTADOS_PROSPECTO = [
  'prospecto', 'reconocimiento', 'propuesta',
  'aceptacion_propuesta', 'creacion_sop', 'facturado',
  'frio', 'perdido',
]

const TIPOS_CONTACTO = [
  'principal', 'comercial', 'gestion-documental', 'financiero', 'operativo',
]

const emptyContacto = (): ContactoCreate => ({
  nombre: '', cargo: '', telefono: '', email: '',
  orden: 0, cumpleanos: '', recibeRegalos: false,
})

export default function Registro() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tipo, setTipo] = useState<TipoRecord>('prospecto')
  const [contactos, setContactos] = useState<ContactoCreate[]>([emptyContacto()])

  // Campos comunes
  const [empresa, setEmpresa]           = useState('')
  const [nit, setNit]                   = useState('')
  const [ciudad, setCiudad]             = useState('')
  const [direccion, setDireccion]       = useState('')
  const [comercialId, setComercialId]   = useState('')
  const [fecha, setFecha]               = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria]       = useState<'A' | 'B' | 'C' | ''>('')
  const [servicios, setServicios]       = useState<string[]>([])
  const [observaciones, setObs]         = useState('')

  // Campos prospecto
  const [estadoProspecto, setEstadoP]   = useState('prospecto')
  const [visita, setVisita]             = useState<'no' | 'si' | 'virtual' | 'llamada'>('no')
  const [fechaVisita, setFechaVisita]   = useState('')
  const [proxSeguimiento, setProxSeg]  = useState('')
  const [ingresosEsperados, setIngresos] = useState('')

  // Campos cliente
  const [tipoCliente, setTipoCliente]   = useState<'directo' | 'intermediario' | 'referido'>('directo')
  const [estadoCliente, setEstadoC]     = useState<'activo' | 'en-riesgo' | 'inactivo'>('activo')
  const [visitaCliente, setVisitaC]     = useState<'no' | 'si' | 'virtual'>('no')
  const [facturado, setFacturado]       = useState<'no' | 'si' | 'parcial'>('no')
  const [valor, setValor]               = useState('')

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const createMut = useMutation({
    mutationFn: createRecord,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success(`${tipo === 'prospecto' ? 'Prospecto' : 'Cliente'} creado correctamente`)
      navigate(`/detalle/${data.id}`)
    },
    onError: () => toast.error('Error al crear el registro'),
  })

  function toggleServicio(s: string) {
    setServicios((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function addContacto() {
    setContactos((prev) => [...prev, { ...emptyContacto(), orden: prev.length }])
  }

  function removeContacto(i: number) {
    setContactos((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateContacto(i: number, field: keyof ContactoCreate, value: string | boolean) {
    setContactos((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!empresa.trim()) { toast.error('La empresa es requerida'); return }
    if (!comercialId) { toast.error('Selecciona un comercial'); return }
    if (servicios.length === 0) { toast.error('Selecciona al menos un servicio'); return }
    if (contactos.length === 0 || !contactos[0].nombre.trim()) {
      toast.error('Agrega al menos un contacto'); return
    }

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
      observaciones: observaciones || undefined,
      contactos: contactos.filter((c) => c.nombre.trim()),
      ...(tipo === 'prospecto' ? {
        estadoProspecto: estadoProspecto as RecordCreate['estadoProspecto'],
        visita,
        fechaVisita: fechaVisita || undefined,
        proximoSeguimiento: proxSeguimiento || undefined,
        ingresosEsperados: ingresosEsperados ? parseInt(ingresosEsperados.replace(/\D/g, '')) : undefined,
      } : {
        tipoCliente,
        estadoCliente,
        visitaCliente,
        facturado,
        valor: valor ? parseInt(valor.replace(/\D/g, '')) : undefined,
      }),
    }

    createMut.mutate(payload)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nuevo Registro</h1>
        <p className="text-sm text-muted mt-1">Completa los campos para crear un prospecto o cliente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Toggle tipo */}
        <div className="card p-1 flex gap-1 w-fit">
          {(['prospecto', 'cliente'] as TipoRecord[]).map((t) => (
            <button
              key={t} type="button"
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                tipo === t
                  ? 'bg-accent text-bg shadow-accent'
                  : 'text-muted hover:text-foreground'
              }`}
              onClick={() => setTipo(t)}
            >
              {t === 'prospecto' ? '🎯 Prospecto' : '🏢 Cliente'}
            </button>
          ))}
        </div>

        {/* Datos generales */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-widest">Datos generales</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Empresa *</label>
              <input className="input" placeholder="Nombre de la empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">NIT</label>
              <input className="input" placeholder="900.000.000-0" value={nit} onChange={(e) => setNit(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Ciudad</label>
              <input className="input" placeholder="Bogotá, Medellín..." value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Dirección</label>
              <input className="input" placeholder="Cra 1 # 2-3" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Comercial responsable *</label>
              <select className="input" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Fecha</label>
              <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Categoría</label>
              <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value as '' | 'A' | 'B' | 'C')}>
                <option value="">Sin categoría</option>
                <option value="A">A — Mayor a $50M/mes</option>
                <option value="B">B — Entre $10M y $50M/mes</option>
                <option value="C">C — Menor a $10M/mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-widest">
            Servicios logísticos *
          </h2>
          <div className="flex flex-wrap gap-2">
            {SERVICIOS.map((s) => (
              <button
                key={s} type="button"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  servicios.includes(s)
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'border-border text-muted hover:border-muted hover:text-foreground'
                }`}
                onClick={() => toggleServicio(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Campos específicos por tipo */}
        {tipo === 'prospecto' ? (
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-widest">Datos del prospecto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Estado pipeline</label>
                <select className="input" value={estadoProspecto} onChange={(e) => setEstadoP(e.target.value)}>
                  {ESTADOS_PROSPECTO.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Visita</label>
                <select className="input" value={visita} onChange={(e) => setVisita(e.target.value as typeof visita)}>
                  <option value="no">No</option>
                  <option value="si">Sí (presencial)</option>
                  <option value="virtual">Virtual</option>
                  <option value="llamada">Llamada</option>
                </select>
              </div>
              {visita !== 'no' && (
                <div>
                  <label className="block text-xs text-muted mb-1">Fecha de visita</label>
                  <input type="date" className="input" value={fechaVisita} onChange={(e) => setFechaVisita(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-xs text-muted mb-1">Próximo seguimiento</label>
                <input type="date" className="input" value={proxSeguimiento} onChange={(e) => setProxSeg(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Ingresos esperados/mes</label>
                <input className="input" placeholder="$5.000.000" value={ingresosEsperados}
                  onChange={(e) => setIngresos(e.target.value)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-widest">Datos del cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Tipo de cliente</label>
                <select className="input" value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value as typeof tipoCliente)}>
                  <option value="directo">Directo</option>
                  <option value="intermediario">Intermediario</option>
                  <option value="referido">Referido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Estado</label>
                <select className="input" value={estadoCliente} onChange={(e) => setEstadoC(e.target.value as typeof estadoCliente)}>
                  <option value="activo">Activo</option>
                  <option value="en-riesgo">En riesgo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Visita</label>
                <select className="input" value={visitaCliente} onChange={(e) => setVisitaC(e.target.value as typeof visitaCliente)}>
                  <option value="no">No</option>
                  <option value="si">Sí (presencial)</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Facturado</label>
                <select className="input" value={facturado} onChange={(e) => setFacturado(e.target.value as typeof facturado)}>
                  <option value="no">No</option>
                  <option value="si">Sí</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Valor facturado/mes</label>
                <input className="input" placeholder="$10.000.000" value={valor}
                  onChange={(e) => setValor(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Contactos */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-widest">Contactos *</h2>
            <button type="button" className="btn-secondary btn-sm" onClick={addContacto}>
              + Contacto
            </button>
          </div>

          {contactos.map((c, i) => (
            <div key={i} className="bg-surface2 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Contacto {i + 1}
                </span>
                {contactos.length > 1 && (
                  <button type="button" className="text-danger text-xs hover:underline"
                    onClick={() => removeContacto(i)}>
                    Quitar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Nombre *</label>
                  <input className="input" placeholder="Nombre completo" value={c.nombre}
                    onChange={(e) => updateContacto(i, 'nombre', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Cargo</label>
                  <input className="input" placeholder="Gerente, Jefe de logística..." value={c.cargo ?? ''}
                    onChange={(e) => updateContacto(i, 'cargo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Teléfono</label>
                  <input className="input" placeholder="300 000 0000" value={c.telefono ?? ''}
                    onChange={(e) => updateContacto(i, 'telefono', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Email</label>
                  <input type="email" className="input" placeholder="correo@empresa.com" value={c.email ?? ''}
                    onChange={(e) => updateContacto(i, 'email', e.target.value)} />
                </div>
                {tipo === 'cliente' && (
                  <>
                    <div>
                      <label className="block text-xs text-muted mb-1">Cumpleaños</label>
                      <input type="date" className="input" value={c.cumpleanos ?? ''}
                        onChange={(e) => updateContacto(i, 'cumpleanos', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input type="checkbox" id={`regalo-${i}`} checked={c.recibeRegalos ?? false}
                        onChange={(e) => updateContacto(i, 'recibeRegalos', e.target.checked)}
                        className="w-4 h-4 accent-accent" />
                      <label htmlFor={`regalo-${i}`} className="text-sm text-muted cursor-pointer">
                        Recibe regalo de cumpleaños
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Observaciones */}
        <div className="card p-5">
          <label className="block text-xs text-muted mb-2">Observaciones</label>
          <textarea className="input min-h-24 resize-none" placeholder="Notas adicionales..."
            value={observaciones} onChange={(e) => setObs(e.target.value)} />
        </div>

        {/* Acciones */}
        <div className="flex gap-3 justify-end pb-6">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={createMut.isPending}>
            {createMut.isPending ? 'Guardando...' : `Crear ${tipo}`}
          </button>
        </div>

      </form>
    </div>
  )
}
