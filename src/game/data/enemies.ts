import type { ElemType } from './spells'

export interface EnemyDef {
  id: string
  name: string
  sprite: string
  framePx: [number, number]   // [ширина, высота] одного кадра в пикселях
  frames: 1 | 4               // 1 = single image, 4 = 2×2 spritesheet
  hp: number
  damage: number
  hitChance: number
  goldReward: number
  tier: 1 | 2 | 3
  element?: ElemType
  description: string
}

const SKEL: [number, number] = [330, 526]   // кадр из skelet_idel.png  (660×1052 / 2×2)
const GOLM: [number, number] = [418, 512]   // кадр из golem_idle.png   (836×1024 / 2×2)

export const ALL_ENEMIES: EnemyDef[] = [
  // ── Tier 1 ─────────────────────────────────────────────────────
  {
    id: 'golem', name: 'Голем', tier: 1,
    sprite: '/assets/enemy/golem_idle.png', framePx: GOLM, frames: 4,
    hp: 12, damage: 2, hitChance: 0.5, goldReward: 8,
    description: 'Медленный, но крепкий.',
  },
  {
    id: 'skeleton', name: 'Скелет', tier: 1,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 14, damage: 3, hitChance: 0.55, goldReward: 10,
    description: 'Слабый, но настойчивый.',
  },
  {
    id: 'giant_bat', name: 'Летучая мышь', tier: 1,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 10, damage: 2, hitChance: 0.75, goldReward: 8,
    description: 'Быстрая. Промахи болезненны.',
  },
  // ── Tier 2 ─────────────────────────────────────────────────────
  {
    id: 'werewolf', name: 'Вервольф', tier: 2,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 24, damage: 5, hitChance: 0.6, goldReward: 20,
    description: 'Крепкий. Бьёт сильно.',
  },
  {
    id: 'gargoyle', name: 'Горгулья', tier: 2,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 32, damage: 4, hitChance: 0.5, goldReward: 22,
    description: 'Каменная шкура. Много HP.',
  },
  {
    id: 'dark_vampire', name: 'Тёмный вампир', tier: 2,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 20, damage: 6, hitChance: 0.65, goldReward: 25,
    element: 'dark',
    description: 'Тёмный урон. Опасен.',
  },
  // ── Tier 3 ─────────────────────────────────────────────────────
  {
    id: 'fire_demon', name: 'Огненный демон', tier: 3,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 38, damage: 8, hitChance: 0.6, goldReward: 35,
    element: 'fire',
    description: 'Огненный урон. Высокое HP.',
  },
  {
    id: 'lich', name: 'Лич', tier: 3,
    sprite: '/assets/enemy/skelet_idel.png', framePx: SKEL, frames: 4,
    hp: 45, damage: 7, hitChance: 0.55, goldReward: 40,
    element: 'dark',
    description: 'Некромант. Сложнейший враг.',
  },
]

export const STARTING_ENEMY = ALL_ENEMIES.find(e => e.id === 'golem')!

/** Выбирает врага с учётом биома (если задан) или из глобального пула */
export function pickEnemy(fightCount: number, biomeEnemies?: EnemyDef[]): EnemyDef {
  const tier: 1 | 2 | 3 = fightCount <= 2 ? 1 : fightCount <= 5 ? 2 : 3
  const pool = (biomeEnemies ?? ALL_ENEMIES).filter(e => e.tier === tier && e.id !== 'golem')
  if (pool.length === 0) return ALL_ENEMIES.filter(e => e.tier === tier)[0]
  return pool[Math.floor(Math.random() * pool.length)]
}
