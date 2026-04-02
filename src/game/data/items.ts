import type { ElemType } from './spells'

export type ItemEffect =
  | { type: 'spellSlot' }
  | { type: 'synergy'; e1: ElemType; e2: ElemType; multiplier: number }
  | { type: 'resistance'; element: ElemType; reduction: number }   // отрицательное = уязвимость
  | { type: 'goldBonus'; amount: number }
  | { type: 'flatAttack'; amount: number }                          // отрицательное = штраф
  | { type: 'flatAttackElement'; element: ElemType; amount: number }
  | { type: 'flatDefense'; amount: number }                         // отрицательное = штраф
  | { type: 'maxHp'; amount: number }                               // отрицательное = режет макс HP
  | { type: 'healStreak'; count: number; hp: number }
  | { type: 'moreChoices' }
  | { type: 'selfDamageOnHit'; amount: number }
  | { type: 'enemyAccuracyBonus'; amount: number }
  | { type: 'lowHpMultiplier'; threshold: number; multiplier: number }

export type ItemRarity = 'common' | 'rare' | 'epic'

export interface GameItem {
  id: string
  name: string
  icon: string       // эмодзи — fallback если нет PNG
  description: string
  effects: ItemEffect[]
  rarity: ItemRarity
}

/** PNG иконка предмета по соглашению именования */
export const itemIconSrc = (id: string) => `/assets/items/${id}.png`

// Противоположные стихии — фокус на одной создаёт уязвимость к другой
const OPPOSITES: Partial<Record<ElemType, ElemType>> = {
  fire: 'water', water: 'fire',
  lightning: 'earth', earth: 'lightning',
  dark: 'physical', physical: 'dark',
}

function runeOf(element: ElemType, name: string, icon: string): GameItem {
  const opp = OPPOSITES[element]!
  return {
    id: `${element}_rune`,
    name,
    icon,
    rarity: 'common',
    description: `+1 урона ${name.split(' ')[1] ?? ''}, −10% сопр. к ${opp}`,
    effects: [
      { type: 'flatAttackElement', element, amount: 1 },
      { type: 'resistance', element: opp, reduction: -0.1 },   // отрицательное = уязвимость
    ],
  }
}

