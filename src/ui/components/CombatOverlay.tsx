import type { RefObject } from 'react'
import type { Phase, AppPhase } from '../../types'
import { PX } from '../../constants'

interface Props {
  phase:      Phase
  appPhase:   AppPhase
  correctDir: 'left' | 'right'
  telegraph:  boolean
  dragging:   boolean

  floatContainerRef: RefObject<HTMLDivElement>
  screenFlashRef:    RefObject<HTMLDivElement>
  charElRef:         RefObject<HTMLDivElement>
  charInnerRef:      RefObject<HTMLDivElement>
  leftZoneRef:       RefObject<HTMLDivElement>
  rightZoneRef:      RefObject<HTMLDivElement>

  onPointerDown:  (e: React.PointerEvent) => void
  onPointerMove:  (e: React.PointerEvent) => void
  onPointerUp:    () => void
}

const zoneBase: React.CSSProperties = {
  position: 'absolute', top: 92, bottom: 88,
  width: '36%', opacity: 0,
  background: 'rgba(240,68,68,0.04)',
  border: '3px solid rgba(240,68,68,0.3)',
  pointerEvents: 'none',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
}

export function CombatOverlay({
  phase, appPhase, correctDir, telegraph, dragging,
  floatContainerRef, screenFlashRef, charElRef, charInnerRef,
  leftZoneRef, rightZoneRef,
  onPointerDown, onPointerMove, onPointerUp,
}: Props) {
  return (
    <>
      {/* Telegraph */}
      {telegraph && phase === 'choose' && (
        <div style={{
          position: 'absolute', top: '35%', left: '50%',
          transform: 'translateX(-50%)',
          color: '#ffd700', fontSize: 64, lineHeight: 1,
          textShadow: '4px 4px 0 #000, 0 0 30px #ffd70088',
          animation: 'telegraphIn 0.2s steps(4) forwards',
          pointerEvents: 'none', zIndex: 25,
          fontFamily: PX,
        }}>
          {correctDir === 'left' ? '◀' : '▶'}
        </div>
      )}

      {/* Drag zones */}
      <div ref={leftZoneRef} style={{ ...zoneBase, left: 0 }}>
        <span style={{ fontSize: 36, color: 'rgba(240,68,68,0.5)', fontFamily: PX }}>◀</span>
        <span style={{ color: 'rgba(240,68,68,0.4)', fontSize: 7, letterSpacing: 1, fontFamily: PX }}>ВЛЕВО</span>
      </div>
      <div ref={rightZoneRef} style={{ ...zoneBase, right: 0 }}>
        <span style={{ fontSize: 36, color: 'rgba(240,68,68,0.5)', fontFamily: PX }}>▶</span>
        <span style={{ color: 'rgba(240,68,68,0.4)', fontSize: 7, letterSpacing: 1, fontFamily: PX }}>ВПРАВО</span>
      </div>

      {/* Screen flash */}
      <div ref={screenFlashRef} style={{
        position: 'absolute', inset: 0, opacity: 0,
        pointerEvents: 'none', zIndex: 18,
      }} />

      {/* Float messages */}
      <div ref={floatContainerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }} />

      {/* Character */}
      <div
        ref={charElRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'absolute',
          left: '50%', bottom: 88, transform: 'translateX(-50%)',
          touchAction: 'none', zIndex: 20, userSelect: 'none',
          cursor: dragging ? 'grabbing' : (phase === 'waiting' || appPhase !== 'playing' ? 'default' : 'grab'),
        }}
      >
        <div
          ref={charInnerRef}
          style={{
            filter: dragging
              ? 'drop-shadow(0 0 12px #ffd700) drop-shadow(2px 2px 0 #000)'
              : 'drop-shadow(2px 4px 0 #000)',
            transform: 'scale(1)',
            transition: 'filter 0.15s, transform 0.1s',
          }}
        >
          <img
            src="/assets/character/character.png"
            draggable={false}
            style={{ imageRendering: 'pixelated', width: 240, height: 240, display: 'block' }}
          />
        </div>
      </div>
    </>
  )
}
