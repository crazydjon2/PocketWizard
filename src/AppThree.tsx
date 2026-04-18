import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import s from './AppThree.module.css'
import { toHandSpell } from '@game/data/spells'
import type { ClassDef } from '@game/data/classes'
import { pickEnemy } from '@game/data/enemies'
import { FOREST_BIOME } from '@game/biomes/forest'
import { ALL_EVENTS } from '@game/data/events'
import type { EventEffect } from '@game/data/events'
import { EVENT_ITEMS } from '@game/data/items'
import type { Spell, HandSpell } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { EnemyDef } from '@game/data/enemies'
import type { GameEvent, EventChoice } from '@game/data/events'
import type { Phase, PathType, AppPhase, ChestOption } from './types'
import { MAX_HP, HEAL_AMOUNT, REROLL_BASE, ENEMY_SPRITE_UV, ENEMY_SPRITE_UV_16, ENEMY_BASE_HEIGHT, PX, ELEM_DISPLAY } from './constants'
import {
  calcCardDamage, calcIncomingDamage,
  calcLifeSteal, calcSelfDamage, calcFireBurn, calcLightningChain,
  calcEarthArmorGain, calcDarkDrain, calcWaterKillHeal,
  calcDiversityBonus, calcMomentumBonus, calcElementCombo,
  calcFirstHitBonus, calcStreakBonus,
} from '@game/logic/combatCalc'
import { buildRewardPool, pickWeighted } from '@game/logic/rewardPool'
import { useThreeScene } from '@hooks/useThreeScene'
import { useCombatEffects } from '@hooks/useCombatEffects'
import { GameHUD } from '@ui/components/GameHUD'
import { CardHand } from '@ui/components/CardHand'
import { StatsPanel } from '@ui/components/StatsPanel'
import { EnemyInfoPanel } from '@ui/components/EnemyInfoPanel'
import { CombatOverlay } from '@ui/components/CombatOverlay'
import { ClassSelectScreen } from '@ui/screens/ClassSelectScreen'
import { WorldOverlay } from '@ui/components/WorldOverlay'
import { DraftScreen } from '@ui/components/DraftScreen'

// ── Utilities ─────────────────────────────────────────────────────
function tween(setter: (v: number) => void, from: number, to: number, ms: number) {
  return new Promise<void>(resolve => {
    const start = performance.now()
    const tick  = (now: number) => {
      const t = Math.min((now - start) / ms, 1)
      setter(from + (to - from) * t)
      t < 1 ? requestAnimationFrame(tick) : resolve()
    }
    requestAnimationFrame(tick)
  })
}

function buildDraftPool(n: number): PathType[] {
  const weighted: PathType[] = ['combat', 'combat', 'rest', 'event', 'shop']
  return Array.from({ length: n + 1 }, () => weighted[Math.floor(Math.random() * weighted.length)])
}

