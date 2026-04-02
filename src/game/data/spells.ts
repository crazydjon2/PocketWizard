export type ElemType = 'fire' | 'water' | 'physical' | 'dark' | 'lightning' | 'earth'

export interface Spell {
  id: string
  name: string
  icon: string
  description: string
  element: ElemType
  baseDamage: number
}

export const ALL_SPELLS: Spell[] = [
  { id: 'fireball',     name: 'Огненный шар',    icon: '🔥', element: 'fire',      baseDamage: 4, description: '4 урон огнём' },
  { id: 'dark_essence', name: 'Тёмная сущность', icon: '🌑', element: 'dark',      baseDamage: 4, description: '4 урон тьмой' },
  { id: 'staff',        name: 'Удар посохом',     icon: '🪄', element: 'physical',  baseDamage: 4, description: '4 физ. урона' },
  { id: 'water_wave',   name: 'Водный поток',     icon: '💧', element: 'water',     baseDamage: 4, description: '4 урон водой' },
  { id: 'lightning',    name: 'Разряд молнии',    icon: '⚡', element: 'lightning', baseDamage: 4, description: '4 урон молнией' },
  { id: 'earth_slam',   name: 'Удар земли',       icon: '🪨', element: 'earth',     baseDamage: 4, description: '4 урон землёй' },
]
