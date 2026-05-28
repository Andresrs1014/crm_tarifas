import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { importRecords } from '../api/records'
import { toast } from '../store/toastStore'

// ─── Plantilla descargable ─────────────────────────────────────────────────────

const TEMPLATE_COLS = [
  'tipo', 'empresa', 'nit', 'ciudad', 'comercialNombre',
  'estadoProspecto', 'estadoCliente', 'fecha', 'observaciones', 'servicios', 'valor',
]

const TEMPLATE_EXAMPLE = [
  ['prospecto', 'Empresa ABC', '900.123.456-7', 'Bogotá', 'Juan Pérez',
   'propuesta', '', '2024-06-01', 'Cliente potencial zona franca', 'Zona Franca,Aduana', ''],
  ['cliente', 'Empresa XYZ', '800.456.789-1', 'Medellín', 'María López',
   '', 'activo', '2024-05-15', '', 'CEDI,Transporte', '5000000'],
]

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLS, ...TEMPLATE_EXAMPLE])

  // Anchos de columna
  ws['!cols'] = TEMPLATE_COLS.map((col) => ({
    wch: col === 'observaciones' ? 30 : col === 'empresa' ? 25 : 18,
  }))

  XLSX.utils.book_append_sheet(wb, ws, 'Registros')
  XLSX.writeFile(wb, 'plantilla_importacion_crm.xlsx')
}

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface PreviewRow {
  [key: string]: string | number | null
}

interface ImportResult {
  imported: number
  errors: string[]
}

// ─── Pasos ─────────────────────────────────────────────────────────────────────

const STEPS = ['Plantilla', 'Subir archivo', 'Vista previa', 'Resultado']

// ─── Componente ────────────────────────────────────────────────────────────────