// ── App ───────────────────────────────────────────────────────────
export function App() {
  // ── Three.js / scene refs ──────────────────────────────────────
  const mountRef         = useRef<HTMLDivElement>(null)
  const cameraRef        = useRef<THREE.PerspectiveCamera | null>(null)
  const speedRef         = useRef(0)
  const movingRef        = useRef(false)
  const grassLeanYRef    = useRef(0)
  const grassSnapRef     = useRef(false)
  const stepCountRef     = useRef(0)
  const roadTexsRef      = useRef<THREE.Texture[]>([])
  const enemyMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const enemyMeshRef     = useRef<THREE.Mesh | null>(null)
  const enemyBaseScaleRef= useRef<[number, number]>([1.9, 3.0])
  const enemyHitRef        = useRef(false)
  const enemyAttackRef     = useRef(false)
  const enemyFramesRef     = useRef<1 | 4 | 16>(FOREST_BIOME.enemies[0].frames)
  const enemyIdleTexRef    = useRef<THREE.Texture | null>(null)
  const enemyAttackTexRef  = useRef<THREE.Texture | null>(null)
  const enemyDieRef        = useRef(false)
  const enemyReadyRef      = useRef(false)
  const isFirstHitRef      = useRef(true)  // reset per combat
  const lastElementRef     = useRef<string | null>(null) // for elementStreak
  const earthShieldRef     = useRef(0)    // flat reduction on next incoming hit (earthArmor)
  const momentumCountRef   = useRef(0)    // physical hits this fight (physicalMomentum)
  const usedElementsRef    = useRef(new Set<string>()) // unique elements this fight (elementDiversity)
  const enemyWeakenRef     = useRef(0)    // flat reduction on next enemy attack (weaken combo)

  // ── DOM refs ───────────────────────────────────────────────────
  const charInnerRef      = useRef<HTMLDivElement>(null)
  const screenFlashRef    = useRef<HTMLDivElement>(null)
  const floatContainerRef = useRef<HTMLDivElement>(null)

  // ── Stable read refs ──────────────────────────────────────────
  const startEnemy        = FOREST_BIOME.enemies[0]
  const currentEnemyRef   = useRef<EnemyDef>(startEnemy)
  const fightCountRef     = useRef(0)
  const effectiveMaxHpRef = useRef(MAX_HP)

  // ── Combat state ──────────────────────────────────────────────
  const [phase,        setPhase]        = useState<Phase>('choose')
  const [playerHp,     setPlayerHp]     = useState(MAX_HP)
  const [currentEnemy, setCurrentEnemy] = useState<EnemyDef>(startEnemy)
  const [enemyHp,      setEnemyHp]      = useState(startEnemy.hp)
  const [fightCount,   setFightCount]   = useState(0)
  const [stepCount,    setStepCount]    = useState(0)
  const [pathChoices,  setPathChoices]  = useState<PathType[]>([])
  const [draftPool,    setDraftPool]    = useState<PathType[]>([])
  const [draftN,       setDraftN]       = useState(3)
  const upcomingPathsRef = useRef<PathType[]>([])
  const [showStats,    setShowStats]    = useState(false)
  const [showEnemyInfo, setShowEnemyInfo] = useState(false)

  // ── Spell / item / progression state ──────────────────────────
  const [appPhase,       setAppPhase]       = useState<AppPhase>('menu')
  const [baseMaxHp,      setBaseMaxHp]      = useState(MAX_HP)
  const [classDmgBonus,  setClassDmgBonus]  = useState<import('@game/data/classes').ElemStat[]>([])
  const [classResist,    setClassResist]    = useState<import('@game/data/classes').ElemStat[]>([])
  const [hand,           setHand]           = useState<HandSpell[]>([])
  const [ownedItems,     setOwnedItems]     = useState<GameItem[]>([])
  const [gold,           setGold]           = useState(0)
  const [hitStreak,      setHitStreak]      = useState(0)
  const [chestChoices,   setChestChoices]   = useState<ChestOption[]>([])
  const [shopItems,      setShopItems]      = useState<ChestOption[]>([])
  const [rerollCost,     setRerollCost]     = useState(REROLL_BASE)
  const [currentEvent,      setCurrentEvent]      = useState<GameEvent | null>(null)
  const [eventResolved,     setEventResolved]     = useState(false)
  const [eventOutcome,      setEventOutcome]      = useState<string>('')
  const [permanentHpBonus,  setPermanentHpBonus]  = useState(0)

  // ── Derived / ref sync ────────────────────────────────────────
  const effectiveMaxHp = Math.max(1, baseMaxHp + permanentHpBonus + ownedItems
    .flatMap(i => i.effects)
    .filter(e => e.type === 'maxHp')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'maxHp' }>).amount, 0))
  effectiveMaxHpRef.current = effectiveMaxHp
  currentEnemyRef.current   = currentEnemy
  fightCountRef.current     = fightCount
  stepCountRef.current      = stepCount

  // ── Enemy texture swap ────────────────────────────────────────
  useEffect(() => {
    const mat = enemyMaterialRef.current
    if (!mat) return
    const loader = new THREE.TextureLoader()
    const t = loader.load(currentEnemy.sprite)
    t.colorSpace = THREE.SRGBColorSpace
    if (currentEnemy.frames === 4) {
      t.repeat.set(0.5, 0.5)
      t.offset.set(...ENEMY_SPRITE_UV[0])
    } else if (currentEnemy.frames === 16) {
      t.repeat.set(0.25, 0.25)
      t.offset.set(0, 0.75)
    } else {
      t.repeat.set(1, 1)
      t.offset.set(0, 0)
    }
    mat.map = t
    mat.color.setHex(currentEnemy.tint ?? 0xffffff)
    mat.needsUpdate = true
    enemyIdleTexRef.current = t
    if (currentEnemy.attackSprite) {
      const atk = loader.load(currentEnemy.attackSprite)
      atk.colorSpace = THREE.SRGBColorSpace
      atk.repeat.set(0.25, 0.25)
      atk.offset.set(...ENEMY_SPRITE_UV_16[0])
      enemyAttackTexRef.current = atk
    } else {
      enemyAttackTexRef.current = null
    }
    enemyFramesRef.current = currentEnemy.frames
    const [fw, fh] = currentEnemy.framePx
    const rs = currentEnemy.renderScale ?? 1.0
    const h = ENEMY_BASE_HEIGHT * rs; const w = h * fw / fh
    enemyBaseScaleRef.current = [w, h]
    if (enemyMeshRef.current) {
      enemyMeshRef.current.scale.set(w, h, 1)
      enemyMeshRef.current.position.y = h / 2
    }
  }, [currentEnemy])

  // ── Hooks ─────────────────────────────────────────────────────
  useThreeScene({
    mountRef, cameraRef, speedRef, movingRef, grassLeanYRef, grassSnapRef,
    stepCountRef, roadTexsRef,
    enemyMaterialRef, enemyMeshRef, enemyBaseScaleRef,
    enemyHitRef, enemyAttackRef, enemyFramesRef,
    enemyAttackTexRef, enemyIdleTexRef, enemyDieRef, enemyReadyRef,
  })

  const { showFloat } = useCombatEffects({
    floatContainerRef, charInnerRef, screenFlashRef,
  })

  // ── Death detection ───────────────────────────────────────────
  useEffect(() => {
    if (playerHp <= 0 && appPhase === 'playing') {
      const t = setTimeout(() => setAppPhase('gameOver'), 700)
      return () => clearTimeout(t)
    }
  }, [playerHp, appPhase])

  // ── Restart ───────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    const se = FOREST_BIOME.enemies[0]
    setPlayerHp(MAX_HP)
    setGold(0)
    setHand([])
    setOwnedItems([])
    setHitStreak(0)
    setFightCount(0)
    setStepCount(0)
    setCurrentEnemy(se)
    setEnemyHp(se.hp)
    setPhase('choose')
    setPathChoices([])
    setChestChoices([])
    setShopItems([])
    setRerollCost(REROLL_BASE)
    setCurrentEvent(null)
    setEventResolved(false)
    setEventOutcome('')
    setPermanentHpBonus(0)
    setBaseMaxHp(MAX_HP)
    enemyReadyRef.current = false
    setAppPhase('menu')
  }, [])

  // ── Reward pool helpers ───────────────────────────────────────
  // ref-мост: позволяет nextFromQueue вызывать handlePathChoice без circular dep
  const handlePathChoiceRef = useRef<((path: PathType) => void) | null>(null)

  const generateDraft = useCallback(() => {
    const n = 3 // TODO: scale with biome/difficulty
    setDraftN(n)
    setDraftPool(buildDraftPool(n))
    setPhase('draft')
  }, [])

  const nextFromQueue = useCallback(() => {
    const queue = upcomingPathsRef.current
    if (queue.length > 0) {
      const [next, ...rest] = queue
      upcomingPathsRef.current = rest
      handlePathChoiceRef.current?.(next)
    } else {
      generateDraft()
    }
  }, [generateDraft])

  const handleDraftConfirm = useCallback((ordered: PathType[]) => {
    const [first, ...rest] = ordered
    upcomingPathsRef.current = rest
    handlePathChoiceRef.current?.(first)
  }, [])

  const openChest = useCallback(() => {
    const extraChoices = ownedItems.filter(i => i.effects.some(e => e.type === 'moreChoices')).length
    const pool = buildRewardPool(hand)
    setChestChoices(pickWeighted(pool, 3 + extraChoices))
    setPhase('chest')
  }, [ownedItems, hand])

  const handleChestChoice = useCallback((choice: ChestOption) => {
    if (choice.kind === 'spell') {
      setHand(prev => [...prev, toHandSpell(choice.data as Spell)])
    } else {
      const item = choice.data as GameItem
      setOwnedItems(prev => {
        const next = [...prev, item]
        const newMax = Math.max(1, MAX_HP + next
          .flatMap(i => i.effects)
          .filter(e => e.type === 'maxHp')
          .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'maxHp' }>).amount, 0))
        setPlayerHp(h => Math.min(h, newMax))
        return next
      })
    }
    nextFromQueue()
  }, [nextFromQueue])

  const buildShopPool = useCallback(() =>
    pickWeighted(buildRewardPool(hand), 4),
  [hand])

  const openShop = useCallback(() => {
    setShopItems(buildShopPool())
    setRerollCost(REROLL_BASE)
    setPhase('shop')
  }, [buildShopPool])

  const handleReroll = useCallback(() => {
    setGold(g => g - rerollCost)
    setRerollCost(c => c + 10)
    setShopItems(buildShopPool())
  }, [rerollCost, buildShopPool])

  const shopDiscount = ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'shopDiscount')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'shopDiscount' }>).amount, 0)

  const handleShopBuy = useCallback((choice: ChestOption) => {
    const basePrice = choice.kind === 'spell'
      ? 25
      : { common: 12, rare: 28, epic: 55 }[(choice.data as GameItem).rarity]
    const price = Math.max(1, basePrice - shopDiscount)
    setGold(g => g - price)
    if (choice.kind === 'spell') {
      setHand(prev => [...prev, toHandSpell(choice.data as Spell)])
    } else {
      const item = choice.data as GameItem
      setOwnedItems(prev => {
        const next = [...prev, item]
        const newMax = Math.max(1, MAX_HP + next
          .flatMap(i => i.effects)
          .filter(e => e.type === 'maxHp')
          .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'maxHp' }>).amount, 0))
        setPlayerHp(h => Math.min(h, newMax))
        return next
      })
    }
    setShopItems(prev => prev.filter(c => c.data.id !== choice.data.id))
    showFloat('🛒 Куплено!', '#fbbf24')
  }, [showFloat])

  const openEvent = useCallback(() => {
    setCurrentEvent(ALL_EVENTS[Math.floor(Math.random() * ALL_EVENTS.length)])
    setEventResolved(false)
    setEventOutcome('')
    setPhase('event')
  }, [])

  const applyEventEffect = useCallback((eff: EventEffect) => {
    if (eff.type === 'gold') {
      setGold(g => g + eff.amount)
      showFloat(eff.amount >= 0 ? `+${eff.amount} 💰` : `${eff.amount} 💰`, eff.amount >= 0 ? '#fbbf24' : '#ef4444')
    } else if (eff.type === 'hp') {
      setPlayerHp(h => Math.min(effectiveMaxHpRef.current, Math.max(1, h + eff.amount)))
      showFloat(eff.amount >= 0 ? `+${eff.amount} HP` : `${eff.amount} HP`, eff.amount >= 0 ? '#4ade80' : '#ef4444')
    } else if (eff.type === 'maxHp') {
      setPermanentHpBonus(b => b + eff.amount)
      showFloat(eff.amount >= 0 ? `+${eff.amount} макс.HP` : `${eff.amount} макс.HP`, eff.amount >= 0 ? '#a78bfa' : '#f87171')
    } else if (eff.type === 'item') {
      const item = EVENT_ITEMS.find(i => i.id === eff.itemId)
      if (item) {
        setOwnedItems(prev => [...prev, item])
        showFloat(`+ ${item.name}`, '#ffd700')
      }
    } else if (eff.type === 'chargesAll') {
      setHand(prev => prev.map(s => s.infinite ? s : {
        ...s,
        charges: Math.max(0, Math.min(s.maxCharges ?? 3, s.charges + eff.amount)),
      }))
      showFloat(eff.amount >= 0 ? `+${eff.amount} заряды` : `${eff.amount} заряды`, eff.amount >= 0 ? '#60a5fa' : '#f87171')
    } else if (eff.type === 'chargesRandom') {
      setHand(prev => {
        const eligible = prev.filter(s => !s.infinite)
        const targets = [...eligible].sort(() => Math.random() - 0.5).slice(0, eff.count)
        const targetIds = new Set(targets.map(s => s.instanceId))
        return prev.map(s => targetIds.has(s.instanceId) ? {
          ...s,
          charges: Math.max(0, Math.min(s.maxCharges ?? 3, s.charges + eff.amount)),
        } : s)
      })
      showFloat(eff.amount >= 0 ? `+${eff.amount} заряды` : `${eff.amount} заряды`, eff.amount >= 0 ? '#60a5fa' : '#f87171')
    } else if (eff.type === 'restoreAllCharges') {
      setHand(prev => prev.map(s => s.infinite ? s : { ...s, charges: s.maxCharges ?? 3 }))
      showFloat('заряды восполнены', '#60a5fa')
    } else if (eff.type === 'removeRandomItem') {
      setOwnedItems(prev => {
        if (prev.length === 0) return prev
        const idx = Math.floor(Math.random() * prev.length)
        showFloat(`- ${prev[idx].name}`, '#f87171')
        return prev.filter((_, i) => i !== idx)
      })
    } else if (eff.type === 'spellDamageRandom') {
      setHand(prev => {
        const eligible = prev.filter(s => !s.infinite)
        if (eligible.length === 0) return prev
        const target = eligible[Math.floor(Math.random() * eligible.length)]
        showFloat(eff.amount >= 0 ? `+${eff.amount} урон: ${target.name}` : `${eff.amount} урон: ${target.name}`, eff.amount >= 0 ? '#f59e0b' : '#f87171')
        return prev.map(s => s.instanceId === target.instanceId
          ? { ...s, baseDamage: Math.max(1, s.baseDamage + eff.amount) }
          : s)
      })
    } else if (eff.type === 'multi') {
      eff.effects.forEach(e => applyEventEffect(e))
    } else if (eff.type === 'gamble') {
      const won = Math.random() < eff.chance
      applyEventEffect(won ? eff.win : eff.lose)
    }
  }, [showFloat])

  const handleEventChoice = useCallback((choice: EventChoice) => {
    if (choice.goldCost) setGold(g => g - choice.goldCost!)
    if (choice.hpCost)   setPlayerHp(h => Math.max(1, h - choice.hpCost!))
    // build outcome text before applying (gamble needs its own resolution)
    let outcomeText = choice.text
    const eff = choice.effect
    if (eff.type === 'gamble') {
      const won = Math.random() < eff.chance
      outcomeText = won ? `✨ Удача! ${eff.win.type !== 'nothing' ? '' : 'Ничего не случилось.'}` : `💀 Неудача!`
      applyEventEffect(won ? eff.win : eff.lose)
    } else {
      applyEventEffect(eff)
    }
    setEventOutcome(outcomeText)
    setEventResolved(true)
  }, [applyEventEffect])

  const closeEvent = useCallback(() => {
    setCurrentEvent(null)
    nextFromQueue()
  }, [nextFromQueue])

  // ── Rest amounts (base + item bonuses) ─────────────────────────
  const restChargeAmount = 1 + ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'restChargeBonus')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'restChargeBonus' }>).amount, 0)

  // ── Card play ─────────────────────────────────────────────────
  const handlePlayCard = useCallback((card: HandSpell) => {
    // ── Rest: restore spell charge ─────────────────────────────────
    if (phase === 'rest_charge') {
      if (card.infinite) return
      setHand(prev => prev.map(c =>
        c.instanceId === card.instanceId
          ? { ...c, charges: Math.min(c.maxCharges ?? 3, c.charges + restChargeAmount) }
          : c
      ))
      showFloat(`+${restChargeAmount} заряд`, '#a78bfa')
      nextFromQueue()
      return
    }

    if (phase !== 'choose' || appPhase !== 'playing') return

    // ── Charge preserve chance ────────────────────────────────────
    const preserveChance = Math.min(0.8, ownedItems.flatMap(i => i.effects)
      .filter(e => e.type === 'chargePreserve')
      .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'chargePreserve' }>).chance, 0))
    const preserved = !card.infinite && Math.random() < preserveChance

    if (!card.infinite && !preserved) {
      setHand(prev => prev
        .map(h => h.instanceId === card.instanceId ? { ...h, charges: h.charges - 1 } : h)
        .filter(h => h.charges > 0)
      )
    } else if (preserved) {
      showFloat('✨ Заряд сохранён', '#a78bfa')
    }

    // ── First hit bonus ───────────────────────────────────────────
    const isFirst = isFirstHitRef.current
    if (isFirst) isFirstHitRef.current = false
    const firstBonus = calcFirstHitBonus(ownedItems, isFirst, card.infinite ?? false)

    // ── Element streak ────────────────────────────────────────────
    const prevElement = !card.infinite ? lastElementRef.current : null
    if (!card.infinite) lastElementRef.current = card.element
    const streakBonus = calcStreakBonus(ownedItems, prevElement, card.element, card.infinite ?? false)

    // ── Element diversity ─────────────────────────────────────────
    if (!card.infinite) usedElementsRef.current.add(card.element)
    const diversityBonus = calcDiversityBonus(ownedItems, usedElementsRef.current, card.infinite ?? false)

    // ── Physical momentum ─────────────────────────────────────────
    const momentumBonus = calcMomentumBonus(ownedItems, card.element, momentumCountRef.current, card.infinite ?? false)
    if (!card.infinite && card.element === 'physical') momentumCountRef.current += 1

    // ── Element combo (damage part) ───────────────────────────────
    const combos      = calcElementCombo(ownedItems, prevElement, card.element, card.infinite ?? false)
    const comboDmgBonus = combos.filter(c => c!.effect === 'damage').reduce((s, c) => s + c!.amount, 0)
    if (comboDmgBonus > 0) showFloat(`✨ Комбо!`, '#c084fc')

    const baseDmg = calcCardDamage(card, ownedItems, playerHp, effectiveMaxHpRef.current, currentEnemyRef.current, card.charges, gold)
    let dmg       = baseDmg + firstBonus + streakBonus + momentumBonus + diversityBonus + comboDmgBonus

    // ── Lightning chain ───────────────────────────────────────────
    const chainDmg = calcLightningChain(ownedItems, dmg, card.element, Math.random())
    // ── Fire burn ─────────────────────────────────────────────────
    const burnDmg  = calcFireBurn(ownedItems, dmg, card.element)

    const totalDmg   = dmg + chainDmg + burnDmg
    const newEnemyHp = Math.max(0, enemyHp - totalDmg)

    setEnemyHp(newEnemyHp)
    showFloat(`⚔️ −${dmg}`, '#fbbf24')
    if (chainDmg > 0) showFloat(`⚡ Цепь −${chainDmg}`, '#facc15')
    if (burnDmg  > 0) showFloat(`🔥 Поджог −${burnDmg}`,  '#f97316')
    if (momentumBonus > 0) showFloat(`💪 +${momentumBonus} импульс`, '#fb923c')
    enemyHitRef.current = true

    // ── Life steal ────────────────────────────────────────────────
    const lifeSteal = calcLifeSteal(ownedItems)
    if (lifeSteal > 0) {
      setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + lifeSteal))
      showFloat(`🩸 +${lifeSteal} HP`, '#f472b6')
    }

    // ── Dark drain ────────────────────────────────────────────────
    const darkHeal = calcDarkDrain(ownedItems, dmg, card.element)
    if (darkHeal > 0) {
      setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + darkHeal))
      showFloat(`🌑 +${darkHeal} HP`, '#a855f7')
    }

    // ── Earth armor ───────────────────────────────────────────────
    const armorGain = calcEarthArmorGain(ownedItems, card.element)
    if (armorGain > 0) {
      earthShieldRef.current += armorGain
      showFloat(`🪨 Щит +${armorGain}`, '#84cc16')
    }

    // ── Element combo (heal / shield / weaken) ────────────────────
    for (const combo of combos.filter(c => c!.effect !== 'damage')) {
      const ec = combo!
      if (ec.effect === 'heal') {
        setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + ec.amount))
        showFloat(`💚 Комбо +${ec.amount} HP`, '#4ade80')
      } else if (ec.effect === 'shield') {
        earthShieldRef.current += ec.amount
        showFloat(`🔮 Комбо щит +${ec.amount}`, '#818cf8')
      } else if (ec.effect === 'weaken') {
        enemyWeakenRef.current += ec.amount
        showFloat(`💨 Ослаблен −${ec.amount}`, '#94a3b8')
      }
    }

    const newStreak = hitStreak + 1
    setHitStreak(newStreak)
    const healItemBase = ownedItems.find(i => i.effects.some(e => e.type === 'healStreak'))
    const healEffect   = healItemBase
      ? healItemBase.effects.find(e => e.type === 'healStreak') as Extract<ItemEffect, { type: 'healStreak' }>
      : undefined
    if (healEffect && newStreak % healEffect.count === 0) {
      setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + healEffect.hp))
      showFloat(`💎 +${healEffect.hp} HP`, '#a78bfa')
    }

    if (newEnemyHp <= 0) {
      // ── Water kill heal ───────────────────────────────────────
      const killHeal = calcWaterKillHeal(ownedItems, card.element, true)
      if (killHeal > 0) {
        setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + killHeal))
        showFloat(`💧 +${killHeal} HP`, '#38bdf8')
      }
      const bonusGold = ownedItems.flatMap(i => i.effects)
        .filter(e => e.type === 'goldBonus')
        .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'goldBonus' }>).amount, 0)
      const earned = currentEnemyRef.current.goldReward + bonusGold
      setGold(g => g + earned)
      showFloat(`🏆 +${earned}💰`, '#fbbf24')
      setHitStreak(0)
      enemyDieRef.current   = true
      enemyReadyRef.current = false
      setTimeout(() => openChest(), 800)
      return
    }

    const selfDmg = calcSelfDamage(ownedItems)
    if (selfDmg > 0) {
      setPlayerHp(h => Math.max(0, h - selfDmg))
      showFloat(`💀 −${selfDmg}`, '#a855f7')
    }

    // Enemy counter-attack (automatic)
    setPhase('waiting')
    setTimeout(() => { enemyAttackRef.current = true }, 400)
    setTimeout(() => {
      const shield = earthShieldRef.current
      const weaken = enemyWeakenRef.current
      earthShieldRef.current = 0
      enemyWeakenRef.current = 0
      const raw = calcIncomingDamage(ownedItems, currentEnemyRef.current.damage, currentEnemyRef.current.element)
      const dmg = Math.max(1, raw - shield - weaken)
      if (shield > 0) showFloat(`🪨 −${shield} щит`, '#84cc16')
      if (weaken > 0) showFloat(`💨 −${weaken} ослаблен`, '#94a3b8')
      setPlayerHp(h => Math.max(0, h - dmg))
      showFloat(`🗡️ −${dmg}`, '#ef4444')
      setTimeout(() => setPhase('choose'), 700)
    }, 900)
  }, [phase, appPhase, ownedItems, playerHp, enemyHp, hitStreak, gold, openChest, showFloat, restChargeAmount, nextFromQueue])

  const handlePathChoice = useCallback((path: PathType) => {
    setPhase('walking')
    movingRef.current = true
    tween(v => { speedRef.current = v }, 0, 4, 1200)
      .then(() => tween(v => { speedRef.current = v }, 4, 0, 1400))
      .then(() => {
        movingRef.current = false
        const nextStep = stepCountRef.current + 1
        stepCountRef.current = nextStep
        setStepCount(nextStep)

        // ── Regen per room ─────────────────────────────────────────
        const regen = ownedItems.flatMap(i => i.effects)
          .filter(e => e.type === 'regenPerRoom')
          .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'regenPerRoom' }>).amount, 0)
        if (regen > 0) {
          setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + regen))
          showFloat(`💓 +${regen} HP`, '#4ade80')
        }

        if (path === 'combat') {
          const nextCount = fightCountRef.current + 1
          setFightCount(nextCount)
          const nextEnemy = pickEnemy(nextCount, FOREST_BIOME.enemies)
          setCurrentEnemy(nextEnemy)
          currentEnemyRef.current = nextEnemy
          setEnemyHp(nextEnemy.hp)
          enemyReadyRef.current = true
          isFirstHitRef.current = true
          lastElementRef.current = null
          earthShieldRef.current = 0
          momentumCountRef.current = 0
          usedElementsRef.current = new Set()
          enemyWeakenRef.current = 0
          setPhase('choose')
        } else if (path === 'rest') {
          setPhase('rest')
        } else if (path === 'shop') {
          openShop()
        } else {
          openEvent()
        }
      })
  }, [ownedItems, showFloat, openShop, openEvent])

  handlePathChoiceRef.current = handlePathChoice

  // ── Rest amounts (base + item bonuses) ─────────────────────────
  const restHealAmount   = HEAL_AMOUNT + ownedItems.flatMap(i => i.effects)
    .filter(e => e.type === 'restHealBonus')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'restHealBonus' }>).amount, 0)

  const handleRestChoice = useCallback((type: 'heal' | 'charge') => {
    if (type === 'heal') {
      setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + restHealAmount))
      showFloat(`+${restHealAmount} HP`, '#4ade80')
      nextFromQueue()
    } else {
      // Switch to drag-to-altar phase — player drags a card to restore its charge
      setPhase('rest_charge')
    }
  }, [restHealAmount, showFloat, nextFromQueue])

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={s.root}>
    <div className={s.container} style={{ fontFamily: PX }}>
      {/* Three.js canvas */}
      <div
        ref={mountRef}
        className={s.canvas}
        onClick={e => {
          const mesh = enemyMeshRef.current
          const cam  = cameraRef.current
          const el   = mountRef.current
          if (!mesh || !cam || !el || showEnemyInfo) return
          const rect = el.getBoundingClientRect()
          const x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1
          const y = -((e.clientY - rect.top)   / rect.height) * 2 + 1
          const ray = new THREE.Raycaster()
          ray.setFromCamera(new THREE.Vector2(x, y), cam)
          if (ray.intersectObject(mesh, true).length > 0) setShowEnemyInfo(true)
        }}
      />

      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      {appPhase === 'playing' && (
        <GameHUD
          gold={gold} stepCount={stepCount} hitStreak={hitStreak}
          playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
          onStats={() => setShowStats(true)}
        />
      )}

      {appPhase === 'playing' && (<>
        {/* ── FRAME: side vignette + edge fill ─────────────────────── */}
        <div className={s.frame} />

        {/* ── GAME FRAME overlay ────────────────────────────────────── */}
        {/* <img
          src="/assets/game_frame.png"
          draggable={false}
          className={s.gameFrame}
          style={{ filter: FOREST_BIOME.frameFilter }}
        /> */}

        {/* ── BOTTOM PANEL: textured dark base ──────────────────────── */}
        <div className={s.bottomPanel} />
      </>)}

      {/* ── ENEMY INFO: icon + name + HP numbers ──────────────────── */}
      {appPhase === 'playing' && (phase === 'choose' || phase === 'waiting') && (() => {
        const attacking = phase === 'waiting'
        const elem = ELEM_DISPLAY.find(e => e.key === currentEnemy.element)
        return (
          <>
            {/* Name + HP — purely visual, no pointer events */}
            <div
              className={s.enemyLabel}
              style={{
                fontFamily: PX,
                filter: attacking ? 'drop-shadow(0 0 10px #f04545bb)' : 'none',
              }}
            >
              <div className={s.enemyNameRow}>
                <span className={s.enemyElemIcon}>{elem?.icon ?? '👾'}</span>
                <span style={{
                  color: attacking ? '#ff8888' : '#f06060',
                  fontSize: 5, letterSpacing: 1,
                  textShadow: '1px 1px 0 #000, 0 0 10px #000',
                }}>
                  {currentEnemy.name.toUpperCase()}
                </span>
              </div>
              <div
                className={s.enemyHpBox}
                style={{ border: `1px solid ${attacking ? '#f0454566' : '#f0454522'}` }}
              >
                <span style={{ color: attacking ? '#ffaaaa' : '#ff7777', fontSize: 10 }}>
                  {enemyHp}
                </span>
                <span style={{ color: '#5a3838', fontSize: 7 }}>·</span>
                <span style={{ color: '#8a6060', fontSize: 8 }}>{currentEnemy.hp}</span>
              </div>
            </div>
          </>
        )
      })()}

      {/* ── CARD HAND: full-width bottom panel ────────────────────── */}
      {appPhase === 'playing' && (
        <div className={s.cardHandSlot}>
          <CardHand
            hand={hand} phase={phase} onPlayCard={handlePlayCard}
            ownedItems={ownedItems} gold={gold}
            playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
            currentEnemy={currentEnemy}
          />
        </div>
      )}

      {/* ── WORLD OVERLAY: diegetic path/chest/shop/event ─────────── */}
      {appPhase === 'playing' && (
        <WorldOverlay
          phase={phase}
          pathChoices={pathChoices}     onPathChoose={handlePathChoice}
          chestChoices={chestChoices}   onChestChoose={handleChestChoice}
          shopItems={shopItems}         gold={gold}  rerollCost={rerollCost}
          onShopBuy={handleShopBuy}     onReroll={handleReroll}   shopDiscount={shopDiscount}
          onShopLeave={nextFromQueue}
          event={currentEvent}          eventResolved={eventResolved}   eventOutcome={eventOutcome}
          playerHp={playerHp}          effectiveMaxHp={effectiveMaxHp}
          ownedItems={ownedItems}       handSize={hand.length}
          onEventChoice={handleEventChoice} onEventContinue={closeEvent}
          restHealAmount={restHealAmount}   restChargeAmount={restChargeAmount}
          onRestChoice={handleRestChoice}
        />
      )}

      {/* Draft overlay */}
      {appPhase === 'playing' && phase === 'draft' && (
        <DraftScreen
          pool={draftPool}
          slotCount={draftN}
          onConfirm={handleDraftConfirm}
        />
      )}

      {/* Stats modal */}
      {showStats && (
        <StatsPanel
          playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
          gold={gold} hitStreak={hitStreak}
          ownedItems={ownedItems}
          classDmgBonus={classDmgBonus}
          classResist={classResist}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Enemy info modal — open by tapping enemy */}
      {showEnemyInfo && (
        <EnemyInfoPanel
          enemy={currentEnemy} enemyHp={enemyHp}
          flatDef={ownedItems.flatMap(i => i.effects)
            .filter(e => e.type === 'flatDefense')
            .reduce((s, e) => s + (e as import('@game/data/items').ItemEffect & { type: 'flatDefense'; amount: number }).amount, 0)}
          onClose={() => setShowEnemyInfo(false)}
        />
      )}

      {/* Combat effects (flash, floats, char anim) */}
      <CombatOverlay
        floatContainerRef={floatContainerRef}
        screenFlashRef={screenFlashRef}
        charInnerRef={charInnerRef}
      />

      {/* ── MAIN MENU ─────────────────────────────────────────────── */}
      {appPhase === 'menu' && (
        <div className={s.menu} style={{ fontFamily: PX }}>
          <div className={s.menuVignette} />

          <div className={s.menuTitle}>
            <div className={s.menuSubtitle}>— ROGUELIKE —</div>
            <div className={s.menuHeading}>DUNGEON PATH</div>
            <div className={s.menuDivider} />
          </div>

          <div className={s.menuDots}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: i === 1 ? 8 : 5, height: i === 1 ? 8 : 5,
                background: i === 1 ? '#c8a80088' : '#c8a80033',
              }} />
            ))}
          </div>

          <button
            onClick={() => setAppPhase('spellSelect')}
            className={s.menuStartBtn}
            style={{ fontFamily: PX }}
            onMouseEnter={e => {
              const b = e.currentTarget
              b.style.borderColor = '#c8a800cc'
              b.style.color = '#ffd700'
              b.style.boxShadow = '0 0 20px #c8a80055'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget
              b.style.borderColor = '#c8a80066'
              b.style.color = '#c8a800'
              b.style.boxShadow = '0 0 12px #c8a80022'
            }}
          >
            НАЧАТЬ ИГРУ
          </button>
        </div>
      )}

      {/* Class selection (game start) */}
      {appPhase === 'spellSelect' && (
        <ClassSelectScreen
          onSelect={(cls: ClassDef) => {
            setHand(cls.spells.map(toHandSpell))
            setBaseMaxHp(cls.startingHp)
            setPlayerHp(cls.startingHp)
            setClassDmgBonus(cls.dmgBonus)
            setClassResist(cls.resist)
            setAppPhase('playing')
            generateDraft()
          }}
        />
      )}

      {/* ── GAME OVER ─────────────────────────────────────────────── */}
      {appPhase === 'gameOver' && (
        <div className={s.gameOver} style={{ fontFamily: PX }}>
          <div className={s.gameOverVignette} />

          <div className={s.gameOverTitle}>
            <div className={s.gameOverHeading}>GAME OVER</div>
            <div className={s.gameOverDivider} />
          </div>

          <div className={s.gameOverStats}>
            {[
              { label: 'ВРАГОВ ПОВЕРЖЕНО', value: fightCount },
              { label: 'ШАГОВ ПРОЙДЕНО',  value: stepCount  },
              { label: 'ЗОЛОТО',           value: gold       },
            ].map(({ label, value }) => (
              <div key={label} className={s.gameOverStatRow}>
                <span className={s.gameOverStatLabel}>{label}</span>
                <span className={s.gameOverStatVal}>{value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleRestart}
            className={s.gameOverBtn}
            style={{ fontFamily: PX }}
            onMouseEnter={e => {
              const b = e.currentTarget
              b.style.borderColor = '#f04545cc'
              b.style.color = '#ff6666'
              b.style.boxShadow = '0 0 20px #f0454555'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget
              b.style.borderColor = '#f0454566'
              b.style.color = '#f04545'
              b.style.boxShadow = '0 0 12px #f0454522'
            }}
          >
            ЗАНОВО
          </button>
        </div>
      )}


      {/* Global CSS animations */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-48px); }
        }
        @keyframes charAttack {
          0%   { transform: scale(1)    translateY(0); }
          22%  { transform: scale(1.14) translateY(-22px); }
          58%  { transform: scale(0.93) translateY(7px); }
          100% { transform: scale(1)    translateY(0); }
        }
        @keyframes charMiss {
          0%   { transform: rotate(0deg)  translateX(0)    scale(1); }
          28%  { transform: rotate(16deg) translateX(14px) scale(1.06); }
          62%  { transform: rotate(-5deg) translateX(-7px); }
          100% { transform: rotate(0deg)  translateX(0)    scale(1); }
        }
        @keyframes charHit {
          0%,100% { transform: translateX(0); }
          18%     { transform: translateX(20px); }
          38%     { transform: translateX(-20px); }
          58%     { transform: translateX(13px); }
          78%     { transform: translateX(-8px); }
        }
        @keyframes screenFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes orbPulse {
          0%   { box-shadow: 0 0 0 1px #c8a80088, 0 0 0 3px #1a1630, 0 0 0 4px #c8a80033, 0 0 20px #f0454544, 0 0 32px #f0454522, 4px 4px 0 #000; }
          100% { box-shadow: 0 0 0 1px #c8a800cc, 0 0 0 3px #1a1630, 0 0 0 4px #c8a80055, 0 0 28px #f04545aa, 0 0 48px #f0454544, 4px 4px 0 #000; }
        }
        @keyframes telegraphIn {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.5); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
    </div>
  )
}
