import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getRecords, updateRecord } from '../api/records'
import { getComercialesApi } from '../api/comerciales'
import { getVisitasVencidas } from '../api/actividades'
import { toast } from '../store/toastStore'
import type { CRMRecord, EstadoProspecto } from '../types'
import {
  COMPANIAS_FILTER_OPTIONS,
  CRM_KANBAN_STAGES,
  CRM_KPI_STRIP,
  ESTADOS_ACTIVOS,
  recordMatchesCompaniaFilter,
} from '../lib/htmlV6/domainConfig'
import { fmtMoney } from '../utils/fmtMoney'
import { TableScrollArea } from '../components/ui/DataListPanel'

const STAGES = CRM_KANBAN_STAGES as { value: EstadoProspecto; label: string; color: string; bg: string }[]
const STAGE_VALUES = STAGES.map((s) => s.value)
const ORDER_STORAGE_KEY = 'crm-kanban-column-order-v3'

type ColumnMap = Record<EstadoProspecto, string[]>

function columnPlaceholderId(stage: EstadoProspecto): string {
  return `${stage}__empty`
}

function isPlaceholderId(id: UniqueIdentifier): boolean {
  return String(id).endsWith('__empty')
}

function normalizeStage(estado?: string | null): EstadoProspecto {
  if (estado && STAGE_VALUES.includes(estado as EstadoProspecto)) {
    return estado as EstadoProspecto
  }
  return 'prospecto'
}

function sortableItemsForColumn(stage: EstadoProspecto, cardIds: string[]): string[] {
  return cardIds.length > 0 ? cardIds : [columnPlaceholderId(stage)]
}

function buildColumnMap(records: CRMRecord[]): ColumnMap {
  const map = Object.fromEntries(STAGE_VALUES.map((v) => [v, [] as string[]])) as ColumnMap
  const seen = new Set<string>()
  for (const r of records) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    map[normalizeStage(r.estadoProspecto)].push(r.id)
  }
  return map
}

function loadStoredOrder(): Partial<ColumnMap> | null {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY)
    return raw ? JSON.parse(raw) as Partial<ColumnMap> : null
  } catch {
    return null
  }
}

function mergeOrder(base: ColumnMap, stored: Partial<ColumnMap> | null): ColumnMap {
  if (!stored) return base
  const merged = Object.fromEntries(STAGE_VALUES.map((v) => [v, [] as string[]])) as ColumnMap

  for (const stage of STAGE_VALUES) {
    const baseIds = base[stage]
    const preferred = (stored[stage] ?? []).filter((id) => baseIds.includes(id))
    const rest = baseIds.filter((id) => !preferred.includes(id))
    merged[stage] = [...preferred, ...rest]
  }

  return merged
}

function findContainer(columns: ColumnMap, id: UniqueIdentifier): EstadoProspecto | null {
  const key = String(id)
  if (STAGE_VALUES.includes(key as EstadoProspecto)) return key as EstadoProspecto
  if (isPlaceholderId(key)) return key.replace('__empty', '') as EstadoProspecto
  for (const stage of STAGE_VALUES) {
    if (columns[stage].includes(key)) return stage
  }
  return null
}

function moveCardBetweenColumns(
  prev: ColumnMap,
  cardId: string,
  from: EstadoProspecto,
  to: EstadoProspecto,
  overId: UniqueIdentifier,
): ColumnMap {
  if (from === to) return prev

  const activeItems = prev[from].filter((id) => id !== cardId)
  const overItems = [...prev[to]]
  const overKey = String(overId)

  if (overId === to || isPlaceholderId(overId) || overItems.indexOf(overKey) === -1) {
    overItems.push(cardId)
  } else {
    overItems.splice(overItems.indexOf(overKey), 0, cardId)
  }

  return {
    ...prev,
    [from]: activeItems,
    [to]: overItems,
  }
}

function applyDragEndColumns(
  prev: ColumnMap,
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  sourceAtStart: EstadoProspecto | null,
): ColumnMap {
  const cardId = String(activeId)
  if (isPlaceholderId(activeId)) return prev

  const currentContainer = findContainer(prev, activeId)
  const overContainer = findContainer(prev, overId)
  if (!currentContainer || !overContainer) return prev

  if (currentContainer === overContainer) {
    if (isPlaceholderId(overId)) return prev
    const items = [...prev[currentContainer]]
    const oldIndex = items.indexOf(cardId)
    const newIndex = items.indexOf(String(overId))
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      return { ...prev, [currentContainer]: arrayMove(items, oldIndex, newIndex) }
    }
    return prev
  }

  if (
    sourceAtStart !== null &&
    currentContainer === sourceAtStart &&
    prev[currentContainer].includes(cardId)
  ) {
    return moveCardBetweenColumns(prev, cardId, currentContainer, overContainer, overId)
  }

  return prev
}

