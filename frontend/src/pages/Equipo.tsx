import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, X, Check, Trophy } from 'lucide-react'
import { getComercialesApi, createComercialApi, updateComercialApi, deleteComercialApi } from '../api/comerciales'
import { getRankingApi } from '../api/dashboard'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import type { Comercial, RankingEntry } from '../types'

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function RankingCard({ entry, position }: { entry: RankingEntry; position: number }) {
  const medal = MEDAL_COLORS[position] ?? null
  const isTop3 = position < 3

  return (
    <div
      className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 transition hover:border-opacity-60"
      style={isTop3 ? { borderColor: medal + '55' } : {}}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: isTop3 ? medal + '22' : '#1e3050',
            color: isTop3 ? medal! : '#8899b4',
          }}
        >
          {isTop3 ? <Trophy size={14} /> : position + 1}
        </div>
        <div className="min-w-0">
          <p className="font-condensed font-bold text-sm truncate" style={{ color: '#e8edf5' }}>
            {entry.nombre}
          </p>
          {isTop3 && (
            <p className="text-xs font-medium" style={{ color: medal! }}>
              {position === 0 ? '1° Lugar' : position === 1 ? '2° Lugar' : '3° Lugar'}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Prospectos" value={entry.prospectos} color="#00c2ff" />
        <Stat label="Clientes" value={entry.clientes} color="#00e676" />
        <Stat label="Visitas" value={entry.visitas} color="#a855f7" />
        <Stat label="Facturado" value={fmtCurrency(entry.valor_facturado)} color="#f5a623" />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-surface2 rounded-lg px-3 py-2">
      <p className="text-xs text-muted font-condensed uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  cargo: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  tel: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Equipo() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Comercial | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const toast = useToastStore()
  const qc = useQueryClient()

  const { data: comerciales = [], isLoading } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const { data: ranking = [] } = useQuery({
    queryKey: ['ranking'],
    queryFn: getRankingApi,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: createComercialApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.add('Comercial creado')
      reset()
      setShowForm(false)
    },
    onError: () => toast.add('Error al crear', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) => updateComercialApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.add('Comercial actualizado')
      setEditing(null)
      reset()
    },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComercialApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.add('Comercial eliminado')
      setDeleteId(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { status?: number } })?.response?.status === 409
        ? 'No se puede eliminar: tiene registros asociados'
        : 'Error al eliminar'
      toast.add(msg, 'error')
      setDeleteId(null)
    },
  })

  const onSubmit = (data: FormValues) => {
    const payload = {
      nombre: data.nombre,
      cargo: data.cargo || undefined,
      email: data.email || undefined,
      tel: data.tel || undefined,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const startEdit = (c: Comercial) => {
    setEditing(c)
    setShowForm(false)
    reset({ nombre: c.nombre, cargo: c.cargo ?? '', email: c.email ?? '', tel: c.tel ?? '' })
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
    reset()
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Equipo Comercial
        </h1>
        {!showForm && !editing && (
          <button
            onClick={() => { setShowForm(true); reset() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            <Plus size={16} /> Nuevo comercial
          </button>
        )}
      </div>

      {/* Form */}
      {(showForm || editing) && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-5">
          <h2 className="font-condensed font-bold text-base mb-4" style={{ color: '#e8edf5' }}>
            {editing ? 'Editar comercial' : 'Nuevo comercial'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">
                Nombre *
              </label>
              <input {...register('nombre')} placeholder="Nombre completo" />
              {errors.nombre && <p className="text-danger text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">
                Cargo
              </label>
              <input {...register('cargo')} placeholder="Cargo" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">
                Teléfono
              </label>
              <input {...register('tel')} placeholder="Teléfono" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">
                Email
              </label>
              <input {...register('email')} type="email" placeholder="email@empresa.com" />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted hover:text-white transition"
              >
                <X size={14} /> Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ background: '#00c2ff', color: '#0a0e1a' }}
              >
                <Check size={14} /> {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Nombre', 'Cargo', 'Email', 'Teléfono', 'Estado', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-condensed uppercase text-muted tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted">Cargando...</td>
              </tr>
            )}
            {!isLoading && comerciales.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted">Sin comerciales</td>
              </tr>
            )}
            {comerciales.map((c) => (
              <tr key={c.id} className="border-b border-border hover:bg-surface2 transition">
                <td className="px-4 py-3 font-medium" style={{ color: '#e8edf5' }}>{c.nombre}</td>
                <td className="px-4 py-3 text-muted">{c.cargo ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{c.tel ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: c.activo ? '#00e67622' : '#8899b422',
                      color: c.activo ? '#00e676' : '#8899b4',
                    }}
                  >
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-muted hover:text-accent transition"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="text-muted hover:text-danger transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteId}
        message="¿Eliminar este comercial? Solo es posible si no tiene registros asociados."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />

      {/* Ranking de Gestión */}
      {ranking.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} style={{ color: '#FFD700' }} />
            <h2 className="font-condensed font-bold text-lg" style={{ color: '#e8edf5' }}>
              Ranking de Gestión
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranking.map((entry, i) => (
              <RankingCard key={entry.comercial_id} entry={entry} position={i} />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
