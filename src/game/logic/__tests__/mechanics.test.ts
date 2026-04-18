/**
 * Unit-тесты боевых механик.
 *
 * Принцип:
 *  - Тесты на ЛОГИКУ (без реальных предметов) — проверяют поведение функции
 *    на явных значениях (hardcoded). Баланс не важен.
 *  - Тесты на РЕАЛЬНЫЕ ПРЕДМЕТЫ — читают параметры из ALL_ITEMS и проверяют
 *    что математика применяется правильно. Баланс можно менять свободно.
 */
import { describe, it, expect } from 'vitest'
import {
  calcCardDamage,
  calcIncomingDamage,
  calcLifeSteal,
  calcSelfDamage,
  calcFireBurn,
  calcLightningChain,
  calcEarthArmorGain,
  calcDarkDrain,
  calcWaterKillHeal,
  calcDiversityBonus,
  calcMomentumBonus,
  calcElementCombo,
  calcFirstHitBonus,
  calcStreakBonus,
} from '../combatCalc'
import type { Spell } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'
import { ALL_ITEMS } from '@game/data/items'

// ── Helpers ────────────────────────────────────────────────────────

function spell(overrides: Partial<Spell> = {}): Spell {
  return { id: 't', name: 'T', icon: '?', description: '', element: 'fire', baseDamage: 10, ...overrides }
}

function item(effects: GameItem['effects']): GameItem {
  return { id: 'x', name: 'x', icon: '?', flavor: '', rarity: 'common', effects }
}

function realItem(id: string): GameItem {
  const found = ALL_ITEMS.find(i => i.id === id)
  if (!found) throw new Error(`Item not found: ${id}`)
  return found
}

/** Вычитает эффект нужного типа из предмета */
function fx<T extends ItemEffect['type']>(it: GameItem, type: T): Extract<ItemEffect, { type: T }> {
  const e = it.effects.find(e => e.type === type)
  if (!e) throw new Error(`Effect ${type} not found on ${it.id}`)
  return e as Extract<ItemEffect, { type: T }>
}

function sumFx<T extends ItemEffect['type']>(items: GameItem[], type: T, field: string): number {
  return items.flatMap(i => i.effects)
    .filter(e => e.type === type)
    .reduce((s, e) => s + (e as any)[field], 0)
}

const MAX = 100
const BASE_DMG = 20 // удобное число для ratio-тестов

// ══ firstHitBonus ═════════════════════════════════════════════════

describe('firstHitBonus — логика', () => {
  it('активируется только на первом ударе', () => {
    const items = [item([{ type: 'firstHitBonus', bonus: 5 }])]
    expect(calcFirstHitBonus(items, true,  false)).toBe(5)
    expect(calcFirstHitBonus(items, false, false)).toBe(0)
  })

  it('не работает для infinite заклинания', () => {
    const items = [item([{ type: 'firstHitBonus', bonus: 5 }])]
    expect(calcFirstHitBonus(items, true, true)).toBe(0)
  })

  it('суммирует несколько предметов', () => {
    const items = [item([{ type: 'firstHitBonus', bonus: 3 }]), item([{ type: 'firstHitBonus', bonus: 7 }])]
    expect(calcFirstHitBonus(items, true, false)).toBe(10)
  })
})

describe('firstHitBonus — реальные предметы', () => {
  it('charged_glove: первый удар = +bonus, второй = 0', () => {
    const g = realItem('charged_glove')
    const bonus = fx(g, 'firstHitBonus').bonus
    expect(calcFirstHitBonus([g], true,  false)).toBe(bonus)
    expect(calcFirstHitBonus([g], false, false)).toBe(0)
  })

  it('battle_focus: первый удар = +bonus', () => {
    const f = realItem('battle_focus')
    const bonus = fx(f, 'firstHitBonus').bonus
    expect(calcFirstHitBonus([f], true, false)).toBe(bonus)
  })

  it('charged_glove + battle_focus: суммарный bonus на первом ударе', () => {
    const items = [realItem('charged_glove'), realItem('battle_focus')]
    const total = sumFx(items, 'firstHitBonus', 'bonus')
    expect(calcFirstHitBonus(items, true, false)).toBe(total)
  })
})

