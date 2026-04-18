import { useState, useCallback, useRef, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import s from './CardHand.module.css'
import type { HandSpell } from '@game/data/spells'
import { PUNCH_SPELL, spellIconSrc } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { EnemyDef } from '@game/data/enemies'
import type { Phase } from '../../types'
import { ELEM_DISPLAY, PX } from '../../constants'
import { calcCardDamage } from '@game/logic/combatCalc'

interface Props {
  hand:           HandSpell[]
  phase:          Phase
  onPlayCard:     (card: HandSpell) => void
  ownedItems:     GameItem[]
  gold:           number
  playerHp:       number
  effectiveMaxHp: number
  currentEnemy:   EnemyDef
}



// ── Element theming ───────────────────────────────────────────────
const ELEM_THEME: Record<string, { bg: string; glow: string; mid: string }> = {
  fire:      { bg: 'linear-gradient(170deg,#2a0700 0%,#5c1500 55%,#8a2200 100%)', glow: '#f97316', mid: '#c84400' },
  water:     { bg: 'linear-gradient(170deg,#000e28 0%,#002850 55%,#004878 100%)', glow: '#38bdf8', mid: '#0077bb' },
  physical:  { bg: 'linear-gradient(170deg,#111111 0%,#242424 55%,#333333 100%)', glow: '#a3a3a3', mid: '#666666' },
  dark:      { bg: 'linear-gradient(170deg,#09001c 0%,#180038 55%,#28005a 100%)', glow: '#a855f7', mid: '#6600cc' },
  lightning: { bg: 'linear-gradient(170deg,#151000 0%,#2e2200 55%,#483400 100%)', glow: '#facc15', mid: '#cc9900' },
  earth:     { bg: 'linear-gradient(170deg,#0c0700 0%,#221200 55%,#3a1e00 100%)', glow: '#a16207', mid: '#7a4a00' },
}
const PUNCH_THEME = { bg: 'linear-gradient(170deg,#161000 0%,#2a1e00 55%,#3d2c00 100%)', glow: '#ffd700', mid: '#c8a800' }

// CSS filter to tint the gold spell_frame per element
// sepia(1) → warm base ~35°, then hue-rotate shifts to target hue
const FRAME_FILTER: Record<string, string> = {
  fire:      'sepia(1) saturate(4) hue-rotate(330deg) brightness(1.1)',
  water:     'sepia(1) saturate(4) hue-rotate(170deg)',
  physical:  'grayscale(1) brightness(0.65)',
  dark:      'sepia(1) saturate(4) hue-rotate(240deg) brightness(1.1)',
  lightning: 'sepia(1) saturate(3) brightness(1.25)',
  earth:     'sepia(1) saturate(2) hue-rotate(8deg) brightness(0.8)',
}

const PUNCH_HAND: HandSpell = { ...PUNCH_SPELL, charges: Infinity, instanceId: 'punch' }

// ── Drag state for vertical (play) gesture ────────────────────────
interface PlayDrag {
  card:    HandSpell
  startY:  number
  currentY: number
}

// ── Card face ─────────────────────────────────────────────────────
function CardFace({ card, active, lifted, displayDamage, conditionalBonus = 0, enemyMod = null }: {
  card: HandSpell; active: boolean; lifted?: boolean
  displayDamage: number; conditionalBonus?: number
  enemyMod?: { text: string; color: string } | null
}) {
  const elem  = ELEM_DISPLAY.find(e => e.key === card.element)
  const theme = card.infinite ? PUNCH_THEME : (ELEM_THEME[card.element] ?? ELEM_THEME.physical)
  const color = theme.glow
  const isLow = !card.infinite && card.charges === 1
  const hasBonus = displayDamage !== card.baseDamage

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bg,
      boxShadow: lifted
        ? `0 0 40px ${color}55, inset 0 0 24px ${color}14`
        : active
          ? `inset 0 0 20px ${color}12`
          : 'none',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
      fontFamily: PX, userSelect: 'none',
      transition: lifted ? 'none' : 'box-shadow 0.2s',
    }}>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 45%, ${color}${active ? '18' : '06'} 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Spell frame overlay */}
      <img
        src="/assets/spell_frame.png"
        draggable={false}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'fill',
          pointerEvents: 'none',
          opacity: active ? 1 : 0.5,
          transition: 'opacity 0.2s, filter 0.2s',
          filter: card.infinite ? undefined : (FRAME_FILTER[card.element] ?? undefined),
          zIndex: 10,
        }}
      />

      {/* ── Top: name + element ── */}
      {/* padding % = relative to card width → scales with card size */}
      <div style={{ padding: '14% 11% 3%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, zIndex: 11 }}>
        <div style={{ color: active ? '#e8e0c8' : '#4a4030', fontSize: 4.5, lineHeight: 1.2, textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: 0.8, maxWidth: '100%', transition: 'color 0.2s', textShadow: active ? '0 1px 4px #000' : 'none' }}>
          {card.name.toUpperCase()}
        </div>
        <div style={{ background: `${color}${active ? '28' : '10'}`, border: `1px solid ${active ? color + '66' : color + '22'}`, padding: '1px 5px', display: 'flex', alignItems: 'center', gap: 2, transition: 'background 0.2s, border-color 0.2s' }}>
          <span style={{ fontSize: 7, lineHeight: 1 }}>{card.infinite ? '⚔' : elem?.icon}</span>
          <span style={{ color: active ? color : color + '44', fontSize: 3.5, letterSpacing: 0.5, transition: 'color 0.2s' }}>
            {card.infinite ? 'УДАР' : (elem?.label.toUpperCase() ?? '')}
          </span>
        </div>
      </div>

      {/* ── Art area ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2% 12%', zIndex: 11 }}>
        {spellIconSrc(card.id)
          ? <img src={spellIconSrc(card.id)!} draggable={false} style={{ width: '85%', height: '85%', imageRendering: 'pixelated', objectFit: 'contain', filter: active ? `drop-shadow(0 0 10px ${color}aa)` : 'grayscale(0.7) brightness(0.35)', transition: 'filter 0.2s' }} />
          : <span style={{ fontSize: 32, lineHeight: 1, filter: active ? `drop-shadow(0 0 10px ${color}99)` : 'grayscale(0.5) brightness(0.45)', transition: 'filter 0.2s' }}>{card.icon}</span>
        }
      </div>

      {/* ── Bottom: damage + charges ── */}
      <div style={{ padding: '3% 11% 14%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 11 }}>
        {/* Damage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 26, height: 26,
            background: hasBonus ? (active ? '#4ade8022' : '#4ade8010') : (active ? `${color}22` : `${color}0c`),
            border: `2px solid ${hasBonus ? (active ? '#4ade80cc' : '#4ade8033') : (active ? color + 'cc' : color + '28')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s, background 0.2s',
          }}>
            <span key={displayDamage} style={{ color: hasBonus ? (active ? '#4ade80' : '#4ade8066') : (active ? color : color + '55'), fontSize: 10, lineHeight: 1, animation: 'dmgPop 0.28s cubic-bezier(0.16,1,0.3,1) both' }}>
              {displayDamage}
            </span>
          </div>
          {lifted && enemyMod && <div style={{ fontSize: 4, color: enemyMod.color, lineHeight: 1, whiteSpace: 'nowrap', textShadow: '1px 1px 0 #000' }}>{enemyMod.text}</div>}
          {conditionalBonus > 0 && lifted && <div style={{ fontSize: 4, color: '#facc1577', lineHeight: 1 }}>+{conditionalBonus}?</div>}
        </div>
        {/* Charges */}
        {card.infinite
          ? <div style={{ color: active ? color + '99' : color + '28', fontSize: 9, lineHeight: 1, transition: 'color 0.2s' }}>∞</div>
          : (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, alignItems: 'center' }}>
              {Array.from({ length: card.maxCharges ?? 3 }).map((_, i) => {
                const filled = i < card.charges
                return (
                  <div key={i} style={{
                    width: filled ? 7 : 5, height: filled ? 7 : 5,
                    background: filled ? (isLow ? '#f04545' : color) : color + '18',
                    border: `1px solid ${filled ? (isLow ? '#f04545cc' : color + 'cc') : color + '22'}`,
                    boxShadow: filled && active ? `0 0 5px ${isLow ? '#f04545' : color}` : 'none',
                    transition: 'width 0.15s, height 0.15s, background 0.15s',
                    flexShrink: 0,
                  }} />
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}

// ── Damage helpers ────────────────────────────────────────────────
function cardDisplayDamage(c: HandSpell, items: GameItem[], gold: number, hp: number, mhp: number) {
  return calcCardDamage(c, items, hp, mhp, undefined, typeof c.charges === 'number' ? c.charges : undefined, gold)
}
function cardDamageVsEnemy(c: HandSpell, items: GameItem[], gold: number, hp: number, mhp: number, enemy: EnemyDef) {
  return calcCardDamage(c, items, hp, mhp, enemy, typeof c.charges === 'number' ? c.charges : undefined, gold)
}
function enemyModLabel(c: HandSpell, enemy: EnemyDef) {
  if (enemy.weaknesses?.includes(c.element))  return { text: '💥 ×1.5', color: '#4ade80' }
  if (enemy.resistances?.includes(c.element)) return { text: '🛡 ×0.5', color: '#f87171' }
  return null
}
function cardConditionalBonus(c: HandSpell, items: GameItem[]) {
  if (c.infinite) return 0
  const all = items.flatMap(i => i.effects)
  const fh = all.filter(e => e.type === 'firstHitBonus').reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'firstHitBonus' }>).bonus, 0)
  const mo = all.filter(e => e.type === 'physicalMomentum' && c.element === 'physical').reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'physicalMomentum' }>).bonus, 0)
  const st = all.filter(e => e.type === 'elementStreak').reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'elementStreak' }>).bonus, 0)
  return fh + mo + st
}

