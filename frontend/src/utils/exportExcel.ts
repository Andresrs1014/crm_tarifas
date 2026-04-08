import * as XLSX from 'xlsx'
import type { RecordRead } from '../types'

function fmtNum(v: number | null | undefined) {
  return v ?? 0
}

function fmtList(arr: string[]) {
  return arr.join(', ')
}

export function exportProspectos(records: RecordRead[], comerciales: { id: string; nombre: string }[]) {
  const comMap = Object.fromEntries(comerciales.map((c) => [c.id, c.nombre]))
  const data = records.map((r) => ({
    Empresa: r.empresa,
    NIT: r.nit ?? '',
    Ciudad: r.ciudad ?? '',
    Contacto: r.contacto_nombre ?? '',
    Comercial: r.comercial_id ? (comMap[r.comercial_id] ?? r.comercial_id) : '',
    Servicios: fmtList(r.servicios),
    Categoría: r.categoria ?? '',
    'Tipo cliente': r.tipo_cliente,
    Visita: r.visita ?? '',
    'Fecha visita': r.fecha_visita ?? '',
    Estado: r.estado_prospecto ?? '',
    '¿Facturado?': r.facturado_p ?? '',
    'Valor (COP)': fmtNum(r.valor_p),
    'Próx. seguimiento': r.proximo_seguimiento ?? '',
    'Fecha registro': r.fecha,
    Observaciones: r.observaciones ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 20 },
    { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 40 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Prospectos')
  XLSX.writeFile(wb, `Prospectos_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportClientes(records: RecordRead[], comerciales: { id: string; nombre: string }[]) {
  const comMap = Object.fromEntries(comerciales.map((c) => [c.id, c.nombre]))
  const data = records.map((r) => ({
    Empresa: r.empresa,
    NIT: r.nit ?? '',
    Ciudad: r.ciudad ?? '',
    Contacto: r.contacto_nombre ?? '',
    Comercial: r.comercial_id ? (comMap[r.comercial_id] ?? r.comercial_id) : '',
    Servicios: fmtList(r.servicios),
    Categoría: r.categoria ?? '',
    'Tipo cliente': r.tipo_cliente,
    Visita: r.visita_cliente ?? '',
    'Fecha visita': r.fecha_visita_cliente ?? '',
    'Nuevo servicio': r.nuevo_servicio ?? '',
    'Servicio cerrado': r.servicio_nuevo ?? '',
    Estado: r.estado_cliente ?? '',
    '¿Facturado?': r.facturado ?? '',
    'Valor (COP)': fmtNum(r.valor),
    'Fecha registro': r.fecha,
    Observaciones: r.observaciones ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 20 },
    { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
    { wch: 14 }, { wch: 40 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  XLSX.writeFile(wb, `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportTodos(records: RecordRead[], comerciales: { id: string; nombre: string }[]) {
  const comMap = Object.fromEntries(comerciales.map((c) => [c.id, c.nombre]))
  const data = records.map((r) => ({
    Tipo: r.tipo,
    Empresa: r.empresa,
    NIT: r.nit ?? '',
    Ciudad: r.ciudad ?? '',
    Contacto: r.contacto_nombre ?? '',
    Comercial: r.comercial_id ? (comMap[r.comercial_id] ?? r.comercial_id) : '',
    Servicios: fmtList(r.servicios),
    Categoría: r.categoria ?? '',
    Estado: r.tipo === 'prospecto' ? (r.estado_prospecto ?? '') : (r.estado_cliente ?? ''),
    '¿Facturado?': r.tipo === 'prospecto' ? (r.facturado_p ?? '') : (r.facturado ?? ''),
    'Valor (COP)': fmtNum(r.tipo === 'prospecto' ? r.valor_p : r.valor),
    'Fecha registro': r.fecha,
    Observaciones: r.observaciones ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 20 },
    { wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 40 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Todos los registros')
  XLSX.writeFile(wb, `CRM_Export_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
