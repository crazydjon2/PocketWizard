import type { ChestOption } from '../../types'
import type { Spell } from '@game/data/spells'
import type { GameItem } from '@game/data/items'
import { itemIconSrc } from '@game/data/items'
import { ELEM_DISPLAY, RARITY_COLOR, PX } from '../../constants'

interface Props {
  choices:  ChestOption[]
  onChoose: (choice: ChestOption) => void
}

export function ChestScreen({ choices, onChoose }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,2,8,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, zIndex: 50,
      animation: 'overlayIn 0.2s ease forwards',
    }}>
      {/* Panel */}
      <div style={{
        background: '#08080f',
        border: '3px solid #c8a800',
        boxShadow: 'inset 0 0 0 1px #3a2000, 6px 6px 0 #000',
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column',
        maxHeight: '80vh',
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
          <span style={{ fontSize: 16 }}>🎁</span>
          <span style={{ color: '#ffd700', fontSize: 8, letterSpacing: 1, flex: 1 }}>ВЫБЕРИ НАГРАДУ</span>
          <span style={{ color: '#888', fontSize: 6 }}>{choices.length} вар.</span>
        </div>

        {/* Scrollable item list */}
        <div style={{
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1,
        }}>
          {choices.map((choice, idx) => {
            const isSpell = choice.kind === 'spell'
            const color   = isSpell
              ? (ELEM_DISPLAY.find(e => e.key === (choice.data as Spell).element)?.color ?? '#ffd700')
              : RARITY_COLOR[(choice.data as GameItem).rarity]
            const badge   = isSpell
              ? 'ЗАКЛ.'
              : (choice.data as GameItem).rarity.toUpperCase()

            return (
              <button
                key={idx}
                onClick={() => onChoose(choice)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #ffffff08',
                  cursor: 'pointer',
                  fontFamily: PX,
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  textAlign: 'left',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, flexShrink: 0,
                  background: '#0e0c1e',
                  border: `2px solid ${color}`,
                  boxShadow: `inset 0 0 0 1px ${color}33, 2px 2px 0 #000, 0 0 10px ${color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {isSpell
                    ? <span style={{ fontSize: 24 }}>{choice.data.icon}</span>
                    : <img src={itemIconSrc(choice.data.id)} draggable={false}
                        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', objectFit: 'contain' }} />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  {/* Name + badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      color,
                      fontSize: 7, letterSpacing: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {choice.data.name.toUpperCase()}
                    </span>
                    <span style={{
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                      color, fontSize: 5, padding: '2px 5px', flexShrink: 0,
                    }}>
                      {badge}
                    </span>
                  </div>
                  {/* Description */}
                  <span style={{ color: '#8888aa', fontSize: 5, lineHeight: 1.8 }}>
                    {choice.data.description}
                  </span>
                </div>

                {/* Arrow */}
                <span style={{ color, fontSize: 10, flexShrink: 0 }}>▶</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
