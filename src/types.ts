import type { Spell } from '@game/data/spells'
import type { GameItem } from '@game/data/items'

export type Zone     = 'left' | 'right' | null
export type Phase    = 'choose' | 'waiting' | 'chest' | 'path' | 'walking' | 'shop' | 'event' | 'rest' | 'rest_charge' | 'draft'
export type PathType = 'combat' | 'rest' | 'event' | 'shop'
export type AppPhase = 'menu' | 'spellSelect' | 'playing' | 'gameOver'

export type ChestOption =
  | { kind: 'spell'; data: Spell }
  | { kind: 'item';  data: GameItem }
