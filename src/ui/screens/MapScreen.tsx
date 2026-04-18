import React, { useRef } from 'react'
import s from './MapScreen.module.css'
import { useGameStore } from '@store/gameStore'
import { useParallax } from '@scene/useParallax'
import type { ParallaxScene } from '@scene/ParallaxScene'
import type { MapNode } from '@game/types'
import { NodeButton } from '@ui/components/NodeButton'

export function MapScreen() {
  const { map, selectNode } = useGameStore()
  const sceneRef = useRef<ParallaxScene | null>(null)

  const { canvasRef } = useParallax(scene => {
    sceneRef.current = scene
  })

  function handleNodeClick(node: MapNode) {
    if (!node.available) return

    sceneRef.current?.transition(() => {
      selectNode(node.id)
    })
  }

  const nodes = Object.values(map.nodes).filter(n => n.type !== 'start')

  return (
    <div className={s.root}>
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.overlay}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={s.svg}>
          {/* Линии связей между узлами */}
          {nodes.map(node =>
            node.nextIds.map(nextId => {
              const next = map.nodes[nextId]
              if (!next) return null
              return (
                <line
                  key={`${node.id}-${nextId}`}
                  x1={node.x * 100} y1={node.y * 100}
                  x2={next.x * 100}  y2={next.y * 100}
                  stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"
                />
              )
            })
          )}
        </svg>

        {/* Узлы */}
        {nodes.map(node => (
          <NodeButton
            key={node.id}
            node={node}
            style={{
              position: 'absolute',
              left: `${node.x * 100}%`,
              top: `${node.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => handleNodeClick(node)}
          />
        ))}
      </div>
    </div>
  )
}