// ══ elementStreak ═════════════════════════════════════════════════

describe('elementStreak — логика', () => {
  it('активируется при повторе той же стихии', () => {
    const items = [item([{ type: 'elementStreak', bonus: 3 }])]
    expect(calcStreakBonus(items, 'fire', 'fire', false)).toBe(3)
  })

  it('не активируется при другой стихии', () => {
    const items = [item([{ type: 'elementStreak', bonus: 3 }])]
    expect(calcStreakBonus(items, 'fire', 'water', false)).toBe(0)
  })

  it('не активируется при prevElement = null (первый удар)', () => {
    const items = [item([{ type: 'elementStreak', bonus: 3 }])]
    expect(calcStreakBonus(items, null, 'fire', false)).toBe(0)
  })

  it('не работает для infinite заклинания', () => {
    const items = [item([{ type: 'elementStreak', bonus: 3 }])]
    expect(calcStreakBonus(items, 'fire', 'fire', true)).toBe(0)
  })
})

describe('elementStreak — реальные предметы', () => {
  it('harmony_stone: streak = +bonus при повторе', () => {
    const s = realItem('harmony_stone')
    const bonus = fx(s, 'elementStreak').bonus
    expect(calcStreakBonus([s], 'water', 'water', false)).toBe(bonus)
    expect(calcStreakBonus([s], 'water', 'fire',  false)).toBe(0)
  })

  it('resonance_ring: streak = +bonus при повторе', () => {
    const r = realItem('resonance_ring')
    const bonus = fx(r, 'elementStreak').bonus
    expect(calcStreakBonus([r], 'earth', 'earth', false)).toBe(bonus)
  })

  it('harmony_stone + resonance_ring: суммарный стак', () => {
    const items = [realItem('harmony_stone'), realItem('resonance_ring')]
    const total = sumFx(items, 'elementStreak', 'bonus')
    expect(calcStreakBonus(items, 'fire', 'fire', false)).toBe(total)
  })
})

// ══ elementDiversity ══════════════════════════════════════════════

describe('elementDiversity — логика', () => {
  it('возвращает 0 без предметов', () => {
    expect(calcDiversityBonus([], new Set(['fire']), false)).toBe(0)
  })

  it('bonus × кол-во уникальных стихий', () => {
    const items = [item([{ type: 'elementDiversity', bonus: 2 }])]
    expect(calcDiversityBonus(items, new Set(['fire']),               false)).toBe(2)
    expect(calcDiversityBonus(items, new Set(['fire', 'water']),      false)).toBe(4)
    expect(calcDiversityBonus(items, new Set(['fire', 'water', 'dark']), false)).toBe(6)
  })

  it('не работает для infinite', () => {
    const items = [item([{ type: 'elementDiversity', bonus: 2 }])]
    expect(calcDiversityBonus(items, new Set(['fire', 'water']), true)).toBe(0)
  })

  it('несколько предметов суммируют bonus', () => {
    const items = [item([{ type: 'elementDiversity', bonus: 1 }]), item([{ type: 'elementDiversity', bonus: 2 }])]
    expect(calcDiversityBonus(items, new Set(['fire', 'water']), false)).toBe(6) // (1+2)*2
  })
})

describe('elementDiversity — реальные предметы', () => {
  for (const id of ['prism', 'chaos_crystal', 'world_shard']) {
    it(`${id}: bonus применяется правильно`, () => {
      const it_ = realItem(id)
      const bonus = fx(it_, 'elementDiversity').bonus
      const used = new Set(['fire', 'water'])
      expect(calcDiversityBonus([it_], used, false)).toBe(bonus * used.size)
    })
  }

  it('prism + world_shard: суммарный bonus × stihii', () => {
    const items = [realItem('prism'), realItem('world_shard')]
    const total = sumFx(items, 'elementDiversity', 'bonus')
    const used = new Set(['fire', 'water', 'dark'])
    expect(calcDiversityBonus(items, used, false)).toBe(total * used.size)
  })
})

