import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { getRecords, updateRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { toast } from '../store/toastStore'
import type { CRMRecord, EstadoProspecto } from '../types'

// ─── Pipeline stages ───────────────────────────────────────────────────────────

const STAGES: { value: EstadoProspecto; label: string; color: string; bg: string }[] = [
  { value: 'prospecto',            label: 'Prospecto',     color: '#00c2ff', bg: '#00c2ff10' },
  { value: 'reconocimiento',       label: 'Reconocimiento', color: '#a855f7', bg: '#a855f710' },
  { value: 'propuesta',            label: 'Propuesta',     color: '#f5a623', bg: '#f5a62310' },
  { value: 'aceptacion_propuesta', label: 'Aceptación',    color: '#00e676', bg: '#00e67610' },
  { value: 'creacion_sop',         label: 'Creación SOP',  color: '#f5a623', bg: '#f5a62310' },
  { value: 'facturado',            label: 'Facturado',     color: '#00e676', bg: '#00e67610' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumn({
  stage, cards, isOver,
}: {
  stage: (typeof STAGES)[number]
  cards: CRMRecord[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage.value })
  const total = cards.reduce((s, c) => s + (c.ingresosEsperados ?? 0), 0)

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl border transition-colors min-h-[400px] w-56 flex-shrink-0"
      style={{
        background: isOver ? stage.bg : '#0d1b2a',
        borderColor: isOver ? stage.color : '#1e3050',
      }}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: stage.color }}>
            {stage.label}
          </span>
          <span
            className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `${stage.color}20`, color: stage.color }}
          >
            {cards.length}
          </span>
        </div>
        {total > 0 && (
          <p className="text-2xs text-muted font-mono">{fmt(total)}</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {cards.map((c) => (
          <KanbanCard key={c.id} record={c} color={stage.color} />
        ))}
        {cards.length === 0 && (
          <p className="text-xs text-muted/40 text-center pt-8">Arrastra aquí</p>
        )}
      </div>
    </div>
  )
}

// ─── Draggable card ───────────────────────────────────────────────────────────

function KanbanCard({
  record, color, overlay = false,
}: {
  record: CRMRecord; color: string; overlay?: boolean
}) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: record.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`card p-3 space-y-1.5 cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging && !overlay ? 'opacity-30' : ''
      } ${overlay ? 'rotate-1 shadow-xl' : 'hover:border-accent/30'}`}
      style={overlay ? { borderColor: color } : undefined}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          className="text-sm font-semibold text-foreground leading-tight truncate cursor-pointer hover:text-accent transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate(`/detalle/${record.id}`) }}
        >
          {record.empresa}
        </p>
      </div>

      {record.ciudad && (
        <p className="text-2xs text-muted">{record.ciudad}</p>
      )}

      {record.comercial && (
        <p className="text-2xs text-muted/70">{record.comercial.nombre}</p>
      )}

      {(record.servicios ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {record.servicios.slice(0, 2).map((s) => (
            <span key={s} className="stag">{s}</span>
          ))}
          {record.servicios.length > 2 && (
            <span className="stag">+{record.servicios.length - 2}</span>
          )}
        </div>
      )}

      {record.ingresosEsperados ? (
        <p className="text-2xs font-mono text-success">{fmt(record.ingresosEsperados)}</p>
      ) : null}

      {record.proximoSeguimiento && (
        <p className={`text-2xs font-mono ${
          new Date(record.proximoSeguimiento) < new Date()
            ? 'text-danger'
            : 'text-muted'
        }`}>
          🔔 {new Date(record.proximoSeguimiento).toLocaleDateString('es-CO')}
        </p>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CRMKanban() {
  const qc = useQueryClient()
  const [comercialId, setComercialId] = useState('')
  const [search, setSearch] = useState('')
  const [activeCard, setActiveCard] = useState<CRMRecord | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const { data: prospectos = [], isLoading } = useQuery({
    queryKey: ['records', 'prospecto', '', comercialId, search],
    queryFn: () => getRecords({ tipo: 'prospecto', comercialId: comercialId || undefined, search: search || undefined }),
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const updateEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoProspecto }) =>
      updateRecord(id, { estadoProspecto: estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records', 'prospecto'] }),
    onError: () => toast.error('Error al mover la tarjeta'),
  })

  // Alertas: visitas vencidas (proximoSeguimiento pasado)
  const vencidas = prospectos.filter(
    (p) => p.proximoSeguimiento && new Date(p.proximoSeguimiento) < new Date()
  )

  function handleDragStart(e: DragStartEvent) {
    const record = prospectos.find((p) => p.id === e.active.id)
    setActiveCard(record ?? null)
  }

  function handleDragOver(e: DragOverEvent) {
    setOverId(e.over ? String(e.over.id) : null)
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveCard(null)
    setOverId(null)
    if (!over) return
    const newEstado = over.id as EstadoProspecto
    const record = prospectos.find((p) => p.id === active.id)
    if (!record || record.estadoProspecto === newEstado) return
    updateEstadoMut.mutate({ id: record.id, estado: newEstado })
  }

  // Agrupar por estado
  const byStage: Record<string, CRMRecord[]> = {}
  STAGES.forEach((s) => { byStage[s.value] = [] })
  prospectos.forEach((p) => {
    const estado = p.estadoProspecto ?? 'prospecto'
    if (byStage[estado]) byStage[estado].push(p)
    else byStage['prospecto'].push(p)
  })

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline Kanban</h1>
          <p className="text-sm text-muted mt-0.5">{prospectos.length} prospectos</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            className="filter-input min-w-48"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
            <option value="">Todos los comerciales</option>
            {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Alerta visitas vencidas */}
      {vencidas.length > 0 && (
        <div className="rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 flex items-center gap-3">
          <span className="text-danger text-lg">⚠</span>
          <div className="flex-1 text-sm">
            <span className="font-semibold text-danger">{vencidas.length} seguimiento{vencidas.length > 1 ? 's' : ''} vencido{vencidas.length > 1 ? 's': ''}: </span>
            <span className="text-muted">
              {vencidas.slice(0, 3).map((v) => v.empresa).join(', ')}
              {vencidas.length > 3 && ` y ${vencidas.length - 3} más`}
            </span>
          </div>
        </div>
      )}

      {/* Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <div key={s.value} className="w-56 flex-shrink-0 h-96 bg-surface2 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.value}
                stage={stage}
                cards={byStage[stage.value] ?? []}
                isOver={overId === stage.value}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard && (
              <KanbanCard
                record={activeCard}
                color={STAGES.find((s) => s.value === activeCard.estadoProspecto)?.color ?? '#00c2ff'}
                overlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
