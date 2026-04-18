import type { Spell } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { EnemyDef } from '@game/data/enemies'

/** Урон одной сыгранной карты с учётом предметов и сопротивлений врага */
export function calcCardDamage(
  card: Spell,
  ownedItems: GameItem[],
  playerHp: number,
  effectiveMaxHp: number,
  enemy?: Pick<EnemyDef, 'weaknesses' | 'resistances'>,
  charges?: number,   // текущие заряды карты (для lastChargeDamage)
  gold?: number,      // монеты игрока (для goldScaling)
): number {
  if (card.infinite) return Math.max(1, card.baseDamage)

  const allEffects = ownedItems.flatMap(i => i.effects)

  // ── Flat bonuses ─────────────────────────────────────────────────
  const flat = allEffects
    .filter(e => e.type === 'flatAttack')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttack' }>).amount, 0)

  const elemFlat = allEffects
    .filter(e => e.type === 'flatAttackElement' &&
      (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).element === card.element)
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatAttackElement' }>).amount, 0)

  // ── Gold scaling ─────────────────────────────────────────────────
  const goldBonus = gold != null
    ? allEffects
        .filter(e => e.type === 'goldScaling')
        .reduce((s, e) => s + Math.floor(gold / (e as Extract<ItemEffect, { type: 'goldScaling' }>).per), 0)
    : 0

  // ── Last charge bonus ─────────────────────────────────────────────
  const lastChargeBonus = charges === 1
    ? allEffects
        .filter(e => e.type === 'lastChargeDamage')
        .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'lastChargeDamage' }>).bonus, 0)
    : 0

  // ── Charge bonus (+N per remaining charge) ────────────────────────
  const chargeBonusTotal = charges != null
    ? allEffects
        .filter(e => e.type === 'chargeBonus')
        .reduce((s, e) => s + charges * (e as Extract<ItemEffect, { type: 'chargeBonus' }>).bonus, 0)
    : 0

  let dmg = card.baseDamage + flat + elemFlat + goldBonus + lastChargeBonus + chargeBonusTotal

  // ── Low HP multiplier ─────────────────────────────────────────────
  for (const eff of allEffects.filter(e => e.type === 'lowHpMultiplier')) {
    const e = eff as Extract<ItemEffect, { type: 'lowHpMultiplier' }>
    if (playerHp / effectiveMaxHp <= e.threshold) dmg *= e.multiplier
  }

  // ── Enemy elemental weakness/resistance ───────────────────────────
  if (enemy) {
    if (enemy.weaknesses?.includes(card.element))  dmg *= 1.5
    if (enemy.resistances?.includes(card.element)) dmg *= 0.5
  }

  return Math.max(1, Math.round(dmg))
}

/** Суммарный урон всех заклинаний (для отображения в статах) */
export function calcPlayerDamage(
  equippedSpells: Spell[],
  ownedItems: GameItem[],
  playerHp: number,
  effectiveMaxHp: number,
  gold?: number,
): number {
  if (equippedSpells.length === 0) return 0
  let total = 0
  for (const spell of equippedSpells) {
    total += calcCardDamage(spell, ownedItems, playerHp, effectiveMaxHp, undefined, undefined, gold)
  }
  return Math.max(1, Math.round(total))
}

// ─────────────────────────────────────────────────────────────────
// Per-hit side-effects — pure functions, used by AppThree + tests
// ─────────────────────────────────────────────────────────────────

/** HP восстановление от lifeSteal за один удар */
export function calcLifeSteal(ownedItems: GameItem[]): number {
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'lifeSteal')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'lifeSteal' }>).amount, 0)
}

/** Урон от самоудара за один удар */
export function calcSelfDamage(ownedItems: GameItem[]): number {
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'selfDamageOnHit')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'selfDamageOnHit' }>).amount, 0)
}

/** Доп. урон от поджога огня (fireBurn). baseDmg — урон основного удара */
export function calcFireBurn(ownedItems: GameItem[], baseDmg: number, element: string): number {
  if (element !== 'fire') return 0
  const ratio = ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'fireBurn')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'fireBurn' }>).ratio, 0)
  return ratio > 0 ? Math.max(1, Math.round(baseDmg * ratio)) : 0
}

