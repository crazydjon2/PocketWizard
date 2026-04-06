import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { ALL_SPELLS, toHandSpell } from '@game/data/spells'
import { pickEnemy } from '@game/data/enemies'
import { FOREST_BIOME } from '@game/biomes/forest'
import { ALL_EVENTS } from '@game/data/events'
import type { Spell, HandSpell } from '@game/data/spells'
import type { GameItem, ItemEffect } from '@game/data/items'
import type { EnemyDef } from '@game/data/enemies'
import type { GameEvent, EventChoice } from '@game/data/events'
import type { Phase, PathType, AppPhase, ChestOption } from './types'
import { MAX_HP, HEAL_AMOUNT, REROLL_BASE, ENEMY_SPRITE_UV, ENEMY_BASE_HEIGHT, PX, ELEM_DISPLAY } from './constants'
import { calcCardDamage, calcIncomingDamage } from '@game/logic/combatCalc'
import { buildRewardPool, pickWeighted } from '@game/logic/rewardPool'
import { useThreeScene } from '@hooks/useThreeScene'
import { useCombatEffects } from '@hooks/useCombatEffects'
import { GameHUD } from '@ui/components/GameHUD'
import { CardHand } from '@ui/components/CardHand'
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
  const [showStats,    setShowStats]    = useState(false)

  // ── Spell / item / progression state ──────────────────────────
  const [appPhase,       setAppPhase]       = useState<AppPhase>('spellSelect')
  const [startOptions]                      = useState<Spell[]>(() =>
    [...ALL_SPELLS].sort(() => Math.random() - 0.5).slice(0, 6)
  )
  const [hand,           setHand]           = useState<HandSpell[]>([])
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
    const h = ENEMY_BASE_HEIGHT; const w = h * fw / fh
    enemyBaseScaleRef.current = [w, h]
    if (enemyMeshRef.current) {
      enemyMeshRef.current.scale.set(w, h, 1)
      enemyMeshRef.current.position.y = h / 2   // ноги на земле
    }
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

  // ── Reward pool helpers ───────────────────────────────────────
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
      setOwnedItems(prev => [...prev, choice.data as GameItem])
    }
    setPathChoices(randomPathChoices())
    setPhase('path')
  }, [])

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

  const handleShopBuy = useCallback((choice: ChestOption) => {
    const price = choice.kind === 'spell'
      ? 25
      : { common: 12, rare: 28, epic: 55 }[(choice.data as GameItem).rarity]
    setGold(g => g - price)
    if (choice.kind === 'spell') {
      setHand(prev => [...prev, toHandSpell(choice.data as Spell)])
    } else {
      setOwnedItems(prev => [...prev, choice.data as GameItem])
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

  // ── Card play ─────────────────────────────────────────────────
  const handlePlayCard = useCallback((card: HandSpell) => {
    if (phase !== 'choose' || appPhase !== 'playing') return

    // Decrement charges; remove card when depleted
    if (!card.infinite) {
      setHand(prev => prev
        .map(h => h.instanceId === card.instanceId ? { ...h, charges: h.charges - 1 } : h)
        .filter(h => h.charges > 0)
      )
    }

    const dmg        = calcCardDamage(card, ownedItems, playerHp, effectiveMaxHpRef.current)
    const newEnemyHp = Math.max(0, enemyHp - dmg)

    setEnemyHp(newEnemyHp)
    showFloat(`⚔️ −${dmg}`, '#fbbf24')
    triggerCharAnim('charAttack', 480)
    enemyHitRef.current = true

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

    // Enemy counter-attack (automatic)
    setPhase('waiting')
    setTimeout(() => { enemyAttackRef.current = true }, 400)
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
      setTimeout(() => setPhase('choose'), 700)
    }, 900)
  }, [phase, appPhase, ownedItems, playerHp, enemyHp, hitStreak, openChest, showFloat, triggerCharAnim, triggerScreenFlash])

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
      {/* Three.js canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <GameHUD gold={gold} stepCount={stepCount} hitStreak={hitStreak} />

      {/* ── FRAME: vignette + side borders ────────────────────────── */}
      <div style={{
        position: 'absolute', top: 42, left: 0, right: 0, bottom: 196,
        pointerEvents: 'none', zIndex: 20,
        boxShadow: [
          'inset 0 0 80px rgba(0,0,0,0.8)',
          'inset 6px 0 0 #100d22',
          'inset -6px 0 0 #100d22',
        ].join(', '),
      }} />

      {/* Frame corner ornaments */}
      {([
        { top: 42,  left:  0, borderTop: '3px solid #c8a80077', borderLeft:  '3px solid #c8a80077' },
        { top: 42,  right: 0, borderTop: '3px solid #c8a80077', borderRight: '3px solid #c8a80077' },
        { bottom: 196, left:  0, borderBottom: '3px solid #c8a80077', borderLeft:  '3px solid #c8a80077' },
        { bottom: 196, right: 0, borderBottom: '3px solid #c8a80077', borderRight: '3px solid #c8a80077' },
      ] as React.CSSProperties[]).map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 22, height: 22, pointerEvents: 'none', zIndex: 51, ...s }} />
      ))}

      {/* ── BOTTOM PANEL: textured dark base ──────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 196,
        backgroundColor: '#07050f',
        backgroundImage: 'radial-gradient(circle, #13102a 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        borderTop: '3px solid #2a2448',
        boxShadow: 'inset 0 3px 0 #100d22',
        pointerEvents: 'none', zIndex: 98,
      }} />

      {/* ── ENEMY INFO: icon + name + HP numbers ──────────────────── */}
      {appPhase === 'playing' && (phase === 'choose' || phase === 'waiting') && (() => {
        const attacking = phase === 'waiting'
        const elem = ELEM_DISPLAY.find(e => e.key === currentEnemy.element)
        return (
          <div style={{
            position: 'absolute', top: '42%', left: '50%',
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none', zIndex: 25,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            fontFamily: PX,
            filter: attacking ? 'drop-shadow(0 0 10px #f04545bb)' : 'none',
            transition: 'filter 0.3s',
          }}>
            {/* Icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, filter: 'drop-shadow(0 1px 3px #000)' }}>
                {elem?.icon ?? '👾'}
              </span>
              <span style={{
                color: attacking ? '#ff8888' : '#f06060',
                fontSize: 5, letterSpacing: 1,
                textShadow: '1px 1px 0 #000, 0 0 10px #000',
              }}>
                {currentEnemy.name.toUpperCase()}
              </span>
            </div>
            {/* HP numbers only — no bar */}
            <div style={{
              background: '#000000cc',
              border: `1px solid ${attacking ? '#f0454566' : '#f0454522'}`,
              padding: '3px 12px',
              display: 'flex', alignItems: 'baseline', gap: 4,
            }}>
              <span style={{ color: attacking ? '#ffaaaa' : '#ff7777', fontSize: 10 }}>
                {enemyHp}
              </span>
              <span style={{ color: '#5a3838', fontSize: 7 }}>·</span>
              <span style={{ color: '#8a6060', fontSize: 8 }}>{currentEnemy.hp}</span>
            </div>
          </div>
        )
      })()}

      {/* ── HP ORB: bottom left (Diablo-style) ────────────────────── */}
      {appPhase === 'playing' && (() => {
        const pct     = Math.max(0, Math.min(100, playerHp / effectiveMaxHp * 100))
        const color   = pct > 50 ? '#3af3a0' : pct > 25 ? '#f0c040' : '#f04545'
        const darkClr = pct > 50 ? '#04240e' : pct > 25 ? '#2c1e00' : '#280606'
        const isLow   = pct <= 25
        return (
          <div style={{
            position: 'absolute', bottom: 24, left: 10, zIndex: 101,
            pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            {/* Tick marks + orb wrapper */}
            <div style={{ position: 'relative', width: 84, height: 84 }}>
              {/* Cardinal tick marks */}
              {([
                { top: 0,   left: '50%', transform: 'translateX(-50%)', width: 4, height: 7 },
                { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 7 },
                { left: 0,  top: '50%', transform: 'translateY(-50%)',  width: 7, height: 4 },
                { right: 0, top: '50%', transform: 'translateY(-50%)',  width: 7, height: 4 },
              ] as React.CSSProperties[]).map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', background: '#c8a80066', ...s,
                }} />
              ))}

              {/* Orb */}
              <div style={{
                position: 'absolute', top: 6, left: 6, width: 72, height: 72,
                borderRadius: '50%', overflow: 'hidden',
                background: '#06040e',
                border: '3px solid #2a2048',
                boxShadow: [
                  '0 0 0 1px #c8a80088',
                  `0 0 0 3px #1a1630`,
                  `0 0 0 4px #c8a80033`,
                  `0 0 20px ${color}33`,
                  isLow ? `0 0 28px #f0454566` : '',
                  '4px 4px 0 #000',
                ].filter(Boolean).join(', '),
                animation: isLow ? 'orbPulse 1.2s ease-in-out infinite' : 'none',
              }}>
                {/* Liquid */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: `${pct}%`,
                  background: `linear-gradient(to top, ${darkClr} 0%, ${color}dd 100%)`,
                  transition: 'height 0.35s ease-out',
                }} />
                {/* Wave surface */}
                <div style={{
                  position: 'absolute', left: '-18%', right: '-18%',
                  bottom: `calc(${pct}% - 5px)`,
                  height: 10, background: `${color}66`,
                  borderRadius: '50%', transform: 'scaleX(1.4)',
                  transition: 'bottom 0.35s ease-out',
                }} />
                {/* Vertical light stripe (liquid refraction) */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: '38%', width: 4,
                  background: `linear-gradient(to bottom, transparent 0%, ${color}22 40%, ${color}11 70%, transparent 100%)`,
                }} />
                {/* Glass shine */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 30% 24%, #ffffff66 0%, #ffffff22 28%, transparent 55%)',
                }} />
                {/* HP number */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: PX, fontSize: 9, color: '#fff',
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 0 0 10px #000',
                }}>
                  {playerHp}
                </div>
              </div>
            </div>

            {/* Max HP + label below orb */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{
                width: 84, height: 1,
                background: 'linear-gradient(90deg, transparent, #c8a80055, transparent)',
              }} />
              <span style={{ color: '#4a4060', fontSize: 4, fontFamily: PX }}>
                / {effectiveMaxHp}
              </span>
            </div>
          </div>
        )
      })()}

      {/* ── STATS BUTTON: bottom right ─────────────────────────────── */}
      {appPhase === 'playing' && (
        <button
          onClick={() => setShowStats(true)}
          style={{
            position: 'absolute', bottom: 28, right: 12, zIndex: 101,
            width: 60, height: 60,
            background: 'linear-gradient(135deg, #0e0c22, #1a1840)',
            border: '3px solid #3a3660',
            boxShadow: '0 0 0 1px #5050aa22, 4px 4px 0 #000, inset 0 0 16px #8080ff08',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 3,
            padding: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 3 }}>
            {['#6060aa', '#8080cc', '#6060aa'].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, background: c }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#8080cc', '#a0a0ff', '#8080cc'].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, background: c }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#6060aa', '#8080cc', '#6060aa'].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, background: c }} />
            ))}
          </div>
        </button>
      )}

      {/* ── CARD HAND ─────────────────────────────────────────────── */}
      {appPhase === 'playing' && (phase === 'choose' || phase === 'waiting') && (
        <CardHand hand={hand} phase={phase} onPlayCard={handlePlayCard} />
      )}

      {/* Stats modal */}
      {showStats && (
        <StatsPanel
          playerHp={playerHp} effectiveMaxHp={effectiveMaxHp}
          gold={gold} hitStreak={hitStreak}
          equippedSpells={hand} ownedItems={ownedItems}
          currentEnemy={currentEnemy} enemyHp={enemyHp}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Combat effects (flash, floats, char anim) */}
      <CombatOverlay
        floatContainerRef={floatContainerRef}
        screenFlashRef={screenFlashRef}
        charInnerRef={charInnerRef}
      />

      {/* Spell selection (game start) */}
      {appPhase === 'spellSelect' && (
        <SpellSelectScreen
          startOptions={startOptions}
          onSelect={spells => { setHand(spells.map(toHandSpell)); setAppPhase('playing') }}
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
  )
}
