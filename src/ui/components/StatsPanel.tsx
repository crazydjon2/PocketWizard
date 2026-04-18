import { useState } from 'react'
import { itemIconSrc } from '@game/data/items'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { ElemStat } from '@game/data/classes'
import { ELEM_DISPLAY, RARITY_COLOR, PX, MAX_HP } from '../../constants'
import { PixelHpBar } from './PixelHpBar'
import { effectTags } from '@game/logic/itemDisplay'
import s from './StatsPanel.module.css'

interface Props {
  playerHp:       number
  effectiveMaxHp: number
  gold:           number
  hitStreak:      number
  ownedItems:     GameItem[]
  classDmgBonus:  ElemStat[]
  classResist:    ElemStat[]
  onClose:        () => void
}

type Tab = 'status' | 'attack' | 'items'

function sum<T extends ItemEffect>(effects: ItemEffect[], type: T['type'], key: keyof Extract<T, { type: typeof type }>): number {
  return effects
    .filter(e => e.type === type)
    .reduce((s, e) => s + ((e as Extract<T, { type: typeof type }>)[key] as number), 0)
}

// ── Status tab ────────────────────────────────────────────────────
function StatusTab({ playerHp, effectiveMaxHp, gold, hitStreak, allEffects }: {
  playerHp: number; effectiveMaxHp: number; gold: number; hitStreak: number
  allEffects: ItemEffect[]
}) {
  const pct        = playerHp / effectiveMaxHp
  const hpColor    = pct > 0.5 ? '#3af3a0' : pct > 0.25 ? '#f0c040' : '#f04545'
  const bonusGold  = sum<Extract<ItemEffect, { type: 'goldBonus' }>>(allEffects, 'goldBonus', 'amount')
  const regen      = sum<Extract<ItemEffect, { type: 'regenPerRoom' }>>(allEffects, 'regenPerRoom', 'amount')
  const selfDmg    = sum<Extract<ItemEffect, { type: 'selfDamageOnHit' }>>(allEffects, 'selfDamageOnHit', 'amount')
  const flatDef    = sum<Extract<ItemEffect, { type: 'flatDefense' }>>(allEffects, 'flatDefense', 'amount')
  const healItem   = allEffects.find(e => e.type === 'healStreak') as Extract<ItemEffect, { type: 'healStreak' }> | undefined
  const lowHp      = allEffects.filter(e => e.type === 'lowHpMultiplier') as Extract<ItemEffect, { type: 'lowHpMultiplier' }>[]
  const firstHit   = sum<Extract<ItemEffect, { type: 'firstHitBonus' }>>(allEffects, 'firstHitBonus', 'bonus')
  const chargePreserveChance = (allEffects.filter(e => e.type === 'chargePreserve') as Extract<ItemEffect, { type: 'chargePreserve' }>[])
    .reduce((s, e) => s + e.chance, 0)
  const restHealBonus   = sum<Extract<ItemEffect, { type: 'restHealBonus' }>>(allEffects, 'restHealBonus', 'amount')
  const restChargeBonus = sum<Extract<ItemEffect, { type: 'restChargeBonus' }>>(allEffects, 'restChargeBonus', 'amount')

  function Row({ label, value, color = '#aaa' }: { label: string; value: string; color?: string }) {
    return (
      <div className={s.row}>
        <span className={s.rowLabel}>{label}</span>
        <span className={s.rowVal} style={{ color }}>{value}</span>
      </div>
    )
  }

  return (
    <div>
      {/* HP */}
      <div className={s.hpSection}>
        <PixelHpBar pct={pct * 100} color={hpColor} />
        <div className={s.hpMeta}>
          <span className={s.hpLabel}>❤ HP</span>
          <span style={{ color: hpColor, fontSize: 9 }}>
            {playerHp}
            <span style={{ color: '#444', fontSize: 6 }}> / {effectiveMaxHp}</span>
            {effectiveMaxHp < MAX_HP && <span style={{ color: '#f87171', fontSize: 5 }}> (−{MAX_HP - effectiveMaxHp} макс.)</span>}
          </span>
        </div>
      </div>

      {/* Stats rows */}
      <div className={s.statsRows}>
        <Row label="💰 Золото" value={String(gold)} color="#fbbf24" />
        {hitStreak > 0 && <Row label="🔥 Серия ударов" value={String(hitStreak)} color="#f0c040" />}
        {bonusGold > 0 && <Row label="💰 Бонус за победу" value={`+${bonusGold}`} color="#fbbf24" />}
        {regen > 0 && <Row label="💚 Реген / комната" value={`+${regen} HP`} color="#4ade80" />}
        {flatDef > 0 && <Row label="🛡 Снижение урона" value={`−${flatDef}`} color="#60a5fa" />}
        {firstHit > 0 && <Row label="⚡ Первый удар" value={`+${firstHit}`} color="#facc15" />}
        {chargePreserveChance > 0 && <Row label="🔮 Шанс сохр. заряд" value={`${Math.round(chargePreserveChance * 100)}%`} color="#a78bfa" />}
        {healItem && <Row label="💎 Лечение серией" value={`+${healItem.hp} HP / ${healItem.count} уд.`} color="#a78bfa" />}
        {selfDmg > 0 && <Row label="💀 Урон себе за удар" value={`−${selfDmg}`} color="#a855f7" />}
        {lowHp.map((e, i) => (
          <Row key={i}
            label={`⚡ ×${e.multiplier} при HP ≤ ${Math.round(e.threshold * 100)}%`}
            value={playerHp / effectiveMaxHp <= e.threshold ? 'АКТИВНО' : 'НЕАКТИВНО'}
            color={playerHp / effectiveMaxHp <= e.threshold ? '#f0c040' : '#444'}
          />
        ))}
        {restHealBonus > 0 && <Row label="🛏 Бонус лечения отдыха" value={`+${restHealBonus}`} color="#4ade80" />}
        {restChargeBonus > 0 && <Row label="🛏 Бонус зарядов отдыха" value={`+${restChargeBonus}`} color="#a78bfa" />}
      </div>
    </div>
  )
}

