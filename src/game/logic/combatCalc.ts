import type { Spell } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'

/** Урон одной сыгранной карты с учётом предметов */
export function calcCardDamage(
  card: Spell,
  ownedItems: GameItem[],
  playerHp: number,
  effectiveMaxHp: number,
): number {
  // Базовый удар (punch) НЕ получает бонусы от предметов
  if (card.infinite) return Math.max(1, card.baseDamage)

  const allEffects = ownedItems.flatMap(i => i.effects)

  const flat = allEffects
    .filter(e => e.type === 'flatAttack')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttack' }>).amount, 0)

  const elemBonus = allEffects
    .filter(e => e.type === 'flatAttackElement' &&
      (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).element === card.element)
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).amount, 0)

  let dmg = card.baseDamage + flat + elemBonus

  for (const eff of allEffects.filter(e => e.type === 'lowHpMultiplier')) {
    const e = eff as Extract<ItemEffect, { type: 'lowHpMultiplier' }>
    if (playerHp / effectiveMaxHp <= e.threshold) dmg *= e.multiplier
  }

  return Math.max(1, Math.round(dmg))
}

/** Суммарный урон всех заклинаний с учётом всех предметов и HP-порогов */
export function calcPlayerDamage(
  equippedSpells: Spell[],
  ownedItems: GameItem[],
  playerHp: number,
  effectiveMaxHp: number,
): number {
  if (equippedSpells.length === 0) return 0

  const allEffects = ownedItems.flatMap(i => i.effects)

  const flat = allEffects
    .filter(e => e.type === 'flatAttack')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttack' }>).amount, 0)

  const elems = new Set(equippedSpells.map(s => s.element))

  let total = 0
  for (const spell of equippedSpells) {
    const elemBonus = allEffects
      .filter(e => e.type === 'flatAttackElement' &&
        (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).element === spell.element)
      .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).amount, 0)

    let dmg = spell.baseDamage + flat + elemBonus

    for (const item of ownedItems) {
      for (const eff of item.effects) {
        if (eff.type !== 'synergy') continue
        const e = eff as Extract<ItemEffect, { type: 'synergy' }>
        if (elems.has(e.e1) && elems.has(e.e2) && (spell.element === e.e1 || spell.element === e.e2))
          dmg *= e.multiplier
      }
    }

    total += dmg
  }

  for (const eff of allEffects.filter(e => e.type === 'lowHpMultiplier')) {
    const e = eff as Extract<ItemEffect, { type: 'lowHpMultiplier' }>
    if (playerHp / effectiveMaxHp <= e.threshold) total *= e.multiplier
  }

  return Math.max(1, Math.round(total))
}

/** Входящий урон после защиты и сопротивления */
export function calcIncomingDamage(
  ownedItems: GameItem[],
  raw: number,
  element?: string,
): number {
  const allEffects = ownedItems.flatMap(i => i.effects)

  const def = allEffects
    .filter(e => e.type === 'flatDefense')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatDefense' }>).amount, 0)

  const resist = element
    ? Math.min(0.8, allEffects
        .filter(e => e.type === 'resistance' &&
          (e as Extract<ItemEffect, { type: 'resistance' }>).element === element)
        .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'resistance' }>).reduction, 0))
    : 0

  return Math.max(1, Math.round((raw - def) * (1 - resist)))
}
