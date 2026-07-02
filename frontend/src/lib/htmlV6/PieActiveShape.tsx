import { Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'

/** Expande el segmento ~6px al hover (equivalente Chart.js doughnut hover). */
export function PieActiveShape(props: PieSectorDataItem) {
  const outer = (props.outerRadius ?? 85) + 6
  return (
    <Sector
      {...props}
      outerRadius={outer}
      stroke="#e2e8f0"
      strokeWidth={2}
    />
  )
}
