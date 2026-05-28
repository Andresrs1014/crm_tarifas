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
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: '#0a0e1a' }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border border-border p-10"
        style={{ background: '#111827' }}
        dangerouslySetInnerHTML={{ __html: data.htmlPreview || `<h1>${data.numero}</h1><p>${data.empresa}</p>` }}
      />
    </div>
  )
}
