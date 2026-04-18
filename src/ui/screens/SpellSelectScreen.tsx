import { useState } from 'react'
import type { Spell } from '@game/data/spells'
import { spellIconSrc } from '@game/data/spells'
import { ELEM_DISPLAY, PX } from '../../constants'
import s from './SpellSelectScreen.module.css'

interface Props {
  startOptions: Spell[]
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
      if (next.has(spell.id)) next.delete(spell.id)
      else if (next.size < 3) next.add(spell.id)
      return next
    })
  }

  const ready   = selected.size === 3
  const confirm = () => { if (ready) onSelect(startOptions.filter(sp => selected.has(sp.id))) }

  return (
    <div className={s.root} style={{ fontFamily: PX }}>

      <div className={s.title}>
        <div className={s.titleMain}>ВЫБЕРИ КАРТЫ</div>
        <div className={s.titleSub}>ВЫБЕРИ 3 КАРТЫ ДЛЯ НАЧАЛА ИГРЫ</div>
      </div>

      <div className={s.grid}>
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
              className={[s.card, blocked ? s['card--blocked'] : s['card--selectable']].join(' ')}
              style={{
                background: ELEM_BG[spell.element] ?? '#0f0f0f',
                border: `2px solid ${isOn ? color : color + '44'}`,
                boxShadow: isOn
                  ? `inset 0 0 0 1px ${color}55, 0 0 18px ${color}55, 2px 2px 0 #000`
                  : `inset 0 0 0 1px ${color}1a, 2px 2px 0 #000`,
                fontFamily: PX,
              }}
            >
              <div className={s.cardAccent} style={{ background: isOn ? color : color + '55' }} />

              <div className={s.cardHeader}>
                <span className={s.cardElemLabel} style={{ color: isOn ? color : color + '88' }}>
                  {elem?.label.toUpperCase() ?? spell.element.toUpperCase()}
                </span>
                <span className={s.cardElemIcon}>{elem?.icon}</span>
              </div>

              <div className={s.cardIconArea}>
                {spellIconSrc(spell.id)
                  ? <img src={spellIconSrc(spell.id)!} draggable={false} className={s.cardImg}
                      style={{ filter: isOn ? `drop-shadow(0 0 6px ${color}88)` : 'grayscale(0.5) brightness(0.5)' }} />
                  : <span className={s.cardEmoji}>{spell.icon}</span>
                }
              </div>

              <div className={s.cardFooter} style={{ borderTop: `1px solid ${color}33` }}>
                <div className={s.cardName} style={{ color: isOn ? '#ddd' : '#666' }}>
                  {spell.name.toUpperCase()}
                </div>
                <div className={s.cardDmg} style={{ color: isOn ? color : color + '77' }}>
                  {spell.baseDamage}
                </div>
              </div>

              {isOn && (
                <div className={s.checkmark} style={{ background: color }}>✓</div>
              )}
            </button>
          )
        })}
      </div>

      <div className={s.counter}>
        {selected.size} / 3
        {selected.size > 0 && <span className={s.counterRem}> — {3 - selected.size} ещё</span>}
      </div>

      <button
        onClick={confirm}
        disabled={!ready}
        className={[s.confirmBtn, !ready ? s['confirmBtn--disabled'] : ''].join(' ')}
        style={{
          background:  ready ? '#1a1200' : '#0c0c0c',
          border:      `3px solid ${ready ? '#c8a800' : '#333'}`,
          boxShadow:   ready ? 'inset 0 0 0 1px #3a2000, 4px 4px 0 #000, 0 0 20px #c8a80044' : 'inset 0 0 0 1px #222, 2px 2px 0 #000',
          color:       ready ? '#ffd700' : '#444',
          fontFamily:  PX,
        }}
      >
        {ready ? '▶ В БОЙ' : '— ВЫБЕРИ 3 —'}
      </button>
    </div>
  )
}
