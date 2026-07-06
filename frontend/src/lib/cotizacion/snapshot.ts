import type { BibliotecaGrupo, BibliotecaItem, BibliotecaLinea } from '../../types'
import {
  PAQUETEO_SCHEMA,
  PAQUETEO_PAQUETEADORAS,
  TRANSP_SCHEMA,
  type PaqueteoTab,
} from '../htmlV6/constants'

const COL_DEFAULTS: [string, string, string] = ['Servicio', 'Tarifa', 'Observación']

export interface CotSnapshotItem {
  id: string
  sel?: boolean
  nombre: string
  tarifa: string
  tipoTarifa?: 'moneda' | 'porcentaje'
  obs?: string
  extraCols?: Record<string, string>
  minima?: string
  campos?: Record<string, string>
  tiposCampo?: Record<string, string>
}

/** lineaNombre → grupoId → items[] */
export type CotItemsSnapshot = Record<string, Record<string, CotSnapshotItem[]>>

export function parseGrupoNombre(nombre: string) {
  const idx = nombre.indexOf('|')
  return idx < 0 ? { tipo: '', display: nombre } : { tipo: nombre.slice(0, idx), display: nombre.slice(idx + 1) }
}

export function isTransporteLine(nombre: string) {
  return nombre.toLowerCase().includes('transporte')
}

export function isPaqueteoLine(nombre: string) {
  return nombre.toLowerCase().includes('paqueteo')
}

export function parseColumnas(raw: string[]): { headers: [string, string, string]; extra: string[] } {
  const headers: [string, string, string] = [...COL_DEFAULTS] as [string, string, string]
  const extra: string[] = []
  for (const c of raw) {
    if (c.startsWith('__h1:')) headers[0] = c.slice(5)
    else if (c.startsWith('__h2:')) headers[1] = c.slice(5)
    else if (c.startsWith('__h3:')) headers[2] = c.slice(5)
    else extra.push(c)
  }
  return { headers, extra }
}

export function resolvePaqueteadoraTab(input: string): PaqueteoTab | null {
  const u = input.trim().toUpperCase()
  if (!u) return null
  for (const p of PAQUETEO_PAQUETEADORAS) {
    if (u === p) return p
  }
  if (u.includes('COORD')) return 'COORDINADORA'
  if (u.includes('SERVI')) return 'SERVIENTREGA'
  if (u.includes('TCC')) return 'TCC'
  return null
}

export function paqueteoGrupoMatches(linea: BibliotecaLinea, grupo: BibliotecaGrupo, paqueteadora: string): boolean {
  if (!isPaqueteoLine(linea.nombre)) return true
  const tab = resolvePaqueteadoraTab(paqueteadora)
  if (!tab) return true
  const { tipo } = parseGrupoNombre(grupo.nombre)
  const entry = PAQUETEO_SCHEMA[tipo]
  return entry?.paqueteadora === tab
}

export function bibItemToSnapshotItem(item: BibliotecaItem, sel = true): CotSnapshotItem {
  const campos: Record<string, string> = {}
  const tiposCampo: Record<string, string> = {}
  const extraCols: Record<string, string> = {}

  for (const [k, v] of Object.entries(item.extraCols ?? {})) {
    if (k.startsWith('_tc_')) tiposCampo[k.slice(4)] = String(v)
    else extraCols[k] = String(v)
  }

  for (const [k, v] of Object.entries(extraCols)) {
    campos[k] = v
  }

  return {
    id: item.id,
    sel,
    nombre: item.nombre,
    tarifa: item.tarifa,
    tipoTarifa: item.tipoTarifa,
    obs: item.obs,
    extraCols,
    campos: Object.keys(campos).length ? campos : undefined,
    tiposCampo: Object.keys(tiposCampo).length ? tiposCampo : undefined,
  }
}

export function getGrupoSnapshot(
  lineSnap: Record<string, CotSnapshotItem[]> | undefined,
  grupo: BibliotecaGrupo,
): CotSnapshotItem[] | undefined {
  if (!lineSnap) return undefined
  return lineSnap[grupo.id] ?? lineSnap[grupo.nombre]
}

export function setGrupoSnapshot(
  snapshot: CotItemsSnapshot,
  lineaNombre: string,
  grupoId: string,
  items: CotSnapshotItem[],
): CotItemsSnapshot {
  return {
    ...snapshot,
    [lineaNombre]: {
      ...(snapshot[lineaNombre] ?? {}),
      [grupoId]: items,
    },
  }
}

export function isItemSelected(item: CotSnapshotItem | undefined): boolean {
  return item?.sel !== false
}

export function findSnapshotItem(
  lineSnap: Record<string, CotSnapshotItem[]> | undefined,
  grupo: BibliotecaGrupo,
  itemId: string,
): CotSnapshotItem | undefined {
  const items = getGrupoSnapshot(lineSnap, grupo)
  return items?.find((i) => i.id === itemId)
}

