import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { ALL_SPELLS } from '@game/data/spells'
import { pickEnemy } from '@game/data/enemies'
import { FOREST_BIOME } from '@game/biomes/forest'
import { ALL_EVENTS } from '@game/data/events'
import type { Spell } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { EnemyDef } from '@game/data/enemies'
import type { GameEvent, EventChoice } from '@game/data/events'
import type { Zone, Phase, PathType, AppPhase, ChestOption } from './types'
import { MAX_HP, HEAL_AMOUNT, TELEGRAPH_MS, REROLL_BASE, ENEMY_SPRITE_UV, PX } from './constants'
import { calcPlayerDamage, calcIncomingDamage } from '@game/logic/combatCalc'
import { buildRewardPool, pickWeighted } from '@game/logic/rewardPool'
import { useThreeScene } from '@hooks/useThreeScene'
import { useCombatEffects } from '@hooks/useCombatEffects'
import { GameHUD } from '@ui/components/GameHUD'
import { StatsPanel } from '@ui/components/StatsPanel'
import { CombatOverlay } from '@ui/components/CombatOverlay'
import { SpellSelectScreen } from '@ui/screens/SpellSelectScreen'
import { ChestScreen } from '@ui/screens/ChestScreen'
import { ShopScreen } from '@ui/screens/ShopScreen'
import { EventScreen } from '@ui/screens/EventScreen'
import { PathChoiceScreen } from '@ui/screens/PathChoiceScreen'

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

function getZone(dx: number, dy: number, dist: number): Zone {
  if (dist < 30) return null
  const a = Math.atan2(dy, dx)
  if (Math.abs(a) < Math.PI * 0.35)  return 'right'
  if (Math.abs(a) > Math.PI * 0.65)  return 'left'
  return null
}

function randomPathChoices(): PathType[] {
  const all: PathType[] = ['combat', 'rest', 'event', 'shop']
  const count = 2 + Math.floor(Math.random() * 2)
  return [...all].sort(() => Math.random() - 0.5).slice(0, count)
}

