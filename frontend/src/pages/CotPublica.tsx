import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileX, Loader2, Printer } from 'lucide-react'
import { getCotizacionPublica } from '../api/cotizaciones'
import { getBiblioteca } from '../api/biblioteca'
import { buildCotHTML, flattenSnapshot } from '../lib/cotizacion/buildCotHTML'

export default function CotPublica() {
  const { numero } = useParams<{ numero: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cot-publica', numero],
    queryFn: () => getCotizacionPublica(numero!),
    enabled: !!numero,
  })

  const { data: biblioteca = [] } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBiblioteca,
    enabled: !!data,
  })

  const htmlPreview = useMemo(() => {
    if (!data) return ''
    if (biblioteca.length) {
      return buildCotHTML({
        numero: data.numero,
        fecha: data.createdAt,
        empresa: data.empresa,
        nit: data.nit,
        ciudad: data.ciudad,
        contacto: data.contacto,
        email: data.email,
        comercial: data.comercial,
        paqueteadora: data.paqueteadora,
        lineas: data.lineas,
        itemsSnapshot: flattenSnapshot(data.itemsSnapshot),
        obsHtml: data.obsHtml,
        obsLibre: data.obsLibre,
      }, biblioteca)
    }
    return data.htmlPreview || `<h1>${data.numero}</h1><p>${data.empresa}</p>`
  }, [data, biblioteca])

  if (isLoading) {
    return (
      <div className="cot-publica-shell flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden />
          Cargando propuesta comercial…
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="cot-publica-shell flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <FileX className="mx-auto mb-4 h-12 w-12 text-muted" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground">Cotización no disponible</h1>
          <p className="mt-2 text-sm text-muted">
            Verifique el enlace recibido o contacte a su ejecutivo comercial.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="cot-publica-shell min-h-screen pb-10">
      <header className="mx-auto flex w-full max-w-[820px] items-center justify-between gap-4 px-4 pb-4 pt-6 print:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Propuesta comercial
          </p>
          <p className="font-display text-base font-bold text-foreground">{data.numero}</p>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm inline-flex items-center gap-2"
          onClick={() => window.print()}
          aria-label="Descargar o imprimir cotización en PDF"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Descargar / Imprimir PDF
        </button>
      </header>

      <div
        id="cot-print-area"
        className="mx-auto w-full max-w-[820px] px-4 print:max-w-none print:px-0"
        dangerouslySetInnerHTML={{ __html: htmlPreview }}
      />
    </div>
  )
}
