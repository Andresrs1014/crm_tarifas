/** Registro global — barra horizontal fija (patrón HTML v6 #mr-fixed-scroll). */

export interface TableScrollState {
  needsScroll: boolean
  scrollWidth: number
  scrollLeft: number
  setScrollLeft: (value: number) => void
}

export interface TableScrollEntry {
  id: string
  /** 0–1 visibilidad en viewport (debajo del header) */
  ratio: number
  getState: () => TableScrollState
}

function readCssPx(varName: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function headerOffset(): number {
  return readCssPx('--header-h', 60)
}

function sidebarWidth(): number {
  return readCssPx('--sidebar-w', 200)
}

const entries = new Map<string, TableScrollEntry>()
const listeners = new Set<() => void>()
/** Mientras el usuario arrastra la barra fija, no cambiar de tabla activa */
let lockedActiveId: string | null = null

export function subscribeTableScroll(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyTableScroll() {
  listeners.forEach((l) => l())
}

export function lockTableScroll(id: string | null) {
  lockedActiveId = id
}

export function getTableScrollEntry(id: string): TableScrollEntry | undefined {
  return entries.get(id)
}

export function registerTableScroll(entry: TableScrollEntry) {
  entries.set(entry.id, entry)
  notifyTableScroll()
  return () => {
    if (lockedActiveId === entry.id) lockedActiveId = null
    entries.delete(entry.id)
    notifyTableScroll()
  }
}

export function updateTableScrollEntry(id: string, patch: Partial<Pick<TableScrollEntry, 'ratio'>> = {}) {
  const entry = entries.get(id)
  if (!entry) return
  if (Object.keys(patch).length > 0) {
    entries.set(id, { ...entry, ...patch })
  }
  notifyTableScroll()
}

/** Tabla ancha más visible en pantalla (o la bloqueada mientras se arrastra la barra). */
export function getActiveTableScroll(): (TableScrollEntry & { state: TableScrollState }) | null {
  if (lockedActiveId) {
    const locked = entries.get(lockedActiveId)
    if (locked) {
      const state = locked.getState()
      if (state.needsScroll) return { ...locked, state }
    }
  }

  let best: TableScrollEntry | null = null
  let bestScore = 0

  for (const entry of entries.values()) {
    const state = entry.getState()
    if (!state.needsScroll || entry.ratio <= 0) continue

    if (entry.ratio > bestScore) {
      bestScore = entry.ratio
      best = entry
    }
  }

  if (!best) return null
  return { ...best, state: best.getState() }
}

export function getMainContentRect(): { left: number; width: number } {
  const main = document.querySelector('main.main')
  if (main) {
    const rect = main.getBoundingClientRect()
    return { left: rect.left, width: rect.width }
  }
  const sw = sidebarWidth()
  return { left: sw, width: window.innerWidth - sw }
}

/** Visibilidad vertical del scroll body en viewport (0–1). */
export function computeViewportRatio(el: HTMLElement): number {
  const rect = el.getBoundingClientRect()
  const viewTop = headerOffset()
  const viewBottom = window.innerHeight

  if (rect.bottom <= viewTop || rect.top >= viewBottom) return 0

  const visibleHeight = Math.min(rect.bottom, viewBottom) - Math.max(rect.top, viewTop)
  if (visibleHeight <= 8) return 0

  return visibleHeight / Math.max(rect.height, visibleHeight)
}
