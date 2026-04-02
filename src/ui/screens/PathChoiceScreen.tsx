import type { PathType } from '../../types'
import { PATH_META, PX } from '../../constants'

interface Props {
  choices:  PathType[]
  onChoose: (path: PathType) => void
}

const PATH_HINT: Record<PathType, string> = {
  combat: 'Победи врага',
  rest:   '+8 HP',
  event:  'Случайное',
  shop:   'Купи предмет',
}

export function PathChoiceScreen({ choices, onChoose }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,2,8,0.88)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 45,
      animation: 'overlayIn 0.2s ease forwards',
    }}>
      <div style={{
        background: '#08080f',
        border: '3px solid #c8a800',
        boxShadow: 'inset 0 0 0 1px #3a2000, 6px 6px 0 #000',
        width: '100%', maxWidth: 360, margin: '0 12px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'panelIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{
          background: '#1a1200',
          borderBottom: '2px solid #3a2000',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 14 }}>🗺</span>
          <span style={{ color: '#ffd700', fontSize: 8, letterSpacing: 1 }}>ВЫБЕРИ ПУТЬ</span>
        </div>

        {/* Path buttons */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {choices.map((path, idx) => {
            const m = PATH_META[path]
            return (
              <button key={path} onClick={() => onChoose(path)} style={{
                background: 'transparent',
                border: 'none',
                borderBottom: idx < choices.length - 1 ? '1px solid #ffffff06' : 'none',
                color: '#fff', cursor: 'pointer', fontFamily: PX,
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px',
                textAlign: 'left',
              }}>
                {/* Color accent bar */}
                <div style={{
                  width: 3, alignSelf: 'stretch', flexShrink: 0,
                  background: m.color,
                  boxShadow: `1px 0 0 ${m.color}44`,
                }} />

                <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                  <span style={{ color: m.color, fontSize: 7, letterSpacing: 1 }}>
                    {m.label.toUpperCase()}
                  </span>
                  <span style={{ color: '#888', fontSize: 5 }}>
                    {PATH_HINT[path]}
                  </span>
                </div>

                <span style={{ color: m.color, fontSize: 10, flexShrink: 0 }}>▶</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