function KanbanEmptySlot({ stageValue }: { stageValue: EstadoProspecto }) {
  const { setNodeRef, isOver } = useSortable({
    id: columnPlaceholderId(stageValue),
    data: { type: 'placeholder', stage: stageValue },
  })

  return (
    <div
      ref={setNodeRef}
      className={`kanban-empty-hint${isOver ? ' kanban-empty-hint--over' : ''}`}
    >
      Arrastra aquí
    </div>
  )
}

function KanbanColumn({
  stage,
  cardIds,
  recordsById,
  isOver,
}: {
  stage: (typeof STAGES)[number]
  cardIds: string[]
  recordsById: Map<string, CRMRecord>
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage.value, data: { type: 'column', stage: stage.value } })
  const cards = cardIds.map((id) => recordsById.get(id)).filter(Boolean) as CRMRecord[]
  const total = cards.reduce((s, c) => s + (c.ingresosEsperados ?? 0), 0)
  const sortableIds = sortableItemsForColumn(stage.value, cardIds)

  return (
    <div
      className="kanban-column"
      style={{
        background: isOver ? stage.bg : '#0d1b2a',
        borderColor: isOver ? stage.color : '#1e3050',
      }}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title-row">
          <span className="kanban-column-title" style={{ color: stage.color }}>
            {stage.label}
          </span>
          <span className="kanban-column-count" style={{ background: `${stage.color}22`, color: stage.color }}>
            {cards.length}
          </span>
        </div>
        {total > 0 && <p className="money-gold kanban-column-total">{fmtMoney(total)}</p>}
      </div>

      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="kanban-column-body">
          {cards.map((c) => (
            <KanbanCard key={c.id} record={c} color={stage.color} />
          ))}
          {cards.length === 0 && <KanbanEmptySlot stageValue={stage.value} />}
        </div>
      </SortableContext>
    </div>
  )
}

function KanbanCardBody({
  record,
}: {
  record: CRMRecord
}) {
  return (
    <>
      <p className="kanban-card-title">{record.empresa}</p>
      {record.ciudad && <p className="kanban-card-meta">{record.ciudad}</p>}
      {record.comercial && <p className="kanban-card-meta">{record.comercial.nombre}</p>}

      {(record.servicios ?? []).length > 0 && (
        <div className="kanban-card-tags">
          {record.servicios.slice(0, 2).map((s) => (
            <span key={s} className="stag">{s}</span>
          ))}
          {record.servicios.length > 2 && (
            <span className="stag">+{record.servicios.length - 2}</span>
          )}
        </div>
      )}

      {record.ingresosEsperados ? (
        <p className="money-gold kanban-card-money">{fmtMoney(record.ingresosEsperados)}</p>
      ) : null}

      {record.proximoSeguimiento && (
        <p className={`kanban-card-date${
          new Date(record.proximoSeguimiento) < new Date() ? ' kanban-card-date--late' : ''
        }`}>
          🔔 {new Date(record.proximoSeguimiento).toLocaleDateString('es-CO')}
        </p>
      )}
    </>
  )
}

/** Vista estática para DragOverlay — sin useSortable (evita congelar el board). */
function KanbanCardPreview({ record, color }: { record: CRMRecord; color: string }) {
  return (
    <div
      className="kanban-card kanban-card--overlay"
      style={{ borderColor: color, cursor: 'grabbing' }}
    >
      <span className="kanban-card-handle" aria-hidden="true">⠿</span>
      <div className="kanban-card-body">
        <KanbanCardBody record={record} />
      </div>
    </div>
  )
}

