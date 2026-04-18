import { useState } from 'react'
import type { PathType } from '../../types'
import { PATH_META, PX } from '../../constants'
import s from './DraftScreen.module.css'

interface Props {
  pool:      PathType[]   // M = N+1 available paths
  slotCount: number       // N slots to fill
  onConfirm: (ordered: PathType[]) => void
}

export function DraftScreen({ pool, slotCount, onConfirm }: Props) {
  // null = empty slot
  const [slots, setSlots] = useState<(PathType | null)[]>(Array(slotCount).fill(null))
  // track which pool indices are already placed
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set())

  const availablePool = pool.map((p, i) => ({ path: p, idx: i, used: usedIndices.has(i) }))
  const filled = slots.filter(Boolean).length
  const canConfirm = filled === slotCount

  // Click pool card → place into first empty slot
  function pickFromPool(poolIdx: number) {
    if (usedIndices.has(poolIdx)) return
    const firstEmpty = slots.findIndex(s => s === null)
    if (firstEmpty === -1) return
    const next = [...slots]
    next[firstEmpty] = pool[poolIdx]
    setSlots(next)
    setUsedIndices(prev => new Set([...prev, poolIdx]))
  }

  // Click slot → remove it, return to pool
  function removeFromSlot(slotIdx: number) {
    const path = slots[slotIdx]
    if (!path) return
    // find the pool index for this path that's used (pick first match)
    const poolIdx = pool.findIndex((p, i) => p === path && usedIndices.has(i))
    const next = [...slots]
    next[slotIdx] = null
    setSlots(next)
    setUsedIndices(prev => {
      const s = new Set(prev)
      s.delete(poolIdx)
      return s
    })
  }

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(slots as PathType[])
  }

  return (
    <div className={s.backdrop} style={{ fontFamily: PX }}>
      {/* Header */}
      <div className={s.header}>
        <span className={s.headerTitle}>СОСТАВЬ МАРШРУТ</span>
        <span className={s.headerSub}>{filled} / {slotCount}</span>
      </div>

      {/* Pool — available paths to pick from */}
      <div className={s.poolSection}>
        <div className={s.sectionLabel}>ДОСТУПНО</div>
        <div className={s.pool}>
          {availablePool.map(({ path, idx, used }) => {
            const m = PATH_META[path]
            return (
              <div
                key={idx}
                className={s.poolCard}
                data-used={used}
                onClick={() => pickFromPool(idx)}
                style={{
                  borderColor: used ? '#1a1a1a' : m.color + '66',
                  background:  used ? '#0a0a0a' : `linear-gradient(160deg, #0f0c00, ${m.color}14)`,
                  boxShadow:   used ? 'none' : `0 0 12px ${m.color}22`,
                  cursor:      used ? 'default' : 'pointer',
                  opacity:     used ? 0.3 : 1,
                }}
              >
                <span className={s.poolCardIcon} style={{ filter: used ? 'grayscale(1)' : 'none' }}>
                  {m.icon}
                </span>
                <span className={s.poolCardLabel} style={{ color: used ? '#333' : m.color }}>
                  {m.label.toUpperCase()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className={s.divider} />

      {/* Slots — ordered sequence */}
      <div className={s.slotsSection}>
        <div className={s.sectionLabel}>МАРШРУТ</div>
        <div className={s.slots}>
          {slots.map((path, idx) => {
            const m = path ? PATH_META[path] : null
            return (
              <div key={idx} className={s.slotWrapper}>
                <div className={s.slotNum}>{idx + 1}</div>
                <div
                  className={s.slot}
                  data-filled={!!path}
                  onClick={() => removeFromSlot(idx)}
                  style={{
                    borderColor: path ? m!.color + '88' : '#222',
                    background:  path ? `linear-gradient(160deg, #0f0c00, ${m!.color}18)` : '#09090b',
                    boxShadow:   path ? `0 0 16px ${m!.color}22` : 'none',
                    cursor:      path ? 'pointer' : 'default',
                  }}
                >
                  {path ? (
                    <>
                      <span className={s.slotIcon}>{m!.icon}</span>
                      <span className={s.slotLabel} style={{ color: m!.color }}>
                        {m!.label.toUpperCase()}
                      </span>
                      <span className={s.slotRemove}>✕</span>
                    </>
                  ) : (
                    <span className={s.slotEmpty}>—</span>
                  )}
                </div>
                {/* Arrow between slots */}
                {idx < slotCount - 1 && (
                  <div className={s.slotArrow}>→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Confirm */}
      <div className={s.footer}>
        <button
          className={s.confirmBtn}
          disabled={!canConfirm}
          onClick={handleConfirm}
          style={{
            borderColor: canConfirm ? '#c8a800' : '#2a2a2a',
            color:       canConfirm ? '#c8a800' : '#333',
            boxShadow:   canConfirm ? '0 0 16px #c8a80033' : 'none',
            background:  canConfirm ? '#1a1200' : '#0a0a0a',
          }}
        >
          {canConfirm ? 'ВЫСТУПИТЬ' : `ВЫБЕРИ ЕЩЁ ${slotCount - filled}`}
        </button>
      </div>
    </div>
  )
}
