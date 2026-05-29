import * as XLSX from 'xlsx'
import type { CRMRecord, Cotizacion } from '../types'

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
