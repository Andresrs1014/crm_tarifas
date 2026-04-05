import { create } from 'zustand'
import type {
  BibliotecaLinea,
  CotizacionRead,
  EstadoCotizacion,
  ItemsMap,
  WizardGrupo,
  WizardItem,
} from '../types'
import { today } from '../utils/format'

// ─────────────────────────────────────────────────────────
// Tipos auxiliares
// ─────────────────────────────────────────────────────────

export interface DatosGenerales {
  empresa: string
  nit: string
  record_id: string | null
  contacto: string
  cargo: string
  email: string
  telefono: string
  comercial_id: string
  fecha: string      // YYYY-MM-DD
  vigencia: string   // YYYY-MM-DD
  estado: EstadoCotizacion
  asunto: string
}

// ─────────────────────────────────────────────────────────
// Estado inicial (reutilizable en reset)
// ─────────────────────────────────────────────────────────

const INITIAL_DATOS: DatosGenerales = {
  empresa: '',
  nit: '',
  record_id: null,
  contacto: '',
  cargo: '',
  email: '',
  telefono: '',
  comercial_id: '',
  fecha: today(),
  vigencia: '',
  estado: 'borrador',
  asunto: '',
}

const INITIAL_STATE = {
  id: null as string | null,
  numero: null as string | null,
  paso: 1 as 1 | 2 | 3 | 4 | 5,
  ...INITIAL_DATOS,
  lineas: [] as string[],
  items: {} as ItemsMap,
  obs_plantillas: {} as Record<string, string[]>,
  obs_libre: '',
  paqueteadora: null as string | null,
  tarifa_tipo: {} as Record<string, string>,        // {linea: 'biblioteca'|'especial'}
  tarifa_especial_id: {} as Record<string, string>, // {linea: uuid_str}
}

// ─────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────

/** Convierte un BibliotecaGrupo → WizardGrupo con todos los ítems en sel=false */
function bibliotecaGrupoToWizard(
  grupo: BibliotecaLinea['grupos'][number]
): WizardGrupo {
  return {
    sel: false,
    nombre: grupo.nombre,
    items: grupo.items.map((item): WizardItem => ({
      sel: false,
      nombre: item.nombre,
      tarifa: item.tarifa,
      tipo_tarifa: item.tipo_tarifa,
      obs: item.obs ?? '',
      extra_cols: { ...item.extra_cols },
    })),
  }
}

/** Deep clone seguro usando structuredClone (disponible en todos los browsers modernos) */
function cloneItems(items: ItemsMap): ItemsMap {
  return structuredClone(items)
}

// ─────────────────────────────────────────────────────────
// Interfaz del store
// ─────────────────────────────────────────────────────────

type CotWizardStore = typeof INITIAL_STATE & {
  // ── Navegación ──
  setPaso: (n: 1 | 2 | 3 | 4 | 5) => void

  // ── Paso 1: datos generales ──
  setDatosGenerales: (data: Partial<DatosGenerales>) => void

  // ── Paso 2: selección de líneas ──
  // Al desactivar una línea limpia sus items y obs_plantillas
  toggleLinea: (svc: string) => void

  // ── Paso 3: configurar ítems ──
  // Llamar al pasar del Paso 2 → Paso 3.
  // Regla: si items[svc] ya existe (usuario editó antes) → conservar.
  //        si no existe → poblar desde biblioteca con sel=false.
  initItemsFromBiblioteca: (biblioteca: BibliotecaLinea[]) => void

  // Selecciona/deselecciona todo el grupo y sus ítems
  toggleGrupo: (svc: string, gid: string, checked: boolean) => void

  // Selecciona/deselecciona un ítem individual y recalcula sel del grupo
  toggleItem: (svc: string, gid: string, idx: number, checked: boolean) => void

  // Edita cualquier campo escalar de un WizardItem (nombre, tarifa, obs, tipo_tarifa)
  updateItemField: (
    svc: string,
    gid: string,
    idx: number,
    field: Exclude<keyof WizardItem, 'extra_cols' | 'sel'>,
    val: string
  ) => void

  // Edita una columna extra específica de un ítem
  updateItemExtraCol: (
    svc: string,
    gid: string,
    idx: number,
    colId: string,
    val: string
  ) => void

  // ── Paso 3: paqueteadora ──
  setPaqueteadora: (val: string | null) => void

  // ── Paso 2: tarifa tipo / especial ──
  setTarifaTipo: (svc: string, tipo: 'biblioteca' | 'especial') => void
  setTarifaEspecialId: (svc: string, id: string) => void

  // ── Paso 4: observaciones ──
  // Toggle de una plantilla de observación (add/remove del array)
  toggleObsPlantilla: (svc: string, obsId: string) => void
  setObsLibre: (text: string) => void

  // ── Lifecycle ──
  resetWizard: () => void
  // Carga cotización existente para edición.
  // Necesita biblioteca para recuperar nombres de grupos que podrían
  // no estar en el snapshot si se guardaron con versiones anteriores.
  loadFromCotizacion: (cot: CotizacionRead, biblioteca: BibliotecaLinea[]) => void
}

