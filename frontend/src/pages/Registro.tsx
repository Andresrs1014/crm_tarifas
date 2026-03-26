import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { getBibliotecaApi } from '../api/biblioteca'
import ServiceChip from '../components/ServiceChip'
import ContactosList from '../components/ContactosList'
import BillingLines from '../components/BillingLines'
import PageContainer from '../components/PageContainer'
import { useToastStore } from '../store/toastStore'
import { SERVICIOS } from '../types'
import type { ContactoCreate } from '../types'
import { today } from '../utils/format'

const schema = z.object({
  tipo: z.enum(['prospecto', 'cliente']),
  empresa: z.string().min(1, 'Requerido'),
  nit: z.string().optional(),
  ciudad: z.string().optional(),
  comercial_id: z.string().optional(),
  tipo_cliente: z.enum(['directo', 'indirecto', 'referido']).default('directo'),
  comision: z.string().optional(),
  observaciones: z.string().optional(),
  fecha: z.string(),
  // prospecto fields
  estado_prospecto: z.enum(['seguimiento', 'cerrado', 'perdido', 'frio']).optional(),
  visita: z.enum(['no', 'si', 'virtual', 'llamada']).optional(),
  facturado_p: z.enum(['no', 'si', 'parcial']).optional(),
  proximo_seguimiento: z.string().optional(),
  // cliente fields
  estado_cliente: z.enum(['activo', 'en-riesgo', 'inactivo']).optional(),
  visita_cliente: z.enum(['no', 'si', 'virtual', 'llamada']).optional(),
  nuevo_servicio: z.enum(['si', 'no']).optional(),
  servicio_nuevo: z.string().optional(),
  facturado: z.enum(['no', 'si', 'parcial']).optional(),
})
type FormValues = z.infer<typeof schema>

export default function Registro() {
  const navigate = useNavigate()
  const toast = useToastStore()
  const [servicios, setServicios] = useState<string[]>([])
  const [contactos, setContactos] = useState<ContactoCreate[]>([])
  const [facturacionLineas, setFacturacionLineas] = useState<Record<string, number>>({})

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const { data: biblioteca = [] } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBibliotecaApi,
    staleTime: 1000 * 60 * 5,
  })

  // Líneas desde backend; mientras carga usa el array estático para no mostrar vacío
  const lineasDisponibles = biblioteca.length > 0
    ? biblioteca.map((l) => l.nombre)
    : [...SERVICIOS]

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'prospecto',
      tipo_cliente: 'directo',
      fecha: today(),
    },
  })

  const tipo = watch('tipo')
  const tipoCliente = watch('tipo_cliente')

  const mutation = useMutation({
    mutationFn: createRecord,
    onSuccess: (data) => {
      toast.add('Registro creado exitosamente')
      const path = data.tipo === 'prospecto' ? `/prospectos/${data.id}` : `/clientes/${data.id}`
      navigate(path)
    },
    onError: () => toast.add('Error al crear el registro', 'error'),
  })

  const onSubmit = (values: FormValues) => {
    const payload: Record<string, unknown> = {
      ...values,
      servicios,
      contactos,
      ...(servicios.length > 0 ? { facturacion_lineas: facturacionLineas } : {}),
    }
    // Clean empty strings
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === undefined) delete payload[k]
    })
    mutation.mutate(payload)
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
            Nuevo Registro
          </h1>
          <p className="text-muted text-sm mt-1">Prospecto o cliente nuevo</p>
        </div>

        {/* Tipo de registro en el header */}
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div className="flex gap-2">
              {(['prospecto', 'cliente'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => field.onChange(t)}
                  className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition"
                  style={{
                    background: field.value === t ? '#00c2ff' : 'transparent',
                    color: field.value === t ? '#0a0e1a' : '#8899b4',
                    border: `1px solid ${field.value === t ? '#00c2ff' : '#1e3050'}`,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Fila 1: Datos generales + Estado */}
        <div className="grid grid-cols-3 gap-5">

          {/* Datos generales — 2 cols */}
          <div className="col-span-2 bg-surface border border-border rounded-xl p-5">
            <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Datos generales</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Empresa *</label>
                <input {...register('empresa')} placeholder="Nombre de la empresa" />
                {errors.empresa && <p className="text-danger text-xs mt-1">{errors.empresa.message}</p>}
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">NIT</label>
                <input {...register('nit')} placeholder="900.123.456-7" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Ciudad</label>
                <input {...register('ciudad')} placeholder="Ciudad" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Fecha</label>
                <input type="date" {...register('fecha')} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Comercial</label>
                <select {...register('comercial_id')}>
                  <option value="">Sin asignar</option>
                  {comerciales.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Tipo cliente</label>
                <select {...register('tipo_cliente')}>
                  <option value="directo">Directo</option>
                  <option value="indirecto">Indirecto</option>
                  <option value="referido">Referido</option>
                </select>
              </div>
              {tipoCliente !== 'directo' && (
                <div>
                  <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Comisión</label>
                  <input {...register('comision')} placeholder="%" />
                </div>
              )}
              <div className="col-span-3">
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Observaciones</label>
                <textarea
                  {...register('observaciones')}
                  placeholder="Notas adicionales..."
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Estado prospecto/cliente — 1 col */}
          <div className="bg-surface border border-border rounded-xl p-5">
            {tipo === 'prospecto' ? (
              <>
                <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Estado prospecto</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Estado</label>
                    <select {...register('estado_prospecto')}>
                      <option value="">—</option>
                      <option value="seguimiento">Seguimiento</option>
                      <option value="cerrado">Cerrado</option>
                      <option value="perdido">Perdido</option>
                      <option value="frio">Frío</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Visita</label>
                    <select {...register('visita')}>
                      <option value="">—</option>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                      <option value="virtual">Virtual</option>
                      <option value="llamada">Llamada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Facturado</label>
                    <select {...register('facturado_p')}>
                      <option value="">—</option>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                      <option value="parcial">Parcial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Próx. seguimiento</label>
                    <input type="date" {...register('proximo_seguimiento')} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Estado cliente</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Estado</label>
                    <select {...register('estado_cliente')}>
                      <option value="">—</option>
                      <option value="activo">Activo</option>
                      <option value="en-riesgo">En riesgo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Visita</label>
                    <select {...register('visita_cliente')}>
                      <option value="">—</option>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                      <option value="virtual">Virtual</option>
                      <option value="llamada">Llamada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">¿Nuevo servicio?</label>
                    <select {...register('nuevo_servicio')}>
                      <option value="">—</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Servicio nuevo</label>
                    <input {...register('servicio_nuevo')} placeholder="Nombre del servicio" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Facturado</label>
                    <select {...register('facturado')}>
                      <option value="">—</option>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                      <option value="parcial">Parcial</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fila 2: Servicios + Contactos */}
        <div className="grid grid-cols-2 gap-5">

          {/* Servicios de interés */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Servicios de interés</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {lineasDisponibles.map((s) => (
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
              <>
                <p className="text-xs text-muted mb-3 uppercase tracking-wider font-condensed">Facturación por línea</p>
                <BillingLines
                  servicios={servicios}
                  value={facturacionLineas}
                  onChange={setFacturacionLineas}
                />
              </>
            )}
          </div>

          {/* Contactos */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Contactos</h2>
            <ContactosList value={contactos} onChange={setContactos} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg text-sm text-muted hover:text-white transition border border-border"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            {mutation.isPending ? 'Guardando...' : 'Crear registro'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