// ══ physicalMomentum ══════════════════════════════════════════════

describe('physicalMomentum — логика', () => {
  it('0 на первом ударе (hitCount=0)', () => {
    const items = [item([{ type: 'physicalMomentum', bonus: 2 }])]
    expect(calcMomentumBonus(items, 'physical', 0, false)).toBe(0)
  })

  it('hitCount × bonusPerHit', () => {
    const items = [item([{ type: 'physicalMomentum', bonus: 2 }])]
    expect(calcMomentumBonus(items, 'physical', 3, false)).toBe(6)
    expect(calcMomentumBonus(items, 'physical', 5, false)).toBe(10)
  })

  it('0 для не-physical стихий', () => {
    const items = [item([{ type: 'physicalMomentum', bonus: 2 }])]
    expect(calcMomentumBonus(items, 'fire', 3, false)).toBe(0)
  })

  it('0 для infinite', () => {
    const items = [item([{ type: 'physicalMomentum', bonus: 2 }])]
    expect(calcMomentumBonus(items, 'physical', 3, true)).toBe(0)
  })
})

describe('physicalMomentum — реальные предметы', () => {
  for (const id of ['iron_fist', 'berserker_fist']) {
    it(`${id}: hitCount × bonus = ожидаемый урон`, () => {
      const it_ = realItem(id)
      const bonus = fx(it_, 'physicalMomentum').bonus
      expect(calcMomentumBonus([it_], 'physical', 0, false)).toBe(0)
      expect(calcMomentumBonus([it_], 'physical', 1, false)).toBe(bonus)
      expect(calcMomentumBonus([it_], 'physical', 4, false)).toBe(4 * bonus)
    })
  }

  it('iron_fist + berserker_fist: суммарный bonus/hit', () => {
    const items = [realItem('iron_fist'), realItem('berserker_fist')]
    const total = sumFx(items, 'physicalMomentum', 'bonus')
    expect(calcMomentumBonus(items, 'physical', 4, false)).toBe(4 * total)
  })

  it('сброс между боями: hitCount=0 снова даёт 0', () => {
    const it_ = realItem('iron_fist')
    expect(calcMomentumBonus([it_], 'physical', 3, false)).toBeGreaterThan(0)
    expect(calcMomentumBonus([it_], 'physical', 0, false)).toBe(0)
  })
})

// ══ fireBurn ══════════════════════════════════════════════════════

describe('fireBurn — логика', () => {
  it('0 без предмета', () => {
    expect(calcFireBurn([], BASE_DMG, 'fire')).toBe(0)
  })

  it('0 для не-огненной стихии', () => {
    const items = [item([{ type: 'fireBurn', ratio: 0.3 }])]
    expect(calcFireBurn(items, BASE_DMG, 'water')).toBe(0)
  })

  it('round(baseDmg × ratio)', () => {
    const items = [item([{ type: 'fireBurn', ratio: 0.3 }])]
    expect(calcFireBurn(items, BASE_DMG, 'fire')).toBe(Math.round(BASE_DMG * 0.3))
  })

  it('минимум 1 когда активен', () => {
    const items = [item([{ type: 'fireBurn', ratio: 0.01 }])]
    expect(calcFireBurn(items, 1, 'fire')).toBe(1)
  })

  it('несколько предметов суммируют ratio', () => {
    const items = [item([{ type: 'fireBurn', ratio: 0.3 }]), item([{ type: 'fireBurn', ratio: 0.2 }])]
    expect(calcFireBurn(items, BASE_DMG, 'fire')).toBe(Math.round(BASE_DMG * 0.5))
  })
})

