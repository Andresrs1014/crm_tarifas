import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Save, Send } from 'lucide-react'
import { useCotWizardStore } from '../../store/cotWizardStore'
import { getComercialesApi } from '../../api/comerciales'
import { buildCotHTML } from '../../utils/cotizacion'
import type { BibliotecaLinea } from '../../types'

interface Props {
  biblioteca: BibliotecaLinea[]
  onSave: (estado?: string) => Promise<void>
}

export default function Paso5({ biblioteca, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const s = useCotWizardStore()

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const comercial = comerciales.find((c) => c.id === s.comercial_id) ?? null

  const html = buildCotHTML(
    {
      numero: s.numero,
      empresa: s.empresa,
      nit: s.nit,
      contacto: s.contacto,
      cargo: s.cargo,
      email: s.email,
      telefono: s.telefono,
      fecha: s.fecha,
      vigencia: s.vigencia,
      asunto: s.asunto,
      lineas: s.lineas,
      items: s.items,
      obs_plantillas: s.obs_plantillas,
      obs_libre: s.obs_libre,
    },
    comercial,
    biblioteca
  )

  const handleSave = async (estado?: string) => {
    setSaving(true)
    try {
      await onSave(estado)
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      {/* Acciones */}
      <div className="print-hide flex gap-3 mb-6 justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted hover:text-white transition border border-border"
        >
          <Printer size={15} /> Exportar PDF
        </button>
        <button
          onClick={() => handleSave('borrador')}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted hover:text-white transition border border-border disabled:opacity-50"
        >
          <Save size={15} /> Guardar borrador
        </button>
        <button
          onClick={() => handleSave('enviada')}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}
        >
          <Send size={15} /> Guardar y enviar
        </button>
      </div>

      {/* Vista previa */}
      <div
        className="rounded-xl overflow-hidden border border-border"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
