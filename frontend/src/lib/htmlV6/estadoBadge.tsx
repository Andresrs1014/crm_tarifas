import type { CRMRecord } from '../../types'
import { CLIENTE_BADGE, CLIENTE_LABEL, PROSPECTO_BADGE, PROSPECTO_LABEL } from './domainConfig'

/** estadoBadge — HTML v6 (React) */
export function EstadoBadge({ rec }: { rec: CRMRecord }) {
  if (rec.tipo === 'prospecto') {
    const est = rec.estadoProspecto || 'prospecto'
    return (
      <span className={`badge ${PROSPECTO_BADGE[est] || 'badge-gray'}`}>
        {PROSPECTO_LABEL[est] || est}
      </span>
    )
  }

  const est = rec.estadoCliente || 'activo'
  return (
    <span className={`badge ${CLIENTE_BADGE[est] || 'badge-gray'}`}>
      {CLIENTE_LABEL[est] || est}
    </span>
  )
}