describe('fireBurn — реальные предметы', () => {
  for (const id of ['ember_brand', 'inferno_core']) {
    it(`${id}: burn = round(dmg × ratio)`, () => {
      const it_ = realItem(id)
      const ratio = fx(it_, 'fireBurn').ratio
      expect(calcFireBurn([it_], BASE_DMG, 'fire')).toBe(Math.max(1, Math.round(BASE_DMG * ratio)))
      expect(calcFireBurn([it_], BASE_DMG, 'water')).toBe(0)
    })
  }

  it('ember_brand + inferno_core: суммарный ratio', () => {
    const items = [realItem('ember_brand'), realItem('inferno_core')]
    const total = sumFx(items, 'fireBurn', 'ratio')
    expect(calcFireBurn(items, BASE_DMG, 'fire')).toBe(Math.max(1, Math.round(BASE_DMG * total)))
  })
})

// ══ lightningChain ════════════════════════════════════════════════

describe('lightningChain — логика', () => {
  it('0 без предмета', () => {
    expect(calcLightningChain([], BASE_DMG, 'lightning', 0)).toBe(0)
  })

  it('0 для не-молнии', () => {
    const items = [item([{ type: 'lightningChain', chance: 0.5 }])]
    expect(calcLightningChain(items, BASE_DMG, 'fire', 0.1)).toBe(0)
  })

  it('срабатывает когда roll < chance', () => {
    const items = [item([{ type: 'lightningChain', chance: 0.5 }])]
    expect(calcLightningChain(items, BASE_DMG, 'lightning', 0.49)).toBe(Math.round(BASE_DMG * 0.5))
  })

  it('не срабатывает когда roll >= chance', () => {
    const items = [item([{ type: 'lightningChain', chance: 0.5 }])]
    expect(calcLightningChain(items, BASE_DMG, 'lightning', 0.5)).toBe(0)
  })

  it('суммарный шанс ограничен 0.8', () => {
    const items = [item([{ type: 'lightningChain', chance: 0.7 }]), item([{ type: 'lightningChain', chance: 0.7 }])]
    expect(calcLightningChain(items, BASE_DMG, 'lightning', 0.79)).toBeGreaterThan(0)
    expect(calcLightningChain(items, BASE_DMG, 'lightning', 0.81)).toBe(0)
  })

  it('минимум 1 когда срабатывает', () => {
    const items = [item([{ type: 'lightningChain', chance: 1.0 }])]
    expect(calcLightningChain(items, 1, 'lightning', 0)).toBe(1)
  })
})

describe('lightningChain — реальные предметы', () => {
  for (const id of ['storm_fork', 'twin_bolt']) {
    it(`${id}: срабатывает ниже шанса, нет выше`, () => {
      const it_ = realItem(id)
      const chance = fx(it_, 'lightningChain').chance
      expect(calcLightningChain([it_], BASE_DMG, 'lightning', chance - 0.001)).toBe(Math.round(BASE_DMG * 0.5))
      expect(calcLightningChain([it_], BASE_DMG, 'lightning', chance)).toBe(0)
    })
  }

  it('storm_fork + twin_bolt: суммарный шанс, но не больше 0.8', () => {
    const items = [realItem('storm_fork'), realItem('twin_bolt')]
    const raw = sumFx(items, 'lightningChain', 'chance')
    const capped = Math.min(0.8, raw)
    expect(calcLightningChain(items, BASE_DMG, 'lightning', capped - 0.001)).toBeGreaterThan(0)
    expect(calcLightningChain(items, BASE_DMG, 'lightning', capped)).toBe(0)
  })
})

// ══ earthArmor ════════════════════════════════════════════════════

describe('earthArmor — логика', () => {
  it('0 без предмета', () => {
    expect(calcEarthArmorGain([], 'earth')).toBe(0)
  })

  it('0 для не-земли', () => {
    const items = [item([{ type: 'earthArmor', amount: 4 }])]
    expect(calcEarthArmorGain(items, 'fire')).toBe(0)
  })

  it('возвращает amount для земли', () => {
    const items = [item([{ type: 'earthArmor', amount: 4 }])]
    expect(calcEarthArmorGain(items, 'earth')).toBe(4)
  })

  it('суммирует несколько предметов', () => {
    const items = [item([{ type: 'earthArmor', amount: 3 }]), item([{ type: 'earthArmor', amount: 5 }])]
    expect(calcEarthArmorGain(items, 'earth')).toBe(8)
  })
})

