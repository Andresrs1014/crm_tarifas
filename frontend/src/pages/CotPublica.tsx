import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCotizacionPublica } from '../api/cotizaciones'

export default function CotPublica() {
  const { numero } = useParams<{ numero: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cot-publica', numero],
    queryFn: () => getCotizacionPublica(numero!),
    enabled: !!numero,
  })

  if (isLoading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-accent text-lg animate-pulse">Cargando cotización...</div>
    </div>
  )

  if (isError || !data) return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted">
      <div className="text-center">
        <div className="text-5xl mb-4">😔</div>
        <p>Cotización no encontrada</p>
      </div>
    </div>
  )

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-8 gap-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Toolbar — hidden on print */}
      <div className="w-full max-w-4xl flex justify-end gap-2 print:hidden">
        <button
          className="btn-secondary btn-sm"
          onClick={() => window.print()}
        >
          🖨 Imprimir / PDF
        </button>
      </div>

      <div
        id="cot-print-area"
        className="w-full max-w-4xl rounded-2xl border border-border p-10 print:border-0 print:p-0 print:rounded-none"
        style={{ background: 'var(--surface)' }}
        dangerouslySetInnerHTML={{ __html: data.htmlPreview || `<h1>${data.numero}</h1><p>${data.empresa}</p>` }}
      />
    </div>
  )
}
