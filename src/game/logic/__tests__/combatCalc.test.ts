import { describe, it, expect } from 'vitest'
import { calcCardDamage, calcIncomingDamage } from '../combatCalc'
import type { Spell } from '@game/data/spells'
import type { GameItem } from '@game/data/items'

// ── Helpers ────────────────────────────────────────────────────────
function spell(overrides: Partial<Spell> = {}): Spell {
  return {
    id: 'test', name: 'Test', icon: '🔥', description: '',
    element: 'fire', baseDamage: 10,
    ...overrides,
  }
}

function item(effects: GameItem['effects']): GameItem {
  return { id: 'x', name: 'x', icon: '?', flavor: '', rarity: 'common', effects }
}

const NO_ITEMS: GameItem[] = []
const MAX_HP = 100

// ── calcCardDamage ─────────────────────────────────────────────────
describe('calcCardDamage — base', () => {
  it('returns baseDamage with no items', () => {
    expect(calcCardDamage(spell(), NO_ITEMS, 100, MAX_HP)).toBe(10)
  })

  it('infinite spell ignores all item bonuses', () => {
    const items = [item([{ type: 'flatAttack', amount: 99 }])]
    expect(calcCardDamage(spell({ infinite: true }), items, 100, MAX_HP)).toBe(10)
  })

  it('returns at least 1', () => {
    const items = [item([{ type: 'flatAttack', amount: -999 }])]
    expect(calcCardDamage(spell({ baseDamage: 1 }), items, 100, MAX_HP)).toBe(1)
  })
})

