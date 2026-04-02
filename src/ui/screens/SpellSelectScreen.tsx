import type { Spell } from '@game/data/spells'
import { ELEM_DISPLAY, PX } from '../../constants'

interface Props {
  startOptions: Spell[]
  onSelect:     (spell: Spell) => void
}

export function SpellSelectScreen({ startOptions, onSelect }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,2,8,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, zIndex: 70,
      animation: 'overlayIn 0.2s ease forwards',
    }}>
      {/* Title panel */}
      <div style={{
        background: '#08080f',
        border: '3px solid #c8a800',
        boxShadow: 'inset 0 0 0 1px #3a2000, 6px 6px 0 #000',
        width: '100%', maxWidth: 360, margin: '0 12px',
        overflow: 'hidden',
        animation: 'panelIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{
          background: '#1a1200',
          borderBottom: '2px solid #3a2000',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#ffd700', fontSize: 8, letterSpacing: 1 }}>ВЫБЕРИ ЗАКЛИНАНИЕ</span>
            <span style={{ color: '#888', fontSize: 5, letterSpacing: 1 }}>
              2-Й СЛОТ ОТКРОЕТСЯ ПОСЛЕ ПЕРВОЙ ПОБЕДЫ
            </span>
          </div>
        </div>

        {/* Spell list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {startOptions.map((spell, idx) => {
            const ed    = ELEM_DISPLAY.find(e => e.key === spell.element)
            const color = ed?.color ?? '#ffd700'
            return (
              <button key={spell.id} onClick={() => onSelect(spell)} style={{
                background: 'transparent',
                border: 'none',
                borderBottom: idx < startOptions.length - 1 ? '1px solid #ffffff06' : 'none',
                cursor: 'pointer', fontFamily: PX,
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
              }}>
                {/* Icon frame */}
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  background: '#0e0c1e',
                  border: `2px solid ${color}`,
                  boxShadow: `inset 0 0 0 1px ${color}33, 2px 2px 0 #000`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>
                  {spell.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      color, fontSize: 7, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {spell.name.toUpperCase()}
                    </span>
                    <span style={{
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                      color, fontSize: 5, padding: '1px 5px', flexShrink: 0,
                    }}>
                      {ed?.label.toUpperCase() ?? spell.element.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ color: '#8888aa', fontSize: 5, lineHeight: 1.6 }}>
                    {spell.description}
                  </span>
                </div>

                {/* Damage badge */}
                <div style={{
                  flexShrink: 0,
                  background: '#0e0c1e',
                  border: `2px solid ${color}`,
                  boxShadow: `inset 0 0 0 1px ${color}33, 2px 2px 0 #000`,
                  padding: '4px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  minWidth: 40,
                }}>
                  <span style={{ color: '#888', fontSize: 4 }}>УРОН</span>
                  <span style={{ color, fontSize: 10, fontFamily: PX }}>{spell.baseDamage}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
