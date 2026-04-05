import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Cake, Gift, Download, X, Camera, Trash2, Check,
  ChevronDown, Building2, Phone, Mail, MapPin, User,
} from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { getSACContactos, updateFotos } from '../api/sac'
import { useToastStore } from '../store/toastStore'
import type { SACContacto } from '../types'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatCumple(cumple: string | null): string {
  if (!cumple) return '—'
  try {
    const [, mes, dia] = cumple.split('-')
    return `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]}`
  } catch {
    return cumple
  }
}

function exportXLSX(rows: SACContacto[], titulo: string) {
  import('xlsx').then((XLSX) => {
    const data = rows.map((c) => ({
      Nombre: c.nombre,
      Empresa: c.empresa,
      Cargo: c.cargo ?? '',
      Teléfono: c.telefono ?? '',
      Email: c.email ?? '',
      'Fecha Cumpleaños': c.cumpleanos ?? '',
      '¿Recibe Regalos?': c.recibe_regalos ?? '',
      '# Fotos Entrega': c.fotos_entrega.length,
      '# Fotos FDA': c.fotos_fda.length,
      'FDA Entregado': c.fda_entregado ? 'Sí' : 'No',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 16 },
      { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, titulo)
    XLSX.writeFile(wb, `SAC_${titulo.replace(/\s/g, '_')}.xlsx`)
  })
}

interface ContactoModalProps {
  contacto: SACContacto
  mode: 'cumple' | 'fda'
  onClose: () => void
}

function ContactoModal({ contacto, mode, onClose }: ContactoModalProps) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const fotos = mode === 'cumple' ? contacto.fotos_entrega : contacto.fotos_fda
  const [localFotos, setLocalFotos] = useState<string[]>(fotos)

  const mutation = useMutation({
    mutationFn: (payload: { fotos_entrega?: string[]; fotos_fda?: string[]; fda_entregado?: boolean }) =>
      updateFotos(contacto.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sac-contactos'] })
      toast.add('Guardado correctamente')
      onClose()
    },
    onError: () => toast.add('Error al guardar', 'error'),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string
        setLocalFotos((prev) => [...prev, b64])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setLocalFotos((prev) => prev.filter((_, i) => i !== idx))
  }

  function save() {
    const payload = mode === 'cumple'
      ? { fotos_entrega: localFotos }
      : { fotos_fda: localFotos }
    mutation.mutate(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-border overflow-hidden"
        style={{ background: '#111827', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-semibold text-white">{contacto.nombre}</p>
            <p className="text-xs text-muted mt-0.5">{contacto.empresa}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-3 border-b border-border grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted mb-0.5">
              {mode === 'cumple' ? 'Cumpleaños' : 'Fin de Año'}
            </p>
            <p className="text-sm font-semibold" style={{ color: mode === 'cumple' ? '#f59e0b' : '#00c2ff' }}>
              {mode === 'cumple' ? formatCumple(contacto.cumpleanos) : 'Control FDA'}
            </p>
          </div>
          {contacto.cargo && (
            <div>
              <p className="text-xs text-muted mb-0.5">Cargo</p>
              <p className="text-sm text-white">{contacto.cargo}</p>
            </div>
          )}
          {contacto.telefono && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Phone size={13} /> {contacto.telefono}
            </div>
          )}
          {contacto.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Mail size={13} /> {contacto.email}
            </div>
          )}
          {contacto.direccion && (
            <div className="col-span-2 flex items-center gap-1.5 text-sm text-muted">
              <MapPin size={13} /> {contacto.direccion}
            </div>
          )}
        </div>

        {/* Fotos */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">
              {mode === 'cumple' ? 'Fotos de Entrega' : 'Fotos FDA'}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition"
              style={{ background: '#1a2235', color: '#00c2ff', border: '1px solid #1e3a5f' }}
            >
              <Camera size={13} /> Agregar foto
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </div>

          {localFotos.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              No hay fotos registradas
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {localFotos.map((src, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden aspect-square group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    style={{ background: 'rgba(239,68,68,0.85)' }}
                  >
                    <Trash2 size={11} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-white transition">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            <Check size={14} />
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border p-4" style={{ background: '#111827' }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <p className="text-xs text-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

export default function SAC() {
  const [mes, setMes] = useState(new Date().getMonth() + 1)  // 1-12
  const [activeTab, setActiveTab] = useState<'cumple' | 'fda'>('cumple')
  const [modal, setModal] = useState<{ contacto: SACContacto; mode: 'cumple' | 'fda' } | null>(null)
  const toast = useToastStore()
  const qc = useQueryClient()

  // Todos los contactos (sin filtro de mes para stats)
  const { data: allContactos = [] } = useQuery({
    queryKey: ['sac-contactos', 'all'],
    queryFn: () => getSACContactos(),
  })

  // Contactos filtrados por mes (para tab Cumpleaños)
  const { data: contactosMes = [], isLoading } = useQuery({
    queryKey: ['sac-contactos', mes],
    queryFn: () => getSACContactos({ mes }),
  })

  // Contactos que reciben regalos (para tab FDA)
  const contactosRegalos = allContactos.filter(
    (c) => c.recibe_regalos === 'si' || c.recibe_regalos === 'tal_vez'
  )

  // Stats
  const totalCumple = allContactos.filter((c) => c.cumpleanos).length
  const delMes = contactosMes.length
  const conFotos = allContactos.filter((c) => c.fotos_entrega.length > 0).length
  const fdaEntregados = allContactos.filter((c) => c.fda_entregado).length

  const fdaMutation = useMutation({
    mutationFn: ({ id, entregado }: { id: string; entregado: boolean }) =>
      updateFotos(id, { fda_entregado: entregado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sac-contactos'] })
      toast.add('Actualizado')
    },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const displayRows = activeTab === 'cumple' ? contactosMes : contactosRegalos

  function handleExport() {
    if (activeTab === 'cumple') {
      exportXLSX(contactosMes, `Cumpleaños_${MESES[mes - 1]}`)
    } else {
      exportXLSX(contactosRegalos, 'Fin_de_Año')
    }
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
            SAC — Servicio al Cliente
          </h1>
          <p className="text-sm text-muted mt-0.5">Cumpleaños, detalles y regalos de fin de año</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: '#1a2235', color: '#00c2ff', border: '1px solid #1e3a5f' }}
        >
          <Download size={15} /> Exportar Excel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Cake size={16} />} label="Cumpleaños registrados" value={totalCumple} color="#f59e0b" />
        <StatCard icon={<Cake size={16} />} label={`En ${MESES[mes - 1]}`} value={delMes} color="#f59e0b" />
        <StatCard icon={<Gift size={16} />} label="Reciben regalos" value={contactosRegalos.length} color="#a855f7" />
        <StatCard icon={<Check size={16} />} label="FDA Entregados" value={fdaEntregados} color="#00e676" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-lg" style={{ background: '#111827', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('cumple')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition"
          style={activeTab === 'cumple'
            ? { background: '#1a2235', color: '#f59e0b' }
            : { color: '#8899b4' }}
        >
          <Cake size={15} /> Cumpleaños del mes
        </button>
        <button
          onClick={() => setActiveTab('fda')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition"
          style={activeTab === 'fda'
            ? { background: '#1a2235', color: '#00c2ff' }
            : { color: '#8899b4' }}
        >
          <Gift size={15} /> Detalles Fin de Año
        </button>
      </div>

      {/* Filtro mes (solo en tab cumple) */}
      {activeTab === 'cumple' && (
        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm text-muted">Mes:</label>
          <div className="relative">
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="appearance-none pr-8 pl-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1a2235', color: '#e8edf5', border: '1px solid #1e3a5f' }}
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <span className="text-xs text-muted">{delMes} contacto{delMes !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-16 text-muted">Cargando...</div>
      ) : displayRows.length === 0 ? (
        <div
          className="rounded-xl border border-border text-center py-16"
          style={{ background: '#111827' }}
        >
          <p className="text-muted text-sm">
            {activeTab === 'cumple'
              ? `No hay cumpleaños registrados en ${MESES[mes - 1]}.`
              : 'No hay contactos con regalos configurados.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayRows.map((c) => (
            <ContactoCard
              key={c.id}
              contacto={c}
              mode={activeTab}
              onDetail={() => setModal({ contacto: c, mode: activeTab })}
              onToggleFDA={(entregado) => fdaMutation.mutate({ id: c.id, entregado })}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ContactoModal
          contacto={modal.contacto}
          mode={modal.mode}
          onClose={() => setModal(null)}
        />
      )}
    </PageContainer>
  )
}

interface ContactoCardProps {
  contacto: SACContacto
  mode: 'cumple' | 'fda'
  onDetail: () => void
  onToggleFDA: (v: boolean) => void
}

function ContactoCard({ contacto, mode, onDetail, onToggleFDA }: ContactoCardProps) {
  const fotos = mode === 'cumple' ? contacto.fotos_entrega : contacto.fotos_fda
  const accentColor = mode === 'cumple' ? '#f59e0b' : '#a855f7'

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border transition hover:border-accent/30"
      style={{ background: '#111827' }}
    >
      {/* Día destacado (cumple) */}
      {mode === 'cumple' && contacto.cumpleanos && (
        <div
          className="shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center"
          style={{ background: '#1a2235', borderLeft: `3px solid ${accentColor}` }}
        >
          <span className="text-lg font-bold leading-none" style={{ color: accentColor }}>
            {contacto.cumpleanos.split('-')[2]}
          </span>
          <span className="text-xs text-muted mt-0.5">
            {MESES[parseInt(contacto.cumpleanos.split('-')[1]) - 1].substring(0, 3)}
          </span>
        </div>
      )}

      {/* FDA badge */}
      {mode === 'fda' && (
        <div
          className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: '#1a2235', borderLeft: `3px solid ${accentColor}` }}
        >
          <Gift size={20} style={{ color: accentColor }} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-white truncate">{contacto.nombre}</p>
          {contacto.recibe_regalos === 'si' && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2235', color: '#a855f7' }}>
              Sí
            </span>
          )}
          {contacto.recibe_regalos === 'tal_vez' && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2235', color: '#f59e0b' }}>
              Tal vez
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Building2 size={12} className="text-muted shrink-0" />
          <p className="text-xs text-muted truncate">{contacto.empresa}</p>
          {contacto.cargo && <span className="text-xs text-muted">· {contacto.cargo}</span>}
        </div>
        {mode === 'cumple' && contacto.cumpleanos && (
          <p className="text-xs mt-1" style={{ color: accentColor }}>
            {formatCumple(contacto.cumpleanos)}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="shrink-0 flex items-center gap-2">
        {/* Fotos */}
        <button
          onClick={onDetail}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition"
          style={{ background: '#1a2235', color: fotos.length > 0 ? accentColor : '#8899b4', border: '1px solid #1e3a5f' }}
        >
          <Camera size={13} />
          {fotos.length > 0 ? `${fotos.length} foto${fotos.length !== 1 ? 's' : ''}` : 'Fotos'}
        </button>

        {/* FDA Entregado (solo tab fda) */}
        {mode === 'fda' && (
          <button
            onClick={() => onToggleFDA(!contacto.fda_entregado)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={contacto.fda_entregado
              ? { background: '#00e676', color: '#0a0e1a' }
              : { background: '#1a2235', color: '#8899b4', border: '1px solid #1e3a5f' }}
          >
            <Check size={13} />
            {contacto.fda_entregado ? 'Entregado' : 'Marcar'}
          </button>
        )}
      </div>
    </div>
  )
}
