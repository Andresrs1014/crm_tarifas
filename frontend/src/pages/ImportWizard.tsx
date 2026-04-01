import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, ArrowLeft, ArrowRight, Check, AlertCircle, Inbox } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { importRecords } from '../api/records'
import { useToastStore } from '../store/toastStore'

const FIELD_OPTIONS = [
  { value: '', label: '— Ignorar —' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'nit', label: 'NIT' },
  { value: 'ciudad', label: 'Ciudad' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'servicios', label: 'Servicios (separados por coma)' },
  { value: 'estado', label: 'Estado' },
  { value: 'tipo', label: 'Tipo (prospecto / cliente)' },
  { value: 'observaciones', label: 'Observaciones' },
]

const AUTO_MAP: Record<string, string> = {
  empresa: 'empresa', company: 'empresa', 'razon social': 'empresa',
  razón: 'empresa', razon: 'empresa', nombre: 'empresa',
  nit: 'nit', identificacion: 'nit', identificación: 'nit', ruc: 'nit',
  ciudad: 'ciudad', city: 'ciudad',
  comercial: 'comercial', asesor: 'comercial', vendedor: 'comercial',
  representante: 'comercial', agente: 'comercial',
  servicios: 'servicios', services: 'servicios',
  interes: 'servicios', interés: 'servicios',
  estado: 'estado', status: 'estado',
  tipo: 'tipo', type: 'tipo',
  observaciones: 'observaciones', notas: 'observaciones',
  notes: 'observaciones', comentarios: 'observaciones',
}

type Mapping = Record<number, string>

interface ImportResult {
  created: number
  errors: Array<{ empresa: string; error: string }>
}