describe('earthArmor — реальные предметы', () => {
  for (const id of ['stone_mantle', 'granite_bastion']) {
    it(`${id}: щит = amount при ударе землёй`, () => {
      const it_ = realItem(id)
      const amount = fx(it_, 'earthArmor').amount
      expect(calcEarthArmorGain([it_], 'earth')).toBe(amount)
      expect(calcEarthArmorGain([it_], 'fire')).toBe(0)
    })
  }

  it('stone_mantle + granite_bastion: суммарный щит', () => {
    const items = [realItem('stone_mantle'), realItem('granite_bastion')]
    const total = sumFx(items, 'earthArmor', 'amount')
    expect(calcEarthArmorGain(items, 'earth')).toBe(total)
  })

  it('накопленный щит уменьшает входящий урон', () => {
    const items = [realItem('stone_mantle')]
    const shield = calcEarthArmorGain(items, 'earth')
    const raw = 15
    expect(Math.max(1, calcIncomingDamage([], raw) - shield)).toBe(raw - shield)
  })
})

// ══ darkDrain ═════════════════════════════════════════════════════

describe('darkDrain — логика', () => {
  it('0 без предмета', () => {
    expect(calcDarkDrain([], BASE_DMG, 'dark')).toBe(0)
  })

  it('0 для не-тьмы', () => {
    const items = [item([{ type: 'darkDrain', ratio: 0.2 }])]
    expect(calcDarkDrain(items, BASE_DMG, 'fire')).toBe(0)
  })

  it('round(dmg × ratio)', () => {
    const items = [item([{ type: 'darkDrain', ratio: 0.25 }])]
    expect(calcDarkDrain(items, BASE_DMG, 'dark')).toBe(Math.round(BASE_DMG * 0.25))
  })

  it('минимум 1 когда активен', () => {
    const items = [item([{ type: 'darkDrain', ratio: 0.01 }])]
    expect(calcDarkDrain(items, 1, 'dark')).toBe(1)
  })
})

describe('darkDrain — реальные предметы', () => {
  for (const id of ['shadow_leech', 'void_parasite']) {
    it(`${id}: heal = round(dmg × ratio)`, () => {
      const it_ = realItem(id)
      const ratio = fx(it_, 'darkDrain').ratio
      expect(calcDarkDrain([it_], BASE_DMG, 'dark')).toBe(Math.max(1, Math.round(BASE_DMG * ratio)))
      expect(calcDarkDrain([it_], BASE_DMG, 'fire')).toBe(0)
    })
  }

  it('shadow_leech + void_parasite: суммарный ratio', () => {
    const items = [realItem('shadow_leech'), realItem('void_parasite')]
    const total = sumFx(items, 'darkDrain', 'ratio')
    expect(calcDarkDrain(items, BASE_DMG, 'dark')).toBe(Math.max(1, Math.round(BASE_DMG * total)))
  })
})

// ══ waterKillHeal ════════════════════════════════════════════════

describe('waterKillHeal — логика', () => {
  it('0 без предмета', () => {
    expect(calcWaterKillHeal([], 'water', true)).toBe(0)
  })

  it('0 если не убийство', () => {
    const items = [item([{ type: 'waterKillHeal', amount: 8 }])]
    expect(calcWaterKillHeal(items, 'water', false)).toBe(0)
  })

  it('0 для не-воды', () => {
    const items = [item([{ type: 'waterKillHeal', amount: 8 }])]
    expect(calcWaterKillHeal(items, 'fire', true)).toBe(0)
  })

  it('возвращает amount при убийстве водой', () => {
    const items = [item([{ type: 'waterKillHeal', amount: 8 }])]
    expect(calcWaterKillHeal(items, 'water', true)).toBe(8)
  })
})

