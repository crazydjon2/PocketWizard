interface Props {
  pct:      number
  color:    string
  segments?: number
}

export function PixelHpBar({ pct, color, segments = 20 }: Props) {
  const filled = Math.round(Math.max(0, Math.min(100, pct)) / 100 * segments)
  return (
    <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'stretch', height: 12 }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} style={{
          flex: 1,
          background: i < filled ? color : '#160a10',
          boxShadow: i < filled ? `inset 0 1px 0 ${color}88` : 'none',
          border: '1px solid #00000066',
        }} />
      ))}
    </div>
  )
}
