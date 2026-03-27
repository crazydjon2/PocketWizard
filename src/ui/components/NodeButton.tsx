import React from 'react'
import type { CSSProperties } from 'react'
import type { MapNode, NodeType } from '@game/types'

const NODE_ICONS: Record<NodeType, string> = {
  start:  '🏁',
  combat: '⚔️',
  elite:  '💀',
  shop:   '🛒',
  event:  '❓',
  rest:   '🔥',
  boss:   '👑',
}

const NODE_COLORS: Record<NodeType, string> = {
  start:  '#4ade80',
  combat: '#f87171',
  elite:  '#c084fc',
  shop:   '#facc15',
  event:  '#60a5fa',
  rest:   '#fb923c',
  boss:   '#ef4444',
}

interface NodeButtonProps {
  node: MapNode
  style?: CSSProperties
  onClick: () => void
}

export function NodeButton({ node, style, onClick }: NodeButtonProps) {
  const color = NODE_COLORS[node.type]
  const opacity = node.visited ? 0.4 : node.available ? 1 : 0.3

  return (
    <button
      onClick={onClick}
      disabled={!node.available}
      style={{
        ...style,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        background: node.available ? `${color}33` : 'transparent',
        color: '#fff',
        fontSize: 18,
        cursor: node.available ? 'pointer' : 'default',
        opacity,
        transition: 'transform 0.15s, opacity 0.2s',
        boxShadow: node.available ? `0 0 12px ${color}88` : 'none',
      }}
    >
      {NODE_ICONS[node.type]}
    </button>
  )
}