describe('waterKillHeal — реальные предметы', () => {
  for (const id of ['tide_chalice', 'deep_chalice']) {
    it(`${id}: heal = amount при убийстве водой`, () => {
      const it_ = realItem(id)
      const amount = fx(it_, 'waterKillHeal').amount
      expect(calcWaterKillHeal([it_], 'water', true)).toBe(amount)
      expect(calcWaterKillHeal([it_], 'water', false)).toBe(0)
      expect(calcWaterKillHeal([it_], 'fire',  true)).toBe(0)
    })
  }

  it('tide_chalice + deep_chalice: суммарное исцеление', () => {
    const items = [realItem('tide_chalice'), realItem('deep_chalice')]
    const total = sumFx(items, 'waterKillHeal', 'amount')
    expect(calcWaterKillHeal(items, 'water', true)).toBe(total)
  })
})

// ══ lifeSteal ════════════════════════════════════════════════════

describe('lifeSteal — реальные предметы', () => {
  for (const id of ['leech_ring', 'vampire_fang']) {
    it(`${id}: heal = amount за удар`, () => {
      const it_ = realItem(id)
      const amount = fx(it_, 'lifeSteal').amount
      expect(calcLifeSteal([it_])).toBe(amount)
    })
  }

  it('leech_ring + vampire_fang: суммарный lifesteal', () => {
    const items = [realItem('leech_ring'), realItem('vampire_fang')]
    const total = sumFx(items, 'lifeSteal', 'amount')
    expect(calcLifeSteal(items)).toBe(total)
  })
})

// ══ selfDamage ════════════════════════════════════════════════════

describe('selfDamage — реальные предметы', () => {
  for (const id of ['blade_oil', 'blood_blade']) {
    it(`${id}: самоурон = amount за удар`, () => {
      const it_ = realItem(id)
      const amount = fx(it_, 'selfDamageOnHit').amount
      expect(calcSelfDamage([it_])).toBe(amount)
    })
  }

  it('blade_oil + blood_blade: суммарный самоурон', () => {
    const items = [realItem('blade_oil'), realItem('blood_blade')]
    const total = sumFx(items, 'selfDamageOnHit', 'amount')
    expect(calcSelfDamage(items)).toBe(total)
  })
})

// ══ elementCombo ═════════════════════════════════════════════════

describe('elementCombo — логика', () => {
  it('пусто без предметов', () => {
    expect(calcElementCombo([], 'water', 'lightning', false)).toHaveLength(0)
  })

  it('пусто когда prev=null', () => {
    const items = [item([{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 }])]
    expect(calcElementCombo(items, null, 'lightning', false)).toHaveLength(0)
  })

  it('пусто для infinite', () => {
    const items = [item([{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 }])]
    expect(calcElementCombo(items, 'water', 'lightning', true)).toHaveLength(0)
  })

  it('срабатывает на matching from→to', () => {
    const items = [item([{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 }])]
    expect(calcElementCombo(items, 'water', 'lightning', false)).toHaveLength(1)
  })

  it('не срабатывает на wrong from или wrong to', () => {
    const items = [item([{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 }])]
    expect(calcElementCombo(items, 'fire',  'lightning', false)).toHaveLength(0)
    expect(calcElementCombo(items, 'water', 'fire',      false)).toHaveLength(0)
  })

  it('несколько предметов могут сработать одновременно', () => {
    const items = [
      item([{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 }]),
      item([{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'heal',   amount: 3 }]),
    ]
    expect(calcElementCombo(items, 'water', 'lightning', false)).toHaveLength(2)
  })
})