/** Auto-selecciona filas Transporte/Paqueteo al entrar al paso 3. */
export function ensureTransportePaqueteoSnapshot(
  snapshot: CotItemsSnapshot,
  lineas: string[],
  biblioteca: BibliotecaLinea[],
  paqueteadora: string,
): CotItemsSnapshot {
  let next = snapshot
  let anyChanged = false

  for (const lineaNombre of lineas) {
    const linea = biblioteca.find((l) => l.nombre === lineaNombre)
    if (!linea || (!isTransporteLine(linea.nombre) && !isPaqueteoLine(linea.nombre))) continue

    const lineSnap = { ...(next[lineaNombre] ?? {}) }
    let lineChanged = false

    for (const grupo of linea.grupos) {
      if (!paqueteoGrupoMatches(linea, grupo, paqueteadora)) continue
      if (getGrupoSnapshot(lineSnap, grupo)?.length) continue

      lineSnap[grupo.id] = [...grupo.items]
        .sort((a, b) => a.orden - b.orden)
        .map((item) => bibItemToSnapshotItem(item, true))
      lineChanged = true
    }

    if (lineChanged) {
      next = { ...next, [lineaNombre]: lineSnap }
      anyChanged = true
    }
  }

  return anyChanged ? next : snapshot
}

export function countSelectedItems(snapshot: CotItemsSnapshot): number {
  let total = 0
  for (const lineSnap of Object.values(snapshot)) {
    for (const items of Object.values(lineSnap)) {
      total += items.filter((i) => isItemSelected(i)).length
    }
  }
  return total
}

export function resolveTransporteTipo(grupo: BibliotecaGrupo): keyof typeof TRANSP_SCHEMA {
  const { tipo, display } = parseGrupoNombre(grupo.nombre)
  if (tipo === 'local' || tipo === 'otros') return tipo
  const label = (display || grupo.nombre).toUpperCase()
  return label.includes('OTROS') ? 'otros' : 'local'
}

export function getSchemaForGrupo(linea: BibliotecaLinea, grupo: BibliotecaGrupo) {
  const { tipo, display } = parseGrupoNombre(grupo.nombre)
  if (isTransporteLine(linea.nombre)) {
    const transpTipo = resolveTransporteTipo(grupo)
    const schema = TRANSP_SCHEMA[transpTipo]
    return { kind: 'transporte' as const, cols: schema.cols, label: display || schema.label }
  }
  if (isPaqueteoLine(linea.nombre)) {
    const entry = PAQUETEO_SCHEMA[tipo]
    if (!entry) return null
    return { kind: 'paqueteo' as const, cols: entry.cols, label: display || entry.label, entry }
  }
  return null
}

/** Alias legacy (snake_case / importaciones) → id canónico del schema. */
const SCHEMA_FIELD_ALIASES: Record<string, readonly string[]> = {
  tipoVehiculo: ['tipo_vehiculo', 'tipoVeh'],
  capacidades: ['capacidad'],
  valorMax: ['valor_max', 'valorMaximo'],
  viaje4h: ['viaje_4h', 'viaje_4_horas', 'viaje4H'],
  viaje8h: ['viaje_8h', 'viaje_8_horas', 'viaje8H'],
  horaAdc: ['hora_adicional', 'horaAdcional'],
  servicio: ['nombre'],
  caracteristica: ['caracteristica'],
  condicion: ['condicion'],
  unaHora: ['una_hora', '1hora'],
  minima: ['minima', 'min'],
}

function extraColsToCampos(extraCols: Record<string, unknown> | undefined): {
  campos: Record<string, string>
  tiposCampo: Record<string, string>
} {
  const campos: Record<string, string> = {}
  const tiposCampo: Record<string, string> = {}
  if (!extraCols) return { campos, tiposCampo }

  for (const [k, v] of Object.entries(extraCols)) {
    if (k.startsWith('_tc_')) {
      tiposCampo[k.slice(4)] = String(v)
      continue
    }
    if (k === 'campos' && v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [ck, cv] of Object.entries(v as Record<string, unknown>)) {
        if (cv != null && typeof cv !== 'object') campos[ck] = String(cv)
      }
      continue
    }
    if (k === 'tiposCampo' && v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [tk, tv] of Object.entries(v as Record<string, unknown>)) {
        if (tv != null && typeof tv !== 'object') tiposCampo[tk] = String(tv)
      }
      continue
    }
    if (v != null && typeof v !== 'object') campos[k] = String(v)
  }
  return { campos, tiposCampo }
}

