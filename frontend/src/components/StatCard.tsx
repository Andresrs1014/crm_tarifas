interface StatCardProps {
  label: string
  value: string | number
  accent?: string
  sub?: string
}

export default function StatCard({ label, value, accent = '#00c2ff', sub }: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg p-5 border border-border relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: accent }}
      />
      <p className="text-muted text-xs uppercase tracking-wider mb-2 font-condensed">{label}</p>
      <p className="text-3xl font-bold font-condensed" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}
