import { useState } from 'react'
import type { PathType } from '../../types'
import { PATH_META, PX } from '../../constants'
import s from './PathChoiceScreen.module.css'

interface Props {
  choices:  PathType[]
  onChoose: (path: PathType) => void
}

const PATH_HINT: Record<PathType, string> = {
  combat: 'Победи врага',
  rest:   '+8 HP',
  event:  'Случайное',
  shop:   'Купи предмет',
}

export function PathChoiceScreen({ choices, onChoose }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [flipped, setFlipped] = useState<number | null>(null)

  const handleClick = (idx: number, path: PathType) => {
    if (flipped !== null) return
    setFlipped(idx)
    setTimeout(() => onChoose(path), 480)
  }

  const n      = choices.length
  const center = (n - 1) / 2

  return (
    <div className={s.root}>
      <div className={s.label} style={{ fontFamily: PX }}>— ВЫБЕРИ СУДЬБУ —</div>

      <div className={s.row}>
        {choices.map((path, idx) => {
          const m      = PATH_META[path]
          const offset = idx - center
          const rot    = offset * 5.5
          const ty     = offset * offset * 3
          const isHov  = hovered === idx && flipped === null
          const isFlip = flipped === idx

          return (
            <div
              key={path}
              className={s.cardWrap}
              style={{
                cursor: flipped === null ? 'pointer' : 'default',
                transform: `rotate(${rot}deg) translateY(${ty + (isHov ? -14 : 0)}px)`,
                filter: isHov
                  ? 'drop-shadow(0 8px 18px rgba(0,0,0,0.9)) drop-shadow(0 0 12px #c8a80066)'
                  : 'drop-shadow(2px 4px 8px rgba(0,0,0,0.8))',
              }}
              onClick={() => handleClick(idx, path)}
              onMouseEnter={() => { if (flipped === null) setHovered(idx) }}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={s.flipper} style={{ transform: isFlip ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

                {/* Back */}
                <div className={s.cardBack} style={{
                  background: 'linear-gradient(160deg, #0f0c1e 0%, #1a1535 50%, #0f0c1e 100%)',
                  border: `2px solid ${isHov ? '#c8a80088' : '#2a2448'}`,
                  boxShadow: isHov ? 'inset 0 0 20px #c8a80011' : 'inset 0 0 8px #00000044',
                  fontFamily: PX,
                }}>
                  <div className={s.cardBackPattern} />
                  <div className={s.cardBackRune} style={{ border: `2px solid ${isHov ? '#c8a80055' : '#2a244888'}` }}>
                    <div className={s.cardBackRuneInner} style={{ border: `1px solid ${isHov ? '#c8a80044' : '#2a244866'}` }} />
                  </div>
                  {[0,1,2,3].map((_, i) => (
                    <div key={i} className={s.cardBackDot} style={{
                      top:    i < 2 ? 5 : undefined,
                      bottom: i >= 2 ? 5 : undefined,
                      left:   i % 2 === 0 ? 5 : undefined,
                      right:  i % 2 === 1 ? 5 : undefined,
                      background: isHov ? '#c8a80066' : '#2a244888',
                    }} />
                  ))}
                </div>

                {/* Front */}
                <div className={s.cardFront} style={{
                  background: 'linear-gradient(160deg, #0a0612 0%, #16102a 55%, #0a0612 100%)',
                  border: `2px solid ${m.color}88`,
                  boxShadow: `inset 0 0 24px ${m.color}11`,
                  fontFamily: PX,
                }}>
                  <div className={s.cardFrontAccentTop} style={{ background: `linear-gradient(90deg, transparent, ${m.color}cc, transparent)` }} />
                  <div className={s.cardFrontAccentBot} style={{ background: `linear-gradient(90deg, transparent, ${m.color}88, transparent)` }} />
                  <div className={s.cardFrontLabel} style={{ color: `${m.color}99` }}>{m.label.toUpperCase()}</div>
                  <span className={s.cardFrontIcon} style={{ filter: `drop-shadow(0 0 10px ${m.color}88)` }}>{m.icon}</span>
                  <div className={s.cardFrontHint}>{PATH_HINT[path]}</div>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
