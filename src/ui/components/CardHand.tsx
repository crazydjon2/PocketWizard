import { useState, useCallback } from 'react'
import type { HandSpell } from '@game/data/spells'
import { PUNCH_SPELL } from '@game/data/spells'
import type { Phase } from '../../types'
import { ELEM_DISPLAY, PX } from '../../constants'

interface Props {
  hand:       HandSpell[]
  phase:      Phase
  onPlayCard: (card: HandSpell) => void
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

interface DragState { card: HandSpell; idx: number; startY: number; x: number; y: number }

const PUNCH_HAND: HandSpell = { ...PUNCH_SPELL, charges: Infinity, instanceId: 'punch' }

// ── Card visual ───────────────────────────────────────────────────
function CardFace({ card, active, lifted }: { card: HandSpell; active: boolean; lifted?: boolean }) {
  const elem  = ELEM_DISPLAY.find(e => e.key === card.element)
  const theme = card.infinite ? PUNCH_THEME : (ELEM_THEME[card.element] ?? ELEM_THEME.physical)
  const color = theme.glow
  const isLow = !card.infinite && card.charges === 1

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bg,
      border: `3px solid ${active ? color : color + '55'}`,
      boxShadow: lifted
        ? `0 0 32px ${color}88, 0 0 8px ${color}44, inset 0 0 24px ${color}22, 6px 6px 0 #000`
        : active
          ? `0 0 12px ${color}44, inset 0 0 16px ${color}18, 4px 4px 0 #000`
          : `inset 0 0 8px ${color}0a, 2px 2px 0 #000`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
      fontFamily: PX, userSelect: 'none',
      transition: lifted ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
    }}>

      {/* Radial glow behind icon */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 42%, ${color}${active ? '22' : '0c'} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Top accent bar */}
      <div style={{
        height: 4, flexShrink: 0,
        background: active
          ? `linear-gradient(90deg, ${color}dd, ${theme.mid}88, ${color}dd)`
          : `linear-gradient(90deg, ${color}55, ${theme.mid}33, ${color}55)`,
      }} />

      {/* Header: element badge */}
      <div style={{
        padding: '4px 6px 2px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{
          background: active ? `${color}22` : `${color}0d`,
          border: `1px solid ${active ? color + '66' : color + '22'}`,
          padding: '1px 4px',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{ fontSize: 7, lineHeight: 1 }}>
            {card.infinite ? '∞' : elem?.icon}
          </span>
          <span style={{ color: active ? color + 'cc' : color + '55', fontSize: 3.5, letterSpacing: 0.5 }}>
            {card.infinite ? 'БАЗОВЫЙ' : (elem?.label.toUpperCase() ?? '')}
          </span>
        </div>

        {/* Damage circle */}
        <div style={{
          width: 22, height: 22,
          background: active ? `${color}33` : `${color}11`,
          border: `2px solid ${active ? color : color + '44'}`,
          borderRadius: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: active ? color : color + '77', fontSize: 8, lineHeight: 1 }}>
            {card.baseDamage}
          </span>
        </div>
      </div>

      {/* Main icon area */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{
          fontSize: 40, lineHeight: 1,
          filter: active
            ? `drop-shadow(0 0 8px ${color}99)`
            : 'grayscale(0.5) brightness(0.55)',
          transition: 'filter 0.2s',
        }}>
          {card.icon}
        </span>
      </div>

      {/* Footer */}
      <div style={{
        background: `linear-gradient(to bottom, transparent, #00000088)`,
        borderTop: `1px solid ${active ? color + '44' : color + '1a'}`,
        padding: '4px 6px 6px',
        flexShrink: 0,
      }}>
        {/* Name */}
        <div style={{
          color: active ? '#ddd' : '#444',
          fontSize: 3.5, lineHeight: 1.4, textAlign: 'center',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          marginBottom: 3,
        }}>
          {card.name.toUpperCase()}
        </div>

        {/* Charges */}
        {!card.infinite && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
            {Array.from({ length: card.maxCharges ?? 3 }).map((_, i) => (
              <div key={i} style={{
                width: i < card.charges ? 8 : 6,
                height: i < card.charges ? 8 : 6,
                background: i < card.charges
                  ? (isLow ? '#f04545' : color)
                  : color + '1a',
                border: `1px solid ${i < card.charges ? (isLow ? '#f04545aa' : color + 'aa') : color + '22'}`,
                boxShadow: i < card.charges && active ? `0 0 4px ${isLow ? '#f04545' : color}88` : 'none',
                alignSelf: 'center',
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Card hand ─────────────────────────────────────────────────────
export function CardHand({ hand, phase, onPlayCard }: Props) {
  const canPlay  = phase === 'choose'
  const allCards: HandSpell[] = [PUNCH_HAND, ...hand]
  const n        = allCards.length
  const center   = (n - 1) / 2

  const [drag, setDrag] = useState<DragState | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent, card: HandSpell, idx: number) => {
    if (!canPlay) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ card, idx, startY: e.clientY, x: e.clientX, y: e.clientY })
    setHover(null)
  }, [canPlay])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return
    setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY } : null)
  }, [drag])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag) return
    if (drag.startY - e.clientY > 70) onPlayCard(drag.card)
    setDrag(null)
  }, [drag, onPlayCard])

  const dragLift  = drag ? Math.max(0, Math.min(drag.startY - drag.y, 240)) : 0
  const dragReady = dragLift > 70
  const dragTheme = drag
    ? (drag.card.infinite ? PUNCH_THEME : (ELEM_THEME[drag.card.element] ?? ELEM_THEME.physical))
    : null
  const dragColor = dragTheme?.glow ?? '#ffd700'

  return (
    <>
      {/* ── Drag ghost ────────────────────────────────────────────── */}
      {drag && (
        <div style={{
          position: 'fixed',
          left: drag.x - 44,
          top:  drag.y - dragLift - 64,
          width: 88, height: 128,
          zIndex: 200, pointerEvents: 'none',
          transform: `rotate(-3deg) scale(${1 + dragLift * 0.001})`,
          filter: `drop-shadow(0 16px 24px rgba(0,0,0,0.95)) drop-shadow(0 0 16px ${dragColor}66)`,
        }}>
          <CardFace card={drag.card} active lifted />
        </div>
      )}

      {/* ── Drop zone ─────────────────────────────────────────────── */}
      {drag && (
        <>
          <div style={{
            position: 'absolute', top: 60, left: '15%', right: '15%', height: 2,
            background: dragReady
              ? `linear-gradient(90deg, transparent, ${dragColor}cc, transparent)`
              : `linear-gradient(90deg, transparent, ${dragColor}22, transparent)`,
            pointerEvents: 'none', zIndex: 99,
            transition: 'background 0.15s',
            boxShadow: dragReady ? `0 0 12px ${dragColor}88` : 'none',
          }} />
          <div style={{
            position: 'fixed',
            left: drag.x, top: drag.y - dragLift - 82,
            transform: 'translateX(-50%)',
            color: dragReady ? dragColor : '#ffffff44',
            fontSize: 5, fontFamily: PX, letterSpacing: 2,
            pointerEvents: 'none', zIndex: 201,
            whiteSpace: 'nowrap',
            textShadow: dragReady ? `0 0 8px ${dragColor}` : '1px 1px 0 #000',
            transition: 'color 0.15s',
          }}>
            {dragReady ? '▲ ОТПУСТИ ▲' : '▲ ТЯНИ ВЫШЕ ▲'}
          </div>
        </>
      )}

      {/* ── Bottom panel (background provided by AppThree) ────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 100,
        paddingBottom: 8,
        paddingTop: 14,
      }}>

        {/* Phase label */}
        <div style={{ textAlign: 'center', height: 14, marginBottom: 6 }}>
          {phase === 'choose' && (
            <span style={{
              color: '#ffffff28', fontSize: 5, letterSpacing: 3, fontFamily: PX,
            }}>
              — ВЫБЕРИ КАРТУ —
            </span>
          )}
          {phase === 'waiting' && (
            <span style={{
              color: '#f0454555', fontSize: 5, letterSpacing: 3, fontFamily: PX,
              animation: 'enemyPulse 0.8s ease-in-out infinite alternate',
            }}>
              — ВРАГ АТАКУЕТ —
            </span>
          )}
        </div>

        {/* Arc hand of cards */}
        <div
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '0 96px',  // leave room for HP orb (left) + stats btn (right)
            gap: 6,
            minHeight: 148,
          }}
        >
          {allCards.map((card, idx) => {
            const offset   = idx - center
            const rot      = offset * 4.5          // fan rotation
            const ty       = offset * offset * 3   // arc curve (edges rise)
            const isDrag   = drag?.idx === idx
            const isHover  = hover === idx && !drag
            const zIdx     = isDrag ? 0 : (isHover ? n + 2 : n - Math.abs(Math.round(offset)))

            return (
              <div
                key={`${card.instanceId}-${idx}`}
                style={{
                  flexShrink: 0, width: 88, height: 128,
                  transformOrigin: 'bottom center',
                  transform: isDrag
                    ? `rotate(${rot}deg) translateY(${ty}px) scale(0.85)`
                    : isHover
                      ? `rotate(${rot * 0.5}deg) translateY(${ty - 18}px) scale(1.06)`
                      : `rotate(${rot}deg) translateY(${ty}px) scale(1)`,
                  opacity:    isDrag ? 0.18 : 1,
                  zIndex:     zIdx,
                  transition: isDrag ? 'none' : 'transform 0.18s cubic-bezier(0.16,1,0.3,1), opacity 0.15s',
                  cursor:     canPlay ? 'grab' : 'default',
                  touchAction: 'none',
                }}
                onPointerDown={e => onPointerDown(e, card, idx)}
                onPointerEnter={() => canPlay && !drag && setHover(idx)}
                onPointerLeave={() => setHover(null)}
              >
                <CardFace card={card} active={canPlay && !isDrag} />
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes enemyPulse {
          from { opacity: 0.4; }
          to   { opacity: 0.9; }
        }
      `}</style>
    </>
  )
}
