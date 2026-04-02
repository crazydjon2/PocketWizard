import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GameState, GameScreen, Player, MapNode, GameEvent, Enemy, CombatState, DamageType } from '@game/types'
import { ZERO_ELEMENTS } from '@game/types'
import { generateMap } from '@game/map/MapGenerator'
import { startCombat, tickCombat, playerAttack } from '@game/engine/CombatEngine'

const DEFAULT_PLAYER: Player = {
  id: 'player_1',
  name: 'Герой',
  stats: {
    hp: 100,
    maxHp: 100,
    attack: 15,
    defense: 5,
    speed: 10,
    elements: { ...ZERO_ELEMENTS },
  },
  items: [],
  gold: 0,
}

interface GameActions {
  startGame: () => void
  setScreen: (screen: GameScreen) => void

  // Карта
  selectNode: (nodeId: string) => void

  // Событие
  resolveEventChoice: (choiceIndex: number) => void

  // Бой
  initCombat: (enemy: Enemy) => void
  playerAttackAction: () => void
  tickAutoCombat: () => void
  endCombat: () => void

  // Прокачка стихий
  upgradeElement: (type: DamageType, amount?: number) => void
}

type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    screen: 'mainMenu',
    mode: 'pve',
    player: DEFAULT_PLAYER,
    map: generateMap(),
    combat: null,
    activeEvent: null,

    startGame: () => {
      set(state => {
        state.player = structuredClone(DEFAULT_PLAYER)
        state.map = generateMap()
        state.combat = null
        state.activeEvent = null
        state.screen = 'map'
      })
    },

    setScreen: (screen) => {
      set(state => { state.screen = screen })
    },

    selectNode: (nodeId) => {
      set(state => {
        const node = state.map.nodes[nodeId]
        if (!node || !node.available) return

        // Помечаем предыдущий как посещённый, обновляем текущий
        state.map.nodes[state.map.currentNodeId].visited = true
        state.map.nodes[state.map.currentNodeId].available = false
        state.map.currentNodeId = nodeId
        node.visited = true
        node.available = false

        // Открываем следующие узлы
        for (const nextId of node.nextIds) {
          state.map.nodes[nextId].available = true
        }

        // Переходим на нужный экран
        const screenMap: Record<string, GameScreen> = {
          combat: 'combat',
          elite: 'combat',
          shop: 'shop',
          event: 'event',
          rest: 'rest',
          boss: 'boss',
        }
        state.screen = screenMap[node.type] ?? 'map'
      })
    },

    resolveEventChoice: (choiceIndex) => {
      const { activeEvent, player } = get()
      if (!activeEvent) return

      const choice = activeEvent.choices[choiceIndex]
      const result = choice.result

      set(state => {
        switch (result.type) {
          case 'gainGold':
            state.player.gold += result.amount
            break
          case 'gainHp':
            state.player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + result.amount)
            break
          case 'loseHp':
            state.player.stats.hp = Math.max(0, player.stats.hp - result.amount)
            break
          case 'gainItem':
            state.player.items.push(result.item)
            break
        }
        state.activeEvent = null
        state.screen = 'map'
      })
    },

    initCombat: (enemy) => {
      set(state => {
        state.combat = startCombat(state.player, enemy)
      })
    },

    playerAttackAction: () => {
      set(state => {
        if (!state.combat) return
        state.combat = playerAttack(state.combat)
      })
    },

    tickAutoCombat: () => {
      set(state => {
        if (!state.combat) return
        state.combat = tickCombat(state.combat)
      })
    },

    upgradeElement: (type, amount = 1) => {
      set(state => { state.player.stats.elements[type] += amount })
    },

    endCombat: () => {
      const { combat } = get()
      if (!combat) return

      set(state => {
        if (combat.status === 'playerWon') {
          state.player.gold += combat.enemy.reward.gold
          state.player.items.push(...combat.enemy.reward.items)
        }
        if (combat.status === 'playerLost') {
          state.screen = 'gameOver'
        } else {
          state.screen = 'map'
        }
        state.combat = null
      })
    },
  }))
)