export default function ImportWizard() {
  const [searchParams] = useSearchParams()
  const tipoDefault = (searchParams.get('tipo') ?? 'prospecto') as 'prospecto' | 'cliente'

  const navigate = useNavigate()
  const toast = useToastStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Mapping>({})
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const allRows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
        if (allRows.length < 2) {
          toast.add('El archivo no tiene datos suficientes', 'error')
          return
        }
        const hdrs = allRows[0].map(String)
        const dataRows = allRows.slice(1).filter(r => r.some(cell => String(cell).trim()))
        setHeaders(hdrs)
        setRawRows(dataRows as string[][])
        const auto: Mapping = {}
        hdrs.forEach((h, i) => {
          const key = String(h).trim().toLowerCase()
          if (AUTO_MAP[key]) auto[i] = AUTO_MAP[key]
        })
        setMapping(auto)
        setStep(2)
      } catch {
        toast.add('Error al leer el archivo. Verifica que sea un .xlsx válido.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const buildRows = () => {
    return rawRows.map(row => {
      const obj: Record<string, unknown> = { tipo: tipoDefault }
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (!field) return
        const val = String(row[Number(colIdx)] ?? '').trim()
        if (!val) return
        if (field === 'servicios') {
          obj.servicios = val.split(',').map(s => s.trim()).filter(Boolean)
        } else if (field === 'estado') {
          if (tipoDefault === 'prospecto') obj.estado_prospecto = val.toLowerCase()
          else obj.estado_cliente = val.toLowerCase()
        } else if (field === 'tipo') {
          obj.tipo = val.toLowerCase() === 'cliente' ? 'cliente' : 'prospecto'
        } else if (field === 'comercial') {
          obj.comercial_nombre = val
        } else {
          obj[field] = val
        }
      })
      return obj
    })
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const rows = buildRows()
      const res = await importRecords(rows)
      setResult(res)
      setStep(3)
      if (res.created > 0) {
        toast.add(`${res.created} registros importados correctamente`)
      }
    } catch {
      toast.add('Error al conectar con el servidor', 'error')
    } finally {
      setImporting(false)
    }
  }

  const hasEmpresaCol = Object.values(mapping).includes('empresa')

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(tipoDefault === 'prospecto' ? '/prospectos' : '/clientes')}
          className="text-muted hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Carga masiva — {tipoDefault === 'prospecto' ? 'Prospectos' : 'Clientes'}
        </h1>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {['Subir archivo', 'Mapear columnas', 'Resultado'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > i + 1
                  ? 'bg-success text-white'
                  : step === i + 1
                  ? 'text-white'
                  : 'bg-surface2 text-muted'
              }`}
              style={step === i + 1 ? { background: '#00c2ff', color: '#0a0e1a' } : undefined}
            >
              {step > i + 1 ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'text-white' : 'text-muted'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Paso 1 — Subir archivo */}
      {step === 1 && (
        <div
          className="border-2 border-dashed border-border rounded-xl p-16 text-center hover:border-accent/50 transition cursor-pointer"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={40} className="mx-auto mb-4 text-muted" />
          <p className="text-white font-medium mb-2">Arrastra tu archivo Excel aquí</p>
          <p className="text-muted text-sm mb-6">Formato soportado: .xlsx — La primera fila debe contener los encabezados</p>
          <label
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            Seleccionar archivo
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </label>
        </div>
      )}

      {/* Paso 2 — Mapear columnas */}
      {step === 2 && (
        <div>
          <p className="text-muted text-sm mb-5">
            Archivo cargado con <span className="text-white font-medium">{rawRows.length} filas</span>.
            Asigna cada columna al campo del sistema correspondiente.
          </p>

          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left min-w-40 align-top">
                        <p className="text-xs text-muted uppercase tracking-wider font-condensed mb-2 whitespace-nowrap">{h}</p>
                        <select
                          className="text-xs w-full"
                          value={mapping[i] ?? ''}
                          onChange={e => setMapping(m => ({ ...m, [i]: e.target.value }))}
                        >
                          {FIELD_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.slice(0, 4).map((row, ri) => (
                    <tr key={ri} className="border-b border-border last:border-0">
                      {headers.map((_, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-muted text-xs truncate max-w-40">
                          {String(row[ci] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!hasEmpresaCol && (
            <p className="text-xs text-gold mb-4 flex items-center gap-1.5">
              <AlertCircle size={13} /> Debes mapear al menos la columna <strong>Empresa</strong> para continuar
            </p>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-white border border-border transition"
            >
              Atrás
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !hasEmpresaCol}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
              style={{ background: '#00c2ff', color: '#0a0e1a' }}
            >
              {importing
                ? 'Importando...'
                : <><ArrowRight size={15} /> Importar {rawRows.length} registros</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Paso 3 — Resultado */}
      {step === 3 && result && (
        <div>
          <div className="flex gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-6 text-center w-36">
              <p className="text-3xl font-bold font-condensed" style={{ color: '#00e676' }}>
                {result.created}
              </p>
              <p className="text-xs text-muted uppercase tracking-wider font-condensed mt-1">Creados</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-6 text-center w-36">
              <p
                className="text-3xl font-bold font-condensed"
                style={{ color: result.errors.length > 0 ? '#ff6b6b' : '#8899b4' }}
              >
                {result.errors.length}
              </p>
              <p className="text-xs text-muted uppercase tracking-wider font-condensed mt-1">Errores</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 max-w-2xl">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-condensed text-xs uppercase text-muted tracking-wider">
                  Registros con error (omitidos)
                </h3>
              </div>
              <div className="divide-y divide-border">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between text-sm gap-4">
                    <span style={{ color: '#e8edf5' }}>{e.empresa}</span>
                    <span className="text-danger text-xs shrink-0">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors.length === 0 && result.created === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted">
              <Inbox size={36} className="opacity-30" />
              <p className="text-sm">No se importó ningún registro. Revisa el archivo y las columnas mapeadas.</p>
            </div>
          )}

          <button
            onClick={() => navigate(tipoDefault === 'prospecto' ? '/prospectos' : '/clientes')}
            className="px-5 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            Volver a {tipoDefault === 'prospecto' ? 'Prospectos' : 'Clientes'}
          </button>
        </div>
      )}
    </PageContainer>
  )
}