// ─────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────

export const useCotWizardStore = create<CotWizardStore>((set, get) => ({
  ...INITIAL_STATE,

  // ── Navegación ──

  setPaso: (n) => set({ paso: n }),

  // ── Paso 1 ──

  setDatosGenerales: (data) => set((s) => ({ ...s, ...data })),

  // ── Paso 2 ──

  toggleLinea: (svc) =>
    set((s) => {
      const isActive = s.lineas.includes(svc)
      if (isActive) {
        // Desactivar: limpiar items y obs de esta línea
        const newLineas = s.lineas.filter((l) => l !== svc)
        const newItems = cloneItems(s.items)
        delete newItems[svc]
        const newObs = { ...s.obs_plantillas }
        delete newObs[svc]
        return { lineas: newLineas, items: newItems, obs_plantillas: newObs }
      } else {
        return { lineas: [...s.lineas, svc] }
      }
    }),

  // ── Paso 3 ──

  initItemsFromBiblioteca: (biblioteca) =>
    set((s) => {
      // Construir mapa: nombre de línea → BibliotecaLinea
      const bibMap = new Map(biblioteca.map((l) => [l.nombre, l]))
      const newItems = cloneItems(s.items)

      for (const svc of s.lineas) {
        if (newItems[svc]) {
          // Ya existe → conservar ediciones previas del usuario
          continue
        }
        const linea = bibMap.get(svc)
        if (!linea) continue

        // Poblar desde biblioteca con sel=false en todo
        newItems[svc] = {}
        for (const grupo of linea.grupos) {
          newItems[svc][grupo.id] = bibliotecaGrupoToWizard(grupo)
        }
      }

      return { items: newItems }
    }),

  toggleGrupo: (svc, gid, checked) =>
    set((s) => {
      const newItems = cloneItems(s.items)
      const grupo = newItems[svc]?.[gid]
      if (!grupo) return s
      grupo.sel = checked
      grupo.items.forEach((item) => { item.sel = checked })
      return { items: newItems }
    }),

  toggleItem: (svc, gid, idx, checked) =>
    set((s) => {
      const newItems = cloneItems(s.items)
      const grupo = newItems[svc]?.[gid]
      if (!grupo || !grupo.items[idx]) return s
      grupo.items[idx].sel = checked
      // Recalcular sel del grupo: true solo si TODOS los ítems están seleccionados
      grupo.sel = grupo.items.every((item) => item.sel)
      return { items: newItems }
    }),

  updateItemField: (svc, gid, idx, field, val) =>
    set((s) => {
      const newItems = cloneItems(s.items)
      const item = newItems[svc]?.[gid]?.items[idx]
      if (!item) return s
      // TypeScript sabe que field no es 'extra_cols' ni 'sel', así que es string
      ;(item as unknown as Record<string, unknown>)[field] = val
      return { items: newItems }
    }),

  updateItemExtraCol: (svc, gid, idx, colId, val) =>
    set((s) => {
      const newItems = cloneItems(s.items)
      const item = newItems[svc]?.[gid]?.items[idx]
      if (!item) return s
      item.extra_cols = { ...item.extra_cols, [colId]: val }
      return { items: newItems }
    }),

  // ── Paso 3: paqueteadora ──

  setPaqueteadora: (val) => set({ paqueteadora: val }),

  // ── Paso 2: tarifa tipo / especial ──

  setTarifaTipo: (svc, tipo) =>
    set((s) => ({ tarifa_tipo: { ...s.tarifa_tipo, [svc]: tipo } })),

  setTarifaEspecialId: (svc, id) =>
    set((s) => ({ tarifa_especial_id: { ...s.tarifa_especial_id, [svc]: id } })),

  // ── Paso 4 ──

  toggleObsPlantilla: (svc, obsId) =>
    set((s) => {
      const current = s.obs_plantillas[svc] ?? []
      const updated = current.includes(obsId)
        ? current.filter((id) => id !== obsId)
        : [...current, obsId]
      return { obs_plantillas: { ...s.obs_plantillas, [svc]: updated } }
    }),

  setObsLibre: (text) => set({ obs_libre: text }),

  // ── Lifecycle ──

  resetWizard: () => set({ ...INITIAL_STATE, fecha: today() }),

  loadFromCotizacion: (cot, biblioteca) => {
    // Construir mapa de grupo_id → nombre desde la biblioteca actual
    // para cubrir casos donde el snapshot no tenga el campo nombre en el grupo
    const grupoNombres = new Map<string, string>()
    for (const linea of biblioteca) {
      for (const grupo of linea.grupos) {
        grupoNombres.set(grupo.id, grupo.nombre)
      }
    }

    // Reconstruir ItemsMap desde items_snapshot, asegurando que WizardGrupo
    // tenga el campo `nombre` (puede no estar en snapshots antiguos)
    const items: ItemsMap = {}
    for (const [svc, grupos] of Object.entries(cot.items_snapshot)) {
      items[svc] = {}
      for (const [gid, grupo] of Object.entries(grupos)) {
        items[svc][gid] = {
          sel: grupo.sel,
          nombre: grupo.nombre || grupoNombres.get(gid) || '',
          items: grupo.items.map((item): WizardItem => ({
            sel: item.sel,
            nombre: item.nombre,
            tarifa: item.tarifa,
            tipo_tarifa: item.tipo_tarifa,
            obs: item.obs,
            extra_cols: { ...item.extra_cols },
          })),
        }
      }
    }

    set({
      id: cot.id,
      numero: cot.numero,
      paso: 1,
      empresa: cot.empresa,
      nit: cot.nit ?? '',
      record_id: cot.record_id,
      contacto: cot.contacto ?? '',
      cargo: cot.cargo ?? '',
      email: cot.email ?? '',
      telefono: cot.telefono ?? '',
      comercial_id: cot.comercial_id ?? '',
      fecha: cot.fecha,
      vigencia: cot.vigencia,
      estado: cot.estado,
      asunto: cot.asunto ?? '',
      lineas: [...cot.lineas],
      items,
      obs_plantillas: structuredClone(cot.obs_plantillas),
      obs_libre: cot.obs_libre ?? '',
      paqueteadora: cot.paqueteadora ?? null,
      tarifa_tipo: cot.tarifa_tipo ?? {},
      tarifa_especial_id: cot.tarifa_especial_id ?? {},
    })
  },
}))

// ─────────────────────────────────────────────────────────
// Selector: construye el payload listo para POST/PUT al backend
// Uso: const payload = buildCotPayload(useCotWizardStore.getState())
// ─────────────────────────────────────────────────────────

export function buildCotPayload(s: CotWizardStore) {
  return {
    empresa: s.empresa,
    nit: s.nit || null,
    record_id: s.record_id || null,
    contacto: s.contacto || null,
    cargo: s.cargo || null,
    email: s.email || null,
    telefono: s.telefono || null,
    comercial_id: s.comercial_id || null,
    fecha: s.fecha,
    vigencia: s.vigencia,
    estado: s.estado,
    asunto: s.asunto || null,
    lineas: s.lineas,
    items_snapshot: s.items,
    obs_plantillas: s.obs_plantillas,
    obs_libre: s.obs_libre || null,
    paqueteadora: s.paqueteadora || null,
    tarifa_tipo: s.tarifa_tipo,
    tarifa_especial_id: s.tarifa_especial_id,
  }
}
