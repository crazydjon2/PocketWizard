import type { ElemType } from './spells'

export interface EnemyDef {
  id: string
  name: string
  sprite: string
  attackSprite?: string
  framePx: [number, number]
  frames: 1 | 4 | 16
  hp: number
  damage: number
  goldReward: number
  tier: 1 | 2 | 3
  element?: ElemType
  weaknesses?:  ElemType[]   // takes ×1.5 damage
  resistances?: ElemType[]   // takes ×0.5 damage
  description: string
  /** Hex color multiplied onto the sprite texture (0xffffff = no change).
   *  Use to match sprite to biome lighting/palette, e.g. 0xaabbaa for green tint. */
  tint?: number
  /** Scale multiplier applied on top of the normal size calculation (default 1.0). */
  renderScale?: number
}

const SKEL: [number, number] = [330, 526]
const GOLM: [number, number] = [418, 512]

export const ALL_ENEMIES: EnemyDef[] = [
  // ── Tier 1 ─────────────────────────────────────────────────────
  {
    id: 'golem', name: 'Голем', tier: 1,
    sprite: '/assets/enemy/golem_idle.png', framePx: GOLM, frames: 4,
    hp: 12, damage: 2, goldReward: 8,
    weaknesses: ['water'],
    resistances: ['physical'],
    description: 'Медленный, но крепкий.',
  },
  {
    id: 'skeleton', name: 'Скелет', tier: 1,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 14, damage: 3, goldReward: 10,
    weaknesses: ['fire', 'physical'],
    description: 'Слабый, но настойчивый.',
  },
  {
    id: 'giant_bat', name: 'Летучая мышь', tier: 1,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 10, damage: 2, goldReward: 8,
    weaknesses: ['lightning'],
    resistances: ['dark'],
    description: 'Быстрая. Избегает света.',
  },
  // ── Tier 2 ─────────────────────────────────────────────────────
  {
    id: 'werewolf', name: 'Вервольф', tier: 2,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 24, damage: 5, goldReward: 20,
    weaknesses: ['fire'],
    resistances: ['physical'],
    description: 'Крепкий. Бьёт сильно.',
  },
  {
    id: 'gargoyle', name: 'Горгулья', tier: 2,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 32, damage: 4, goldReward: 22,
    weaknesses: ['lightning'],
    resistances: ['physical', 'earth'],
    description: 'Каменная шкура. Много HP.',
  },
  {
    id: 'dark_vampire', name: 'Тёмный вампир', tier: 2,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 20, damage: 6, goldReward: 25,
    element: 'dark',
    weaknesses: ['physical', 'fire'],
    resistances: ['dark', 'water'],
    description: 'Тёмный урон. Опасен.',
  },
  // ── Tier 3 ─────────────────────────────────────────────────────
  {
    id: 'fire_demon', name: 'Огненный демон', tier: 3,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 38, damage: 8, goldReward: 35,
    element: 'fire',
    weaknesses: ['water'],
    resistances: ['fire', 'lightning'],
    description: 'Огненный урон. Высокое HP.',
  },
  {
    id: 'lich', name: 'Лич', tier: 3,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 45, damage: 7, goldReward: 40,
    element: 'dark',
    weaknesses: ['physical'],
    resistances: ['dark', 'water'],
    description: 'Некромант. Сложнейший враг.',
  },
]

export const STARTING_ENEMY = ALL_ENEMIES.find(e => e.id === 'golem')!

export function pickEnemy(fightCount: number, biomeEnemies?: EnemyDef[]): EnemyDef {
  const tier: 1 | 2 | 3 = fightCount <= 2 ? 1 : fightCount <= 5 ? 2 : 3
  const pool = (biomeEnemies ?? ALL_ENEMIES).filter(e => e.tier === tier && e.id !== 'golem')
  if (pool.length === 0) return ALL_ENEMIES.filter(e => e.tier === tier)[0]
  return pool[Math.floor(Math.random() * pool.length)]
}
