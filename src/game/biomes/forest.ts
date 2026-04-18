import type { EnemyDef } from '../data/enemies'

export interface BiomeObjectSpec {
  src:   string
  scMin: number
  scMax: number
  xMin:  number
  xMax:  number
  count: number
  road?: boolean  // place symmetrically on road center instead of road sides
}

export interface BiomeDef {
  name:        string
  floorTiles:  string[]
  objects:     BiomeObjectSpec[]
  enemies:     EnemyDef[]
  bgSrc:       string
  skyColor:    number
  fogColor:    number
  fogNear:     number
  fogFar:      number
  frameFilter: string   // CSS filter applied to game_frame.png overlay
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
    { src: '/assets/biom/forest/objects/tree.png',        scMin: 4.0, scMax: 5.5, xMin: 0.3, xMax: 6.0, count: 44 },
    // { src: '/assets/biom/forest/objects/tree_1.png',          scMin: 3.5, scMax: 5.0, xMin: 0.3, xMax: 6.0, count: 14 },
    // { src: '/assets/biom/forest/objects/tree_2.png',          scMin: 3.5, scMax: 5.0, xMin: 0.3, xMax: 6.0, count: 14 },
    // { src: '/assets/biom/forest/objects/tree_3.png',          scMin: 3.5, scMax: 5.0, xMin: 0.3, xMax: 6.0, count: 10 },
    // { src: '/assets/biom/forest/objects/tree_4.png',          scMin: 3.5, scMax: 5.0, xMin: 0.3, xMax: 6.0, count: 10 },
    // { src: '/assets/biom/forest/objects/tree_dead.png',       scMin: 5.0, scMax: 5.5, xMin: 0.3, xMax: 5.0, count: 6  },
    // { src: '/assets/biom/forest/objects/stump.png',           scMin: 0.4, scMax: 0.5, xMin: 0.1, xMax: 3.0, count: 3 },
    { src: '/assets/biom/forest/objects/rock_mossy.png',       scMin: 0.5, scMax: 0.9, xMin: 0.0, xMax: 2.2, count: 14 },
    // { src: '/assets/biom/forest/objects/rock_mossy.png',      scMin: 0.6, scMax: 1.0, xMin: 0.0, xMax: 2.2, count: 14 },
    // { src: '/assets/biom/forest/objects/mushroom_brown.png',  scMin: 0.3, scMax: 0.6, xMin: 0.0, xMax: 2.0, count: 8  },
    // { src: '/assets/biom/forest/objects/mushroom_red.png',    scMin: 0.3, scMax: 0.6, xMin: 0.0, xMax: 2.0, count: 8  },
    // { src: '/assets/biom/forest/objects/bush_mushrooms.png',  scMin: 0.8, scMax: 0.9, xMin: 0.0, xMax: 2.0, count: 8  },
    // { src: '/assets/biom/forest/objects/fence.png',           scMin: 0.8, scMax: 1.2, xMin: 0.0, xMax: 1.5, count: 6  },
    // Road center — small scattered details, don't block enemy
    // { src: '/assets/biom/forest/objects/rock_flat.png',      scMin: 0.18, scMax: 0.35, xMin: 0, xMax: 2.8, count: 10, road: true },
    // { src: '/assets/biom/forest/objects/rock_mossy.png',     scMin: 0.15, scMax: 0.28, xMin: 0, xMax: 2.5, count: 8,  road: true },
    // { src: '/assets/biom/forest/objects/mushroom_brown.png', scMin: 0.12, scMax: 0.22, xMin: 0, xMax: 2.2, count: 6,  road: true },
    // { src: '/assets/biom/forest/objects/mushroom_red.png', scMin: 0.12, scMax: 0.22, xMin: 0, xMax: 2.2, count: 6,  road: true },
    // { src: '/assets/biom/forest/objects/stump.png',             scMin: 0.4, scMax: 0.5, xMin: 0.0, xMax: 2.5, count: 8, road: true  },
    // { src: '/assets/biom/forest/objects/grass.png', scMin: 0.22, scMax: 0.32, xMin: 0, xMax: 2.2, count: 60,  road: true },

  ],

  enemies: [
    // Tier 1
    // {
    //   id: 'bat', name: 'Летучая мышь', tier: 1,
    //   sprite: '/assets/enemy/bat/bat_idle.png',
    //   attackSprite: '/assets/enemy/bat/bat_attack.png',
    //   framePx: [736, 346], frames: 16,
    //   hp: 10, damage: 2, goldReward: 9,
    //   weaknesses: ['lightning'],
    //   resistances: ['dark'],
    //   description: 'Быстрая. Избегает света.',
    // },
    {
      id: 'wolf', name: 'Волк', tier: 1,
      sprite: '/assets/biom/forest/enemy/t.png', framePx: SOLO, frames: 1,
      hp: 13, damage: 3, goldReward: 10,
      weaknesses: ['fire'],
      resistances: ['physical'],
      description: 'Охотится стаей.',
    },
    {
      id: 'spider', name: 'Паук', tier: 1,
      sprite: '/assets/biom/forest/enemy/spider.png', framePx: SOLO, frames: 1,
      hp: 11, damage: 2, goldReward: 9,
      weaknesses: ['fire'],
      resistances: ['dark'],
      description: 'Быстрый и ядовитый.',
    },
    {
      id: 'beer', name: 'Медведь', tier: 1,
      sprite: '/assets/biom/forest/enemy/beer.png', framePx: SOLO, frames: 1,
      hp: 18, damage: 4, goldReward: 12,
      weaknesses: ['lightning'],
      resistances: ['physical'],
      description: 'Медленный, но огромный.',
    },
    {
      id: 'slime', name: 'Слизень', tier: 1,
      sprite: '/assets/enemy/slime/slime_idle.png',
      attackSprite: '/assets/enemy/slime/slime_attack.png',
      framePx: [514, 448], frames: 16,
      hp: 22, damage: 3, goldReward: 11,
      weaknesses: ['lightning'],
      resistances: ['water', 'physical'],
      description: 'Поглощает урон. Неустанно ползёт.',
    },
    {
      id: 'water_spirit', name: 'Водный дух', tier: 1,
      sprite: '/assets/biom/forest/enemy/water_spirit.png', framePx: SOLO, frames: 1,
      hp: 14, damage: 3, goldReward: 10,
      element: 'water',
      weaknesses: ['lightning'],
      resistances: ['fire', 'water'],
      description: 'Дух лесного ручья. Уворачивается от огня.',
      tint: 0x99ccdd,  // холодный синий — водяная природа
    },
    // Tier 2
    {
      id: 'bandit', name: 'Бандит', tier: 2,
      sprite: '/assets/biom/forest/enemy/bandit.png', framePx: SOLO, frames: 1,
      hp: 22, damage: 5, goldReward: 20,
      weaknesses: ['dark'],
      description: 'Разбойник с большой дороги.',
      tint: 0xaabbaa,  // лёгкий лесной зелёный
    },
    {
      id: 'knight', name: 'Тёмный рыцарь', tier: 2,
      sprite: '/assets/biom/forest/enemy/knight.png', framePx: SOLO, frames: 1,
      hp: 28, damage: 6, goldReward: 22,
      element: 'physical',
      weaknesses: ['dark'],
      resistances: ['physical', 'earth'],
      description: 'Закованный в броню. Плохо чувствует тьму.',
      tint: 0x8899bb,  // холодный стальной — гасит тёплые тона брони
    },
    {
      id: 'lightning_spirit', name: 'Дух молнии', tier: 2,
      sprite: '/assets/biom/forest/enemy/lighning_spirit.png', framePx: SOLO, frames: 1,
      hp: 20, damage: 7, goldReward: 23,
      element: 'lightning',
      weaknesses: ['earth'],
      resistances: ['lightning', 'water'],
      description: 'Молниеносный. Бьёт из-за деревьев.',
      tint: 0xccddaa,  // жёлто-зелёный — электрический оттенок в лесу
    },
    {
      id: 'stone_golem', name: 'Каменный голем', tier: 2,
      sprite: '/assets/biom/forest/enemy/stone_golem.png', framePx: SOLO, frames: 1,
      hp: 36, damage: 5, goldReward: 24,
      element: 'earth',
      weaknesses: ['water', 'lightning'],
      resistances: ['physical', 'fire', 'earth'],
      description: 'Монолит из камня. Почти не чувствует боли.',
      tint: 0x99aa99,  // мшисто-каменный
    },
    // Tier 3
    {
      id: 'forest_king', name: 'Лесной король', tier: 3,
      sprite: '/assets/biom/forest/enemy/forest_king.png', framePx: SOLO, frames: 1,
      hp: 50, damage: 9, goldReward: 45,
      weaknesses: ['fire'],
      resistances: ['earth', 'physical'],
      description: 'Владыка чащи. Безжалостен.',
      tint: 0x88aa88,  // тёмно-лесной
    },
    {
      id: 'spider_boss', name: 'Паук-охотник', tier: 3,
      sprite: '/assets/enemy/spider_boss/spider_idle.png',
      attackSprite: '/assets/enemy/spider_boss/spider_attack.png',
      framePx: [528, 412], frames: 16,
      hp: 42, damage: 8, goldReward: 42,
      weaknesses: ['fire'],
      resistances: ['dark', 'physical'],
      description: 'Огромный паук. Ядовитые клыки.',
    },
    {
      id: 'demon', name: 'Лесной демон', tier: 3,
      sprite: '/assets/biom/forest/enemy/demon.png', framePx: SOLO, frames: 1,
      hp: 40, damage: 9, goldReward: 40,
      element: 'fire',
      weaknesses: ['water'],
      resistances: ['fire', 'lightning'],
      description: 'Порождение огня. Сжигает всё на пути.',
      tint: 0xddaa77,  // тёплый огненный, но приглушён
    },
    {
      id: 'death', name: 'Смерть', tier: 3,
      sprite: '/assets/biom/forest/enemy/death.png', framePx: SOLO, frames: 1,
      hp: 35, damage: 10, goldReward: 44,
      element: 'dark',
      weaknesses: ['physical', 'fire'],
      resistances: ['dark', 'water'],
      description: 'Явилась за тобой. Один удар — и конец.',
      tint: 0x7788aa,  // холодный фиолетово-синий — потусторонний
    },
  ],

  bgSrc:    '/assets/biom/forest/bg_forest_mobile2.png',
  skyColor: 0x4a7553,
  fogColor: 0x3a5e40,
  fogNear:  30,
  fogFar:   80,

  // Dark forest: cold teal-green, moonlit atmosphere
  frameFilter: 'sepia(1) saturate(2.5) hue-rotate(105deg) brightness(0.5)',
}
