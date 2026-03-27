// ─── Player ───────────────────────────────────────────────────────────────────

export interface PlayerStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
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
