import { useCallback } from 'react'
import type { RefObject } from 'react'

interface CombatEffectRefs {
  floatContainerRef: RefObject<HTMLDivElement>
  charInnerRef:      RefObject<HTMLDivElement>
  screenFlashRef:    RefObject<HTMLDivElement>
}

let _floatSlot = 0

export function useCombatEffects({ floatContainerRef, charInnerRef, screenFlashRef }: CombatEffectRefs) {
  /** Всплывающий текст (урон / лечение / промах) */
  const showFloat = useCallback((text: string, color: string) => {
    const c = floatContainerRef.current
    if (!c) return
    const slot = _floatSlot++
    const el = document.createElement('div')
    el.textContent = text
    el.style.cssText = [
      'position:absolute', 'left:50%', `bottom:${220 + slot * 26}px`,
      'transform:translateX(-50%)',
      `color:${color}`,
      "font-size:14px", "font-family:'Press Start 2P',monospace",
      'text-shadow:2px 2px 0 #000',
      'animation:floatUp 1.4s ease-out forwards',
      'pointer-events:none', 'white-space:nowrap',
    ].join(';')
    c.appendChild(el)
    setTimeout(() => { el.remove(); _floatSlot = Math.max(0, _floatSlot - 1) }, 1450)
  }, [floatContainerRef])

  /** CSS-анимация на спрайте персонажа */
  const triggerCharAnim = useCallback((name: string, ms: number) => {
    const el = charInnerRef.current
    if (!el) return
    el.style.animation = 'none'
    void el.offsetHeight  // force reflow — перезапускает анимацию
    el.style.animation = `${name} ${ms}ms ease-out forwards`
    setTimeout(() => { if (charInnerRef.current) charInnerRef.current.style.animation = '' }, ms + 50)
  }, [charInnerRef])

  /** Цветная вспышка на весь экран */
  const triggerScreenFlash = useCallback((color: string) => {
    const el = screenFlashRef.current
    if (!el) return
    el.style.background = color
    el.style.animation  = 'none'
    void el.offsetHeight
    el.style.animation = 'screenFlash 0.45s ease-out forwards'
  }, [screenFlashRef])

  return { showFloat, triggerCharAnim, triggerScreenFlash }
}