describe('elementCombo — реальные предметы', () => {
  const COMBO_ITEMS = [
    'conductor', 'discharger', 'shadow_blade',
    'dark_torch', 'living_water',
    'steel_earth', 'granite_shell',
    'steam_valve', 'void_mist',
  ]

  for (const id of COMBO_ITEMS) {
    it(`${id}: срабатывает только на правильной паре from→to`, () => {
      const it_ = realItem(id)
      const eff = fx(it_, 'elementCombo')
      // Правильная пара — срабатывает
      const hit = calcElementCombo([it_], eff.from, eff.to, false)
      expect(hit).toHaveLength(1)
      expect(hit[0]).toEqual({ effect: eff.effect, amount: eff.amount })
      // Неправильная пара — нет
      expect(calcElementCombo([it_], eff.to, eff.from, false)).toHaveLength(0)
    })
  }

  it('два предмета с одной парой — оба срабатывают', () => {
    // Используем предметы у которых одинаковый from→to если есть,
    // иначе проверяем сумму damage combo
    const items = [realItem('conductor'), realItem('conductor')]
    const combos = calcElementCombo(items, 'water', 'lightning', false)
    expect(combos).toHaveLength(2)
    const total = combos.reduce((s, c) => s + c!.amount, 0)
    expect(total).toBe(fx(realItem('conductor'), 'elementCombo').amount * 2)
  })
})

// ══ calcCardDamage — реальные предметы ════════════════════════════

describe('calcCardDamage — реальные предметы', () => {
  it('executioner: +bonus только на последнем заряде', () => {
    const ex = realItem('executioner')
    const bonus = fx(ex, 'lastChargeDamage').bonus
    const base = spell()
    expect(calcCardDamage(base, [ex], 100, MAX, undefined, 1)).toBe(10 + bonus)
    expect(calcCardDamage(base, [ex], 100, MAX, undefined, 2)).toBe(10)
  })

  it('crystal_lens: +bonus × charges', () => {
    const lens = realItem('crystal_lens')
    const bonus = fx(lens, 'chargeBonus').bonus
    const flatAtk = fx(lens, 'flatAttack').amount
    expect(calcCardDamage(spell(), [lens], 100, MAX, undefined, 3)).toBe(10 + flatAtk + 3 * bonus)
    expect(calcCardDamage(spell(), [lens], 100, MAX, undefined, 1)).toBe(10 + flatAtk + 1 * bonus)
  })

  it('merchant_eye: +1 за каждые N монет', () => {
    const eye = realItem('merchant_eye')
    const per = fx(eye, 'goldScaling').per
    const gold = per * 3
    expect(calcCardDamage(spell(), [eye], 100, MAX, undefined, undefined, gold)).toBe(10 + 3)
  })

  it('adrenaline: ×mult при HP ≤ threshold, иначе без бонуса', () => {
    const adr = realItem('adrenaline')
    const { threshold, multiplier } = fx(adr, 'lowHpMultiplier')
    const below = Math.floor(MAX * threshold)
    const above = Math.ceil(MAX * threshold) + 1
    // Учитываем flatResistElement penalty — на calcCardDamage не влияет
    expect(calcCardDamage(spell(), [adr], below, MAX)).toBe(Math.round(10 * multiplier))
    expect(calcCardDamage(spell(), [adr], above, MAX)).toBe(10)
  })

  it('midas_touch: goldScaling доминирует над flatAttack penalty при высоком gold', () => {
    const midas = realItem('midas_touch')
    const per = fx(midas, 'goldScaling').per
    const flatAtk = fx(midas, 'flatAttack').amount // отрицательный
    const gold = per * 10
    const expected = 10 + flatAtk + 10 // -N atk + 10 gold bonus
    expect(calcCardDamage(spell(), [midas], 100, MAX, undefined, undefined, gold)).toBe(expected)
  })
})

// ══ Комбинации и корнеркейсы ══════════════════════════════════════

