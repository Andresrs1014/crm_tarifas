import { Plus, Trash2 } from 'lucide-react'
import type { ContactoCreate } from '../types'

interface ContactosListProps {
  value: ContactoCreate[]
  onChange: (v: ContactoCreate[]) => void
}

const empty = (): ContactoCreate => ({ nombre: '', cargo: '', telefono: '', email: '', orden: 0 })

export default function ContactosList({ value, onChange }: ContactosListProps) {
  const add = () => onChange([...value, { ...empty(), orden: value.length }])

  const remove = (i: number) => {
    const next = value.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, orden: idx }))
    onChange(next)
  }

  const update = (i: number, field: keyof ContactoCreate, val: string | number) => {
    const next = value.map((c, idx) => (idx === i ? { ...c, [field]: val } : c))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.map((c, i) => (
        <div key={i} className="bg-surface2 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-condensed uppercase">
              {i === 0 ? 'Contacto Principal' : `Contacto ${i + 1}`}
            </span>
            {i > 0 && (
              <button type="button" onClick={() => remove(i)} className="text-danger hover:text-red-400">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Nombre *"
              value={c.nombre}
              onChange={(e) => update(i, 'nombre', e.target.value)}
            />
            <input
              placeholder="Cargo"
              value={c.cargo || ''}
              onChange={(e) => update(i, 'cargo', e.target.value)}
            />
            <input
              placeholder="Teléfono"
              value={c.telefono || ''}
              onChange={(e) => update(i, 'telefono', e.target.value)}
            />
            <input
              placeholder="Email"
              value={c.email || ''}
              onChange={(e) => update(i, 'email', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 text-accent text-sm hover:text-blue-300 transition"
      >
        <Plus size={16} /> Agregar contacto
      </button>
    </div>
  )
}
