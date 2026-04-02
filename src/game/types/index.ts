// ─── Elements ─────────────────────────────────────────────────────────────────

export type DamageType = 'fire' | 'water' | 'physical' | 'dark' | 'lightning' | 'earth'

export interface ElementalStats {
  fire:      number   // огонь
  water:     number   // вода
  physical:  number   // физика
  dark:      number   // тьма
  lightning: number   // молния
  earth:     number   // земля
}

export const ELEMENT_META: Record<DamageType, { label: string; icon: string; color: string }> = {
  fire:      { label: 'Огонь',   icon: '🔥', color: '#f97316' },
  water:     { label: 'Вода',    icon: '💧', color: '#38bdf8' },
  physical:  { label: 'Физика',  icon: '⚔️', color: '#a3a3a3' },
  dark:      { label: 'Тьма',    icon: '🌑', color: '#a855f7' },
  lightning: { label: 'Молния',  icon: '⚡', color: '#facc15' },
  earth:     { label: 'Земля',   icon: '🪨', color: '#a16207' },
}

export const ZERO_ELEMENTS: ElementalStats = {
  fire: 0, water: 0, physical: 0, dark: 0, lightning: 0, earth: 0,
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface PlayerStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  elements: ElementalStats  // бонусный урон по типу
}

export interface Player {
  id: string
  name: string
  stats: PlayerStats
  items: Item[]
  gold: number
}

// ─── Items ────────────────────────────────────────────────────────────────────

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type ItemEffect =
  | { type: 'stat'; stat: keyof PlayerStats; value: number }
  | { type: 'onHit'; damage: number }
  | { type: 'onTakeDamage'; shield: number }
  | { type: 'heal'; amount: number }

export interface Item {
  id: string
  name: string
  description: string
  rarity: ItemRarity
  effects: ItemEffect[]
  icon: string
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export type NodeType = 'combat' | 'elite' | 'shop' | 'event' | 'rest' | 'boss' | 'start'

export interface MapNode {
  id: string
  type: NodeType
  x: number
  y: number
  nextIds: string[]   // ids узлов куда можно идти
  visited: boolean
  available: boolean  // доступен ли для выбора сейчас
}

export interface GameMap {
  nodes: Record<string, MapNode>
  currentNodeId: string
  bossNodeId: string
  floor: number
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface EventChoice {
  label: string
  result: EventResult
}

export type EventResult =
  | { type: 'gainItem'; item: Item }
  | { type: 'gainGold'; amount: number }
  | { type: 'loseHp'; amount: number }
  | { type: 'gainHp'; amount: number }
  | { type: 'nothing' }

export interface GameEvent {
  id: string
  title: string
  description: string
  image?: string
  choices: EventChoice[]
}

// ─── Combat ───────────────────────────────────────────────────────────────────

export type CombatMode = 'auto' | 'manual'

export interface Enemy {
  id: string
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  reward: { gold: number; items: Item[] }
  sprite: string
  weakTo:   DamageType | null   // уязвимость: +150% бонуса этого элемента
  resistTo: DamageType | null   // сопротивление: −50% бонуса этого элемента
}

export interface CombatState {
  player: Player
  enemy: Enemy
  round: number
  log: string[]
  isPlayerTurn: boolean
  status: 'ongoing' | 'playerWon' | 'playerLost'
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type GameScreen =
  | 'loading'
  | 'mainMenu'
  | 'map'
  | 'combat'
  | 'event'
  | 'shop'
  | 'rest'
  | 'boss'
  | 'gameOver'
  | 'victory'

export type GameMode = 'pve' | 'pvp'

export interface GameState {
  screen: GameScreen
  mode: GameMode
  player: Player
  map: GameMap
  combat: CombatState | null
  activeEvent: GameEvent | null
}
