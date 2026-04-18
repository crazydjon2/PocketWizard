import { useState, useRef, useCallback, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
import type { PathType, ChestOption, Phase } from '../../types'
import type { GameEvent, EventChoice } from '@game/data/events'
import type { Spell } from '@game/data/spells'
import { spellIconSrc } from '@game/data/spells'
import type { GameItem } from '@game/data/items'
import { itemIconSrc } from '@game/data/items'
import { PATH_META, ELEM_DISPLAY, RARITY_COLOR, SHOP_PRICE, SPELL_PRICE, PX } from '../../constants'
import { effectTags } from '@game/logic/itemDisplay'
import s from './WorldOverlay.module.css'

interface Props {
  phase:           Phase
  pathChoices:     PathType[]
  onPathChoose:    (p: PathType) => void
  chestChoices:    ChestOption[]
  onChestChoose:   (c: ChestOption) => void
  shopItems:       ChestOption[]
  gold:            number
  rerollCost:      number
  onShopBuy:       (c: ChestOption) => void
  onReroll:        () => void
  onShopLeave:     () => void
  shopDiscount:    number
  event:           GameEvent | null
  eventResolved:   boolean
  eventOutcome:    string
  playerHp:        number
  effectiveMaxHp:  number
  ownedItems:      import('@game/data/items').GameItem[]
  handSize:        number
  onEventChoice:   (c: EventChoice) => void
  onEventContinue: () => void
  restHealAmount:   number
  restChargeAmount: number
  onRestChoice:     (type: 'heal' | 'charge') => void
}

// ── Path: signposts ───────────────────────────────────────────────
function PathSigns({ choices, onChoose }: { choices: PathType[]; onChoose: (p: PathType) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const n = choices.length
  const center = (n - 1) / 2

  return (
    <div className={s.pathContainer}>
      {choices.map((path, idx) => {
        const m      = PATH_META[path]
        const offset = idx - center
        const rot    = offset * 3
        const hov    = hovered === idx

        return (
          <div
            key={path}
            className={s.pathSign}
            onClick={() => onChoose(path)}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer',
              transform: `rotate(${rot}deg) translateY(${hov ? -10 : 0}px)`,
              transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1)',
              animation: `worldBob ${1.8 + idx * 0.3}s ease-in-out infinite alternate`,
            }}
          >
            <div
              className={s.pathSignBoard}
              style={{
                background: hov
                  ? `linear-gradient(160deg, #1a1200, #2a1e00)`
                  : `linear-gradient(160deg, #0f0c00, #1a1400)`,
                border: `2px solid ${hov ? m.color + 'cc' : m.color + '55'}`,
                boxShadow: hov
                  ? `0 0 20px ${m.color}55, 0 4px 0 #000, inset 0 0 16px ${m.color}11`
                  : `0 3px 0 #000, inset 0 0 8px #00000044`,
              }}
            >
              <div
                className={s.pathNail}
                style={{
                  background: hov ? m.color + 'aa' : '#5a4a2088',
                  boxShadow: hov ? `0 0 6px ${m.color}` : 'none',
                }}
              />
              <span style={{
                fontSize: 28,
                filter: hov
                  ? `drop-shadow(0 0 10px ${m.color}aa) brightness(1.1)`
                  : 'brightness(0.75) saturate(0.7)',
                transition: 'filter 0.2s',
              }}>
                {m.icon}
              </span>
              <span style={{
                color: hov ? m.color : m.color + '88',
                fontSize: 5.5, fontFamily: PX, letterSpacing: 0.5,
                transition: 'color 0.2s',
              }}>
                {m.label.toUpperCase()}
              </span>
            </div>

            <div style={{
              width: 8,
              height: hov ? 32 : 24,
              background: hov
                ? `linear-gradient(to bottom, ${m.color}55, #2a1e0088)`
                : `linear-gradient(to bottom, #2a1e0088, #0f0a0088)`,
              transition: 'height 0.22s cubic-bezier(0.16,1,0.3,1), background 0.2s',
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Chest / Shop cards ────────────────────────────────────────────
const RARITY_FRAME_FILTER: Record<string, string> = {
  common: 'grayscale(1) brightness(0.65)',
  rare:   'sepia(1) saturate(4) hue-rotate(175deg) brightness(0.85)',
  epic:   'sepia(1) saturate(4) hue-rotate(245deg) brightness(0.9)',
}
const ELEM_FRAME_FILTER_MAP: Record<string, string> = {
  fire:      'sepia(1) saturate(5) hue-rotate(330deg) brightness(1.1)',
  water:     'sepia(1) saturate(4) hue-rotate(170deg)',
  physical:  'grayscale(1) brightness(0.65)',
  dark:      'sepia(1) saturate(4) hue-rotate(240deg) brightness(1.1)',
  lightning: 'sepia(1) saturate(3) brightness(1.25)',
  earth:     'sepia(1) saturate(2) hue-rotate(8deg) brightness(0.8)',
}

function ItemCardFace({ choice, color, cardHeight = 'clamp(200px, 42svh, 360px)' }: {
  choice: ChestOption; color: string; cardHeight?: string
}) {
  const isSpell     = choice.kind === 'spell'
  const badge       = isSpell
    ? 'ЗАКЛИНАНИЕ'
    : ({ common: 'ОБЫЧНЫЙ', rare: 'РЕДКИЙ', epic: 'ЭПИЧЕСКИЙ' }[(choice.data as GameItem).rarity] ?? '')
  const iconSrc     = isSpell ? spellIconSrc((choice.data as Spell).id) : itemIconSrc(choice.data.id)
  const frameSrc    = isSpell ? '/assets/spell_frame.png' : '/assets/item_frame.png'
  const frameFilter = isSpell
    ? (ELEM_FRAME_FILTER_MAP[(choice.data as Spell).element] ?? undefined)
    : RARITY_FRAME_FILTER[(choice.data as GameItem).rarity]

  return (
    <div
      className={s.card}
      style={{
        height: cardHeight,
        background: `linear-gradient(170deg, #090909 0%, ${color}16 55%, #060606 100%)`,
      }}
    >
      <div
        className={s.cardGlow}
        style={{ background: `radial-gradient(ellipse at 50% 40%, ${color}1c, transparent 60%)` }}
      />
      <div className={s.cardTop}>
        <div className={s.cardName} style={{ fontFamily: PX }}>{choice.data.name.toUpperCase()}</div>
        <div
          className={s.cardBadge}
          style={{ color, borderColor: `${color}55`, background: `${color}18`, fontFamily: PX }}
        >
          {badge}
        </div>
      </div>
      <div className={s.cardArt}>
        {iconSrc
          ? <img
              src={iconSrc} draggable={false} className={s.cardIcon}
              style={{ filter: `drop-shadow(0 0 18px ${color}bb)` }}
            />
          : <span
              className={s.cardEmoji}
              style={{ filter: `drop-shadow(0 0 14px ${color}99)` }}
            >
              {choice.data.icon}
            </span>
        }
      </div>
      <img src={frameSrc} draggable={false} className={s.cardFrame} style={{ filter: frameFilter }} />
    </div>
  )
}

// ── Desc panel ────────────────────────────────────────────────────
function DescPanel({ choice, color }: { choice: ChestOption | null; color: string }) {
  if (!choice) return <div className={s.descPanelEmpty} />
  const isSpell = choice.kind === 'spell'
  const tags    = !isSpell ? effectTags((choice.data as GameItem).effects) : []
  const flavor  = !isSpell
    ? (choice.data as GameItem).flavor
    : (choice.data as Spell).description

  return (
    <div className={s.descPanel} style={{ borderTop: `1px solid ${color}22`, fontFamily: PX }}>
      {tags.length > 0 && (
        <div className={s.descTags} style={{ marginBottom: flavor ? 6 : 0 }}>
          {tags.map((tag, i) => (
            <div key={i} className={tag.positive ? s.tagPos : s.tagNeg}>
              {tag.positive ? '▲' : '▼'} {tag.text}
            </div>
          ))}
        </div>
      )}
      {flavor && <div className={s.descFlavor}>"{flavor}"</div>}
      {!tags.length && !flavor && <div className={s.descNone}>—</div>}
    </div>
  )
}

// ── Shared carousel hook ──────────────────────────────────────────
function useItemCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', containScroll: false })
  const slideRefs = useRef<HTMLDivElement[]>([])

  const tweenScale = useCallback((api: EmblaCarouselType) => {
    const progress = api.scrollProgress()
    api.scrollSnapList().forEach((snap, i) => {
      const el = slideRefs.current[i]
      if (!el) return
      const scale = Math.max(0.82, 1 - Math.abs(progress - snap) * 0.22)
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

  return { emblaRef, emblaApi, slideRefs }
}

// ── Chest ─────────────────────────────────────────────────────────
function ChestGems({ choices, onChoose }: { choices: ChestOption[]; onChoose: (c: ChestOption) => void }) {
  const { emblaRef, emblaApi, slideRefs } = useItemCarousel()
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', () => setActiveIdx(emblaApi.selectedScrollSnap()))
  }, [emblaApi])

  const active      = choices[activeIdx] ?? null
  const activeColor = active
    ? (active.kind === 'spell'
        ? (ELEM_DISPLAY.find(e => e.key === (active.data as Spell).element)?.color ?? '#ffd700')
        : RARITY_COLOR[(active.data as GameItem).rarity])
    : '#888'

  return (
    <div className={s.chestOverlay} style={{ fontFamily: PX }}>
      {/* Art area */}
      <div className={s.chestArt}>
        <img
          src="/assets/ui/chest_art.png"
          draggable={false}
          className={s.chestArtImg}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className={s.chestArtFallback}>
          <span className={s.chestArtIcon}>🎁</span>
        </div>
        {/* ambient overlay */}
        <div className={s.chestArtGlow} style={{ background: `radial-gradient(ellipse at 50% 80%, ${activeColor}22, transparent 70%)` }} />
      </div>

      {/* Title strip */}
      <div className={s.chestTitleStrip}>
        <div className={s.chestTitleLine} />
        <span className={s.chestTitleText}>ВЫБЕРИ НАГРАДУ</span>
        <div className={s.chestTitleLine} />
      </div>

      {/* Carousel */}
      <div ref={emblaRef} className={s.viewport}>
        <div className={s.carouselTrack}>
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
                  if (emblaApi?.selectedScrollSnap() === idx) onChoose(choice)
                  else emblaApi?.scrollTo(idx)
                }}
              >
                <ItemCardFace choice={choice} color={color} cardHeight="clamp(160px, 30svh, 280px)" />
              </div>
            )
          })}
        </div>
      </div>

      <DescPanel choice={active} color={activeColor} />
    </div>
  )
}

// ── Shop ──────────────────────────────────────────────────────────
function ShopBoard({
  items, gold, rerollCost, onBuy, onReroll, onLeave, discount,
}: {
  items: ChestOption[]; gold: number; rerollCost: number; discount: number
  onBuy: (c: ChestOption) => void; onReroll: () => void; onLeave: () => void
}) {
  const { emblaRef, emblaApi, slideRefs } = useItemCarousel()
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', () => setActiveIdx(emblaApi.selectedScrollSnap()))
  }, [emblaApi])

  const selected  = items[activeIdx]
  const isSpell   = selected?.kind === 'spell'
  const itemColor = selected
    ? (isSpell
        ? (ELEM_DISPLAY.find(e => e.key === (selected.data as Spell).element)?.color ?? '#ffd700')
        : RARITY_COLOR[(selected.data as GameItem).rarity])
    : '#888'

  return (
    <div className={s.shopOverlay} style={{ fontFamily: PX }}>

      {/* Top: merchant portrait + gold/controls */}
      <div className={s.shopTop}>
        {/* Merchant art */}
        <div className={s.merchantArt}>
          <img
            src="/assets/ui/merchant_art.png"
            draggable={false}
            className={s.merchantArtImg}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className={s.merchantArtFallback}>🧙</div>
        </div>

        {/* Info panel: name + gold + reroll */}
        <div className={s.shopInfo}>
          <div className={s.shopName}>ТОРГОВЕЦ</div>
          <div className={s.shopGoldRow}>
            <div className={s.goldCoin} />
            <span className={s.goldVal} style={{ fontFamily: PX }}>{gold}</span>
          </div>
          <button
            disabled={gold < rerollCost}
            onClick={() => gold >= rerollCost && onReroll()}
            className={s.rerollBtn}
            style={{
              background:  gold >= rerollCost ? '#07131f' : '#0d0d0d',
              borderColor: gold >= rerollCost ? '#7dd3fc55' : '#1a1a1a',
              color:       gold >= rerollCost ? '#7dd3fc' : '#2a2a2a',
              boxShadow:   gold >= rerollCost ? '0 0 8px #7dd3fc11' : 'none',
              cursor:      gold >= rerollCost ? 'pointer' : 'not-allowed',
              fontFamily:  PX,
            }}
          >
            🔄 ОБНОВИТЬ · {rerollCost}
            <span className={s.rerollCoin}>💰</span>
          </button>
          <button className={s.leaveBtn} onClick={onLeave} style={{ fontFamily: PX }}>
            УЙТИ
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className={s.shopDivider}>
        <div className={s.shopDividerLine} />
        <span className={s.shopDividerText}>ТОВАРЫ</span>
        <div className={s.shopDividerLine} />
      </div>

      {/* Carousel */}
      {items.length === 0
        ? <div className={s.emptyShelf} style={{ fontFamily: PX }}>ПОЛКИ ПУСТЫ</div>
        : (
          <div ref={emblaRef} className={s.viewport}>
            <div className={s.carouselTrack}>
              {items.map((choice, idx) => {
                const isSp   = choice.kind === 'spell'
                const color  = isSp
                  ? (ELEM_DISPLAY.find(e => e.key === (choice.data as Spell).element)?.color ?? '#ffd700')
                  : RARITY_COLOR[(choice.data as GameItem).rarity]
                const bPrice = isSp ? SPELL_PRICE : SHOP_PRICE[(choice.data as GameItem).rarity]
                const p      = Math.max(1, bPrice - discount)
                const afford = gold >= p
                return (
                  <div
                    key={idx}
                    ref={el => { slideRefs.current[idx] = el! }}
                    className={s.slideShop}
                    onClick={() => {
                      if (emblaApi?.selectedScrollSnap() === idx && afford) onBuy(choice)
                      else emblaApi?.scrollTo(idx)
                    }}
                  >
                    <ItemCardFace choice={choice} color={color} cardHeight="clamp(160px, 28svh, 260px)" />
                    <div
                      className={s.priceTag}
                      style={{
                        background:  afford ? '#141000' : '#0d0d0d',
                        border:      `2px solid ${afford ? '#c8a80066' : '#1e1e1e'}`,
                        boxShadow:   afford ? '0 2px 0 #000, 0 0 6px #c8a80022' : '0 2px 0 #000',
                        fontFamily:  PX,
                      }}
                    >
                      <div className={s.goldCoinSm} style={{ opacity: afford ? 1 : 0.3 }} />
                      <span className={s.priceVal} style={{ color: afford ? '#ffd700' : '#444' }}>{p}</span>
                      {discount > 0 && !isSp && <span className={s.priceOld}>{bPrice}</span>}
                      {!afford && <span className={s.priceCantAfford}>ДОРОГО</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      <DescPanel choice={selected ?? null} color={itemColor} />
    </div>
  )
}

// ── Rest: two choices ─────────────────────────────────────────────
function RestChoice({
  healAmount, chargeAmount, onChoose,
}: {
  healAmount: number; chargeAmount: number
  onChoose: (type: 'heal' | 'charge') => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const options = [
    { id: 'heal',   icon: '💚', title: `+${healAmount} HP`,       desc: 'Восстановить здоровье',         color: '#4ade80' },
    { id: 'charge', icon: '🔮', title: `+${chargeAmount} заряд`,  desc: 'Перетащи заклинание к алтарю',  color: '#a78bfa' },
  ]

  return (
    <div className={s.restContainer}>
      {options.map((opt, idx) => {
        const hov = hovered === opt.id
        return (
          <div
            key={opt.id}
            onClick={() => onChoose(opt.id as 'heal' | 'charge')}
            onMouseEnter={() => setHovered(opt.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer', userSelect: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
              transform: hov ? 'translateY(-12px)' : 'none',
              transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1)',
              animation: `worldBob ${1.8 + idx * 0.3}s ease-in-out infinite alternate`,
            }}
          >
            <div
              className={s.restCard}
              style={{
                background: hov
                  ? `linear-gradient(160deg,#0a0718,#140f2a)`
                  : `linear-gradient(160deg,#06040f,#0c0a1c)`,
                border: `2px solid ${hov ? opt.color + 'dd' : opt.color + '44'}`,
                boxShadow: hov
                  ? `0 0 24px ${opt.color}55, 0 4px 0 #000, inset 0 0 20px ${opt.color}18`
                  : `0 3px 0 #000, inset 0 0 8px ${opt.color}08`,
              }}
            >
              <div
                className={s.restCardAccent}
                style={{ background: `linear-gradient(90deg,transparent,${opt.color}${hov ? 'cc' : '33'},transparent)` }}
              />
              <span style={{
                fontSize: 32,
                filter: hov ? `drop-shadow(0 0 10px ${opt.color}99)` : 'brightness(0.7)',
                transition: 'filter 0.18s',
              }}>
                {opt.icon}
              </span>
              <span className={s.restTitle} style={{ color: hov ? opt.color : opt.color + '99', fontFamily: PX }}>
                {opt.title}
              </span>
              <span className={s.restDesc} style={{ fontFamily: PX }}>{opt.desc}</span>
            </div>
            <div
              className={s.restCardShadow}
              style={{ background: `radial-gradient(ellipse,${opt.color}${hov ? '33' : '11'} 0%,transparent 70%)` }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Event effect preview label ────────────────────────────────────
function effectLabel(eff: import('@game/data/events').EventEffect): string {
  if (eff.type === 'gold')              return eff.amount >= 0 ? `+${eff.amount} 💰` : `${eff.amount} 💰`
  if (eff.type === 'hp')               return eff.amount >= 0 ? `+${eff.amount} HP` : `${eff.amount} HP`
  if (eff.type === 'maxHp')            return eff.amount >= 0 ? `+${eff.amount} макс.HP` : `${eff.amount} макс.HP`
  if (eff.type === 'item')             return `уник. предмет`
  if (eff.type === 'chargesAll')       return eff.amount >= 0 ? `+${eff.amount} заряды всем` : `${eff.amount} заряды всем`
  if (eff.type === 'chargesRandom')    return eff.amount >= 0 ? `+${eff.amount} заряды ×${eff.count}` : `${eff.amount} заряды ×${eff.count}`
  if (eff.type === 'restoreAllCharges') return `восст. все заряды`
  if (eff.type === 'removeRandomItem')  return `−1 случ. предмет`
  if (eff.type === 'spellDamageRandom') return eff.amount >= 0 ? `+${eff.amount} урон заклинанию` : `${eff.amount} урон заклинанию`
  if (eff.type === 'nothing')           return ''
  if (eff.type === 'multi')             return eff.effects.map(effectLabel).filter(Boolean).join(' · ')
  if (eff.type === 'gamble')            return `${Math.round(eff.chance * 100)}%: ${effectLabel(eff.win)} / ${Math.round((1 - eff.chance) * 100)}%: ${effectLabel(eff.lose)}`
  return ''
}

// ── Event: floating scroll ────────────────────────────────────────
function EventScroll({
  event, resolved, outcome, gold, playerHp, maxHp, hasItems, hasSpells, onChoice, onContinue,
}: {
  event: GameEvent; resolved: boolean; outcome: string
  gold: number; playerHp: number; maxHp: number
  hasItems: boolean; hasSpells: boolean
  onChoice: (c: EventChoice) => void; onContinue: () => void
}) {
  return (
    <div className={s.eventContainer}>
      <div className={s.scrollRodTop} />

      <div className={s.scrollBody}>
        <div className={s.scrollTitle}>
          <span className={s.scrollTitleIcon}>{event.icon}</span>
          <span className={s.scrollTitleText} style={{ fontFamily: PX }}>
            {event.title.toUpperCase()}
          </span>
        </div>

        <p className={s.scrollDesc} style={{ fontFamily: PX }}>{event.desc}</p>

        <div className={s.scrollChoices}>
          {!resolved ? (
            event.choices.map((choice, idx) => {
              const req           = choice.requires
              const meetsReq      = !req || (
                (req.minHp        === undefined || playerHp >= req.minHp) &&
                (req.minGold      === undefined || gold     >= req.minGold) &&
                (req.minHpPercent === undefined || (playerHp / maxHp) * 100 >= req.minHpPercent) &&
                (!req.hasItems    || hasItems) &&
                (!req.hasSpells   || hasSpells)
              )
              const canAffordGold = !choice.goldCost || gold >= choice.goldCost
              const canAffordHp   = !choice.hpCost   || playerHp > choice.hpCost
              const enabled       = meetsReq && canAffordGold && canAffordHp
              const isGamble      = choice.effect.type === 'gamble'
              const preview       = effectLabel(choice.effect)

              let lockReason = ''
              if (!meetsReq && req) {
                if (req.minHpPercent !== undefined) lockReason = `нужно ≥${req.minHpPercent}% HP`
                else if (req.minHp   !== undefined) lockReason = `нужно ≥${req.minHp} HP`
                else if (req.minGold !== undefined) lockReason = `нужно ≥${req.minGold} 💰`
                else if (req.hasItems)              lockReason = `нет предметов`
                else if (req.hasSpells)             lockReason = `нет заклинаний`
              } else if (!canAffordGold) lockReason = `нет 💰`
              else if (!canAffordHp)     lockReason = `мало HP`

              return (
                <button
                  key={idx}
                  className={s.choiceBtn}
                  onClick={() => enabled && onChoice(choice)}
                  disabled={!enabled}
                  style={{
                    background:    enabled ? '#12102a99' : '#0a0a1488',
                    borderColor:   enabled ? (isGamble ? '#f59e0baa' : '#a78bfaaa') : '#2a2a3a',
                    color:         enabled ? (isGamble ? '#fcd34d' : '#c4b5fd') : '#555',
                    cursor:        enabled ? 'pointer' : 'not-allowed',
                    opacity:       enabled ? 1 : 0.45,
                    fontFamily:    PX,
                  }}
                >
                  <div className={s.choiceBtnRow}>
                    <span>{enabled || !lockReason ? '▶' : '🔒'} {choice.text}</span>
                    <div className={s.choiceCosts}>
                      {choice.hpCost && (
                        <span className={s.costHp}>-{choice.hpCost} HP</span>
                      )}
                      {choice.goldCost && (
                        <span style={{
                          background: '#1a120088',
                          border: `1px solid ${enabled ? '#c8a800' : '#333'}`,
                          color: enabled ? '#ffd700' : '#444',
                          padding: '1px 6px', fontSize: 9,
                        }}>
                          💰{choice.goldCost}
                        </span>
                      )}
                    </div>
                  </div>
                  {(preview || lockReason) && (
                    <div
                      className={s.choicePreview}
                      style={{ color: lockReason ? '#ef4444aa' : isGamble ? '#fbbf2488' : '#a78bfa88' }}
                    >
                      {lockReason || preview}
                    </div>
                  )}
                </button>
              )
            })
          ) : (
            <div className={s.eventResolved}>
              {outcome && (
                <div
                  className={s.eventOutcome}
                  style={{
                    color: outcome.startsWith('✨') ? '#86efac'
                         : outcome.startsWith('💀') ? '#f87171'
                         : '#c4b5fd',
                    fontFamily: PX,
                  }}
                >
                  {outcome}
                </div>
              )}
              <button className={s.continueBtn} onClick={onContinue} style={{ fontFamily: PX }}>
                ПРОДОЛЖИТЬ →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={s.scrollRodBottom} />
      <div className={s.scrollGroundShadow} />
    </div>
  )
}

// ── Main WorldOverlay ─────────────────────────────────────────────
export function WorldOverlay({
  phase,
  pathChoices, onPathChoose,
  chestChoices, onChestChoose,
  shopItems, gold, rerollCost, onShopBuy, onReroll, onShopLeave, shopDiscount,
  event, eventResolved, eventOutcome, playerHp, effectiveMaxHp, ownedItems, handSize, onEventChoice, onEventContinue,
  restHealAmount, restChargeAmount, onRestChoice,
}: Props) {
  return (
    <>
      {/* Full-screen overlays: chest & shop */}
      {phase === 'chest' && chestChoices.length > 0 && (
        <ChestGems choices={chestChoices} onChoose={onChestChoose} />
      )}
      {phase === 'shop' && (
        <ShopBoard
          items={shopItems} gold={gold} rerollCost={rerollCost}
          onBuy={onShopBuy} onReroll={onReroll} onLeave={onShopLeave}
          discount={shopDiscount}
        />
      )}

      {/* Diegetic world elements: path, event, rest */}
      <div
        className={s.worldArea}
        style={{
          pointerEvents: (phase === 'path' || phase === 'event' || phase === 'rest') ? 'all' : 'none',
          opacity:       (phase === 'path' || phase === 'event' || phase === 'rest') ? 1 : 0,
        }}
      >
        {phase === 'path' && pathChoices.length > 0 && (
          <PathSigns choices={pathChoices} onChoose={onPathChoose} />
        )}
        {phase === 'event' && event && (
          <EventScroll
            event={event} resolved={eventResolved} outcome={eventOutcome}
            gold={gold} playerHp={playerHp} maxHp={effectiveMaxHp}
            hasItems={ownedItems.length > 0} hasSpells={handSize > 0}
            onChoice={onEventChoice} onContinue={onEventContinue}
          />
        )}
        {phase === 'rest' && (
          <RestChoice
            healAmount={restHealAmount} chargeAmount={restChargeAmount}
            onChoose={onRestChoice}
          />
        )}
      </div>
    </>
  )
}
