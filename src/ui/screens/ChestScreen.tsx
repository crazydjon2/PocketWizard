import { useCallback, useRef, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
import type { ChestOption } from '../../types'
import type { Spell } from '@game/data/spells'
import { spellIconSrc } from '@game/data/spells'
import type { GameItem } from '@game/data/items'
import { itemIconSrc } from '@game/data/items'
import { ELEM_DISPLAY, RARITY_COLOR, PX } from '../../constants'
import { effectTags } from '@game/logic/itemDisplay'
import s from './ChestScreen.module.css'

interface Props {
  choices:  ChestOption[]
  onChoose: (choice: ChestOption) => void
}

// ── Item card face ────────────────────────────────────────────────
function ItemCard({ choice, color }: { choice: ChestOption; color: string }) {
  const isSpell = choice.kind === 'spell'
  const tags    = !isSpell ? effectTags((choice.data as GameItem).effects) : []
  const flavor  = !isSpell
    ? (choice.data as GameItem).flavor
    : (choice.data as Spell).description
  const badge   = isSpell ? 'ЗАКЛИНАНИЕ' : {
    common: 'ОБЫЧНЫЙ', rare: 'РЕДКИЙ', epic: 'ЭПИЧЕСКИЙ',
  }[(choice.data as GameItem).rarity] ?? ''

  const iconSrc = isSpell
    ? spellIconSrc((choice.data as Spell).id)
    : itemIconSrc(choice.data.id)

  return (
    <div className={s.card} style={{ background: `linear-gradient(170deg, #090909 0%, ${color}16 55%, #060606 100%)` }}>
      {/* Ambient glow */}
      <div className={s.cardGlow} style={{ background: `radial-gradient(ellipse at 50% 40%, ${color}1a, transparent 65%)` }} />

      {/* Top: name + badge */}
      <div className={s.cardTop}>
        <div className={s.cardName}>{choice.data.name.toUpperCase()}</div>
        <div className={s.cardBadge} style={{ color, borderColor: `${color}44`, background: `${color}14` }}>
          {badge}
        </div>
      </div>

      {/* Art */}
      <div className={s.cardArt}>
        {iconSrc
          ? <img src={iconSrc} draggable={false} className={s.cardIcon}
              style={{ filter: `drop-shadow(0 0 16px ${color}aa)` }} />
          : <span className={s.cardEmoji} style={{ filter: `drop-shadow(0 0 12px ${color}99)` }}>
              {choice.data.icon}
            </span>
        }
      </div>

      {/* Bottom: effects + flavor */}
      <div className={s.cardBottom}>
        {tags.length > 0 && (
          <div className={s.cardTags}>
            {tags.slice(0, 3).map((tag, i) => (
              <div key={i} className={tag.positive ? s.tagPos : s.tagNeg}>
                {tag.positive ? '▲' : '▼'} {tag.text}
              </div>
            ))}
          </div>
        )}
        {flavor && <div className={s.cardFlavor}>"{flavor}"</div>}
      </div>

      {/* Frame overlay */}
      <img src="/assets/item_frame.png" draggable={false} className={s.cardFrame} />

      {/* Pick hint */}
      <div className={s.pickHint} style={{ color, borderColor: `${color}55` }}>
        ВЗЯТЬ
      </div>
    </div>
  )
}

// ── Chest screen ──────────────────────────────────────────────────
export function ChestScreen({ choices, onChoose }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', containScroll: false })
  const slideRefs = useRef<HTMLDivElement[]>([])

  const tweenScale = useCallback((api: EmblaCarouselType) => {
    const progress = api.scrollProgress()
    api.scrollSnapList().forEach((snap, i) => {
      const el = slideRefs.current[i]
      if (!el) return
      const dist  = Math.abs(progress - snap)
      const scale = Math.max(0.82, 1 - dist * 0.22)
      el.style.transform = `scale(${scale})`
      el.style.transformOrigin = 'center center'
    })
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('scroll', tweenScale)
    emblaApi.on('reInit', tweenScale)
    tweenScale(emblaApi)
  }, [emblaApi, tweenScale])

  return (
    <div className={s.backdrop} style={{ fontFamily: PX }}>

      {/* Header */}
      <div className={s.header}>
        <span className={s.headerIcon}>🎁</span>
        <span className={s.headerTitle}>ВЫБЕРИ НАГРАДУ</span>
        <span className={s.headerCount}>{choices.length}</span>
      </div>

      {/* Carousel */}
      <div className={s.viewport} ref={emblaRef}>
        <div className={s.carouselContainer}>
          {choices.map((choice, idx) => {
            const isSpell = choice.kind === 'spell'
            const color   = isSpell
              ? (ELEM_DISPLAY.find(e => e.key === (choice.data as Spell).element)?.color ?? '#ffd700')
              : RARITY_COLOR[(choice.data as GameItem).rarity]
            return (
              <div
                key={idx}
                ref={el => { slideRefs.current[idx] = el! }}
                className={s.slide}
                onClick={() => {
                  if (emblaApi?.selectedScrollSnap() === idx) {
                    onChoose(choice)
                  } else {
                    emblaApi?.scrollTo(idx)
                  }
                }}
              >
                <ItemCard choice={choice} color={color} />
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