export default function ImportWizard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState<'prospecto' | 'cliente'>('prospecto')
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Leer Excel en el frontend para preview
  function handleFile(f: File) {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<PreviewRow>(ws, { defval: '' })
      if (rows.length > 0) {
        setHeaders(Object.keys(rows[0]))
        setPreview(rows.slice(0, 10))
      }
      setStep(2)
    }
    reader.readAsArrayBuffer(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      handleFile(f)
    } else {
      toast.error('Solo se aceptan archivos Excel (.xlsx, .xls)')
    }
  }

  const importMut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Sin archivo')
      return importRecords(file, tipo)
    },
    onSuccess: (data: ImportResult) => {
      qc.invalidateQueries({ queryKey: ['records'] })
      setResult(data)
      setStep(3)
    },
    onError: () => toast.error('Error al importar el archivo'),
  })

  // ─── Render por paso ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <button onClick={() => navigate('/registro')} className="text-xs text-muted hover:text-foreground mb-2">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-foreground">Importar registros</h1>
        <p className="text-sm text-muted mt-0.5">Carga masiva desde Excel — prospectos o clientes</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 text-xs font-semibold ${
              i === step ? 'text-accent' : i < step ? 'text-success' : 'text-muted'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0 ${
                i === step ? 'border-accent bg-accent/10 text-accent'
                : i < step ? 'border-success bg-success/10 text-success'
                : 'border-border text-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-success/40' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── PASO 0: Plantilla ────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Descarga la plantilla oficial</h3>
            <p className="text-sm text-muted">
              Usa la plantilla para asegurarte de que las columnas tengan los nombres correctos.
              El sistema reconoce las siguientes columnas:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { col: 'tipo', req: true, desc: '"prospecto" o "cliente"' },
                { col: 'empresa', req: true, desc: 'Razón social' },
                { col: 'nit', req: false, desc: 'NIT de la empresa' },
                { col: 'ciudad', req: false, desc: 'Ciudad de la empresa' },
                { col: 'comercialNombre', req: false, desc: 'Nombre exacto del comercial' },
                { col: 'estadoProspecto', req: false, desc: 'prospecto, propuesta, etc.' },
                { col: 'estadoCliente', req: false, desc: 'activo, en-riesgo, inactivo' },
                { col: 'fecha', req: false, desc: 'YYYY-MM-DD' },
                { col: 'observaciones', req: false, desc: 'Texto libre' },
                { col: 'servicios', req: false, desc: 'Separados por coma' },
                { col: 'valor', req: false, desc: 'Número sin formato' },
              ].map(({ col, req, desc }) => (
                <div key={col} className="p-2.5 rounded-lg bg-surface2 border border-border">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <code className="text-xs font-mono text-accent">{col}</code>
                    {req && <span className="text-2xs text-danger font-bold">*</span>}
                  </div>
                  <p className="text-2xs text-muted">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary btn-sm" onClick={downloadTemplate}>
                ⬇ Descargar plantilla .xlsx
              </button>
              <button className="btn-secondary btn-sm" onClick={() => setStep(1)}>
                Ya tengo la plantilla →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 1: Subir archivo ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Tipo */}
          <div className="card p-5 space-y-3">
            <label className="text-xs font-bold text-muted uppercase tracking-widest">Tipo de registro a importar</label>
            <div className="flex gap-3">
              {(['prospecto', 'cliente'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all capitalize ${
                    tipo === t
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'border-border text-muted hover:border-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-5xl mb-3">📂</div>
            <p className="font-semibold text-foreground mb-1">
              {dragOver ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
            </p>
            <p className="text-sm text-muted mb-4">o haz clic para seleccionar</p>
            <p className="text-xs text-muted/60">.xlsx o .xls — máx. 20 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </div>

          <div className="flex justify-between">
            <button className="btn-secondary btn-sm" onClick={() => setStep(0)}>← Atrás</button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Vista previa ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Vista previa</h3>
                <p className="text-xs text-muted mt-0.5">
                  Archivo: <span className="font-mono text-accent">{file?.name}</span> · Mostrando primeras {preview.length} filas
                </p>
              </div>
              <button
                className="btn-ghost btn-sm text-xs"
                onClick={() => { setStep(1); setFile(null); setPreview([]); setHeaders([]) }}
              >
                Cambiar archivo
              </button>
            </div>

            {preview.length === 0 ? (
              <p className="text-sm text-danger">El archivo parece estar vacío o sin datos válidos.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="text-xs w-full">
                  <thead className="bg-surface2">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-muted whitespace-nowrap">
                          {h}
                          {(h === 'tipo' || h === 'empresa') && (
                            <span className="ml-1 text-danger">*</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {headers.map((h) => (
                          <td key={h} className="px-3 py-1.5 text-foreground whitespace-nowrap max-w-32 truncate"
                            title={String(row[h] ?? '')}>
                            {String(row[h] ?? '') || <span className="text-muted/40">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Validación básica columnas requeridas */}
            {preview.length > 0 && !headers.includes('tipo') && (
              <div className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-2 text-sm text-danger">
                ⚠ Columna <code className="font-mono">tipo</code> no encontrada. Verifica que uses la plantilla oficial.
              </div>
            )}
            {preview.length > 0 && !headers.includes('empresa') && (
              <div className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-2 text-sm text-danger">
                ⚠ Columna <code className="font-mono">empresa</code> no encontrada. Verifica que uses la plantilla oficial.
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button className="btn-secondary btn-sm" onClick={() => setStep(1)}>← Atrás</button>
            <button
              className="btn-primary btn-sm"
              disabled={preview.length === 0 || !headers.includes('tipo') || !headers.includes('empresa') || importMut.isPending}
              onClick={() => importMut.mutate()}
            >
              {importMut.isPending
                ? 'Importando...'
                : `Importar como ${tipo}s`}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Resultado ─────────────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="card p-6 space-y-5">
            {/* Resumen */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-success">{result.imported}</p>
                <p className="text-xs text-muted mt-1">Registros importados</p>
              </div>
              {result.errors.length > 0 && (
                <div className="text-center">
                  <p className="text-4xl font-bold text-danger">{result.errors.length}</p>
                  <p className="text-xs text-muted mt-1">Filas con errores</p>
                </div>
              )}
            </div>

            {result.imported > 0 && (
              <div className="rounded-lg border border-success/40 bg-success/5 px-4 py-3 text-sm text-success">
                ✓ {result.imported} {tipo}{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''} correctamente.
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-danger uppercase tracking-widest">Errores encontrados</p>
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-danger font-mono">{err}</p>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Corrige los errores en el archivo y vuelve a importar solo las filas con problemas.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                className="btn-primary btn-sm"
                onClick={() => navigate(tipo === 'prospecto' ? '/prospectos' : '/clientes')}
              >
                Ver {tipo}s →
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setStep(0); setFile(null); setPreview([])
                  setHeaders([]); setResult(null)
                }}
              >
                Importar otro archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