// ── Attack tab ────────────────────────────────────────────────────
function AttackTab({ allEffects, classDmgBonus, classResist }: {
  allEffects: ItemEffect[]
  classDmgBonus: ElemStat[]
  classResist: ElemStat[]
}) {
  const flatAtk = sum<Extract<ItemEffect, { type: 'flatAttack' }>>(allEffects, 'flatAttack', 'amount')
  const resistAll = ELEM_DISPLAY.map(ed => ({
    ...ed,
    resist: allEffects
      .filter(e => e.type === 'flatResistElement' &&
        (e as Extract<ItemEffect, { type: 'flatResistElement' }>).element === ed.key)
      .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatResistElement' }>).amount, 0),
  }))

  return (
    <div>
      {/* Element attack bonuses */}
      <div className={s.section}>
        <div className={s.sectionTitle}>АТАКА ПО СТИХИЯМ</div>
        {ELEM_DISPLAY.map(ed => {
          const eb = allEffects
            .filter(e => e.type === 'flatAttackElement' &&
              (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).element === ed.key)
            .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).amount, 0)
          const classVal = classDmgBonus.find(b => b.element === ed.key)?.value ?? 0
          const total  = flatAtk + eb + classVal
          const active = total > 0
          return (
            <div key={ed.key} className={s.elemRow} style={{ opacity: active ? 1 : 0.3 }}>
              <span style={{ color: ed.color, fontSize: 6 }}>{ed.icon} {ed.label}</span>
              <div className={s.elemRight}>
                <span className={s.elemVal} style={{
                  color: total > 0 ? '#4ade80' : total < 0 ? '#f87171' : '#333',
                }}>
                  {total > 0 ? `+${total}` : total < 0 ? `${total}` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resistances */}
      <div className={s.section}>
        <div className={s.sectionTitle}>СОПРОТИВЛЕНИЕ</div>
        {resistAll.map(r => {
          const classVal = classResist.find(cr => cr.element === r.key)?.value ?? 0
          const total = r.resist + classVal
          const active = total !== 0
          return (
            <div key={r.key} className={s.elemRow} style={{ opacity: active ? 1 : 0.25 }}>
              <span style={{ color: r.color, fontSize: 6 }}>{r.icon} {r.label}</span>
              <span className={s.elemVal} style={{
                color: total > 0 ? '#60a5fa' : total < 0 ? '#f04545' : '#333',
              }}>
                {total > 0 ? `−${total}` : total < 0 ? `+${Math.abs(total)}` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Items tab ─────────────────────────────────────────────────────
function ItemsTab({ ownedItems, fontFamily }: { ownedItems: GameItem[]; fontFamily: string }) {
  const [selected, setSelected] = useState<GameItem | null>(null)

  const counts: Record<string, number> = {}
  for (const i of ownedItems) counts[i.id] = (counts[i.id] ?? 0) + 1
  const seenIds = new Set<string>()
  const unique = ownedItems.filter(i => { if (seenIds.has(i.id)) return false; seenIds.add(i.id); return true })

  if (unique.length === 0) {
    return (
      <div className={s.emptyItems} style={{ fontFamily }}>НЕТ ПРЕДМЕТОВ</div>
    )
  }

  return (
    <div className={s.itemsLayout}>
      {/* Grid */}
      <div className={s.itemsGridList}>
        {unique.map(item => {
          const isSel = selected?.id === item.id
          const rc    = RARITY_COLOR[item.rarity]
          return (
            <button
              key={item.id}
              onClick={() => setSelected(isSel ? null : item)}
              className={s.itemSlot}
              style={{
                background: isSel ? `${rc}22` : '#0e0c1a',
                border: `2px solid ${isSel ? rc : rc + '44'}`,
                boxShadow: isSel ? `0 0 10px ${rc}44, inset 0 0 8px ${rc}11` : '2px 2px 0 #000',
              }}
            >
              {itemIconSrc(item.id)
                ? <img src={itemIconSrc(item.id)!} draggable={false} className={s.itemSlotImg} />
                : <span className={s.itemSlotEmoji}>{item.icon}</span>
              }
              {counts[item.id] > 1 && (
                <span className={s.itemSlotCount} style={{ fontFamily }}>×{counts[item.id]}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail */}
      <div className={s.itemDetail}>
        {selected ? (
          <div className={s.itemDetailContent}>
            <div className={s.itemDetailHeader}>
              <div className={s.itemDetailIcon} style={{ border: `2px solid ${RARITY_COLOR[selected.rarity]}` }}>
                {itemIconSrc(selected.id)
                  ? <img src={itemIconSrc(selected.id)!} draggable={false} className={s.itemDetailImg} />
                  : <span className={s.itemDetailEmoji}>{selected.icon}</span>
                }
              </div>
              <div>
                <div className={s.itemDetailName} style={{ color: RARITY_COLOR[selected.rarity] }}>
                  {selected.name.toUpperCase()}
                  {counts[selected.id] > 1 && (
                    <span style={{ color: '#ffd700', fontSize: 5 }}> ×{counts[selected.id]}</span>
                  )}
                </div>
                <div className={s.itemDetailRarity}>
                  {selected.rarity === 'common' ? 'Обычный' : selected.rarity === 'rare' ? 'Редкий' : 'Эпический'}
                  {selected.eventOnly && <span className={s.itemDetailRarityEvent}>СОБЫТИЕ</span>}
                </div>
              </div>
            </div>

            <div className={s.effectsList}>
              {effectTags(selected.effects).map((tag, i) => (
                <div key={i} className={`${s.effectRow} ${tag.positive ? s['effectRow--pos'] : s['effectRow--neg']}`}>
                  <span className={tag.positive ? s['effectText--pos'] : s['effectText--neg']}>
                    {tag.positive ? '▲' : '▼'} {tag.text}
                  </span>
                </div>
              ))}
            </div>

            {selected.flavor && (
              <p className={s.flavorText}>"{selected.flavor}"</p>
            )}
          </div>
        ) : (
          <div className={s.selectHint} style={{ fontFamily }}>← ВЫБЕРИ ПРЕДМЕТ</div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export function StatsPanel({
  playerHp, effectiveMaxHp, gold, hitStreak,
  ownedItems, classDmgBonus, classResist, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('status')
  const allEffects = ownedItems.flatMap(i => i.effects)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'status', label: 'СТАТУС' },
    { id: 'attack', label: 'АТАКА' },
    { id: 'items',  label: `ПРЕДМЕТЫ${ownedItems.length ? ` (${ownedItems.length})` : ''}` },
  ]

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.panel} onClick={e => e.stopPropagation()} style={{ fontFamily: PX }}>

        {/* Header */}
        <div className={s.header}>
          <span className={s.headerTitle} style={{ fontFamily: PX }}>■ ХАРАКТЕРИСТИКИ</span>
          <button onClick={onClose} className={s.closeBtn} style={{ fontFamily: PX }}>✕</button>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`${s.tab} ${tab === t.id ? s['tab--active'] : s['tab--inactive']}`}
              style={{ fontFamily: PX }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={s.content}>
          {tab === 'status' && (
            <StatusTab
              playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
              gold={gold} hitStreak={hitStreak} allEffects={allEffects}
            />
          )}
          {tab === 'attack' && (
            <AttackTab allEffects={allEffects} classDmgBonus={classDmgBonus} classResist={classResist} />
          )}
          {tab === 'items' && (
            <ItemsTab ownedItems={ownedItems} fontFamily={PX} />
          )}
        </div>

      </div>
    </div>
  )
}
