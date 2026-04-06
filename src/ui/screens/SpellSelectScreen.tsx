import { useState } from 'react'
import type { Spell } from '@game/data/spells'
import { ELEM_DISPLAY, PX } from '../../constants'

interface Props {
  startOptions: Spell[]           // 6 cards to choose from
  onSelect:     (spells: Spell[]) => void
}

const ELEM_BG: Record<string, string> = {
  fire:      '#150500',
  water:     '#001218',
  physical:  '#0f0f0f',
  dark:      '#0f0014',
  lightning: '#141000',
  earth:     '#0c0900',
}

export function SpellSelectScreen({ startOptions, onSelect }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (spell: Spell) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(spell.id)) {
        next.delete(spell.id)
      } else if (next.size < 3) {
        next.add(spell.id)
      }
      return next
    })
  }

  const ready    = selected.size === 3
  const confirm  = () => {
    if (!ready) return
    onSelect(startOptions.filter(s => selected.has(s.id)))
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,2,8,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 70,
      animation: 'overlayIn 0.25s ease forwards',
      fontFamily: PX,
    }}>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ffd700', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
          ВЫБЕРИ КАРТЫ
        </div>
        <div style={{ color: '#888', fontSize: 5, letterSpacing: 1 }}>
          ВЫБЕРИ 3 КАРТЫ ДЛЯ НАЧАЛА ИГРЫ
        </div>
      </div>

      {/* Cards grid 3×2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 80px)',
        gap: 10,
        padding: '0 16px',
      }}>
        {startOptions.map(spell => {
          const elem    = ELEM_DISPLAY.find(e => e.key === spell.element)
          const color   = elem?.color ?? '#c8a800'
          const isOn    = selected.has(spell.id)
          const blocked = !isOn && selected.size >= 3

          return (
            <button
              key={spell.id}
              onClick={() => toggle(spell)}
              disabled={blocked}
              style={{
                width: 80, height: 112,
                background: ELEM_BG[spell.element] ?? '#0f0f0f',
                border: `2px solid ${isOn ? color : color + '44'}`,
                boxShadow: isOn
                  ? `inset 0 0 0 1px ${color}55, 0 0 18px ${color}55, 2px 2px 0 #000`
                  : `inset 0 0 0 1px ${color}1a, 2px 2px 0 #000`,
                cursor: blocked ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: PX,
                opacity: blocked ? 0.35 : 1,
                transition: 'box-shadow 0.12s, border-color 0.12s, opacity 0.12s',
                padding: 0,
              }}
            >
              {/* Top accent */}
              <div style={{ height: 3, background: isOn ? color : color + '55', flexShrink: 0 }} />

              {/* Element label */}
              <div style={{
                padding: '3px 5px 0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ color: isOn ? color : color + '88', fontSize: 4, letterSpacing: 0 }}>
                  {elem?.label.toUpperCase() ?? spell.element.toUpperCase()}
                </span>
                <span style={{ fontSize: 9 }}>{elem?.icon}</span>
              </div>

              {/* Big icon */}
              <div style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, lineHeight: 1,
              }}>
                {spell.icon}
              </div>

              {/* Bottom info */}
              <div style={{
                borderTop: `1px solid ${color}33`,
                background: '#00000055',
                padding: '3px 5px 5px',
                flexShrink: 0,
              }}>
                <div style={{
                  color: isOn ? '#ddd' : '#666',
                  fontSize: 4, lineHeight: 1.4,
                  overflow: 'hidden', textAlign: 'center',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {spell.name.toUpperCase()}
                </div>
                <div style={{
                  color: isOn ? color : color + '77',
                  fontSize: 9, textAlign: 'center', marginTop: 2,
                }}>
                  {spell.baseDamage}
                </div>
              </div>

              {/* Selected checkmark */}
              {isOn && (
                <div style={{
                  position: 'absolute', top: 5, left: 5,
                  width: 10, height: 10,
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 6, color: '#000',
                }}>✓</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selection counter */}
      <div style={{ color: '#666', fontSize: 5, letterSpacing: 1 }}>
        {selected.size} / 3
        {selected.size > 0 && <span style={{ color: '#ffd70088' }}> — {3 - selected.size} ещё</span>}
      </div>

      {/* Confirm button */}
      <button
        onClick={confirm}
        disabled={!ready}
        style={{
          background: ready ? '#1a1200' : '#0c0c0c',
          border: `3px solid ${ready ? '#c8a800' : '#333'}`,
          boxShadow: ready
            ? 'inset 0 0 0 1px #3a2000, 4px 4px 0 #000, 0 0 20px #c8a80044'
            : 'inset 0 0 0 1px #222, 2px 2px 0 #000',
          color: ready ? '#ffd700' : '#444',
          cursor: ready ? 'pointer' : 'default',
          padding: '10px 32px',
          fontSize: 8, letterSpacing: 2,
          fontFamily: PX,
          transition: 'all 0.15s',
        }}
      >
        {ready ? '▶ В БОЙ' : '— ВЫБЕРИ 3 —'}
      </button>
    </div>
  )
}
