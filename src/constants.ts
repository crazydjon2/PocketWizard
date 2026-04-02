// ── Three.js / scene ──────────────────────────────────────────────
export const GRASS_SRCS = [
  '/assets/Grass_1_64x64.png',
  '/assets/Grass_2_85x64.png',
  '/assets/Grass_3_61x64.png',
  '/assets/Grass_4_59x64.png',
]
export const TRACK_LEN    = 80
export const ROAD_TILES = [
  '/assets/road/tile_dirt.png',
  '/assets/road/tile_cobblestone.png',
  '/assets/road/tile_sand.png',
  '/assets/road/tile_mud.png',
  '/assets/road/tile_dark_stone.png',
]
export const ROAD_HALF   = 3.2
export const ROAD_TILE_W = 5    // размер тайла в мировых единицах (квадратный)
export const BIOME_EVERY = 10   // leapfrog каждые N ходов
export const GROUND_D    = 300  // глубина каждого плейна
// Путь за BIOME_EVERY шагов: tween 0→4 за 1200мс + 4→0 за 1400мс @ 60fps × 0.055 ≈ 17 ед/шаг × 10 = 170
export const BIOME_AHEAD = 170
export const GRASS_PER_TEX = 30

// ── Enemy sprite ───────────────────────────────────────────────────
export const ENEMY_SPRITE_FRAMES = 4  // 2×2 grid
// UV offsets для каждого кадра (flipY=true по умолчанию в Three.js)
export const ENEMY_SPRITE_UV: [number, number][] = [
  [0,   0.5], [0.5, 0.5],  // кадр 0,1 — верхний ряд
  [0,   0  ], [0.5, 0  ],  // кадр 2,3 — нижний ряд
]

// ── Game balance ───────────────────────────────────────────────────
export const MAX_HP      = 60
export const HEAL_AMOUNT = 8

// ── Combat UI ─────────────────────────────────────────────────────
export const TELEGRAPH_MS = 1100  // мс показа подсказки направления

// ── Shop ──────────────────────────────────────────────────────────
export const SHOP_PRICE  = { common: 12, rare: 28, epic: 55 } as const
export const SPELL_PRICE = 25
export const REROLL_BASE = 15

// ── Rarity weights ────────────────────────────────────────────────
export const RARITY_WEIGHT = { common: 65, rare: 28, epic: 7 } as const

// ── Display ───────────────────────────────────────────────────────
export const ELEM_DISPLAY = [
  { key: 'fire',      icon: '🔥', label: 'Огонь',   color: '#f97316' },
  { key: 'water',     icon: '💧', label: 'Вода',    color: '#38bdf8' },
  { key: 'physical',  icon: '⚔️', label: 'Физика',  color: '#a3a3a3' },
  { key: 'dark',      icon: '🌑', label: 'Тьма',    color: '#a855f7' },
  { key: 'lightning', icon: '⚡', label: 'Молния',  color: '#facc15' },
  { key: 'earth',     icon: '🪨', label: 'Земля',   color: '#a16207' },
] as const

export const RARITY_COLOR = {
  common: '#94a3b8',
  rare:   '#60a5fa',
  epic:   '#c084fc',
} as const

export const PATH_META = {
  combat: { label: 'Бой',       icon: '⚔️', color: '#ef4444' },
  rest:   { label: 'Отдых',    icon: '💤', color: '#4ade80' },
  event:  { label: 'Событие',  icon: '📜', color: '#a78bfa' },
  shop:   { label: 'Торговец', icon: '🛒', color: '#fbbf24' },
} as const

export const PX = "'Press Start 2P', monospace"
