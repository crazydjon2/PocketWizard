import { describe, it, expect } from 'vitest'
import { effectTags } from '../itemDisplay'
import type { ItemEffect } from '@game/data/items'

function tag(effect: ItemEffect) {
  return effectTags([effect])[0]
}

describe('effectTags', () => {
  it('flatAttack positive', () => {
    const t = tag({ type: 'flatAttack', amount: 3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('+3')
  })

  it('flatAttack negative', () => {
    const t = tag({ type: 'flatAttack', amount: -2 })
    expect(t.positive).toBe(false)
    expect(t.text).toContain('-2')
  })

  it('flatDefense positive', () => {
    const t = tag({ type: 'flatDefense', amount: 2 })
    expect(t.positive).toBe(true)
  })

  it('maxHp positive', () => {
    const t = tag({ type: 'maxHp', amount: 10 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('+10')
  })

  it('maxHp negative', () => {
    const t = tag({ type: 'maxHp', amount: -10 })
    expect(t.positive).toBe(false)
  })

  it('flatResistElement positive (protection)', () => {
    const t = tag({ type: 'flatResistElement', element: 'fire', amount: 3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('3')
  })

  it('flatResistElement negative (vulnerability)', () => {
    const t = tag({ type: 'flatResistElement', element: 'fire', amount: -2 })
    expect(t.positive).toBe(false)
  })

  it('goldBonus', () => {
    const t = tag({ type: 'goldBonus', amount: 5 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('5')
  })

  it('lifeSteal', () => {
    const t = tag({ type: 'lifeSteal', amount: 2 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('2')
  })

  it('chargePreserve shows percent', () => {
    const t = tag({ type: 'chargePreserve', chance: 0.35 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('35%')
  })

  it('lowHpMultiplier shows threshold percent', () => {
    const t = tag({ type: 'lowHpMultiplier', threshold: 0.3, multiplier: 2 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('30%')
    expect(t.text).toContain('2')
  })

  it('selfDamageOnHit is negative', () => {
    const t = tag({ type: 'selfDamageOnHit', amount: 1 })
    expect(t.positive).toBe(false)
  })

  it('shopDiscount', () => {
    const t = tag({ type: 'shopDiscount', amount: 5 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('5')
  })

  it('elementDiversity', () => {
    const t = tag({ type: 'elementDiversity', bonus: 2 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('2')
  })

  it('chargeBonus', () => {
    const t = tag({ type: 'chargeBonus', bonus: 3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('3')
  })

  it('elementCombo damage shows arrows', () => {
    const t = tag({ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('→')
    expect(t.text).toContain('5')
  })

  it('elementCombo heal shows HP', () => {
    const t = tag({ type: 'elementCombo', from: 'dark', to: 'fire', effect: 'heal', amount: 4 })
    expect(t.text).toContain('HP')
  })

  it('elementCombo shield shows shield', () => {
    const t = tag({ type: 'elementCombo', from: 'earth', to: 'physical', effect: 'shield', amount: 5 })
    expect(t.text.toLowerCase()).toContain('щит')
  })

  it('elementCombo weaken shows weaken', () => {
    const t = tag({ type: 'elementCombo', from: 'fire', to: 'water', effect: 'weaken', amount: 5 })
    expect(t.text.toLowerCase()).toContain('ослаб')
  })

  it('fireBurn shows percent', () => {
    const t = tag({ type: 'fireBurn', ratio: 0.3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('30%')
  })

  it('waterKillHeal', () => {
    const t = tag({ type: 'waterKillHeal', amount: 8 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('8')
  })

  it('lightningChain shows percent', () => {
    const t = tag({ type: 'lightningChain', chance: 0.3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('30%')
  })

  it('earthArmor', () => {
    const t = tag({ type: 'earthArmor', amount: 3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('3')
  })

  it('darkDrain shows percent', () => {
    const t = tag({ type: 'darkDrain', ratio: 0.2 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('20%')
  })

  it('physicalMomentum', () => {
    const t = tag({ type: 'physicalMomentum', bonus: 1 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('1')
  })

  it('regenPerRoom', () => {
    const t = tag({ type: 'regenPerRoom', amount: 3 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('3')
  })

  it('goldScaling', () => {
    const t = tag({ type: 'goldScaling', per: 10 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('10')
  })

  it('restHealBonus', () => {
    const t = tag({ type: 'restHealBonus', amount: 6 })
    expect(t.positive).toBe(true)
    expect(t.text).toContain('6')
  })

  it('restChargeBonus', () => {
    const t = tag({ type: 'restChargeBonus', amount: 1 })
    expect(t.positive).toBe(true)
  })

  it('moreChoices', () => {
    const t = tag({ type: 'moreChoices' })
    expect(t.positive).toBe(true)
  })

  it('handles multiple effects', () => {
    const tags = effectTags([
      { type: 'flatAttack', amount: 2 },
      { type: 'maxHp', amount: -5 },
    ])
    expect(tags).toHaveLength(2)
    expect(tags[0].positive).toBe(true)
    expect(tags[1].positive).toBe(false)
  })
})