/** Урон цепной молнии (lightningChain). roll — значение 0–1 вместо Math.random() */
export function calcLightningChain(ownedItems: GameItem[], baseDmg: number, element: string, roll: number): number {
  if (element !== 'lightning') return 0
  const chance = Math.min(0.8, ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'lightningChain')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'lightningChain' }>).chance, 0))
  if (chance <= 0 || roll >= chance) return 0
  return Math.max(1, Math.round(baseDmg * 0.5))
}

/** Щит земли от earthArmor за удар землёй */
export function calcEarthArmorGain(ownedItems: GameItem[], element: string): number {
  if (element !== 'earth') return 0
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'earthArmor')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'earthArmor' }>).amount, 0)
}

/** HP восстановление от darkDrain. baseDmg — урон основного удара */
export function calcDarkDrain(ownedItems: GameItem[], baseDmg: number, element: string): number {
  if (element !== 'dark') return 0
  const ratio = ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'darkDrain')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'darkDrain' }>).ratio, 0)
  return ratio > 0 ? Math.max(1, Math.round(baseDmg * ratio)) : 0
}

/** HP восстановление waterKillHeal при убийстве водой */
export function calcWaterKillHeal(ownedItems: GameItem[], element: string, killed: boolean): number {
  if (element !== 'water' || !killed) return 0
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'waterKillHeal')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'waterKillHeal' }>).amount, 0)
}

/** Бонус elementDiversity. usedElements — Set стихий, использованных в этом бою (включая текущую) */
export function calcDiversityBonus(ownedItems: GameItem[], usedElements: Set<string>, infinite: boolean): number {
  if (infinite) return 0
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'elementDiversity')
    .reduce((s, e) => s + usedElements.size * (e as Extract<ItemEffect, { type: 'elementDiversity' }>).bonus, 0)
}

/** Накопленный бонус physicalMomentum. hitCount — кол-во физических ударов ДО этого удара */
export function calcMomentumBonus(ownedItems: GameItem[], element: string, hitCount: number, infinite: boolean): number {
  if (infinite || element !== 'physical') return 0
  const bonusPerHit = ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'physicalMomentum')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'physicalMomentum' }>).bonus, 0)
  return hitCount * bonusPerHit
}

export type ComboResult = { effect: 'damage' | 'heal' | 'shield' | 'weaken'; amount: number } | null

/** Результат elementCombo если сработал (prevElement → currentElement) */
export function calcElementCombo(ownedItems: GameItem[], prevElement: string | null, currentElement: string, infinite: boolean): ComboResult[] {
  if (infinite || !prevElement) return []
  const results: ComboResult[] = []
  for (const eff of ownedItems.flatMap(i => i.effects)) {
    if (eff.type !== 'elementCombo') continue
    const ec = eff as Extract<ItemEffect, { type: 'elementCombo' }>
    if (ec.from === prevElement && ec.to === currentElement) {
      results.push({ effect: ec.effect, amount: ec.amount })
    }
  }
  return results
}

/** Бонус firstHitBonus (только если isFirstHit=true) */
export function calcFirstHitBonus(ownedItems: GameItem[], isFirstHit: boolean, infinite: boolean): number {
  if (!isFirstHit || infinite) return 0
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'firstHitBonus')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'firstHitBonus' }>).bonus, 0)
}

/** Бонус elementStreak (только если prevElement === currentElement) */
export function calcStreakBonus(ownedItems: GameItem[], prevElement: string | null, currentElement: string, infinite: boolean): number {
  if (infinite || prevElement !== currentElement) return 0
  return ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'elementStreak')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'elementStreak' }>).bonus, 0)
}

/** Входящий урон после защиты */
export function calcIncomingDamage(
  ownedItems: GameItem[],
  raw: number,
  element?: string,
): number {
  const allEffects = ownedItems.flatMap(i => i.effects)

  const def = allEffects
    .filter(e => e.type === 'flatDefense')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatDefense' }>).amount, 0)

  const elemFlat = element
    ? allEffects
        .filter(e => e.type === 'flatResistElement' &&
          (e as Extract<ItemEffect, { type: 'flatResistElement' }>).element === element)
        .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'flatResistElement' }>).amount, 0)
    : 0

  return Math.max(1, Math.round(raw - def - elemFlat))
}
