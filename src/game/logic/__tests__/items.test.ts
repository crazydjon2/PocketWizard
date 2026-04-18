import { describe, it, expect } from 'vitest'
import { ALL_ITEMS } from '@game/data/items'

describe('ALL_ITEMS integrity', () => {
  it('all items have unique ids', () => {
    const ids = ALL_ITEMS.map(i => i.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all items have at least one effect', () => {
    const empty = ALL_ITEMS.filter(i => i.effects.length === 0)
    expect(empty.map(i => i.id)).toEqual([])
  })

  it('all items have name, icon, flavor', () => {
    for (const item of ALL_ITEMS) {
      expect(item.name.length, `${item.id} missing name`).toBeGreaterThan(0)
      expect(item.icon.length, `${item.id} missing icon`).toBeGreaterThan(0)
      expect(item.flavor.length, `${item.id} missing flavor`).toBeGreaterThan(0)
    }
  })

  it('rarity is valid', () => {
    const valid = new Set(['common', 'rare', 'epic'])
    for (const item of ALL_ITEMS) {
      expect(valid.has(item.rarity), `${item.id} bad rarity: ${item.rarity}`).toBe(true)
    }
  })

  it('flatAttackElement has valid element', () => {
    const valid = new Set(['fire', 'water', 'lightning', 'earth', 'dark', 'physical'])
    for (const item of ALL_ITEMS) {
      for (const eff of item.effects) {
        if (eff.type === 'flatAttackElement') {
          expect(valid.has(eff.element), `${item.id}: bad element ${eff.element}`).toBe(true)
        }
      }
    }
  })

  it('elementCombo has valid from/to elements', () => {
    const valid = new Set(['fire', 'water', 'lightning', 'earth', 'dark', 'physical'])
    for (const item of ALL_ITEMS) {
      for (const eff of item.effects) {
        if (eff.type === 'elementCombo') {
          expect(valid.has(eff.from), `${item.id}: bad from ${eff.from}`).toBe(true)
          expect(valid.has(eff.to),   `${item.id}: bad to ${eff.to}`).toBe(true)
          expect(eff.from).not.toBe(eff.to) // combo with same element makes no sense
          expect(['damage', 'heal', 'shield', 'weaken']).toContain(eff.effect)
          expect(eff.amount).toBeGreaterThan(0)
        }
      }
    }
  })

  it('chargeBonus bonus > 0', () => {
    for (const item of ALL_ITEMS) {
      for (const eff of item.effects) {
        if (eff.type === 'chargeBonus') {
          expect(eff.bonus, `${item.id}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('chargePreserve chance between 0 and 1', () => {
    for (const item of ALL_ITEMS) {
      for (const eff of item.effects) {
        if (eff.type === 'chargePreserve') {
          expect(eff.chance, `${item.id}`).toBeGreaterThan(0)
          expect(eff.chance, `${item.id}`).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('lightningChain chance between 0 and 1', () => {
    for (const item of ALL_ITEMS) {
      for (const eff of item.effects) {
        if (eff.type === 'lightningChain') {
          expect(eff.chance).toBeGreaterThan(0)
          expect(eff.chance).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('fireBurn/darkDrain ratio between 0 and 1', () => {
    for (const item of ALL_ITEMS) {
      for (const eff of item.effects) {
        if (eff.type === 'fireBurn' || eff.type === 'darkDrain') {
          expect(eff.ratio).toBeGreaterThan(0)
          expect(eff.ratio).toBeLessThanOrEqual(1)
        }
      }
    }
  })
})
