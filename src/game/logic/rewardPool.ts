import { ALL_ITEMS } from '@game/data/items'
import { ALL_SPELLS } from '@game/data/spells'
import type { Spell } from '@game/data/spells'
import type { GameItem } from '@game/data/items'
import type { ChestOption } from '../../types'
import { RARITY_WEIGHT } from '../../constants'

/** Строит пул всех доступных наград (предметы + незанятые заклинания) */
export function buildRewardPool(equippedSpells: Spell[], spellSlots: number): ChestOption[] {
  const ownedSpIds  = new Set(equippedSpells.map(s => s.id))
  const canAddSpell = equippedSpells.length < spellSlots
  return [
    ...ALL_ITEMS.map(d => ({ kind: 'item' as const, data: d })),
    ...(canAddSpell
      ? ALL_SPELLS.filter(s => !ownedSpIds.has(s.id)).map(d => ({ kind: 'spell' as const, data: d }))
      : []),
  ]
}

/** Взвешенная случайная выборка без повторов из пула */
export function pickWeighted(pool: ChestOption[], count: number): ChestOption[] {
  const weighted: ChestOption[] = []
  for (const o of pool) {
    const w = o.kind === 'spell' ? 25 : RARITY_WEIGHT[(o.data as GameItem).rarity]
    for (let i = 0; i < w; i++) weighted.push(o)
  }
  weighted.sort(() => Math.random() - 0.5)

  const result: ChestOption[] = []
  const seen = new Set<string>()
  for (const o of weighted) {
    if (!seen.has(o.data.id)) { seen.add(o.data.id); result.push(o) }
    if (result.length >= count) break
  }
  return result
}
