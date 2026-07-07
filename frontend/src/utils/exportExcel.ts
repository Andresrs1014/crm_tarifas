import * as XLSX from 'xlsx'
import type { BibliotecaLinea, CRMRecord, Cotizacion, TarifaEspecialGrupoMeta } from '../types'
import type { CotItemsSnapshot, CotSnapshotItem } from '../lib/cotizacion/snapshot'
import { isItemSelected } from '../lib/cotizacion/snapshot'

export function exportRecordsExcel(records: CRMRecord[], filename = 'registros.xlsx') {
  const rows = records.map((r) => ({
    Empresa: r.empresa,
    NIT: r.nit || '',
    Ciudad: r.ciudad || '',
    Estado: r.tipo === 'prospecto' ? (r.estadoProspecto || '') : (r.estadoCliente || ''),
    Categoría: r.categoria || '',
    Comercial: r.comercial?.nombre || '',
    'Tipo Cliente': r.tipoCliente,
    Servicios: r.servicios.join(', '),
    'Valor Propuesta': r.valorP || 0,
    'Valor Facturado': r.valor || 0,
    'Ingresos Esperados': r.ingresosEsperados || 0,
    Visita: r.visita || '',
    'Próximo Seguimiento': r.proximoSeguimiento
      ? new Date(r.proximoSeguimiento).toLocaleDateString('es-CO')
      : '',
    'Fecha Registro': new Date(r.fecha).toLocaleDateString('es-CO'),
    Observaciones: r.observaciones || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Auto-width columns
  const colWidths = Object.keys(rows[0] ?? {}).map((k) => ({
    wch: Math.max(k.length, ...rows.map((r) => String(r[k as keyof typeof r] ?? '').length)) + 2,
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Registros')
  XLSX.writeFile(wb, filename)
}

export function exportCotizacionesExcel(cotizaciones: Cotizacion[], filename = 'cotizaciones.xlsx') {
  const rows = cotizaciones.map((c) => ({
    Número: c.numero,
    Empresa: c.empresa,
    NIT: c.nit || '',
    Ciudad: c.ciudad || '',
    Contacto: c.contacto || '',
    Comercial: c.comercial,
    Estado: c.estado,
    Líneas: c.lineas.join(', '),
    'Tipo Tarifa': c.tarifaTipo,
    'Fecha Creación': new Date(c.createdAt).toLocaleDateString('es-CO'),
    'Última Actualización': new Date(c.updatedAt).toLocaleDateString('es-CO'),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  const colWidths = Object.keys(rows[0] ?? {}).map((k) => ({
    wch: Math.max(k.length, ...rows.map((r) => String(r[k as keyof typeof r] ?? '').length)) + 2,
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones')
  XLSX.writeFile(wb, filename)
}

function itemTarifaValue(item: CotSnapshotItem): string {
  if (item.tarifa) return item.tarifa
  return Object.values(item.campos ?? {}).find(Boolean) ?? ''
}

/** Excel detallado de una cotización — una hoja por línea (Grupo/Servicio/Tarifa/Tipo/Obs) + hoja Resumen. */
export function exportCotizacionDetalladoExcel(
  input: {
    numero: string
    empresa: string
    nit?: string
    contacto?: string
    fecha?: string
    vigencia?: string
    estado?: string
    comercial: string
    lineas: string[]
    itemsSnapshot: CotItemsSnapshot
    tarifaTipoPorLinea?: Record<string, string>
    tarifaEspecialGrupos?: Record<string, TarifaEspecialGrupoMeta[]>
  },
  biblioteca: BibliotecaLinea[],
  filename?: string,
) {
  const wb = XLSX.utils.book_new()

  for (const lineaNombre of input.lineas) {
    const rows: (string | number)[][] = [['Grupo', 'Servicio', 'Tarifa', 'Tipo', 'Observación']]
    const lineSnap = input.itemsSnapshot[lineaNombre]
    const isEspecial = input.tarifaTipoPorLinea?.[lineaNombre] === 'especial'

    if (isEspecial) {
      for (const meta of input.tarifaEspecialGrupos?.[lineaNombre] ?? []) {
        const items = (lineSnap?.[meta.gid] ?? []).filter(isItemSelected)
        for (const item of items) {
          rows.push([meta.nombre, item.nombre, itemTarifaValue(item), item.tipoTarifa === 'porcentaje' ? '%' : '$', item.obs ?? ''])
        }
      }
    } else {
      const linea = biblioteca.find((l) => l.nombre === lineaNombre)
      for (const grupo of [...(linea?.grupos ?? [])].sort((a, b) => a.orden - b.orden)) {
        const items = (lineSnap?.[grupo.id] ?? lineSnap?.[grupo.nombre] ?? []).filter(isItemSelected)
        for (const item of items) {
          rows.push([grupo.nombre, item.nombre, itemTarifaValue(item), item.tipoTarifa === 'porcentaje' ? '%' : '$', item.obs ?? ''])
        }
      }
    }

    if (rows.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 28 }, { wch: 42 }, { wch: 16 }, { wch: 10 }, { wch: 44 }]
      XLSX.utils.book_append_sheet(wb, ws, lineaNombre.slice(0, 31))
    }
  }

  const resumen = [
    ['COTIZACIÓN', input.numero || 'BORRADOR'],
    ['Empresa', input.empresa || ''],
    ['NIT', input.nit || ''],
    ['Contacto', input.contacto || ''],
    ['Fecha', input.fecha || ''],
    ['Vigencia', input.vigencia || ''],
    ['Estado', input.estado || ''],
    ['Comercial', input.comercial || ''],
  ]
  const wsRes = XLSX.utils.aoa_to_sheet(resumen)
  wsRes['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen')

  XLSX.writeFile(wb, filename || `${input.numero || 'Cotizacion'}_${input.empresa || 'ZYMO'}.xlsx`)
}