function KanbanCard({
  record,
  color,
}: {
  record: CRMRecord
  color: string
}) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card${isDragging ? ' kanban-card--dragging' : ''}`}
      onClick={() => navigate(`/detalle/${record.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/detalle/${record.id}`) }}
    >
      <button
        type="button"
        className="kanban-card-handle"
        aria-label="Arrastrar tarjeta"
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>

      <div className="kanban-card-body">
        <KanbanCardBody record={record} />
      </div>
    </div>
  )
}

export default function CRMKanban() {
  const qc = useQueryClient()
  const boardRef = useRef<HTMLDivElement>(null)
  const columnsRef = useRef<ColumnMap>(
    Object.fromEntries(STAGE_VALUES.map((v) => [v, [] as string[]])) as ColumnMap,
  )
  const dragStartContainerRef = useRef<EstadoProspecto | null>(null)
  const dragTargetRef = useRef<EstadoProspecto | null>(null)
  const [comercialId, setComercialId] = useState('')
  const [search, setSearch] = useState('')
  const [companiaFiltro, setCompaniaFiltro] = useState('')
  const [activeCard, setActiveCard] = useState<CRMRecord | null>(null)
  const [overColumn, setOverColumn] = useState<EstadoProspecto | null>(null)
  const [columns, setColumns] = useState<ColumnMap>(() =>
    Object.fromEntries(STAGE_VALUES.map((v) => [v, [] as string[]])) as ColumnMap,
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const { data: prospectos = [], isLoading } = useQuery({
    queryKey: ['records', 'prospecto', '', comercialId, search],
    queryFn: () => getRecords({
      tipo: 'prospecto',
      comercialId: comercialId || undefined,
      search: search || undefined,
    }),
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const { data: visitasVencidas = [] } = useQuery({
    queryKey: ['visitas-vencidas'],
    queryFn: getVisitasVencidas,
    refetchInterval: 5 * 60 * 1000,
  })

  const updateEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoProspecto }) =>
      updateRecord(id, { estadoProspecto: estado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', 'prospecto'] })
      qc.invalidateQueries({ queryKey: ['records'] })
    },
    onError: () => toast.error('Error al mover la tarjeta'),
  })

  const prospectosFiltrados = useMemo(() => (
    companiaFiltro
      ? prospectos.filter((p) =>
          recordMatchesCompaniaFilter(
            (p.servicios ?? []) as string[],
            p.companias,
            companiaFiltro,
          ),
        )
      : prospectos
  ), [prospectos, companiaFiltro])

  const recordsById = useMemo(
    () => new Map(prospectosFiltrados.map((p) => [p.id, p])),
    [prospectosFiltrados],
  )

  useEffect(() => {
    const base = buildColumnMap(prospectosFiltrados)
    setColumns(mergeOrder(base, loadStoredOrder()))
  }, [prospectosFiltrados])

  columnsRef.current = columns

  useEffect(() => {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(columns))
  }, [columns])

  const empresasVencidas = [...new Set(visitasVencidas.map((v) => v.record.empresa))]

  const kpiTotal = prospectosFiltrados.length
  const kpiEnPipeline = prospectosFiltrados.filter((p) =>
    (ESTADOS_ACTIVOS as readonly string[]).includes(p.estadoProspecto ?? 'prospecto'),
  ).length
  const kpiFacturados = prospectosFiltrados.filter((p) => p.estadoProspecto === 'facturado').length
  const kpiPerdidos = prospectosFiltrados.filter((p) =>
    p.estadoProspecto === 'perdido' || p.estadoProspecto === 'frio',
  ).length
  const kpiIngresos = prospectosFiltrados.reduce((a, p) => a + (p.ingresosEsperados ?? 0), 0)

  const kpiValues: Record<string, string | number> = {
    total: kpiTotal,
    pipeline: kpiEnPipeline,
    facturados: kpiFacturados,
    perdidos: kpiPerdidos,
    ingresos: kpiIngresos ? fmtMoney(kpiIngresos) : '—',
  }

  const resetDragState = useCallback(() => {
    dragStartContainerRef.current = null
    dragTargetRef.current = null
    setActiveCard(null)
    setOverColumn(null)
  }, [])

  const revertColumnsFromRecords = useCallback(() => {
    setColumns(mergeOrder(buildColumnMap(prospectosFiltrados), loadStoredOrder()))
  }, [prospectosFiltrados])

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const record = recordsById.get(String(e.active.id))
    setActiveCard(record ?? null)
    dragStartContainerRef.current = findContainer(columnsRef.current, e.active.id)
    dragTargetRef.current = dragStartContainerRef.current
  }, [recordsById])

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e
    if (!over || isPlaceholderId(active.id)) {
      if (!over) setOverColumn(null)
      return
    }

    const overContainer = findContainer(columnsRef.current, over.id)
    dragTargetRef.current = overContainer
    setOverColumn(overContainer)

    setColumns((prev) => {
      const activeContainer = findContainer(prev, active.id)
      const targetContainer = findContainer(prev, over.id)
      if (!activeContainer || !targetContainer) return prev

      const cardId = String(active.id)

      if (activeContainer === targetContainer) {
        if (isPlaceholderId(over.id)) return prev
        const items = [...prev[activeContainer]]
        const oldIndex = items.indexOf(cardId)
        const newIndex = items.indexOf(String(over.id))
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          return { ...prev, [activeContainer]: arrayMove(items, oldIndex, newIndex) }
        }
        return prev
      }

      return moveCardBetweenColumns(prev, cardId, activeContainer, targetContainer, over.id)
    })
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    const sourceAtStart = dragStartContainerRef.current
    const cardId = String(active.id)

    if (isPlaceholderId(active.id)) {
      resetDragState()
      return
    }

    let targetStage: EstadoProspecto | null = null

    setColumns((prev) => {
      const overId = over?.id ?? dragTargetRef.current
      const next = overId
        ? applyDragEndColumns(prev, active.id, overId, sourceAtStart)
        : prev

      targetStage = findContainer(next, active.id)
      return next
    })

    resetDragState()

    const record = recordsById.get(cardId)
    if (record && targetStage && normalizeStage(record.estadoProspecto) !== targetStage) {
      updateEstadoMut.mutate({ id: record.id, estado: targetStage })
    }
  }, [recordsById, updateEstadoMut, resetDragState])

  const handleDragCancel = useCallback(() => {
    revertColumnsFromRecords()
    resetDragState()
  }, [revertColumnsFromRecords, resetDragState])

  const collisionDetection = useCallback((args: Parameters<typeof closestCorners>[0]) => {
    const hits = pointerWithin(args)
    if (hits.length > 0) {
      const cardHit = hits.find((hit) => {
        const id = String(hit.id)
        return !STAGE_VALUES.includes(id as EstadoProspecto) && !isPlaceholderId(id)
      })
      if (cardHit) return [cardHit, ...hits.filter((h) => h.id !== cardHit.id)]
      return hits
    }
    return closestCorners(args)
  }, [])

  return (
    <div className="page-crm">
      <div className="page-crm-header">
        <div className="section-title" style={{ marginBottom: 0 }}>
          {'\uD83D\uDCC2'} CRM <span>Pipeline de Prospectos</span>
        </div>
        <div className="page-crm-header-actions">
          <input
            className="filter-input"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={companiaFiltro}
            onChange={(e) => setCompaniaFiltro(e.target.value)}
          >
            {COMPANIAS_FILTER_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select className="filter-select" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
            <option value="">{'\uD83D\uDC65'} Todos los comerciales</option>
            {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <Link to="/registro" className="btn btn-primary btn-sm shrink-0">
            {'\u2795'} Nuevo Prospecto
          </Link>
        </div>
      </div>

      <div className="crm-kpi-strip">
        {CRM_KPI_STRIP.map((k) => (
          <div key={k.key} className="crm-kpi-cell" style={{ borderTopColor: k.color }}>
            <p className="crm-kpi-label">{k.label}</p>
            <p className="crm-kpi-value" style={{ color: k.color }}>
              {kpiValues[k.key]}
            </p>
          </div>
        ))}
      </div>

      {visitasVencidas.length > 0 && (
        <div className="crm-visits-banner">
          <span className="text-danger text-lg mt-0.5">{'\u26A0'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-danger mb-1">
              {visitasVencidas.length} visita{visitasVencidas.length > 1 ? 's' : ''} vencida{visitasVencidas.length > 1 ? 's' : ''} sin registrar
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {empresasVencidas.slice(0, 5).map((empresa) => {
                const count = visitasVencidas.filter((v) => v.record.empresa === empresa).length
                return (
                  <span key={empresa} className="text-xs text-muted">
                    {empresa}{count > 1 ? ` (${count})` : ''}
                  </span>
                )
              })}
              {empresasVencidas.length > 5 && (
                <span className="text-xs text-muted/60">y {empresasVencidas.length - 5} más</span>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="kanban-board-wrap">
          <TableScrollArea>
            <div className="kanban-board">
              {STAGES.map((s) => (
                <div key={s.value} className="kanban-column kanban-column--loading" />
              ))}
            </div>
          </TableScrollArea>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          autoScroll={{ threshold: { x: 0.15, y: 0.2 } }}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="kanban-board-wrap">
            <TableScrollArea>
              <div className="kanban-board" ref={boardRef}>
                {STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage.value}
                    stage={stage}
                    cardIds={columns[stage.value] ?? []}
                    recordsById={recordsById}
                    isOver={overColumn === stage.value}
                  />
                ))}
              </div>
            </TableScrollArea>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <KanbanCardPreview
                record={activeCard}
                color={STAGES.find((s) => s.value === normalizeStage(activeCard.estadoProspecto))?.color ?? '#00c2ff'}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
