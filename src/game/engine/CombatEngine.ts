import type { CombatState, Player, Enemy } from '@game/types'

function calcDamage(attack: number, defense: number): number {
  return Math.max(1, attack - defense)
}

export function startCombat(player: Player, enemy: Enemy): CombatState {
  return {
    player: structuredClone(player),
    enemy: structuredClone(enemy),
    round: 1,
    log: [`Бой начался! ${player.name} vs ${enemy.name}`],
    isPlayerTurn: player.stats.speed >= enemy.stats.speed,
    status: 'ongoing',
  }
}

export function playerAttack(state: CombatState): CombatState {
  if (state.status !== 'ongoing' || !state.isPlayerTurn) return state

  const damage = calcDamage(state.player.stats.attack, state.enemy.defense)
  const newEnemyHp = Math.max(0, state.enemy.hp - damage)
  const log = [...state.log, `Ты наносишь ${damage} урона!`]
  const status = newEnemyHp === 0 ? 'playerWon' : 'ongoing'

  return {
    ...state,
    enemy: { ...state.enemy, hp: newEnemyHp },
    log,
    isPlayerTurn: false,
    status,
  }
}

export function enemyAttack(state: CombatState): CombatState {
  if (state.status !== 'ongoing' || state.isPlayerTurn) return state

  const damage = calcDamage(state.enemy.attack, state.player.stats.defense)
  const newPlayerHp = Math.max(0, state.player.stats.hp - damage)
  const log = [...state.log, `${state.enemy.name} наносит ${damage} урона!`]
  const status = newPlayerHp === 0 ? 'playerLost' : 'ongoing'

  return {
    ...state,
    player: {
      ...state.player,
      stats: { ...state.player.stats, hp: newPlayerHp },
    },
    log,
    isPlayerTurn: true,
    round: state.round + 1,
    status,
  }
}

// Авто-просчёт одного тика (для auto-battle режима)
export function tickCombat(state: CombatState): CombatState {
  if (state.status !== 'ongoing') return state
  return state.isPlayerTurn ? playerAttack(state) : enemyAttack(state)
}