// ── App ───────────────────────────────────────────────────────────
export function App() {
  // ── Three.js / scene refs ──────────────────────────────────────
  const mountRef         = useRef<HTMLDivElement>(null)
  const speedRef         = useRef(0)
  const movingRef        = useRef(false)
  const grassLeanYRef    = useRef(0)
  const grassSnapRef     = useRef(false)
  const stepCountRef     = useRef(0)
  const roadTexsRef      = useRef<THREE.Texture[]>([])
  const enemyMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const enemyMeshRef     = useRef<THREE.Mesh | null>(null)
  const enemyBaseScaleRef= useRef<[number, number]>([1.9, 3.0])
  const enemyHitRef      = useRef(false)
  const enemyAttackRef   = useRef(false)
  const enemyFramesRef   = useRef<1 | 4>(FOREST_BIOME.enemies[0].frames)

  // ── DOM refs ───────────────────────────────────────────────────
  const charInnerRef      = useRef<HTMLDivElement>(null)
  const screenFlashRef    = useRef<HTMLDivElement>(null)
  const floatContainerRef = useRef<HTMLDivElement>(null)
  const charElRef         = useRef<HTMLDivElement>(null)
  const leftZoneRef       = useRef<HTMLDivElement>(null)
  const rightZoneRef      = useRef<HTMLDivElement>(null)
  const hoverZoneRef      = useRef<Zone>(null)
  const dragOriginRef     = useRef({ x: 0, y: 0 })

  // ── Stable read refs ──────────────────────────────────────────
  const startEnemy        = FOREST_BIOME.enemies[0]
  const currentEnemyRef   = useRef<EnemyDef>(startEnemy)
  const fightCountRef     = useRef(0)
  const effectiveMaxHpRef = useRef(MAX_HP)

  // ── Combat state ──────────────────────────────────────────────
  const [phase,      setPhase]      = useState<Phase>('choose')
  const [correctDir, setCorrectDir] = useState<'left' | 'right'>(() =>
    Math.random() < 0.5 ? 'left' : 'right'
  )
  const [playerHp,     setPlayerHp]     = useState(MAX_HP)
  const [currentEnemy, setCurrentEnemy] = useState<EnemyDef>(startEnemy)
  const [enemyHp,      setEnemyHp]      = useState(startEnemy.hp)
  const [fightCount,   setFightCount]   = useState(0)
  const [stepCount,    setStepCount]    = useState(0)
  const [telegraph,    setTelegraph]    = useState(true)
  const [pathChoices,  setPathChoices]  = useState<PathType[]>([])
  const [showStats,    setShowStats]    = useState(false)
  const [dragging,     setDragging]     = useState(false)

  // ── Spell / item / progression state ──────────────────────────
  const [appPhase,       setAppPhase]       = useState<AppPhase>('spellSelect')
  const [startOptions]                      = useState<Spell[]>(() =>
    [...ALL_SPELLS].sort(() => Math.random() - 0.5).slice(0, 3)
  )
  const [equippedSpells, setEquippedSpells] = useState<Spell[]>([])
  const [spellSlots,     setSpellSlots]     = useState(2)
  const [ownedItems,     setOwnedItems]     = useState<GameItem[]>([])
  const [gold,           setGold]           = useState(0)
  const [hitStreak,      setHitStreak]      = useState(0)
  const [chestChoices,   setChestChoices]   = useState<ChestOption[]>([])
  const [shopItems,      setShopItems]      = useState<ChestOption[]>([])
  const [rerollCost,     setRerollCost]     = useState(REROLL_BASE)
  const [currentEvent,   setCurrentEvent]   = useState<GameEvent | null>(null)
  const [eventResolved,  setEventResolved]  = useState(false)

  // ── Derived / ref sync ────────────────────────────────────────
  const effectiveMaxHp = Math.max(1, MAX_HP + ownedItems
    .flatMap(i => i.effects)
    .filter(e => e.type === 'maxHp')
    .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'maxHp' }>).amount, 0))
  effectiveMaxHpRef.current = effectiveMaxHp
  currentEnemyRef.current   = currentEnemy
  fightCountRef.current     = fightCount
  stepCountRef.current      = stepCount

  // ── Telegraph effect ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'choose') return
    setTelegraph(true)
    const t = setTimeout(() => setTelegraph(false), TELEGRAPH_MS)
    return () => clearTimeout(t)
  }, [phase, correctDir])

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
    } else {
      t.repeat.set(1, 1)
      t.offset.set(0, 0)
    }
    mat.map = t
    mat.needsUpdate = true
    enemyFramesRef.current = currentEnemy.frames
    const [fw, fh] = currentEnemy.framePx
    const h = 3.0; const w = h * fw / fh
    enemyBaseScaleRef.current = [w, h]
    if (enemyMeshRef.current) enemyMeshRef.current.scale.set(w, h, 1)
  }, [currentEnemy])

  // ── Hooks ─────────────────────────────────────────────────────
  useThreeScene({
    mountRef, speedRef, movingRef, grassLeanYRef, grassSnapRef,
    stepCountRef, roadTexsRef,
    enemyMaterialRef, enemyMeshRef, enemyBaseScaleRef,
    enemyHitRef, enemyAttackRef, enemyFramesRef,
  })

  const { showFloat, triggerCharAnim, triggerScreenFlash } = useCombatEffects({
    floatContainerRef, charInnerRef, screenFlashRef,
  })

  // ── DOM zone helpers ──────────────────────────────────────────
  const applyZoneDOM = (zone: Zone) => {
    for (const [ref, id] of [[leftZoneRef, 'left'], [rightZoneRef, 'right']] as const) {
      if (!ref.current) continue
      const active = zone === id
      ref.current.style.opacity     = '1'
      ref.current.style.background  = active ? 'rgba(240,68,68,0.18)' : 'rgba(240,68,68,0.04)'
      ref.current.style.borderColor = active ? '#f04545' : 'rgba(240,68,68,0.3)'
      ref.current.style.boxShadow   = active
        ? '0 0 16px rgba(240,68,68,0.4), inset 0 0 16px rgba(240,68,68,0.08)'
        : 'none'
      const arrow = ref.current.querySelector('span') as HTMLElement | null
      if (arrow) arrow.style.color = active ? '#f04545' : 'rgba(240,68,68,0.5)'
    }
  }
  const hideZonesDOM = () => {
    leftZoneRef.current  && (leftZoneRef.current.style.opacity  = '0')
    rightZoneRef.current && (rightZoneRef.current.style.opacity = '0')
  }

  // ── Reward pool helpers ───────────────────────────────────────
  const openChest = useCallback(() => {
    const extraChoices = ownedItems.filter(i => i.effects.some(e => e.type === 'moreChoices')).length
    const pool = buildRewardPool(equippedSpells, spellSlots)
    setChestChoices(pickWeighted(pool, 3 + extraChoices))
    setPhase('chest')
  }, [ownedItems, equippedSpells, spellSlots])

  const handleChestChoice = useCallback((choice: ChestOption) => {
    if (choice.kind === 'spell') {
      setEquippedSpells(prev => [...prev, choice.data])
    } else {
      setOwnedItems(prev => [...prev, choice.data])
      if ((choice.data as GameItem).effects.some(e => e.type === 'spellSlot')) setSpellSlots(s => s + 1)
    }
    setPathChoices(randomPathChoices())
    setPhase('path')
  }, [])

  const buildShopPool = useCallback(() =>
    pickWeighted(buildRewardPool(equippedSpells, spellSlots), 4),
  [equippedSpells, spellSlots])

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

  const handleShopBuy = useCallback((choice: ChestOption) => {
    const price = choice.kind === 'spell'
      ? 25
      : { common: 12, rare: 28, epic: 55 }[(choice.data as GameItem).rarity]
    setGold(g => g - price)
    if (choice.kind === 'spell') {
      setEquippedSpells(prev => [...prev, choice.data as Spell])
    } else {
      const item = choice.data as GameItem
      setOwnedItems(prev => [...prev, item])
      if (item.effects.some(e => e.type === 'spellSlot')) setSpellSlots(s => s + 1)
    }
    setShopItems(prev => prev.filter(c => c.data.id !== choice.data.id))
    showFloat('🛒 Куплено!', '#fbbf24')
  }, [showFloat])

  const openEvent = useCallback(() => {
    setCurrentEvent(ALL_EVENTS[Math.floor(Math.random() * ALL_EVENTS.length)])
    setEventResolved(false)
    setPhase('event')
  }, [])

  const handleEventChoice = useCallback((choice: EventChoice) => {
    if (choice.goldCost) setGold(g => g - choice.goldCost!)
    const eff = choice.effect
    if (eff.type === 'gold') {
      setGold(g => g + eff.amount)
      showFloat(eff.amount >= 0 ? `+${eff.amount} 💰` : `${eff.amount} 💰`, eff.amount >= 0 ? '#fbbf24' : '#ef4444')
    } else if (eff.type === 'hp') {
      setPlayerHp(h => Math.min(effectiveMaxHpRef.current, Math.max(0, h + eff.amount)))
      showFloat(eff.amount >= 0 ? `+${eff.amount} HP` : `${eff.amount} HP`, eff.amount >= 0 ? '#4ade80' : '#ef4444')
    }
    setEventResolved(true)
  }, [showFloat])

  const closeEvent = useCallback(() => {
    setPathChoices(randomPathChoices())
    setPhase('path')
    setCurrentEvent(null)
  }, [])

  // ── Drag handlers ─────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'choose' || appPhase !== 'playing') return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOriginRef.current = { x: e.clientX, y: e.clientY }
    hoverZoneRef.current  = null
    if (charElRef.current) {
      charElRef.current.style.left      = `${e.clientX}px`
      charElRef.current.style.top       = `${e.clientY}px`
      charElRef.current.style.bottom    = 'auto'
      charElRef.current.style.transform = 'translate(-50%, -50%)'
    }
    applyZoneDOM(null)
    setDragging(true)
  }, [phase, appPhase])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const { clientX: x, clientY: y } = e
    if (charElRef.current) {
      charElRef.current.style.left = `${x}px`
      charElRef.current.style.top  = `${y}px`
    }
    const dx   = x - dragOriginRef.current.x
    const dy   = y - dragOriginRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const zone = getZone(dx, dy, dist)
    if (zone !== hoverZoneRef.current) { hoverZoneRef.current = zone; applyZoneDOM(zone) }
    grassLeanYRef.current = -(dx / Math.max(dist, 1)) * 0.1
  }, [dragging])

  const handlePointerUp = useCallback(() => {
    if (!dragging) return
    const zone = hoverZoneRef.current
    hoverZoneRef.current  = null
    grassLeanYRef.current = 0
    grassSnapRef.current  = true
    hideZonesDOM()
    if (charElRef.current) {
      charElRef.current.style.left      = '50%'
      charElRef.current.style.top       = 'auto'
      charElRef.current.style.bottom    = '88px'
      charElRef.current.style.transform = 'translateX(-50%)'
    }
    setDragging(false)
    if (!zone || phase !== 'choose') return

    setPhase('waiting')
    const hit        = zone === correctDir
    const playerDmg  = calcPlayerDamage(equippedSpells, ownedItems, playerHp, effectiveMaxHpRef.current)
    const newEnemyHp = hit ? Math.max(0, enemyHp - playerDmg) : enemyHp

    if (hit) {
      setEnemyHp(newEnemyHp)
      showFloat(`⚔️ −${playerDmg}`, '#fbbf24')
      triggerCharAnim('charAttack', 480)
      enemyHitRef.current = true

      const newStreak    = hitStreak + 1
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
        const bonusGold = ownedItems.flatMap(i => i.effects)
          .filter(e => e.type === 'goldBonus')
          .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'goldBonus' }>).amount, 0)
        const earned = currentEnemyRef.current.goldReward + bonusGold
        setGold(g => g + earned)
        showFloat(`🏆 +${earned}💰`, '#fbbf24')
        setHitStreak(0)
        setTimeout(() => openChest(), 800)
        return
      }

      const selfDmg = ownedItems.flatMap(i => i.effects)
        .filter(e => e.type === 'selfDamageOnHit')
        .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'selfDamageOnHit' }>).amount, 0)
      if (selfDmg > 0) {
        setPlayerHp(h => Math.max(0, h - selfDmg))
        showFloat(`💀 −${selfDmg}`, '#a855f7')
      }
    } else {
      setHitStreak(0)
      showFloat('💨 Промах!', '#94a3b8')
      triggerCharAnim('charMiss', 480)
    }

    setTimeout(() => { enemyAttackRef.current = true }, 500)
    setTimeout(() => {
      const accBonus = ownedItems.flatMap(i => i.effects)
        .filter(e => e.type === 'enemyAccuracyBonus')
        .reduce((s, e) => s + (e as Extract<ItemEffect, { type: 'enemyAccuracyBonus' }>).amount, 0)
      const eHit = Math.random() < Math.min(0.95, currentEnemyRef.current.hitChance + accBonus)
      if (eHit) {
        const dmg = calcIncomingDamage(ownedItems, currentEnemyRef.current.damage, currentEnemyRef.current.element)
        setPlayerHp(h => Math.max(0, h - dmg))
        showFloat(`🗡️ −${dmg}`, '#ef4444')
        triggerCharAnim('charHit', 560)
        triggerScreenFlash('#ef4444')
      } else {
        showFloat('🛡️ Враг промахнулся', '#60a5fa')
      }
      setTimeout(() => {
        setCorrectDir(Math.random() < 0.5 ? 'left' : 'right')
        setPhase('choose')
      }, 900)
    }, 900)
  }, [
    dragging, phase, correctDir, enemyHp, hitStreak, ownedItems, equippedSpells, playerHp,
    calcPlayerDamage, openChest, showFloat, triggerCharAnim, triggerScreenFlash,
  ])

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

        if (path === 'combat') {
          const nextCount = fightCountRef.current + 1
          setFightCount(nextCount)
          const nextEnemy = pickEnemy(nextCount, FOREST_BIOME.enemies)
          setCurrentEnemy(nextEnemy)
          currentEnemyRef.current = nextEnemy
          setEnemyHp(nextEnemy.hp)
          setCorrectDir(Math.random() < 0.5 ? 'left' : 'right')
          setPhase('choose')
        } else if (path === 'rest') {
          setPlayerHp(h => Math.min(effectiveMaxHpRef.current, h + HEAL_AMOUNT))
          showFloat(`+${HEAL_AMOUNT} HP`, '#4ade80')
          setPathChoices(randomPathChoices())
          setPhase('path')
        } else if (path === 'shop') {
          openShop()
        } else {
          openEvent()
        }
      })
  }, [showFloat, openShop, openEvent])

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: PX }}>
      {/* Three.js mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* HUD (top + bottom) */}
      <GameHUD
        playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
        enemyHp={enemyHp} currentEnemy={currentEnemy}
        gold={gold} stepCount={stepCount} hitStreak={hitStreak}
        phase={phase} dragging={dragging}
        equippedSpells={equippedSpells} spellSlots={spellSlots}
        onShowStats={() => setShowStats(true)}
      />

      {/* Stats modal */}
      {showStats && (
        <StatsPanel
          playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
          gold={gold} hitStreak={hitStreak}
          equippedSpells={equippedSpells} ownedItems={ownedItems}
          currentEnemy={currentEnemy} enemyHp={enemyHp}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Combat interaction (character, zones, flash, float) */}
      <CombatOverlay
        phase={phase} appPhase={appPhase}
        correctDir={correctDir} telegraph={telegraph} dragging={dragging}
        floatContainerRef={floatContainerRef} screenFlashRef={screenFlashRef}
        charElRef={charElRef} charInnerRef={charInnerRef}
        leftZoneRef={leftZoneRef} rightZoneRef={rightZoneRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Spell selection (game start) */}
      {appPhase === 'spellSelect' && (
        <SpellSelectScreen
          startOptions={startOptions}
          onSelect={spell => { setEquippedSpells([spell]); setAppPhase('playing') }}
        />
      )}

      {/* Chest reward */}
      {phase === 'chest' && (
        <ChestScreen choices={chestChoices} onChoose={handleChestChoice} />
      )}

      {/* Shop */}
      {phase === 'shop' && (
        <ShopScreen
          items={shopItems} gold={gold} rerollCost={rerollCost}
          onBuy={handleShopBuy} onReroll={handleReroll}
          onLeave={() => { setPathChoices(randomPathChoices()); setPhase('path') }}
        />
      )}

      {/* Random event */}
      {phase === 'event' && currentEvent && (
        <EventScreen
          event={currentEvent} resolved={eventResolved} gold={gold}
          onChoice={handleEventChoice} onContinue={closeEvent}
        />
      )}

      {/* Path choice */}
      {phase === 'path' && (
        <PathChoiceScreen choices={pathChoices} onChoose={handlePathChoice} />
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
  )
}