/** Une campos del snapshot con los de biblioteca; soporta claves alias. */
export function mergeSchemaCampos(
  item: CotSnapshotItem,
  bibItem?: BibliotecaItem,
): { campos: Record<string, string>; tiposCampo: Record<string, string> } {
  const fromBib = extraColsToCampos(bibItem?.extraCols as Record<string, unknown> | undefined)
  const fromSnapExtra = extraColsToCampos(item.extraCols as Record<string, unknown> | undefined)

  const campos: Record<string, string> = {
    ...fromBib.campos,
    ...fromSnapExtra.campos,
    ...(item.campos ?? {}),
  }
  const tiposCampo: Record<string, string> = {
    ...fromBib.tiposCampo,
    ...fromSnapExtra.tiposCampo,
    ...(item.tiposCampo ?? {}),
  }

  return { campos, tiposCampo }
}

export function resolveSchemaFieldValue(
  campos: Record<string, string>,
  colId: string,
): string {
  const direct = campos[colId]?.trim()
  if (direct) return direct

  for (const alias of SCHEMA_FIELD_ALIASES[colId] ?? []) {
    const val = campos[alias]?.trim()
    if (val) return val
  }

  return ''
}

function snapshotBlockMatchesGrupo(
  items: CotSnapshotItem[],
  linea: BibliotecaLinea,
  grupo: BibliotecaGrupo,
): boolean {
  const sample = items.find(isItemSelected) ?? items[0]
  if (!sample) return false
  const { campos } = mergeSchemaCampos(sample)
  const schema = getSchemaForGrupo(linea, grupo)
  if (!schema) return false
  if (schema.kind === 'transporte') {
    return resolveTransporteTipo(grupo) === 'otros'
      ? !!resolveSchemaFieldValue(campos, 'servicio')
      : !!resolveSchemaFieldValue(campos, 'tipoVehiculo')
  }
  if (schema.kind === 'paqueteo') {
    return schema.cols.some((c) => resolveSchemaFieldValue(campos, c.id))
  }
  return !!(sample.nombre?.trim() || sample.tarifa?.trim())
}

/** Resuelve ítems del snapshot por id/nombre de grupo o bloques legacy (g123…). */
export function resolveGrupoSnapshotItems(
  lineSnap: Record<string, CotSnapshotItem[]> | undefined,
  grupo: BibliotecaGrupo,
  linea: BibliotecaLinea,
  claimedKeys: Set<string>,
): CotSnapshotItem[] {
  if (!lineSnap) return []

  const { display } = parseGrupoNombre(grupo.nombre)
  for (const key of [grupo.id, grupo.nombre, display]) {
    if (!key || claimedKeys.has(key)) continue
    const raw = lineSnap[key]
    if (Array.isArray(raw) && raw.some(isItemSelected)) {
      claimedKeys.add(key)
      return raw.filter(isItemSelected)
    }
  }

  for (const [key, raw] of Object.entries(lineSnap)) {
    if (claimedKeys.has(key) || !Array.isArray(raw) || !raw.some(isItemSelected)) continue
    if (!snapshotBlockMatchesGrupo(raw, linea, grupo)) continue
    claimedKeys.add(key)
    return raw.filter(isItemSelected)
  }

  return []
}

export function resolveSchemaToggleValue(
  tiposCampo: Record<string, string>,
  colId: string,
  campos: Record<string, string>,
): string | undefined {
  if (tiposCampo[colId]) return tiposCampo[colId]
  for (const alias of SCHEMA_FIELD_ALIASES[colId] ?? []) {
    if (tiposCampo[alias]) return tiposCampo[alias]
  }
  const tcKey = `_tc_${colId}`
  const legacy = campos[tcKey]
  return legacy || undefined
}

export function formatCampoDisplay(value: string, colTipo: string, toggle?: string): string {
  if (!value?.trim()) return '—'
  const t = toggle ?? (colTipo === 'porcentaje' ? 'porcentaje' : colTipo === 'moneda' || colTipo === 'tarifa' ? 'moneda' : 'texto')
  if (t === 'porcentaje') return value.includes('%') ? value : `${value}%`
  if (t === 'moneda' || t === 'tarifa') return value.startsWith('$') ? value : `$${value}`
  return value
}

/** colId → tipo base, derivado de TRANSP_SCHEMA + PAQUETEO_SCHEMA (evita hardcodear la lista dos veces). */
const CAMPO_TIPO_BY_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const { cols } of Object.values(TRANSP_SCHEMA)) {
    for (const c of cols) map[c.id] = c.tipo
  }
  for (const { cols } of Object.values(PAQUETEO_SCHEMA)) {
    for (const c of cols) map[c.id] = c.tipo
  }
  return map
})()

/** true si `campos[colId]` representa dinero para este ítem (respeta el toggle guardado en tiposCampo). */
export function isMonedaCampo(colId: string, tiposCampo?: Record<string, string>): boolean {
  const tipo = CAMPO_TIPO_BY_ID[colId]
  if (!tipo) return false
  if (tipo === 'moneda' || tipo === 'tarifa') return true
  if (tipo === 'tarifa-mixta' || tipo === 'tarifa-texto' || tipo === 'mixta') {
    const toggle = tiposCampo?.[colId]
    return !toggle || toggle === 'moneda'
  }
  return false
}
