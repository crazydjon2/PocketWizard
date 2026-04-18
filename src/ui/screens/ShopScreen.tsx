import { useState, useCallback, useRef, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
import type { ChestOption } from '../../types'
import type { Spell } from '@game/data/spells'
import { spellIconSrc } from '@game/data/spells'
import type { GameItem } from '@game/data/items'
import { itemIconSrc } from '@game/data/items'
import { ELEM_DISPLAY, RARITY_COLOR, SHOP_PRICE, SPELL_PRICE, PX } from '../../constants'
import { effectTags } from '@game/logic/itemDisplay'
import s from './ShopScreen.module.css'

interface Props {
  items:      ChestOption[]
  gold:       number
  rerollCost: number
  onBuy:      (choice: ChestOption) => void
  onReroll:   () => void
  onLeave:    () => void
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
    <div className={s.card} style={{ background: `linear-gradient(170deg, #090909 0%, ${color}14 55%, #060606 100%)` }}>
      {/* Ambient glow */}
      <div className={s.cardGlow} style={{ background: `radial-gradient(ellipse at 50% 40%, ${color}18, transparent 65%)` }} />

      {/* Top: name + badge */}
      <div className={s.cardTop}>
        <div className={s.cardName} style={{ color: '#d4c9b4' }}>
          {choice.data.name.toUpperCase()}
        </div>
        <div className={s.cardBadge} style={{ color, borderColor: `${color}44`, background: `${color}14` }}>
          {badge}
        </div>
      </div>

      {/* Art */}
      <div className={s.cardArt}>
        {iconSrc
          ? <img src={iconSrc} draggable={false} className={s.cardIcon}
              style={{ filter: `drop-shadow(0 0 14px ${color}99)` }} />
          : <span className={s.cardEmoji} style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}>
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
    </div>
  )
}

// ── Shop screen ───────────────────────────────────────────────────
export function ShopScreen({ items, gold, rerollCost, onBuy, onReroll, onLeave }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', containScroll: false })
  const [activeIdx, setActiveIdx] = useState(0)
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
    const onSettle = () => setActiveIdx(emblaApi.selectedScrollSnap())
    emblaApi.on('scroll', tweenScale)
    emblaApi.on('reInit', tweenScale)
    emblaApi.on('settle', onSettle)
    tweenScale(emblaApi)
  }, [emblaApi, tweenScale])

  const selected   = items[activeIdx]
  const isSpell    = selected?.kind === 'spell'
  const price      = selected
    ? (isSpell ? SPELL_PRICE : SHOP_PRICE[(selected.data as GameItem).rarity])
    : 0
  const canAfford  = gold >= price
  const itemColor  = selected
    ? (isSpell
        ? (ELEM_DISPLAY.find(e => e.key === (selected.data as Spell).element)?.color ?? '#ffd700')
        : RARITY_COLOR[(selected.data as GameItem).rarity])
    : '#888'

  return (
    <div className={s.backdrop} style={{ fontFamily: PX }}>

      {/* Header */}
      <div className={s.header}>
        <span className={s.headerTitle}>ТОРГОВЕЦ</span>
        <div className={s.headerGold}>
          <div className={s.goldCoin} />
          <span className={s.goldVal}>{gold}</span>
        </div>
      </div>

      {/* Carousel */}
      {items.length === 0
        ? <div className={s.empty}>ПОЛКИ ПУСТЫ</div>
        : (
          <div className={s.viewport} ref={emblaRef}>
            <div className={s.carouselContainer}>
              {items.map((choice, idx) => {
                const isSp  = choice.kind === 'spell'
                const color = isSp
                  ? (ELEM_DISPLAY.find(e => e.key === (choice.data as Spell).element)?.color ?? '#ffd700')
                  : RARITY_COLOR[(choice.data as GameItem).rarity]
                return (
                  <div
                    key={idx}
                    ref={el => { slideRefs.current[idx] = el! }}
                    className={s.slide}
                    onClick={() => emblaApi?.scrollTo(idx)}
                  >
                    <ItemCard choice={choice} color={color} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      {/* Footer */}
      <div className={s.footer}>
        <div className={s.buyRow}>
          <div className={s.priceTag} style={{ color: canAfford ? '#c8a800' : '#555', borderColor: canAfford ? '#c8a80044' : '#2a2a2a' }}>
            <div className={s.goldCoinSm} style={{ opacity: canAfford ? 1 : 0.3 }} />
            {price}
          </div>
          <button
            className={s.buyBtn}
            disabled={!canAfford || !selected}
            onClick={() => selected && canAfford && onBuy(selected)}
            style={{
              background:   canAfford ? `${itemColor}22` : '#0f0f0f',
              borderColor:  canAfford ? itemColor : '#2a2a2a',
              color:        canAfford ? itemColor : '#444',
              boxShadow:    canAfford ? `0 0 12px ${itemColor}33` : 'none',
            }}
          >
            {canAfford ? 'КУПИТЬ' : 'ДОРОГО'}
          </button>
        </div>

        <div className={s.actions}>
          <button
            className={s.rerollBtn}
            disabled={gold < rerollCost}
            onClick={() => gold >= rerollCost && onReroll()}
            style={{ color: gold >= rerollCost ? '#7dd3fc' : '#333', borderColor: gold >= rerollCost ? '#7dd3fc33' : '#1a1a1a' }}
          >
            🔄 РЕРОЛЛ · 💰{rerollCost}
          </button>
          <button className={s.leaveBtn} onClick={onLeave}>
            УЙТИ
          </button>
        </div>
      </div>

    </div>
  )
}
