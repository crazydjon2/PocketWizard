import type { GameMap, MapNode, NodeType } from '@game/types'

const FLOORS_COUNT = 3        // рядов узлов (без босса)
const NODES_PER_FLOOR = 4    // узлов в ряду

const NODE_TYPE_WEIGHTS: Record<NodeType, number> = {
  combat:  40,
  elite:   10,
  shop:    15,
  event:   25,
  rest:    10,
  boss:     0,
  start:    0,
}

function weightedRandom(weights: Record<NodeType, number>): NodeType {
  const entries = Object.entries(weights) as [NodeType, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [type, weight] of entries) {
    roll -= weight
    if (roll <= 0) return type
  }
  return 'combat'
}

function makeId(floor: number, index: number): string {
  return `f${floor}_n${index}`
}

export function generateMap(): GameMap {
  const nodes: Record<string, MapNode> = {}

  // Стартовый узел
  const startId = 'start'
  nodes[startId] = {
    id: startId,
    type: 'start',
    x: 0.5,
    y: 0,
    nextIds: [],
    visited: true,
    available: false,
  }

  let prevFloorIds: string[] = [startId]

  // Генерируем этажи
  for (let floor = 1; floor <= FLOORS_COUNT; floor++) {
    const floorIds: string[] = []
    const yPos = floor / (FLOORS_COUNT + 1)

    for (let i = 0; i < NODES_PER_FLOOR; i++) {
      const id = makeId(floor, i)
      const xPos = (i + 1) / (NODES_PER_FLOOR + 1)

      nodes[id] = {
        id,
        type: weightedRandom(NODE_TYPE_WEIGHTS),
        x: xPos,
        y: yPos,
        nextIds: [],
        visited: false,
        available: false,
      }
      floorIds.push(id)
    }

    // Соединяем предыдущий этаж с текущим (каждый предыдущий → 1-2 следующих)
    for (const prevId of prevFloorIds) {
      const candidates = [...floorIds].sort(() => Math.random() - 0.5).slice(0, 2)
      nodes[prevId].nextIds.push(...candidates.filter(id => !nodes[prevId].nextIds.includes(id)))
    }

    prevFloorIds = floorIds
  }

  // Босс
  const bossId = 'boss'
  nodes[bossId] = {
    id: bossId,
    type: 'boss',
    x: 0.5,
    y: 1,
    nextIds: [],
    visited: false,
    available: false,
  }
  for (const id of prevFloorIds) {
    nodes[id].nextIds.push(bossId)
  }

  // Первые доступные узлы
  for (const id of nodes[startId].nextIds) {
    nodes[id].available = true
  }

  return {
    nodes,
    currentNodeId: startId,
    bossNodeId: bossId,
    floor: 0,
  }
}
