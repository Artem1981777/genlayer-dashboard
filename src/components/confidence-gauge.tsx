"use client"
export function ConfidenceGauge({ value, size = 132, tone = "#b6ff6c" }: { value: number; size?: number; tone?: string }) {
  const r = (size - 22) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const off = c * (1 - v / 100)
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ display: "block", flex: "none" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#232b3d" strokeWidth={12} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={tone} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform={"rotate(-90 " + cx + " " + cx + ")"}
        style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
      <text x={cx} y={cx - 2} textAnchor="middle" fontSize={size * 0.26} fontWeight={800} fill="#eef2f9">{Math.round(v)}</text>
      <text x={cx} y={cx + size * 0.16} textAnchor="middle" fontSize={12} fill="#94a0ba">confidence</text>
    </svg>
  )
}