describe('комбинации и корнеркейсы', () => {
  it('chargeBonus и lastChargeDamage вместе: пиковый урон на 1 заряде', () => {
    const lens = realItem('crystal_lens')
    const exec = realItem('executioner')
    const chargeBonusVal = fx(lens, 'chargeBonus').bonus
    const flatAtkVal = fx(lens, 'flatAttack').amount
    const lastChargeVal = fx(exec, 'lastChargeDamage').bonus
    const maxHpVal = fx(exec, 'maxHp').amount // отрицательный, не влияет на урон
    void maxHpVal
    // charges=1: base + flatAtk + 1*chargeBonus + lastCharge
    const expected = 10 + flatAtkVal + 1 * chargeBonusVal + lastChargeVal
    expect(calcCardDamage(spell(), [lens, exec], 100, MAX, undefined, 1)).toBe(expected)
  })

  it('adrenaline + death_wish: оба lowHpMult перемножаются', () => {
    const adr = realItem('adrenaline')
    const dw  = realItem('death_wish')
    const { threshold: t1, multiplier: m1 } = fx(adr, 'lowHpMultiplier')
    const { threshold: t2, multiplier: m2 } = fx(dw,  'lowHpMultiplier')
    const minThreshold = Math.min(t1, t2)
    // Ниже обоих порогов — оба активны
    const hp = Math.floor(MAX * minThreshold)
    expect(calcCardDamage(spell(), [adr, dw], hp, MAX)).toBe(Math.round(10 * m1 * m2))
  })

  it('lifeSteal + selfDamage: оба активны одновременно', () => {
    const vamp  = realItem('vampire_fang')
    const blade = realItem('blood_blade')
    const items = [vamp, blade]
    expect(calcLifeSteal(items)).toBe(fx(vamp, 'lifeSteal').amount)
    expect(calcSelfDamage(items)).toBe(fx(blade, 'selfDamageOnHit').amount)
  })

  it('fireBurn + lightningChain: на разные стихии, не мешают друг другу', () => {
    const brand = realItem('ember_brand')
    const fork  = realItem('storm_fork')
    const items = [brand, fork]
    // fire hit: burn активен, chain = 0
    expect(calcFireBurn(items, BASE_DMG, 'fire')).toBeGreaterThan(0)
    expect(calcLightningChain(items, BASE_DMG, 'fire', 0)).toBe(0)
    // lightning hit: chain активен (roll=0), burn = 0
    expect(calcLightningChain(items, BASE_DMG, 'lightning', 0)).toBeGreaterThan(0)
    expect(calcFireBurn(items, BASE_DMG, 'lightning')).toBe(0)
  })

  it('элемент-комбо не срабатывает если порядок перепутан', () => {
    const conductor = realItem('conductor') // water→lightning
    expect(calcElementCombo([conductor], 'lightning', 'water', false)).toHaveLength(0)
    expect(calcElementCombo([conductor], 'water',     'lightning', false)).toHaveLength(1)
  })

  it('разные комбо на разных парах не мешают друг другу', () => {
    const items = [realItem('conductor'), realItem('steam_valve')]
    // conductor: water→lightning
    expect(calcElementCombo(items, 'water', 'lightning', false)).toHaveLength(1)
    // steam_valve: fire→water
    expect(calcElementCombo(items, 'fire',  'water',     false)).toHaveLength(1)
    // несуществующая пара
    expect(calcElementCombo(items, 'water', 'fire',      false)).toHaveLength(0)
  })

  it('earthArmor накапливается от нескольких ударов', () => {
    const items = [realItem('stone_mantle')]
    const gain = fx(realItem('stone_mantle'), 'earthArmor').amount
    let shield = 0
    shield += calcEarthArmorGain(items, 'earth')
    shield += calcEarthArmorGain(items, 'earth')
    expect(shield).toBe(gain * 2)
  })

  it('calcIncomingDamage: flatDefense + flatResistElement стакают', () => {
    const items = [
      realItem('healers_flask'), // flatDefense -1
      realItem('fire_mantle'),   // flatResistElement fire +3
    ]
    const def = fx(realItem('healers_flask'), 'flatDefense').amount
    const res = (realItem('fire_mantle').effects.find(
      e => e.type === 'flatResistElement'
    ) as Extract<ItemEffect, { type: 'flatResistElement' }>).amount
    expect(calcIncomingDamage(items, 15, 'fire')).toBe(Math.max(1, 15 - def - res))
  })
})
