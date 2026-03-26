import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { getCotPublicaApi } from '../api/cotizaciones'
import { getBibliotecaApi } from '../api/biblioteca'
import { buildCotHTML } from '../utils/cotizacion'
import { fmtDate } from '../utils/format'
import type { Comercial } from '../types'

export default function CotPublica() {
  const { numero } = useParams<{ numero: string }>()

  const { data: cot, isLoading: loadingCot, isError } = useQuery({
    queryKey: ['cot-publica', numero],
    queryFn: () => getCotPublicaApi(numero!),
    enabled: !!numero,
    retry: false,
  })

  const { data: biblioteca = [] } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBibliotecaApi,
    staleTime: 1000 * 60 * 5,
  })

  // Notificación EmailJS al abrir
  useEffect(() => {
    if (!cot) return
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    if (!serviceId || !templateId || !publicKey) return

    import('@emailjs/browser').then(({ default: emailjs }) => {
      emailjs.send(serviceId, templateId, {
        numero_cot: cot.numero,
        empresa: cot.empresa,
        contacto: cot.contacto ?? '',
        asunto: cot.asunto ?? '',
        lineas: cot.lineas.join(', '),
        fecha_hora: new Date().toLocaleString('es-CO'),
      }, publicKey).catch(() => { /* silenciar error de emailjs */ })
    }).catch(() => { /* emailjs no instalado — ignorar */ })
  }, [cot])

  if (loadingCot) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f4f6fb' }}
      >
        <p style={{ color: '#555', fontFamily: 'Barlow, sans-serif' }}>Cargando cotización...</p>
      </div>
    )
  }

  if (isError || !cot) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f4f6fb' }}
      >
        <div className="text-center" style={{ fontFamily: 'Barlow, sans-serif' }}>
          <p style={{ color: '#002366', fontSize: 20, fontWeight: 700 }}>Cotización no encontrada</p>
          <p style={{ color: '#888', marginTop: 8 }}>
            Verifica que el enlace sea correcto o contacta a tu asesor comercial.
          </p>
        </div>
      </div>
    )
  }

  // Para la vista pública, construimos un objeto Comercial mínimo
  // (la cotización no incluye el objeto comercial completo, solo el ID)
  // Se usará el nombre del comercial si está en el items_snapshot o dejamos null
  const comercialFallback: Comercial | null = null

  const html = buildCotHTML(
    {
      numero: cot.numero,
      empresa: cot.empresa,
      nit: cot.nit ?? '',
      contacto: cot.contacto ?? '',
      cargo: cot.cargo ?? '',
      email: cot.email ?? '',
      telefono: cot.telefono ?? '',
      fecha: cot.fecha,
      vigencia: cot.vigencia,
      asunto: cot.asunto ?? '',
      lineas: cot.lineas,
      items: cot.items_snapshot,
      obs_plantillas: cot.obs_plantillas,
      obs_libre: cot.obs_libre ?? '',
    },
    comercialFallback,
    biblioteca
  )

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100vh', padding: '32px 16px' }}>
      {/* Barra superior */}
      <div
        className="print-hide"
        style={{
          maxWidth: 820,
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#002366', fontSize: 18 }}>
            {cot.numero}
          </p>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#888' }}>
            Válida hasta: {fmtDate(cot.vigencia)}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            background: '#002366',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Printer size={15} /> Imprimir / PDF
        </button>
      </div>

      {/* Cotización */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
