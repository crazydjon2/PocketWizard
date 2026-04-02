import type { CombatState, Player, Enemy, ElementalStats, DamageType } from '@game/types'

function calcDamage(
  attack: number,
  defense: number,
  elements: ElementalStats,
  weakTo: DamageType | null,
  resistTo: DamageType | null,
): { damage: number; log: string[] } {
  const base = Math.max(0, attack - defense)

  let bonus = 0
  const extraLog: string[] = []

  if (weakTo) {
    const w = elements[weakTo] * 1.5
    if (w > 0) { bonus += w; extraLog.push(`Слабость к ${weakTo}! +${Math.round(w)}`) }
  }
  if (resistTo) {
    const r = elements[resistTo] * 0.5
    if (r > 0) { bonus -= r; extraLog.push(`Сопротивление ${resistTo}. −${Math.round(r)}`) }
  }

  // Остальные элементы дают прямой бонус без множителя
  for (const [type, val] of Object.entries(elements) as [DamageType, number][]) {
    if (type === weakTo || type === resistTo || val === 0) continue
    bonus += val
  }

  return { damage: Math.max(1, Math.round(base + bonus)), log: extraLog }
}

export function startCombat(player: Player, enemy: Enemy): CombatState {
  return {
    player: structuredClone(player),
    enemy: structuredClone(enemy),
    round: 1,
    log: [`Бой начался! ${player.name} vs ${enemy.name}`],
    isPlayerTurn: true,
    status: 'ongoing',
  }
}

export function playerAttack(state: CombatState): CombatState {
  if (state.status !== 'ongoing' || !state.isPlayerTurn) return state

  const { damage, log: extraLog } = calcDamage(
    state.player.stats.attack,
    state.enemy.defense,
    state.player.stats.elements,
    state.enemy.weakTo,
    state.enemy.resistTo,
  )
  const newEnemyHp = Math.max(0, state.enemy.hp - damage)
  const log = [...state.log, `Ты наносишь ${damage} урона!`, ...extraLog]
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

  // Враг атакует без стихийных бонусов
  const { damage } = calcDamage(state.enemy.attack, state.player.stats.defense, { fire:0,water:0,physical:0,dark:0,lightning:0,earth:0 }, null, null)
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