describe('calcCardDamage — flatAttack', () => {
  it('adds flat attack bonus', () => {
    const items = [item([{ type: 'flatAttack', amount: 5 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP)).toBe(15)
  })

  it('stacks multiple flatAttack items', () => {
    const items = [
      item([{ type: 'flatAttack', amount: 3 }]),
      item([{ type: 'flatAttack', amount: 2 }]),
    ]
    expect(calcCardDamage(spell(), items, 100, MAX_HP)).toBe(15)
  })

  it('subtracts negative flatAttack', () => {
    const items = [item([{ type: 'flatAttack', amount: -3 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP)).toBe(7)
  })
})

describe('calcCardDamage — flatAttackElement', () => {
  it('adds element bonus matching spell element', () => {
    const items = [item([{ type: 'flatAttackElement', element: 'fire', amount: 4 }])]
    expect(calcCardDamage(spell({ element: 'fire' }), items, 100, MAX_HP)).toBe(14)
  })

  it('ignores element bonus for wrong element', () => {
    const items = [item([{ type: 'flatAttackElement', element: 'water', amount: 4 }])]
    expect(calcCardDamage(spell({ element: 'fire' }), items, 100, MAX_HP)).toBe(10)
  })
})

describe('calcCardDamage — lastChargeDamage', () => {
  it('activates on charges === 1', () => {
    const items = [item([{ type: 'lastChargeDamage', bonus: 6 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 1)).toBe(16)
  })

  it('does NOT activate on charges > 1', () => {
    const items = [item([{ type: 'lastChargeDamage', bonus: 6 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 2)).toBe(10)
  })
})

describe('calcCardDamage — chargeBonus', () => {
  it('+bonus per remaining charge', () => {
    const items = [item([{ type: 'chargeBonus', bonus: 2 }])]
    // 3 charges * 2 = +6
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 3)).toBe(16)
  })

  it('scales with charge count', () => {
    const items = [item([{ type: 'chargeBonus', bonus: 3 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 1)).toBe(13)
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 2)).toBe(16)
  })

  it('conflicts interestingly with lastChargeDamage', () => {
    // chargeBonus: +1*3=3 | lastCharge: not active (charges=3) → total 13
    const items = [
      item([{ type: 'chargeBonus', bonus: 1 }]),
      item([{ type: 'lastChargeDamage', bonus: 10 }]),
    ]
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 3)).toBe(13)
    // chargeBonus: +1*1=1 | lastCharge: +10 → total 21
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, 1)).toBe(21)
  })
})

describe('calcCardDamage — goldScaling', () => {
  it('adds 1 per N gold', () => {
    const items = [item([{ type: 'goldScaling', per: 10 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, undefined, 30)).toBe(13)
  })

  it('floors partial gold chunks', () => {
    const items = [item([{ type: 'goldScaling', per: 10 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP, undefined, undefined, 25)).toBe(12)
  })

  it('no bonus without gold arg', () => {
    const items = [item([{ type: 'goldScaling', per: 10 }])]
    expect(calcCardDamage(spell(), items, 100, MAX_HP)).toBe(10)
  })
})

describe('calcCardDamage — lowHpMultiplier', () => {
  it('activates below threshold', () => {
    const items = [item([{ type: 'lowHpMultiplier', threshold: 0.3, multiplier: 2 }])]
    // 29% HP → active
    expect(calcCardDamage(spell(), items, 29, MAX_HP)).toBe(20)
  })

  it('does NOT activate above threshold', () => {
    const items = [item([{ type: 'lowHpMultiplier', threshold: 0.3, multiplier: 2 }])]
    expect(calcCardDamage(spell(), items, 31, MAX_HP)).toBe(10)
  })

  it('activates exactly at threshold', () => {
    const items = [item([{ type: 'lowHpMultiplier', threshold: 0.3, multiplier: 2 }])]
    expect(calcCardDamage(spell(), items, 30, MAX_HP)).toBe(20)
  })
})

describe('calcCardDamage — enemy weakness/resistance', () => {
  it('×1.5 on weakness', () => {
    const enemy = { weaknesses: ['fire' as const], resistances: [] }
    expect(calcCardDamage(spell({ element: 'fire' }), NO_ITEMS, 100, MAX_HP, enemy)).toBe(15)
  })

  it('×0.5 on resistance', () => {
    const enemy = { weaknesses: [], resistances: ['fire' as const] }
    expect(calcCardDamage(spell({ element: 'fire' }), NO_ITEMS, 100, MAX_HP, enemy)).toBe(5)
  })
})

// ── calcIncomingDamage ─────────────────────────────────────────────
describe('calcIncomingDamage', () => {
  it('returns raw damage with no items', () => {
    expect(calcIncomingDamage(NO_ITEMS, 10)).toBe(10)
  })

  it('subtracts flatDefense', () => {
    const items = [item([{ type: 'flatDefense', amount: 3 }])]
    expect(calcIncomingDamage(items, 10)).toBe(7)
  })

  it('stacks multiple flatDefense', () => {
    const items = [
      item([{ type: 'flatDefense', amount: 2 }]),
      item([{ type: 'flatDefense', amount: 2 }]),
    ]
    expect(calcIncomingDamage(items, 10)).toBe(6)
  })

  it('subtracts flatResistElement matching element', () => {
    const items = [item([{ type: 'flatResistElement', element: 'fire', amount: 3 }])]
    expect(calcIncomingDamage(items, 10, 'fire')).toBe(7)
  })

  it('ignores flatResistElement for wrong element', () => {
    const items = [item([{ type: 'flatResistElement', element: 'fire', amount: 3 }])]
    expect(calcIncomingDamage(items, 10, 'water')).toBe(10)
  })

  it('negative flatResistElement increases incoming damage', () => {
    const items = [item([{ type: 'flatResistElement', element: 'water', amount: -3 }])]
    expect(calcIncomingDamage(items, 10, 'water')).toBe(13)
  })

  it('stacks flatDefense and flatResistElement', () => {
    const items = [
      item([{ type: 'flatDefense', amount: 2 }]),
      item([{ type: 'flatResistElement', element: 'fire', amount: 2 }]),
    ]
    expect(calcIncomingDamage(items, 10, 'fire')).toBe(6)
  })

  it('returns at least 1', () => {
    const items = [item([{ type: 'flatDefense', amount: 999 }])]
    expect(calcIncomingDamage(items, 10)).toBe(1)
  })
})