// ── Main ──────────────────────────────────────────────────────────
export function CardHand({ hand, phase, onPlayCard, ownedItems, gold, playerHp, effectiveMaxHp, currentEnemy }: Props) {
  const canPlay  = phase === 'choose' || phase === 'rest_charge'
  const allCards = [PUNCH_HAND, ...hand]

  // Embla handles horizontal scrolling
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
  })

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [playDrag,    setPlayDrag]    = useState<PlayDrag | null>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Scale tween (direct DOM, 60fps) ─────────────────────────────
  const tweenScale = useCallback(() => {
    if (!emblaApi) return
    const n    = emblaApi.scrollSnapList().length
    if (n < 2) return
    const prog = emblaApi.scrollProgress()          // 0..1
    const cur  = prog * (n - 1)                     // fractional snap index

    slideRefs.current.forEach((el, idx) => {
      if (!el) return
      const dist  = Math.abs(idx - cur)
      const scale = Math.max(0.78, 1 - dist * 0.18) // 1.0 → 0.82 → 0.78
      el.style.transform       = `scale(${scale.toFixed(3)})`
      el.style.transformOrigin = 'bottom center'
    })
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    emblaApi.on('scroll', tweenScale)
    emblaApi.on('reInit', tweenScale)
    tweenScale()
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('scroll', tweenScale)
      emblaApi.off('reInit', tweenScale)
    }
  }, [emblaApi, tweenScale])

  useEffect(() => {
    setSelectedIdx(i => Math.min(i, allCards.length - 1))
    // Re-run scale after card count changes (refs may shift)
    requestAnimationFrame(tweenScale)
  }, [allCards.length, tweenScale])

  // ── Per-card pointer tracking (for vertical play gesture) ────────
  // We track via window listeners so Embla and our handler coexist.
  // On pointerdown: record start, don't capture (let Embla see it too).
  // On first significant movement:
  //   - if UP: steal capture → Embla loses the gesture → we show drag UI
  //   - if horizontal: do nothing → Embla handles it normally
  const pendingRef = useRef<{
    pointerId: number; startX: number; startY: number
    el: HTMLElement; card: HandSpell; decided: boolean
  } | null>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = pendingRef.current
      if (!p || e.pointerId !== p.pointerId) return

      const dx = Math.abs(e.clientX - p.startX)
      const dy = p.startY - e.clientY  // positive = dragging up

      if (!p.decided) {
        if (dy > 8 && dy > dx) {
          p.decided = true
          // Steal capture from Embla → we control this pointer now
          p.el.setPointerCapture(p.pointerId)
          setPlayDrag({ card: p.card, startY: p.startY, currentY: e.clientY })
        } else if (dx > 8) {
          p.decided = true
          pendingRef.current = null // horizontal → Embla takes over
        }
      } else {
        setPlayDrag(d => d ? { ...d, currentY: e.clientY } : null)
      }
    }

    const onUp = (e: PointerEvent) => {
      const p = pendingRef.current
      if (!p || e.pointerId !== p.pointerId) return
      if (p.decided) {
        const dy = p.startY - e.clientY
        if (dy > 60) onPlayCard(p.card)
      }
      pendingRef.current = null
      setPlayDrag(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [onPlayCard])

  const onCardPointerDown = useCallback((e: React.PointerEvent, card: HandSpell, idx: number) => {
    if (!canPlay) return
    if (phase === 'rest_charge' && card.infinite) return
    // Select the tapped card
    setSelectedIdx(idx)
    emblaApi?.scrollTo(idx)
    // Start direction detection (don't capture yet)
    pendingRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      el: e.currentTarget as HTMLElement,
      card, decided: false,
    }
  }, [canPlay, phase, emblaApi])

  // ── Drag ghost visuals ───────────────────────────────────────────
  const dragLift  = playDrag ? Math.max(0, Math.min(playDrag.startY - playDrag.currentY, 240)) : 0
  const dragReady = dragLift > 60
  const dragTheme = playDrag ? (playDrag.card.infinite ? PUNCH_THEME : (ELEM_THEME[playDrag.card.element] ?? ELEM_THEME.physical)) : null
  const dragColor = dragTheme?.glow ?? '#ffd700'

  return (
    <>
      {/* ── Drag ghost ──────────────────────────────────────────── */}
      {playDrag && (() => {
        const cardEl = pendingRef.current?.el?.firstElementChild as HTMLElement | null
        const rect   = cardEl?.getBoundingClientRect()
        const gW = rect?.width  ?? 100
        const gH = rect?.height ?? 170
        const gL = rect?.left   ?? 0
        return (
        <div
          className={s.ghost}
          style={{
            left:   gL,
            top:    playDrag.currentY - dragLift - gH * 0.75,
            width:  gW,
            height: gH,
            filter: `drop-shadow(0 16px 24px rgba(0,0,0,0.95)) drop-shadow(0 0 16px ${dragColor}66)`,
          }}
        >
          <CardFace
            card={playDrag.card} active lifted
            displayDamage={cardDamageVsEnemy(playDrag.card, ownedItems, gold, playerHp, effectiveMaxHp, currentEnemy)}
            conditionalBonus={cardConditionalBonus(playDrag.card, ownedItems)}
            enemyMod={enemyModLabel(playDrag.card, currentEnemy)}
          />
        </div>
        )
      })()}

      {/* ── Drop zone glow ──────────────────────────────────────── */}
      {playDrag && (
        <div
          className={s.dropZone}
          style={{
            background: dragReady
              ? `linear-gradient(90deg,transparent,${dragColor}cc,transparent)`
              : `linear-gradient(90deg,transparent,${dragColor}22,transparent)`,
            boxShadow: dragReady ? `0 0 16px ${dragColor}88` : 'none',
          }}
        />
      )}

      <div ref={emblaRef} className={s.viewport}>
        <div className={s.container}>
          {allCards.map((card, idx) => {
            const isSel  = selectedIdx === idx
            const isDrag = playDrag?.card.instanceId === card.instanceId
            return (
              <div
                key={`${card.instanceId}-${idx}`}
                ref={el => { slideRefs.current[idx] = el }}
                className={[s.slide, isDrag ? s['slide--drag'] : '', canPlay ? s['slide--play'] : ''].filter(Boolean).join(' ')}
                onPointerDown={e => onCardPointerDown(e, card, idx)}
              >
                <CardFace
                  card={card}
                  active={canPlay && !isDrag && isSel}
                  displayDamage={cardDisplayDamage(card, ownedItems, gold, playerHp, effectiveMaxHp)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
