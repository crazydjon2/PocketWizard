import type { ItemEffect } from '@game/data/items'
import { ELEM_DISPLAY } from '../../constants'

export function effectTags(effects: ItemEffect[]): { text: string; positive: boolean }[] {
  return effects.map(e => {
    switch (e.type) {
      case 'flatAttack':
        return { text: `⚔ ${e.amount > 0 ? '+' : ''}${e.amount} к урону`, positive: e.amount > 0 }
      case 'flatDefense':
        return { text: `🛡 ${e.amount > 0 ? '−' : '+'}${Math.abs(e.amount)} урона от удара`, positive: e.amount > 0 }
      case 'maxHp':
        return { text: `❤ ${e.amount > 0 ? '+' : ''}${e.amount} макс HP`, positive: e.amount > 0 }
      case 'flatAttackElement': {
        const icon = ELEM_DISPLAY.find(d => d.key === e.element)?.icon ?? '?'
        const label = ELEM_DISPLAY.find(d => d.key === e.element)?.label ?? e.element
        return { text: `${icon} ${e.amount > 0 ? '+' : ''}${e.amount} к урону ${label.toLowerCase()}`, positive: e.amount > 0 }
      }
      case 'flatResistElement': {
        const icon  = ELEM_DISPLAY.find(d => d.key === e.element)?.icon ?? '?'
        const label = ELEM_DISPLAY.find(d => d.key === e.element)?.label ?? e.element
        return e.amount > 0
          ? { text: `${icon} −${e.amount} урона ${label.toLowerCase()}`, positive: true }
          : { text: `${icon} +${-e.amount} урона ${label.toLowerCase()}`, positive: false }
      }
      case 'goldBonus':
        return { text: `💰 +${e.amount} монет`, positive: true }
      case 'firstHitBonus':
        return { text: `⚡ +${e.bonus} к первому удару в бою`, positive: true }
      case 'elementStreak':
        return { text: `🔗 +${e.bonus} урона при повторе стихии`, positive: true }
      case 'chargePreserve':
        return { text: `✨ ${Math.round(e.chance * 100)}% шанс не потерять заряд`, positive: true }
      case 'lifeSteal':
        return { text: `🩸 +${e.amount} HP за каждый удар`, positive: true }
      case 'lastChargeDamage':
        return { text: `💥 +${e.bonus} урона при последнем заряде`, positive: true }
      case 'regenPerRoom':
        return { text: `💓 +${e.amount} HP за комнату`, positive: true }
      case 'goldScaling':
        return { text: `💰 +1 урон за каждые ${e.per} монет`, positive: true }
      case 'lowHpMultiplier':
        return { text: `⚡ ×${e.multiplier} при <${Math.round(e.threshold * 100)}% HP`, positive: true }
      case 'selfDamageOnHit':
        return { text: `💔 −${e.amount} HP за удар`, positive: false }
      case 'healStreak':
        return { text: `💚 +${e.hp} HP каждые ${e.count} удара`, positive: true }
      case 'moreChoices':
        return { text: `🎁 +1 предмет из сундука`, positive: true }
      case 'restHealBonus':
        return { text: `🌿 +${e.amount} HP при отдыхе`, positive: true }
      case 'restChargeBonus':
        return { text: `🔮 +${e.amount} заряд при отдыхе`, positive: true }
      case 'elementDiversity':
        return { text: `🌈 +${e.bonus} урон за каждую стихию в бою`, positive: true }
      case 'chargeBonus':
        return { text: `🔷 +${e.bonus} урон за каждый оставшийся заряд`, positive: true }
      case 'shopDiscount':
        return { text: `🎫 −${e.amount} к цене предметов в магазине`, positive: true }
      case 'elementCombo': {
        const fromIcon = ELEM_DISPLAY.find(d => d.key === e.from)?.icon ?? '?'
        const toIcon   = ELEM_DISPLAY.find(d => d.key === e.to)?.icon   ?? '?'
        const fx = e.effect === 'damage'  ? `+${e.amount} урон`
                 : e.effect === 'heal'    ? `+${e.amount} HP`
                 : e.effect === 'shield'  ? `щит ${e.amount}`
                 :                          `ослабить −${e.amount}`
        return { text: `✨ ${fromIcon}→${toIcon} ${fx}`, positive: true }
      }
      case 'fireBurn':
        return { text: `🔥 Поджог: +${Math.round(e.ratio * 100)}% урона огнём`, positive: true }
      case 'waterKillHeal':
        return { text: `💧 Убийство водой: +${e.amount} HP`, positive: true }
      case 'lightningChain':
        return { text: `⚡ ${Math.round(e.chance * 100)}% шанс ударить дважды (×0.5)`, positive: true }
      case 'earthArmor':
        return { text: `🪨 Удар землёй: щит −${e.amount} к следующему удару`, positive: true }
      case 'darkDrain':
        return { text: `🌑 Вытягивание: +${Math.round(e.ratio * 100)}% урона тьмой как HP`, positive: true }
      case 'physicalMomentum':
        return { text: `💢 +${e.bonus} урон за каждый физический удар в бою`, positive: true }
    }
  })
}
