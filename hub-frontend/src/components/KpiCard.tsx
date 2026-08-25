type Props = { label: string; value: number | string }

export function KpiCard({ label, value }: Props) {
  return (
    <div className="kpi-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
