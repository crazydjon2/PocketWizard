import { useState, useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
import { ALL_CLASSES } from '@game/data/classes'
import type { ClassDef } from '@game/data/classes'
import { spellIconSrc } from '@game/data/spells'
import { ELEM_DISPLAY, PX } from '../../constants'

const getElemIcon  = (key: string) => ELEM_DISPLAY.find(e => e.key === key)?.icon ?? key
const getElemColor = (key: string) => ELEM_DISPLAY.find(e => e.key === key)?.color ?? '#888'
import s from './ClassSelectScreen.module.css'

interface Props {
  onSelect: (cls: ClassDef) => void
}

export function ClassSelectScreen({ onSelect }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', containScroll: false })
  const [activeIdx, setActiveIdx] = useState(0)
  const slideRefs = useRef<HTMLDivElement[]>([])

  const tweenScale = useCallback((api: EmblaCarouselType) => {
    const progress = api.scrollProgress()
    api.scrollSnapList().forEach((snap, i) => {
      const el = slideRefs.current[i]
      if (!el) return
      const dist = Math.abs(progress - snap)
      el.style.transform = `scale(${Math.max(0.84, 1 - dist * 0.2)})`
      el.style.transformOrigin = 'center center'
      el.style.opacity = String(Math.max(0.4, 1 - dist * 0.8))
    })
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('scroll', tweenScale)
    emblaApi.on('reInit', tweenScale)
    emblaApi.on('select', () => setActiveIdx(emblaApi.selectedScrollSnap()))
    tweenScale(emblaApi)
  }, [emblaApi, tweenScale])

  const cls = ALL_CLASSES[activeIdx]

  return (
    <div className={s.root} style={{ fontFamily: PX }}>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerTitle}>ВЫБЕРИ КЛАСС</div>
        <div className={s.headerDots}>
          {ALL_CLASSES.map((_, i) => (
            <div
              key={i}
              className={s.headerDot}
              style={{ background: i === activeIdx ? cls.color : '#2a2a2a' }}
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      </div>

      {/* Carousel */}
      <div ref={emblaRef} className={s.viewport}>
        <div className={s.track}>
          {ALL_CLASSES.map((c, idx) => {
            const elemLabel = ELEM_DISPLAY.find(e => e.key === c.element)?.label ?? c.element
            const elemIcon  = ELEM_DISPLAY.find(e => e.key === c.element)?.icon ?? ''
            return (
              <div
                key={c.id}
                ref={el => { slideRefs.current[idx] = el! }}
                className={s.slide}
              >
                <div
                  className={s.card}
                  style={{
                    background: `linear-gradient(175deg, #08090d 0%, ${c.color}1a 50%, #040507 100%)`,
                    borderColor: c.color + '55',
                    boxShadow: `0 0 30px ${c.color}22, 0 6px 0 #000`,
                  }}
                >
                  {/* Art zone */}
                  <div className={s.cardArt} style={{ background: `linear-gradient(180deg, ${c.color}10, #04050700)` }}>
                    <img
                      src={`/assets/ui/class_${c.id}.png`}
                      draggable={false}
                      className={s.cardArtImg}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className={s.cardArtFallback} style={{ color: c.color }}>{c.icon}</div>
                    <div className={s.cardArtGradient} style={{ background: `linear-gradient(to top, #08090d, transparent)` }} />
                  </div>

                  {/* Identity */}
                  <div className={s.cardIdentity}>
                    <div className={s.cardElement} style={{ color: c.color + 'aa' }}>
                      {elemIcon} {elemLabel.toUpperCase()}
                    </div>
                    <div className={s.cardName} style={{ color: '#e8e0cc' }}>{c.name.toUpperCase()}</div>
                    <div className={s.cardTagline}>{c.tagline}</div>
                  </div>

                  {/* Stats */}
                  <div className={s.statsRow} style={{ borderColor: c.color + '22' }}>
                    <div className={s.statBlock}>
                      <span className={s.statBlockLabel}>HP</span>
                      <span className={s.statBlockVal} style={{ color: '#4ade80' }}>{c.startingHp}</span>
                    </div>
                  </div>

                  {/* Elemental bonuses / resistances */}
                  {(c.dmgBonus.length > 0 || c.resist.length > 0) && (
                    <div className={s.elemStats} style={{ borderColor: c.color + '18' }}>
                      {c.dmgBonus.map((b, i) => (
                        <div key={`dmg-${i}`} className={s.elemStatRow}>
                          <span className={s.elemStatIcon}>{getElemIcon(b.element)}</span>
                          <span className={s.elemStatLabel} style={{ color: getElemColor(b.element) }}>урон</span>
                          <span className={s.elemStatVal} style={{ color: '#4ade80' }}>+{b.value}</span>
                        </div>
                      ))}
                      {c.resist.map((r, i) => (
                        <div key={`res-${i}`} className={s.elemStatRow}>
                          <span className={s.elemStatIcon}>{getElemIcon(r.element)}</span>
                          <span className={s.elemStatLabel} style={{ color: getElemColor(r.element) }}>получаемый урон</span>
                          <span className={s.elemStatVal} style={{ color: r.value >= 0 ? '#4ade80' : '#f87171' }}>
                            {r.value >= 0 ? `−${r.value}` : `+${Math.abs(r.value)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Spells */}
                  <div className={s.spellsSection} style={{ borderColor: c.color + '22' }}>
                    <div className={s.spellsSectionLabel} style={{ color: c.color + '66' }}>СТАРТОВЫЕ ЗАКЛИНАНИЯ</div>
                    <div className={s.spellsList}>
                      {c.spells.map((spell, i) => {
                        const iconSrc = spellIconSrc(spell.id)
                        return (
                          <div key={i} className={s.spellRow} style={{ background: c.color + '0d', borderColor: c.color + '22' }}>
                            <div className={s.spellIconBox} style={{ borderColor: c.color + '33' }}>
                              {iconSrc
                                ? <img src={iconSrc} draggable={false} className={s.spellIconImg}
                                    style={{ filter: `drop-shadow(0 0 4px ${c.color}88)` }} />
                                : <span className={s.spellIconEmoji}>{spell.icon}</span>
                              }
                            </div>
                            <div className={s.spellInfo}>
                              <span className={s.spellName} style={{ color: '#ccc' }}>{spell.name}</span>
                              <span className={s.spellDesc}>{spell.description}</span>
                            </div>
                            <div className={s.spellMeta}>
                              <span className={s.spellDmg} style={{ color: c.color }}>{spell.baseDamage}</span>
                              <span className={s.spellCharges} style={{ color: '#555' }}>
                                {spell.infinite ? '∞' : `×${spell.maxCharges ?? 3}`}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={s.footer}>
        <button
          className={s.confirmBtn}
          onClick={() => onSelect(cls)}
          style={{
            background:  cls.color + '18',
            borderColor: cls.color,
            color:       cls.color,
            boxShadow:   `0 0 20px ${cls.color}33`,
          }}
        >
          ▶ ИГРАТЬ
        </button>
      </div>
    </div>
  )
}
