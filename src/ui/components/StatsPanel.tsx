import { ALL_ITEMS, itemIconSrc } from '@game/data/items'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { Spell } from '@game/data/spells'
import type { EnemyDef } from '@game/data/enemies'
import { ELEM_DISPLAY, RARITY_COLOR, PX, MAX_HP } from '../../constants'
import { PixelHpBar } from './PixelHpBar'

interface Props {
  playerHp:       number
  effectiveMaxHp: number
  gold:           number
  hitStreak:      number
  equippedSpells: Spell[]
  ownedItems:     GameItem[]
  currentEnemy:   EnemyDef
  enemyHp:        number
  onClose:        () => void
}

// ── helpers ────────────────────────────────────────────────────────
function sum<T extends ItemEffect>(effects: ItemEffect[], type: T['type'], key: keyof Extract<T, { type: typeof type }>): number {
  return effects
    .filter(e => e.type === type)
    .reduce((s, e) => s + ((e as Extract<T, { type: typeof type }>)[key] as number), 0)
}

function StatRow({ label, value, color = '#ccc' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#999', fontSize: 6, lineHeight: 1.8 }}>{label}</span>
      <span style={{ color, fontSize: 7, textAlign: 'right', flexShrink: 0 }}>{value}</span>
    </div>
  )
}

function Section({ color = '#ffd700', title, children }: { color?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: `1px solid ${color}33`,
      background: `${color}06`,
      padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        color, fontSize: 7, letterSpacing: 1,
        borderBottom: `1px solid ${color}22`, paddingBottom: 6, marginBottom: 2,
      }}>
        ■ {title}
      </div>
      {children}
    </div>
  )
}

