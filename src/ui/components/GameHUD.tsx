import type { EnemyDef } from '@game/data/enemies'
import type { Spell } from '@game/data/spells'
import type { Phase } from '../../types'
import { BIOME_EVERY, ELEM_DISPLAY, PX } from '../../constants'
import { PixelHpBar } from './PixelHpBar'

interface Props {
  playerHp:       number
  effectiveMaxHp: number
  enemyHp:        number
  currentEnemy:   EnemyDef
  gold:           number
  stepCount:      number
  hitStreak:      number
  phase:          Phase
  dragging:       boolean
  equippedSpells: Spell[]
  spellSlots:     number
  onShowStats:    () => void
}

// Классическая РПГ рамка: внешняя золотая + внутренняя тёмная
const rpgPanel: React.CSSProperties = {
  background: '#08080f',
  border: '3px solid #c8a800',
  boxShadow: 'inset 0 0 0 1px #3a2000, 0 4px 0 #000',
}

export function GameHUD({
  playerHp, effectiveMaxHp, enemyHp, currentEnemy,
  gold, stepCount, hitStreak,
  phase, dragging,
  equippedSpells, spellSlots,
  onShowStats,
}: Props) {
  const playerHpPct = playerHp / effectiveMaxHp * 100
  const enemyHpPct  = enemyHp  / currentEnemy.hp * 100
  const hpColor     = playerHpPct > 50 ? '#3af3a0' : playerHpPct > 25 ? '#f0c040' : '#f04545'
  const stepsLeft   = BIOME_EVERY - (stepCount % BIOME_EVERY)

  return (
    <>
      {/* ════ TOP HUD ════════════════════════════════════════════════ */}
      <div style={{
        ...rpgPanel,
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 100, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* HP rows */}
        <div style={{ padding: '8px 12px 6px', display: 'flex', flexDirection: 'column', gap: 5 }}>

          {/* Player HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#3af3a0', fontSize: 6, width: 44, flexShrink: 0, letterSpacing: 0 }}>
              ГЕРОЙ
            </span>
            <PixelHpBar pct={playerHpPct} color={hpColor} />
            <span style={{ color: hpColor, fontSize: 7, width: 52, textAlign: 'right', flexShrink: 0 }}>
              {playerHp}<span style={{ color: '#3a3a3a', fontSize: 6 }}>/{effectiveMaxHp}</span>
            </span>
          </div>

          {/* Enemy HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              color: '#f04545', fontSize: 5, width: 44, flexShrink: 0,
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              {currentEnemy.name.toUpperCase()}
            </span>
            <PixelHpBar pct={enemyHpPct} color="#f04545" />
            <span style={{ color: '#f04545', fontSize: 7, width: 52, textAlign: 'right', flexShrink: 0 }}>
              {enemyHp}<span style={{ color: '#3a3a3a', fontSize: 6 }}>/{currentEnemy.hp}</span>
            </span>
          </div>
        </div>

        {/* Status strip */}
        <div style={{
          borderTop: '1px solid #3a2000',
          background: '#0c0a00',
          padding: '4px 12px 5px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          <span style={{ color: '#ffd700', fontSize: 8 }}>💰{gold}</span>

          {hitStreak >= 3 && (
            <span style={{ color: '#f0c040', fontSize: 7 }}>🔥×{hitStreak}</span>
          )}

          <span style={{ color: '#60a5fa', fontSize: 6 }}>🌍×{stepsLeft}</span>

          <button onClick={onShowStats} style={{
            background: '#1a1200',
            border: '2px solid #c8a800',
            boxShadow: 'inset 0 0 0 1px #3a2000, 2px 2px 0 #000',
            color: '#ffd700', cursor: 'pointer',
            padding: '3px 10px', fontSize: 6,
            fontFamily: PX, letterSpacing: 1,
          }}>
            ■ СТАТ
          </button>
        </div>
      </div>

      {/* ════ BOTTOM HUD ══════════════════════════════════════════════ */}
      <div style={{
        ...rpgPanel,
        boxShadow: 'inset 0 0 0 1px #3a2000, 0 -4px 0 #000',
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 100, pointerEvents: 'none',
        padding: '8px 12px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        {/* Spell slots */}
        <div style={{ display: 'flex', gap: 10 }}>
          {Array.from({ length: spellSlots }).map((_, i) => {
            const spell = equippedSpells[i]
            const elem  = spell ? ELEM_DISPLAY.find(e => e.key === spell.element) : null
            const color = elem?.color ?? '#c8a800'
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Slot frame */}
                <div style={{
                  width: 54, height: 54,
                  background: spell ? '#0e0c1e' : '#060610',
                  border: `2px solid ${spell ? color : '#2a2a3a'}`,
                  boxShadow: spell
                    ? `inset 0 0 0 1px ${color}44, 2px 2px 0 #000, 0 0 12px ${color}33`
                    : '2px 2px 0 #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: spell ? 28 : 16, color: '#2a2a3a',
                  position: 'relative',
                }}>
                  {spell ? spell.icon : '·'}
                  {spell && (
                    <span style={{
                      position: 'absolute', bottom: -2, right: -2,
                      background: color, color: '#000',
                      fontSize: 7, padding: '2px 4px', fontFamily: PX, lineHeight: 1,
                      boxShadow: '1px 1px 0 #000',
                    }}>
                      {spell.baseDamage}
                    </span>
                  )}
                </div>
                {/* Element label */}
                <span style={{ color: spell ? color : '#222', fontSize: 5, letterSpacing: 0 }}>
                  {spell ? (elem?.label.toUpperCase() ?? '???') : 'ПУСТО'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Phase hint */}
        <div style={{ height: 12, display: 'flex', alignItems: 'center' }}>
          {phase === 'choose' && !dragging && (
            <span style={{ color: '#777', fontSize: 6, letterSpacing: 2 }}>← ТЯНИ ПЕРСОНАЖА →</span>
          )}
          {phase === 'waiting' && (
            <span style={{ color: '#777', fontSize: 6, letterSpacing: 1 }}>ХОД ВРАГА...</span>
          )}
        </div>
      </div>
    </>
  )
}
