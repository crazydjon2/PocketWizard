import type { EnemyDef } from '../data/enemies'

export interface BiomeObjectSpec {
  src:   string
  scMin: number
  scMax: number
  xMin:  number
  xMax:  number
  count: number
}

export interface BiomeDef {
  name:       string
  floorTiles: string[]
  objects:    BiomeObjectSpec[]
  enemies:    EnemyDef[]   // pool по тирам, pickEnemy использует биом если задан
  bgSrc:      string
  skyColor:   number
  fogColor:   number
  fogNear:    number
  fogFar:     number
}

const SOLO: [number, number] = [1024, 1024]

export const FOREST_BIOME: BiomeDef = {
  name: 'forest',

  floorTiles: [
    '/assets/biom/forest/flor/ground_01.png',
    '/assets/biom/forest/flor/ground_02.png',
    '/assets/biom/forest/flor/ground_03.png',
    '/assets/biom/forest/flor/ground_04.png',
    '/assets/biom/forest/flor/ground_05.png',
    '/assets/biom/forest/flor/ground_06.png',
    '/assets/biom/forest/flor/ground_07.png',
    '/assets/biom/forest/flor/ground_08.png',
  ],

  objects: [
    { src: '/assets/biom/forest/objects/tree_big.png',    scMin: 4.0, scMax: 5.5, xMin: 0.3, xMax: 5.5, count: 18  },
    { src: '/assets/biom/forest/objects/tree_dead.png',    scMin: 5.0, scMax: 5.5, xMin: 0.3, xMax: 5.0, count: 2  },
    // { src: '/assets/biom/forest/objects/tree_pine.png',scMin: 2.9, scMax: 3.6, xMin: 0.1, xMax: 0.0, count: 8  },
    // { src: '/assets/biom/forest/objects/log.png', scMin: 0.6, scMax: 1.1, xMin: 0.1, xMax: 2.0, count: 8  },
    { src: '/assets/biom/forest/objects/stump.png',  scMin: 0.7, scMax: 1.3, xMin: 0.1, xMax: 2.5, count: 6  },
    // { src: '/assets/biom/forest/objects/fence.png',   scMin: 0.5, scMax: 0.9, xMin: 0.0, xMax: 1.8, count: 10 },
    { src: '/assets/biom/forest/objects/rock_flat.png',   scMin: 0.5, scMax: 0.9, xMin: 0.0, xMax: 1.8, count: 10 },
    { src: '/assets/biom/forest/objects/rock_mossy.png',   scMin: 0.6, scMax: 1.0, xMin: 0.0, xMax: 1.8, count: 10 },
    { src: '/assets/biom/forest/objects/mushroom_brown.png',   scMin: 0.3, scMax: 0.6, xMin: 0.0, xMax: 1.5, count: 4  },
    { src: '/assets/biom/forest/objects/mushroom_red.png',   scMin: 0.3, scMax: 0.6, xMin: 0.0, xMax: 1.5, count: 4  },
    { src: '/assets/biom/forest/objects/bush_mushrooms.png',   scMin: 0.8, scMax: 0.9, xMin: 0.0, xMax: 1.5, count: 4  },
  ],

  enemies: [
    // Tier 1
        {
      id: 'wolf', name: 'Волк', tier: 1,
      sprite: '/assets/biom/forest/enemy/wolf.png', framePx: SOLO, frames: 1,
      hp: 13, damage: 3, hitChance: 0.65, goldReward: 10,
      description: 'Охотится стаей.',
    },
    {
      id: 'spider', name: 'Паук', tier: 1,
      sprite: '/assets/biom/forest/enemy/spider.png', framePx: SOLO, frames: 1,
      hp: 11, damage: 2, hitChance: 0.70, goldReward: 9,
      description: 'Быстрый и ядовитый.',
    },
    {
      id: 'beer', name: 'Медведь', tier: 1,
      sprite: '/assets/biom/forest/enemy/beer.png', framePx: SOLO, frames: 1,
      hp: 18, damage: 4, hitChance: 0.50, goldReward: 12,
      description: 'Медленный, но огромный.',
    },
    // Tier 2
    {
      id: 'bandit', name: 'Бандит', tier: 2,
      sprite: '/assets/biom/forest/enemy/bandit.png', framePx: SOLO, frames: 1,
      hp: 22, damage: 5, hitChance: 0.60, goldReward: 20,
      description: 'Разбойник с большой дороги.',
    },
    // Tier 3
    {
      id: 'forest_king', name: 'Лесной король', tier: 3,
      sprite: '/assets/biom/forest/enemy/forest_king.png', framePx: SOLO, frames: 1,
      hp: 50, damage: 9, hitChance: 0.60, goldReward: 45,
      description: 'Владыка чащи. Безжалостен.',
    },
  ],

  bgSrc:    '/assets/biom/forest/bg_forest_mobile.png',
  skyColor: 0x4a7553,
  fogColor: 0x3a5e40,
  fogNear:  30,
  fogFar:   80,
}
