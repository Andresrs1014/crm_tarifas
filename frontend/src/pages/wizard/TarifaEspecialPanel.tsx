import { useQuery } from '@tanstack/react-query'
import { getTarifasEspeciales } from '../../api/tarifasEspeciales'
import type { TarifaEspecial } from '../../types'

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function itemCount(te: TarifaEspecial): number {
  return te.grupos.reduce((acc, g) => acc + (g.items?.length ?? 0), 0)
}

export function LineaTarifaEspecialPanel({
  linea, espKey, active, selectedId, isNueva, onToggle, onSelect, onEdit, onDelete, onNueva,
}: {
  linea: string
  espKey: string
  active: boolean
  selectedId: string
  isNueva: boolean
  onToggle: () => void
  onSelect: (te: TarifaEspecial) => void
  onEdit: (te: TarifaEspecial) => void
  onDelete: (te: TarifaEspecial) => void
  onNueva: () => void
}) {
  const { data: especiales = [] } = useQuery({
    queryKey: ['tarifas-especiales', espKey],
    queryFn: () => getTarifasEspeciales(espKey),
    enabled: active,
  })

  return (
    <div className={`rounded-xl border p-3 transition-colors ${active ? 'border-gold/40 bg-gold/5' : 'border-border bg-surface2'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {linea}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <span className={active ? 'text-gold' : 'text-muted'}>{active ? 'Activa' : 'Inactiva'}</span>
          <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? 'bg-gold' : 'bg-border'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </span>
        </button>
      </div>

      {active && (
        <div className="mt-3 space-y-2">
          {especiales.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-2xs text-muted uppercase tracking-widest">Tarifas guardadas</div>
              {[...especiales].reverse().map((te) => {
                const isSel = selectedId === te.id
                return (
                  <div
                    key={te.id}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${isSel ? 'border-gold/50 bg-gold/10' : 'border-border bg-surface'}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(te)}
                      className="flex-1 min-w-0 flex items-center gap-2 text-left"
                    >
                      <span className={isSel ? 'text-gold' : 'text-muted'}>{isSel ? '⭐' : '☆'}</span>
                      <span className={`text-xs truncate ${isSel ? 'text-gold font-bold' : 'text-foreground'}`}>{te.nombre}</span>
                      <span className="text-2xs text-muted flex-shrink-0 ml-auto">
                        {itemCount(te)} ítems · {fmtFecha(te.createdAt)}
                      </span>
                    </button>
                    <button type="button" onClick={() => onEdit(te)} className="text-2xs text-muted hover:text-accent flex-shrink-0" title="Editar">
                      ✏️
                    </button>
                    <button type="button" onClick={() => onDelete(te)} className="text-xs text-muted hover:text-danger flex-shrink-0" title="Eliminar">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <button
            type="button"
            onClick={onNueva}
            className="w-full text-xs font-semibold text-gold border border-dashed border-gold/40 rounded-lg py-1.5 hover:bg-gold/10 transition-colors"
          >
            {isNueva ? '✏️ Editando nueva...' : '+ Nueva tarifa especial'}
          </button>
        </div>
      )}
    </div>
  )
}