export function StatsPanel({
  playerHp, effectiveMaxHp, gold, hitStreak,
  equippedSpells, ownedItems, currentEnemy, enemyHp,
  onClose,
}: Props) {
  const allEffects = ownedItems.flatMap(i => i.effects)

  const flatAtk     = sum<Extract<ItemEffect, { type: 'flatAttack' }>>(allEffects, 'flatAttack', 'amount')
  const flatDef     = sum<Extract<ItemEffect, { type: 'flatDefense' }>>(allEffects, 'flatDefense', 'amount')
  const bonusGold   = sum<Extract<ItemEffect, { type: 'goldBonus' }>>(allEffects, 'goldBonus', 'amount')
  const totalSelfDmg = sum<Extract<ItemEffect, { type: 'selfDamageOnHit' }>>(allEffects, 'selfDamageOnHit', 'amount')
  const totalAccBonus = sum<Extract<ItemEffect, { type: 'enemyAccuracyBonus' }>>(allEffects, 'enemyAccuracyBonus', 'amount')

  const lowHpEffects = allEffects.filter(e => e.type === 'lowHpMultiplier') as
    Extract<ItemEffect, { type: 'lowHpMultiplier' }>[]

  const healItem = ownedItems.flatMap(i => i.effects).find(e => e.type === 'healStreak') as
    Extract<ItemEffect, { type: 'healStreak' }> | undefined

  const elems = new Set(equippedSpells.map(s => s.element))

  const spellDmg = equippedSpells.map(s => {
    const eb = allEffects
      .filter(e => e.type === 'flatAttackElement' &&
        (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).element === s.element)
      .reduce((acc, e) => acc + (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).amount, 0)
    let dmg = s.baseDamage + flatAtk + eb
    for (const item of ownedItems)
      for (const eff of item.effects) {
        if (eff.type !== 'synergy') continue
        const e = eff as Extract<ItemEffect, { type: 'synergy' }>
        if (elems.has(e.e1) && elems.has(e.e2) && (s.element === e.e1 || s.element === e.e2))
          dmg *= e.multiplier
      }
    return { spell: s, dmg: Math.max(1, Math.round(dmg)) }
  })

  const dmgByElem: Record<string, number> = {}
  for (const { spell, dmg } of spellDmg) dmgByElem[spell.element] = (dmgByElem[spell.element] ?? 0) + dmg
  const totalDmg = spellDmg.reduce((s, x) => s + x.dmg, 0)

  const resistAll = ELEM_DISPLAY.map(ed => ({
    ...ed,
    pct: Math.round(Math.min(0.8, allEffects
      .filter(e => e.type === 'resistance' &&
        (e as Extract<ItemEffect, { type: 'resistance' }>).element === ed.key)
      .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'resistance' }>).reduction, 0)
    ) * 100),
  }))

  const counts: Record<string, number> = {}
  for (const i of ownedItems) counts[i.id] = (counts[i.id] ?? 0) + 1
  const uniqueItems = ALL_ITEMS.filter(i => counts[i.id])

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 110,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'overlayIn 0.2s ease forwards',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#08080f',
        border: '3px solid #ffd700',
        boxShadow: '6px 6px 0 #000',
        width: 340, maxWidth: '96vw', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'panelIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{
          background: '#ffd700', padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#08080f', fontSize: 8, letterSpacing: 1 }}>■ ХАРАКТЕРИСТИКИ</span>
          <button onClick={onClose} style={{
            background: '#08080f', border: '2px solid #08080f',
            color: '#ffd700', cursor: 'pointer', fontSize: 8,
            fontFamily: PX, padding: '3px 8px', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Player */}
          <Section title="ИГРОК">
            <PixelHpBar pct={playerHp / effectiveMaxHp * 100} color={playerHp > effectiveMaxHp * 0.5 ? '#3af3a0' : '#f04545'} />
            <StatRow label="❤ HP" value={`${playerHp} / ${effectiveMaxHp}${effectiveMaxHp < MAX_HP ? ` (−${MAX_HP - effectiveMaxHp})` : ''}`}
              color={playerHp > effectiveMaxHp * 0.5 ? '#3af3a0' : '#f04545'} />
            <StatRow label="💰 Золото" value={String(gold)} color="#fbbf24" />
            {hitStreak > 0 && <StatRow label="🔥 Серия ударов" value={String(hitStreak)} color="#f0c040" />}
            {bonusGold > 0 && <StatRow label="💰 Бонус за победу" value={`+${bonusGold}`} color="#fbbf24" />}
            {healItem && <StatRow label="💎 Лечение серией" value={`+${healItem.hp} HP / ${healItem.count} уд.`} color="#a78bfa" />}
            {totalSelfDmg > 0 && <StatRow label="💀 Урон себе за удар" value={`−${totalSelfDmg}`} color="#a855f7" />}
          </Section>

          {/* Damage */}
          <Section title="УРОН">
            {ELEM_DISPLAY.map(ed => {
              const dmg = dmgByElem[ed.key] ?? 0
              return (
                <div key={ed.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: dmg > 0 ? ed.color : '#333', fontSize: 6 }}>{ed.icon} {ed.label}</span>
                  <span style={{ color: dmg > 0 ? '#fbbf24' : '#2a2a2a', fontSize: 7 }}>
                    {dmg > 0 ? `⚔ ${dmg}` : '—'}
                  </span>
                </div>
              )
            })}
            {totalDmg > 0 && (
              <div style={{ borderTop: '1px solid #ffd70022', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: 6 }}>Итого за ход</span>
                <span style={{ color: '#fbbf24', fontSize: 9 }}>⚔ {totalDmg}</span>
              </div>
            )}
            {lowHpEffects.map((e, i) => (
              <StatRow key={i}
                label={`⚡ ×${e.multiplier} при HP ≤ ${Math.round(e.threshold * 100)}%`}
                value={playerHp / effectiveMaxHp <= e.threshold ? 'АКТИВНО' : 'НЕАКТИВНО'}
                color={playerHp / effectiveMaxHp <= e.threshold ? '#f0c040' : '#333'}
              />
            ))}
          </Section>

          {/* Defense */}
          <Section title="ЗАЩИТА" color="#60a5fa">
            <StatRow label="🛡 Снижение урона" value={flatDef > 0 ? `−${flatDef}` : '0'}
              color={flatDef > 0 ? '#60a5fa' : '#333'} />
            {totalAccBonus > 0 && <StatRow label="⚠ Враг точнее" value={`+${Math.round(totalAccBonus * 100)}%`} color="#f97316" />}
            {resistAll.map(r => (
              <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: r.pct !== 0 ? r.color : '#2a2a2a', fontSize: 6 }}>{r.icon} {r.label}</span>
                <span style={{ color: r.pct > 0 ? '#60a5fa' : r.pct < 0 ? '#f04545' : '#2a2a2a', fontSize: 7 }}>
                  {r.pct > 0 ? `−${r.pct}%` : r.pct < 0 ? `+${-r.pct}%` : '0%'}
                </span>
              </div>
            ))}
          </Section>

          {/* Enemy */}
          <Section title={currentEnemy.name.toUpperCase()} color="#f04545">
            <PixelHpBar pct={enemyHp / currentEnemy.hp * 100} color="#f04545" />
            <StatRow label="❤ HP" value={`${enemyHp} / ${currentEnemy.hp}`} color="#f04545" />
            <StatRow label="⚔ Урон"
              value={`${Math.max(1, currentEnemy.damage - flatDef)}${flatDef > 0 ? ` (${currentEnemy.damage}−${flatDef})` : ''}`}
              color="#f97316" />
            <StatRow label="🎯 Попадание" value={`${Math.round(currentEnemy.hitChance * 100)}%`} color="#f97316" />
            {currentEnemy.element && <StatRow label="⚡ Стихия" value={currentEnemy.element.toUpperCase()} color="#a78bfa" />}
            {currentEnemy.description && (
              <p style={{ color: '#8888aa', fontSize: 5, margin: '2px 0 0', lineHeight: 1.8 }}>
                {currentEnemy.description}
              </p>
            )}
          </Section>

          {/* Items */}
          {uniqueItems.length > 0 && (
            <Section title={`ПРЕДМЕТЫ (${ownedItems.length})`}>
              {uniqueItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 34, height: 34,
                      border: `2px solid ${RARITY_COLOR[item.rarity]}`,
                      background: '#12102a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    }}>
                      <img src={itemIconSrc(item.id)} draggable={false}
                        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', objectFit: 'contain' }} />
                    </div>
                    {counts[item.id] > 1 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -5,
                        background: '#ffd700', color: '#000',
                        fontSize: 5, padding: '1px 3px', fontFamily: PX, lineHeight: 1,
                      }}>
                        ×{counts[item.id]}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: RARITY_COLOR[item.rarity], fontSize: 6 }}>{item.name.toUpperCase()}</div>
                    <div style={{ color: '#8888aa', fontSize: 5, marginTop: 2, lineHeight: 1.6 }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </Section>
          )}

        </div>
      </div>
    </div>
  )
}
