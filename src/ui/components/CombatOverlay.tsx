import type { RefObject } from 'react'

interface Props {
  floatContainerRef: RefObject<HTMLDivElement>
  screenFlashRef:    RefObject<HTMLDivElement>
  charInnerRef:      RefObject<HTMLDivElement>
}

export function CombatOverlay({ floatContainerRef, screenFlashRef, charInnerRef }: Props) {
  return (
    <>
      {/* Hidden element for CSS hit/attack animations */}
      <div ref={charInnerRef} style={{ position: 'absolute', pointerEvents: 'none' }} />

      {/* Screen flash (damage, etc.) */}
      <div ref={screenFlashRef} style={{
        position: 'absolute', inset: 0, opacity: 0,
        pointerEvents: 'none', zIndex: 18,
      }} />

      {/* Floating damage/status numbers */}
      <div ref={floatContainerRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30,
      }} />
    </>
  )
}
