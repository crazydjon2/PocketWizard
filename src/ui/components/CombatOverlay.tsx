import type { RefObject } from 'react'
import s from './CombatOverlay.module.css'

interface Props {
  floatContainerRef: RefObject<HTMLDivElement>
  screenFlashRef:    RefObject<HTMLDivElement>
  charInnerRef:      RefObject<HTMLDivElement>
}

export function CombatOverlay({ floatContainerRef, screenFlashRef, charInnerRef }: Props) {
  return (
    <>
      {/* Hidden element for CSS hit/attack animations */}
      <div ref={charInnerRef} className={s.char} />
      <div ref={screenFlashRef} className={s.flash} />
      <div ref={floatContainerRef} className={s.floats} />
    </>
  )
}