export const ALL_ITEMS: GameItem[] = [
  // ══ COMMON ══════════════════════════════════════════════════════
  {
    id: 'whetstone', name: 'Точильный камень', icon: '🪨', rarity: 'common',
    description: '+1 урона всем, враг наносит +1',
    effects: [
      { type: 'flatAttack', amount: 1 },
      { type: 'flatDefense', amount: -1 },
    ],
  },
  {
    id: 'leather_vest', name: 'Кожанка', icon: '🥋', rarity: 'common',
    description: 'Враг −1 урона, −1 к своей атаке',
    effects: [
      { type: 'flatDefense', amount: 1 },
      { type: 'flatAttack', amount: -1 },
    ],
  },
  {
    id: 'iron_ring', name: 'Железное кольцо', icon: '💍', rarity: 'common',
    description: 'Враг −2 урона, −1 к своей атаке',
    effects: [
      { type: 'flatDefense', amount: 2 },
      { type: 'flatAttack', amount: -1 },
    ],
  },
  {
    id: 'lucky_coin', name: 'Монетка удачи', icon: '🪙', rarity: 'common',
    description: '+4 золота за победу, враг точнее на 5%',
    effects: [
      { type: 'goldBonus', amount: 4 },
      { type: 'enemyAccuracyBonus', amount: 0.05 },
    ],
  },
  {
    id: 'small_pouch', name: 'Кошелёк', icon: '👛', rarity: 'common',
    description: '+7 золота за победу, враг точнее на 8%',
    effects: [
      { type: 'goldBonus', amount: 7 },
      { type: 'enemyAccuracyBonus', amount: 0.08 },
    ],
  },
  // ── Руны: урон по элементу + уязвимость к противоположному ──────
  runeOf('fire',      'Руна Огня',    '🔥'),
  runeOf('water',     'Руна Воды',    '💧'),
  runeOf('dark',      'Руна Тьмы',    '🌑'),
  runeOf('lightning', 'Руна Молнии',  '⚡'),
  runeOf('earth',     'Руна Земли',   '🌿'),
  runeOf('physical',  'Руна Силы',    '⚔️'),

  // ══ RARE ════════════════════════════════════════════════════════
  {
    id: 'blade_oil', name: 'Масло клинка', icon: '⚗️', rarity: 'rare',
    description: '+3 урона всем, враг точнее на 10%',
    effects: [
      { type: 'flatAttack', amount: 3 },
      { type: 'enemyAccuracyBonus', amount: 0.1 },
    ],
  },
  {
    id: 'iron_shield', name: 'Железный щит', icon: '🛡️', rarity: 'rare',
    description: 'Враг −3 урона, −2 к своей атаке',
    effects: [
      { type: 'flatDefense', amount: 3 },
      { type: 'flatAttack', amount: -2 },
    ],
  },
  {
    id: 'coin_bag', name: 'Кошель', icon: '💰', rarity: 'rare',
    description: '+12 золота за победу, враг точнее на 12%',
    effects: [
      { type: 'goldBonus', amount: 12 },
      { type: 'enemyAccuracyBonus', amount: 0.12 },
    ],
  },
  {
    id: 'fire_mantle', name: 'Огненная мантия', icon: '🧥', rarity: 'rare',
    description: 'Огонь −30%, урон огнём −1',
    effects: [
      { type: 'resistance', element: 'fire', reduction: 0.3 },
      { type: 'flatAttackElement', element: 'fire', amount: -1 },
    ],
  },
  {
    id: 'dark_mantle', name: 'Тёмная мантия', icon: '🌒', rarity: 'rare',
    description: 'Тьма −30%, урон тьмой −1',
    effects: [
      { type: 'resistance', element: 'dark', reduction: 0.3 },
      { type: 'flatAttackElement', element: 'dark', amount: -1 },
    ],
  },
  {
    id: 'pouch', name: 'Подсумок', icon: '🎒', rarity: 'rare',
    description: '+1 ячейка, −5 макс HP',
    effects: [
      { type: 'spellSlot' },
      { type: 'maxHp', amount: -5 },
    ],
  },
  {
    id: 'healstone', name: 'Камень исцеления', icon: '💎', rarity: 'rare',
    description: '+5 HP / 4 удара, −8 макс HP',
    effects: [
      { type: 'healStreak', count: 4, hp: 5 },
      { type: 'maxHp', amount: -8 },
    ],
  },
  {
    id: 'tome', name: 'Том знаний', icon: '📖', rarity: 'rare',
    description: '+1 выбор в сундуке, −3 макс HP',
    effects: [
      { type: 'moreChoices' },
      { type: 'maxHp', amount: -3 },
    ],
  },
  {
    id: 'cursed_eye', name: 'Проклятый глаз', icon: '👁️', rarity: 'rare',
    description: '+4 урона, враг точнее на 15%',
    effects: [
      { type: 'flatAttack', amount: 4 },
      { type: 'enemyAccuracyBonus', amount: 0.15 },
    ],
  },
  {
    id: 'adrenaline', name: 'Адреналин', icon: '💉', rarity: 'rare',
    description: '×2 урона при HP ≤ 30%, −10 макс HP',
    effects: [
      { type: 'lowHpMultiplier', threshold: 0.3, multiplier: 2 },
      { type: 'maxHp', amount: -10 },
    ],
  },
  {
    id: 'berserker_band', name: 'Обруч берсерка', icon: '🔴', rarity: 'rare',
    description: '×1.5 урона при HP ≤ 50%, враг точнее на 10%',
    effects: [
      { type: 'lowHpMultiplier', threshold: 0.5, multiplier: 1.5 },
      { type: 'enemyAccuracyBonus', amount: 0.1 },
    ],
  },

  // ══ EPIC ════════════════════════════════════════════════════════
  {
    id: 'opposites', name: 'Противоположности', icon: '☯️', rarity: 'epic',
    description: 'Огонь+Вода: урон ×2, −5 макс HP',
    effects: [
      { type: 'synergy', e1: 'fire', e2: 'water', multiplier: 2 },
      { type: 'maxHp', amount: -5 },
    ],
  },
  {
    id: 'thunder_earth', name: 'Буря и Камень', icon: '⛈️', rarity: 'epic',
    description: 'Молния+Земля: урон ×2, −5 макс HP',
    effects: [
      { type: 'synergy', e1: 'lightning', e2: 'earth', multiplier: 2 },
      { type: 'maxHp', amount: -5 },
    ],
  },
  {
    id: 'dusk_herald', name: 'Вестник Сумерек', icon: '🌗', rarity: 'epic',
    description: 'Тьма+Физика: урон ×2, −5 макс HP',
    effects: [
      { type: 'synergy', e1: 'dark', e2: 'physical', multiplier: 2 },
      { type: 'maxHp', amount: -5 },
    ],
  },
  {
    id: 'blood_blade', name: 'Кровавый клинок', icon: '🗡️', rarity: 'epic',
    description: '+6 урона, −2 HP при каждом ударе',
    effects: [
      { type: 'flatAttack', amount: 6 },
      { type: 'selfDamageOnHit', amount: 2 },
    ],
  },
  {
    id: 'death_wish', name: 'Желание смерти', icon: '💀', rarity: 'epic',
    description: '×3 урона при HP ≤ 20%, враг точнее на 25%',
    effects: [
      { type: 'lowHpMultiplier', threshold: 0.2, multiplier: 3 },
      { type: 'enemyAccuracyBonus', amount: 0.25 },
    ],
  },
]
