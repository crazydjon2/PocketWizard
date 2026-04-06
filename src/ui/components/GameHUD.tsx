import { BIOME_EVERY, PX } from '../../constants'

interface Props {
  gold:       number
  stepCount:  number
  hitStreak:  number
}

export function GameHUD({ gold, stepCount, hitStreak }: Props) {
  const stepsLeft = BIOME_EVERY - (stepCount % BIOME_EVERY)

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 42, zIndex: 100,
      // Dot-grid texture over dark background
      backgroundColor: '#07050f',
      backgroundImage: 'radial-gradient(circle, #141228 1px, transparent 1px)',
      backgroundSize: '14px 14px',
      // Bottom border: thick line + gold accent line
      borderBottom: '3px solid #2a2448',
      boxShadow: 'inset 0 -1px 0 #c8a80033, inset 0 -4px 0 #100d22',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px',
      pointerEvents: 'none',
      fontFamily: PX,
    }}>

      {/* Gold */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 14 }}>💰</span>
        <span style={{
          color: '#ffd700', fontSize: 9,
          textShadow: '0 0 8px #ffd70066',
        }}>{gold}</span>
      </div>

      {/* Streak badge (center, only when active) */}
      {hitStreak >= 3 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#f0c04012',
          border: '1px solid #f0c04055',
          boxShadow: 'inset 0 0 8px #f0c04011',
          padding: '2px 8px',
        }}>
          <span style={{ fontSize: 11 }}>🔥</span>
          <span style={{ color: '#f0c040', fontSize: 7 }}>×{hitStreak}</span>
        </div>
      ) : (
        /* Subtle center decoration when no streak */
        <div style={{
          display: 'flex', gap: 5, alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === 1 ? 6 : 4,
              height: i === 1 ? 6 : 4,
              background: i === 1 ? '#2a2448' : '#1a1630',
            }} />
          ))}
        </div>
      )}

      {/* Steps to next biome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 11 }}>🌍</span>
        <span style={{
          color: '#7dd3fc', fontSize: 7,
          textShadow: '0 0 6px #7dd3fc44',
        }}>{stepsLeft}</span>
      </div>
    </div>
  )
}
