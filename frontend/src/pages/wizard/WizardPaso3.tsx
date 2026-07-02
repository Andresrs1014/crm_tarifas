import { useEffect, useState } from 'react'
import type { BibliotecaLinea, BibliotecaGrupo, BibliotecaItem } from '../../types'
import {
  TRANSP_SCHEMA,
  PAQUETEO_SCHEMA,
  type BibSchemaCol,
  type PaqueteoSchemaEntry,
} from '../../lib/htmlV6/constants'
import { TableScrollArea } from '../../components/ui/DataListPanel'
import {
  type CotItemsSnapshot,
  type CotSnapshotItem,
  bibItemToSnapshotItem,
  findSnapshotItem,
  formatCampoDisplay,
  getGrupoSnapshot,
  isItemSelected,
  isPaqueteoLine,
  isTransporteLine,
  mergeSchemaCampos,
  paqueteoGrupoMatches,
  parseColumnas,
  parseGrupoNombre,
  resolveSchemaFieldValue,
  resolveSchemaToggleValue,
  setGrupoSnapshot,
  getSchemaForGrupo,
} from '../../lib/cotizacion/snapshot'

// ─── Schema cell (editable en wizard, no persiste en biblioteca) ───────────────

function WizardSchemaCell({
  col, value, toggleVal, onChange, onToggleChange,
}: {
  col: BibSchemaCol
  value: string
  toggleVal?: string
  onChange: (v: string) => void
  onToggleChange?: (v: string) => void
}) {
  const isMixta = col.tipo === 'tarifa-mixta' || col.tipo === 'mixta'
  const isTarifaTexto = col.tipo === 'tarifa-texto'

  if (isMixta || isTarifaTexto) {
    const current = toggleVal ?? 'moneda'
    const isMoneda = current !== 'porcentaje' && current !== 'texto'
    const toggleTo = isMixta ? (isMoneda ? 'porcentaje' : 'moneda') : (isMoneda ? 'texto' : 'moneda')
    const label = isMixta ? (isMoneda ? '$' : '%') : (isMoneda ? '$' : 'T')
    return (
      <div className="flex items-center gap-0.5">
        <button type="button" className="bib-toggle-btn" onClick={() => onToggleChange?.(toggleTo)}>
          {label}
        </button>
        <input
          className="bib-cell-input bib-cell-input--tarifa"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    )
  }

  return (
    <input
      className={`bib-cell-input${col.tipo !== 'texto' && col.tipo !== 'numero' ? ' bib-cell-input--tarifa' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ─── Schema row (Transporte / Paqueteo) ───────────────────────────────────────

function WizardSchemaRow({
  bibItem, snapItem, cols, selected, onToggle, onUpdate,
}: {
  bibItem: BibliotecaItem
  snapItem?: CotSnapshotItem
  cols: BibSchemaCol[]
  selected: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<CotSnapshotItem>) => void
}) {
  const { campos, tiposCampo: tipos } = mergeSchemaCampos(
    snapItem ?? bibItemToSnapshotItem(bibItem, false),
    bibItem,
  )

  function setCampo(colId: string, value: string) {
    onUpdate({ campos: { ...campos, [colId]: value } })
  }

  function setToggle(colId: string, value: string) {
    onUpdate({ tiposCampo: { ...tipos, [colId]: value } })
  }

  return (
    <tr className={selected ? 'wizard-row-selected' : ''}>
      <td style={{ width: 36, textAlign: 'center' }}>
        <input type="checkbox" checked={selected} onChange={onToggle} className="w-4 h-4 accent-accent" />
      </td>
      {cols.map((col) => (
        <td key={col.id}>
          {selected ? (
            <WizardSchemaCell
              col={col}
              value={resolveSchemaFieldValue(campos, col.id)}
              toggleVal={resolveSchemaToggleValue(tipos, col.id, campos)}
              onChange={(v) => setCampo(col.id, v)}
              onToggleChange={(v) => setToggle(col.id, v)}
            />
          ) : (
            <span className="text-xs text-muted">
              {formatCampoDisplay(
                resolveSchemaFieldValue(campos, col.id),
                col.tipo,
                resolveSchemaToggleValue(tipos, col.id, campos),
              )}
            </span>
          )}
        </td>
      ))}
    </tr>
  )
}

function PaqueteoTableHead({ entry }: { entry: PaqueteoSchemaEntry }) {
  if (!entry.colspanGroups) {
    return (
      <thead>
        <tr>
          <th style={{ width: 36 }} />
          {entry.cols.map((c) => <th key={c.id}>{c.nombre}</th>)}
        </tr>
      </thead>
    )
  }

  const spanColIds = new Set(entry.colspanGroups.flatMap((g) => g.cols))
  const leadCols = entry.cols.filter((c) => !spanColIds.has(c.id))

  return (
    <thead>
      <tr>
        <th style={{ width: 36 }} rowSpan={2} />
        {leadCols.map((c) => <th key={c.id} rowSpan={2}>{c.nombre}</th>)}
        {entry.colspanGroups.map((g) => (
          <th key={g.label} colSpan={g.cols.length} className="text-center">{g.label}</th>
        ))}
      </tr>
      <tr>
        {entry.colspanGroups.flatMap((g) =>
          g.cols.map((colId) => {
            const col = entry.cols.find((c) => c.id === colId)
            return <th key={colId}>{col?.nombre ?? colId}</th>
          }),
        )}
      </tr>
    </thead>
  )
}

// ─── Standard row ─────────────────────────────────────────────────────────────

function WizardStandardRow({
  bibItem, snapItem, headers, extraCols, selected, onToggle,
}: {
  bibItem: BibliotecaItem
  snapItem?: CotSnapshotItem
  headers: [string, string, string]
  extraCols: string[]
  selected: boolean
  onToggle: () => void
}) {
  const item = snapItem ?? bibItemToSnapshotItem(bibItem, false)

  return (
    <tr
      className={selected ? 'wizard-row-selected' : ''}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <td style={{ width: 36, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggle} className="w-4 h-4 accent-accent" />
      </td>
      <td className="text-sm">{item.nombre}</td>
      <td className="text-sm font-mono text-accent">{item.tarifa}</td>
      <td className="text-xs text-muted">{item.obs ?? '—'}</td>
      {extraCols.map((col) => (
        <td key={col} className="text-xs text-muted">{item.extraCols?.[col] ?? bibItem.extraCols?.[col] ?? '—'}</td>
      ))}
    </tr>
  )
}

// ─── Grupo renderers ──────────────────────────────────────────────────────────

function WizardSchemaGrupo({
  lineaNombre, grupo, cols, entry, snapshot, onChange,
}: {
  lineaNombre: string
  grupo: BibliotecaGrupo
  cols: BibSchemaCol[]
  entry?: PaqueteoSchemaEntry
  snapshot: CotItemsSnapshot
  onChange: (snap: CotItemsSnapshot) => void
}) {
  const lineSnap = snapshot[lineaNombre]
  const sortedItems = [...grupo.items].sort((a, b) => a.orden - b.orden)
  const { display } = parseGrupoNombre(grupo.nombre)

  function upsertItem(bibItem: BibliotecaItem, patch: Partial<CotSnapshotItem>, sel: boolean) {
    const current = getGrupoSnapshot(lineSnap, grupo) ?? []
    const idx = current.findIndex((i) => i.id === bibItem.id)
    const base = idx >= 0 ? current[idx] : bibItemToSnapshotItem(bibItem, sel)
    const next = { ...base, ...patch, sel }
    const items = idx >= 0
      ? current.map((i, j) => (j === idx ? next : i))
      : [...current, next]
    onChange(setGrupoSnapshot(snapshot, lineaNombre, grupo.id, items))
  }

  function toggleItem(bibItem: BibliotecaItem) {
    const snap = findSnapshotItem(lineSnap, grupo, bibItem.id)
    const selected = isItemSelected(snap)
    if (selected) {
      const current = getGrupoSnapshot(lineSnap, grupo) ?? []
      onChange(setGrupoSnapshot(
        snapshot,
        lineaNombre,
        grupo.id,
        current.map((i) => (i.id === bibItem.id ? { ...i, sel: false } : i)),
      ))
    } else {
      upsertItem(bibItem, {}, true)
    }
  }

  return (
    <div className="grupo-card">
      <div className="grupo-header grupo-header--open">
        <div className="grupo-title">{display || grupo.nombre}</div>
        <div className="text-xs text-muted">{sortedItems.length} filas</div>
      </div>
      <div className="grupo-body">
        <TableScrollArea>
          <table className="bib-items-table">
            {entry ? <PaqueteoTableHead entry={entry} /> : (
              <thead>
                <tr>
                  <th style={{ width: 36 }} />
                  {cols.map((c) => <th key={c.id}>{c.nombre}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              {sortedItems.map((bibItem) => {
                const snap = findSnapshotItem(lineSnap, grupo, bibItem.id)
                const selected = isItemSelected(snap)
                return (
                  <WizardSchemaRow
                    key={bibItem.id}
                    bibItem={bibItem}
                    snapItem={snap}
                    cols={cols}
                    selected={selected}
                    onToggle={() => toggleItem(bibItem)}
                    onUpdate={(patch) => upsertItem(bibItem, patch, true)}
                  />
                )
              })}
            </tbody>
          </table>
        </TableScrollArea>
      </div>
    </div>
  )
}

function WizardStandardGrupo({
  lineaNombre, grupo, headers, extraCols, snapshot, onChange,
}: {
  lineaNombre: string
  grupo: BibliotecaGrupo
  headers: [string, string, string]
  extraCols: string[]
  snapshot: CotItemsSnapshot
  onChange: (snap: CotItemsSnapshot) => void
}) {
  const lineSnap = snapshot[lineaNombre]
  const sortedItems = [...grupo.items].sort((a, b) => a.orden - b.orden)

  function toggleItem(bibItem: BibliotecaItem) {
    const current = getGrupoSnapshot(lineSnap, grupo) ?? []
    const idx = current.findIndex((i) => i.id === bibItem.id)
    if (idx >= 0) {
      const next = current.filter((i) => i.id !== bibItem.id)
      onChange(setGrupoSnapshot(snapshot, lineaNombre, grupo.id, next))
    } else {
      onChange(setGrupoSnapshot(
        snapshot,
        lineaNombre,
        grupo.id,
        [...current, bibItemToSnapshotItem(bibItem, true)],
      ))
    }
  }

  return (
    <div className="grupo-card">
      <div className="grupo-header grupo-header--open">
        <div className="grupo-title">{grupo.nombre}</div>
        <div className="text-xs text-muted">{sortedItems.length} ítems</div>
      </div>
      <div className="grupo-body">
        <TableScrollArea>
          <table className="bib-items-table">
            <thead>
              <tr>
                <th style={{ width: 36 }} />
                <th>{headers[0]}</th>
                <th>{headers[1]}</th>
                <th>{headers[2]}</th>
                {extraCols.map((col) => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((bibItem) => {
                const snap = findSnapshotItem(lineSnap, grupo, bibItem.id)
                const selected = !!snap && isItemSelected(snap)
                return (
                  <WizardStandardRow
                    key={bibItem.id}
                    bibItem={bibItem}
                    snapItem={snap}
                    headers={headers}
                    extraCols={extraCols}
                    selected={selected}
                    onToggle={() => toggleItem(bibItem)}
                  />
                )
              })}
            </tbody>
          </table>
        </TableScrollArea>
      </div>
    </div>
  )
}

// ─── Paso 3 export ────────────────────────────────────────────────────────────

export interface WizardPaso3Props {
  lineas: string[]
  paqueteadora: string
  snapshot: CotItemsSnapshot
  lineasDisponibles: BibliotecaLinea[]
  onChange: (snap: CotItemsSnapshot) => void
}

export function WizardPaso3({
  lineas, paqueteadora, snapshot, lineasDisponibles, onChange,
}: WizardPaso3Props) {
  const [activeLinea, setActiveLinea] = useState(lineas[0] ?? '')

  useEffect(() => {
    if (lineas.length && !lineas.includes(activeLinea)) {
      setActiveLinea(lineas[0])
    }
  }, [lineas, activeLinea])

  const linea = lineasDisponibles.find((l) => l.nombre === activeLinea)
  const isTransporte = linea ? isTransporteLine(linea.nombre) : false
  const isPaqueteo = linea ? isPaqueteoLine(linea.nombre) : false

  const grupos = linea
    ? [...linea.grupos]
      .sort((a, b) => a.orden - b.orden)
      .filter((g) => paqueteoGrupoMatches(linea, g, paqueteadora))
    : []

  const { headers, extra: extraCols } = linea
    ? parseColumnas((linea.columnas as string[]) ?? [])
    : { headers: ['Servicio', 'Tarifa', 'Observación'] as [string, string, string], extra: [] as string[] }

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border-b border-border">
        {lineas.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setActiveLinea(l)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeLinea === l
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {isPaqueteo && paqueteadora && (
        <p className="text-xs text-muted">
          Mostrando grupos de paqueteadora: <strong className="text-foreground">{paqueteadora}</strong>
        </p>
      )}

      {linea ? (
        grupos.length > 0 ? (
          <div className="space-y-4">
            {grupos.map((grupo) => {
              if (isTransporte) {
                const { tipo } = parseGrupoNombre(grupo.nombre)
                const schema = TRANSP_SCHEMA[tipo as keyof typeof TRANSP_SCHEMA] ?? TRANSP_SCHEMA.local
                return (
                  <WizardSchemaGrupo
                    key={grupo.id}
                    lineaNombre={activeLinea}
                    grupo={grupo}
                    cols={schema.cols}
                    snapshot={snapshot}
                    onChange={onChange}
                  />
                )
              }
              if (isPaqueteo) {
                const { tipo } = parseGrupoNombre(grupo.nombre)
                const entry = PAQUETEO_SCHEMA[tipo]
                if (!entry) return null
                return (
                  <WizardSchemaGrupo
                    key={grupo.id}
                    lineaNombre={activeLinea}
                    grupo={grupo}
                    cols={entry.cols}
                    entry={entry}
                    snapshot={snapshot}
                    onChange={onChange}
                  />
                )
              }
              return (
                <WizardStandardGrupo
                  key={grupo.id}
                  lineaNombre={activeLinea}
                  grupo={grupo}
                  headers={headers}
                  extraCols={extraCols}
                  snapshot={snapshot}
                  onChange={onChange}
                />
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">
            {isPaqueteo && paqueteadora
              ? `No hay grupos para la paqueteadora "${paqueteadora}". Verifica el paso 1 o la Biblioteca.`
              : 'No hay grupos configurados en la biblioteca para esta línea.'}
          </p>
        )
      ) : (
        <p className="text-sm text-muted">Selecciona una línea.</p>
      )}
    </div>
  )
}

export function countSelectedInSnapshot(snapshot: CotItemsSnapshot): number {
  let total = 0
  for (const lineSnap of Object.values(snapshot)) {
    for (const items of Object.values(lineSnap)) {
      total += items.filter(isItemSelected).length
    }
  }
  return total
}

export function summarizeSnapshotItem(item: CotSnapshotItem): string {
  if (item.campos && Object.keys(item.campos).length) {
    const first = Object.values(item.campos).find(Boolean)
    return first ?? item.nombre
  }
  return item.nombre
}

export function itemDisplayTarifa(item: CotSnapshotItem): string {
  if (item.tarifa) return item.tarifa
  const campos = item.campos ?? {}
  const moneda = Object.entries(campos).find(([, v]) => v && v.includes('$'))
  if (moneda) return moneda[1]
  return '—'
}
