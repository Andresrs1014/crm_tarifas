import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCotWizardStore, buildCotPayload } from '../../store/cotWizardStore'
import { getCotizacionApi, createCotizacionApi, updateCotizacionApi } from '../../api/cotizaciones'
import { getBibliotecaApi } from '../../api/biblioteca'
import { useToastStore } from '../../store/toastStore'
import Paso1 from './Paso1'
import Paso2 from './Paso2'
import Paso3 from './Paso3'
import Paso4 from './Paso4'
import Paso5 from './Paso5'

const PASOS = [
  { n: 1, label: 'Datos' },
  { n: 2, label: 'Líneas' },
  { n: 3, label: 'Ítems' },
  { n: 4, label: 'Obs.' },
  { n: 5, label: 'Preview' },
] as const

export default function WizardLayout() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToastStore()

  const paso = useCotWizardStore((s) => s.paso)
  const setPaso = useCotWizardStore((s) => s.setPaso)
  const initItems = useCotWizardStore((s) => s.initItemsFromBiblioteca)
  const loadFromCotizacion = useCotWizardStore((s) => s.loadFromCotizacion)
  const wizId = useCotWizardStore((s) => s.id)

  const { data: biblioteca = [] } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBibliotecaApi,
    staleTime: 1000 * 60 * 5, // 5 min — la biblioteca cambia poco
  })

  // Si es edición, cargar la cotización en el store
  const { isLoading: loadingCot } = useQuery({
    queryKey: ['cotizacion-edit', id],
    queryFn: () => getCotizacionApi(id!),
    enabled: isEdit && biblioteca.length > 0,
    staleTime: 0,
    gcTime: 0,
    select: (cot) => {
      // Solo cargar si el store no tiene ya esta cotización
      if (wizId !== cot.id) {
        loadFromCotizacion(cot, biblioteca)
      }
      return cot
    },
  })

  // Limpiar editor al desmontar si se navega fuera
  useEffect(() => {
    return () => { /* No resetear al desmontar — el usuario puede volver */ }
  }, [])

  const handleNext = () => {
    if (paso === 2) {
      // Al pasar a Paso 3: hidratar items desde biblioteca
      initItems(biblioteca)
    }
    if (paso < 5) setPaso((paso + 1) as 1 | 2 | 3 | 4 | 5)
  }

  const handleBack = () => {
    if (paso > 1) setPaso((paso - 1) as 1 | 2 | 3 | 4 | 5)
  }

  const handleSave = async (nuevoEstado?: string) => {
    const state = useCotWizardStore.getState()
    const payload = buildCotPayload(state)
    if (nuevoEstado) payload.estado = nuevoEstado as typeof payload.estado

    try {
      if (isEdit && state.id) {
        await updateCotizacionApi(state.id, payload as Record<string, unknown>)
        toast.add('Cotización actualizada')
      } else {
        const cot = await createCotizacionApi(payload as Record<string, unknown>)
        toast.add(`Cotización ${cot.numero} guardada`)
      }
      navigate('/cotizaciones')
    } catch {
      toast.add('Error al guardar', 'error')
    }
  }

  if (isEdit && loadingCot && wizId !== id) {
    return <div className="p-6 text-muted">Cargando cotización...</div>
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/cotizaciones')}
          className="text-muted hover:text-white text-sm transition"
        >
          ← Cotizaciones
        </button>
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          {isEdit ? 'Editar cotización' : 'Nueva cotización'}
        </h1>
      </div>

      {/* Barra de pasos */}
      <div className="flex items-center mb-8">
        {PASOS.map(({ n, label }, idx) => (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background:
                    n < paso ? '#a855f7' : n === paso ? '#00c2ff' : '#1e3050',
                  color: n === paso ? '#0a0e1a' : n < paso ? '#fff' : '#8899b4',
                  boxShadow: n === paso ? '0 0 12px rgba(0,194,255,0.5)' : 'none',
                }}
              >
                {n < paso ? '✓' : n}
              </div>
              <span
                className="text-xs mt-1.5 font-condensed tracking-wide"
                style={{ color: n === paso ? '#e8edf5' : '#8899b4' }}
              >
                {label}
              </span>
            </div>
            {idx < PASOS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 mt-[-14px]"
                style={{ background: n < paso ? '#a855f7' : '#1e3050' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="mb-8">
        {paso === 1 && <Paso1 />}
        {paso === 2 && <Paso2 />}
        {paso === 3 && <Paso3 biblioteca={biblioteca} />}
        {paso === 4 && <Paso4 biblioteca={biblioteca} />}
        {paso === 5 && <Paso5 biblioteca={biblioteca} onSave={handleSave} />}
      </div>

      {/* Navegación (solo pasos 1-4) */}
      {paso < 5 && (
        <div className="flex justify-between">
          <button
            onClick={paso === 1 ? () => navigate('/cotizaciones') : handleBack}
            className="px-5 py-2.5 rounded-lg text-sm text-muted hover:text-white transition border border-border"
          >
            {paso === 1 ? 'Cancelar' : '← Anterior'}
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
