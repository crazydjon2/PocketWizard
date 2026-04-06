export type ElemType = 'fire' | 'water' | 'physical' | 'dark' | 'lightning' | 'earth'

export interface Spell {
  id: string
  name: string
  icon: string
  description: string
  element: ElemType
  baseDamage: number
  infinite?: boolean    // true = не расходуется (только удар кулаком)
  maxCharges?: number   // кол-во использований; default 3
}

/** Карта с зарядами в руке игрока */
export type HandSpell = Spell & { charges: number; instanceId: string }

/** Создаёт экземпляр карты с зарядами при добавлении в руку */
export function toHandSpell(spell: Spell): HandSpell {
  return {
    ...spell,
    charges:    spell.maxCharges ?? 3,
    instanceId: Math.random().toString(36).slice(2, 9),
  }
}

/** Базовая карта — всегда в руке, не расходуется, предметы на неё НЕ влияют */
export const PUNCH_SPELL: Spell = {
  id: 'punch',
  name: 'Удар',
  icon: '👊',
  element: 'physical',
  baseDamage: 3,
  description: 'Базовый удар. Бесконечный, но не улучшается предметами.',
  infinite: true,
}

export const ALL_SPELLS: Spell[] = [
  { id: 'fireball',     name: 'Огненный шар',    icon: '🔥', element: 'fire',      baseDamage: 9,  maxCharges: 3, description: 'Мощный огонь.' },
  { id: 'dark_essence', name: 'Тёмная сущность', icon: '🌑', element: 'dark',      baseDamage: 10, maxCharges: 3, description: 'Тёмный урон.' },
  { id: 'staff',        name: 'Удар посохом',     icon: '🪄', element: 'physical',  baseDamage: 7,  maxCharges: 5, description: 'Физический удар.' },
  { id: 'water_wave',   name: 'Водный поток',     icon: '💧', element: 'water',     baseDamage: 7,  maxCharges: 4, description: 'Поток воды.' },
  { id: 'lightning',    name: 'Разряд молнии',    icon: '⚡', element: 'lightning', baseDamage: 12, maxCharges: 2, description: 'Быстрый разряд.' },
  { id: 'earth_slam',   name: 'Удар земли',       icon: '🪨', element: 'earth',     baseDamage: 8,  maxCharges: 4, description: 'Земной удар.' },
]
