import type { BibliotecaItem, BibliotecaLinea, Cotizacion } from '../../types'
import {
  type CotItemsSnapshot,
  type CotSnapshotItem,
  getSchemaForGrupo,
  mergeSchemaCampos,
  parseGrupoNombre,
  resolveGrupoSnapshotItems,
  resolveSchemaFieldValue,
  resolveSchemaToggleValue,
} from '../cotizacion/snapshot'

export interface PreliqItem {
  id: string
  nombre: string
  tarifa: string
  tipoTarifa: 'moneda' | 'porcentaje'
  obs?: string
  _grupo: string
  _linea: string
}

const TARIFA_COL_TYPES = new Set(['tarifa', 'tarifa-mixta', 'tarifa-texto', 'moneda', 'porcentaje'])

const TARIFA_PRIORITY = [
  'viaje4h', 'unaHora', 'viaje8h', 'horaAdc', 'minima',
  'minFlete', 'manejo', 'pctManejo', 'primerDoc', 'copiaAdc',
]

function isTarifaCol(tipo: string): boolean {
  return TARIFA_COL_TYPES.has(tipo)
}

function resolvePrimaryTarifa(
  campos: Record<string, string>,
  tiposCampo: Record<string, string>,
  cols: { id: string; tipo: string }[],
): { tarifa: string; tipoTarifa: 'moneda' | 'porcentaje' } {
  for (const id of TARIFA_PRIORITY) {
    const val = resolveSchemaFieldValue(campos, id)
    if (val) {
      const toggle = resolveSchemaToggleValue(tiposCampo, id, campos)
      return { tarifa: val, tipoTarifa: toggle === 'porcentaje' ? 'porcentaje' : 'moneda' }
    }
  }

  for (const col of cols) {
    if (!isTarifaCol(col.tipo)) continue
    const val = resolveSchemaFieldValue(campos, col.id)
    if (val) {
      const toggle = resolveSchemaToggleValue(tiposCampo, col.id, campos)
      return { tarifa: val, tipoTarifa: toggle === 'porcentaje' ? 'porcentaje' : 'moneda' }
    }
  }

  return { tarifa: '0', tipoTarifa: 'moneda' }
}

function resolveSchemaNombre(
  campos: Record<string, string>,
  cols: { id: string; tipo: string }[],
): string {
  for (const id of ['tipoVehiculo', 'servicio', 'trayecto']) {
    const val = resolveSchemaFieldValue(campos, id)
    if (val) return val
  }

  for (const col of cols) {
    if (col.tipo !== 'texto' && col.tipo !== 'numero') continue
    const val = resolveSchemaFieldValue(campos, col.id)
    if (val) return val
  }

  return 'Sin nombre'
}

function snapshotItemToPreliqItem(
  item: CotSnapshotItem,
  grupoLabel: string,
  linea: string,
  bibItem: BibliotecaItem | undefined,
  schema: ReturnType<typeof getSchemaForGrupo>,
): PreliqItem {
  if (schema) {
    const { campos, tiposCampo } = mergeSchemaCampos(item, bibItem)
    const { tarifa, tipoTarifa } = resolvePrimaryTarifa(campos, tiposCampo, schema.cols)
    return {
      id: item.id,
      nombre: resolveSchemaNombre(campos, schema.cols),
      tarifa,
      tipoTarifa,
      obs: item.obs,
      _grupo: grupoLabel,
      _linea: linea,
    }
  }

  return {
    id: item.id,
    nombre: item.nombre?.trim() || 'Sin nombre',
    tarifa: item.tarifa || '0',
    tipoTarifa: item.tipoTarifa === 'porcentaje' ? 'porcentaje' : 'moneda',
    obs: item.obs,
    _grupo: grupoLabel,
    _linea: linea,
  }
}

/** Extrae ítems preliquidables desde snapshot + biblioteca (Transporte/Paqueteo incluidos). */
export function getPreliqItemsFromCot(
  cot: Cotizacion,
  biblioteca: BibliotecaLinea[],
): PreliqItem[] {
  const snap = cot.itemsSnapshot as CotItemsSnapshot
  const result: PreliqItem[] = []
  const seenIds = new Set<string>()

  for (const lineaNombre of cot.lineas ?? []) {
    const linea = biblioteca.find((l) => l.nombre === lineaNombre)
    const lineSnap = snap[lineaNombre]
    if (!lineSnap) continue

    if (linea) {
      const claimed = new Set<string>()
      const grupos = [...linea.grupos].sort((a, b) => a.orden - b.orden)

      for (const grupo of grupos) {
        const items = resolveGrupoSnapshotItems(lineSnap, grupo, linea, claimed)
        const { display } = parseGrupoNombre(grupo.nombre)
        const grupoLabel = display || grupo.nombre
        const schema = getSchemaForGrupo(linea, grupo)
        const bibById = new Map(grupo.items.map((i) => [i.id, i]))

        for (const item of items) {
          if (seenIds.has(item.id)) continue
          seenIds.add(item.id)
          result.push(snapshotItemToPreliqItem(item, grupoLabel, lineaNombre, bibById.get(item.id), schema))
        }
      }

      for (const [key, raw] of Object.entries(lineSnap)) {
        if (claimed.has(key) || !Array.isArray(raw)) continue
        for (const item of raw) {
          if (item?.sel === false || seenIds.has(item.id)) continue
          seenIds.add(item.id)
          result.push(snapshotItemToPreliqItem(item, key, lineaNombre, undefined, null))
        }
      }
    } else {
      for (const [grupo, items] of Object.entries(lineSnap)) {
        if (!Array.isArray(items)) continue
        for (const item of items) {
          if (item?.sel === false || seenIds.has(item.id)) continue
          seenIds.add(item.id)
          result.push(snapshotItemToPreliqItem(item, grupo, lineaNombre, undefined, null))
        }
      }
    }
  }

  return result
}
