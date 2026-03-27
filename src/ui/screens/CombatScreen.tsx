import React, { useEffect } from 'react'
import { useGameStore } from '@store/gameStore'

// Заглушка врага для разработки
import type { Enemy } from '@game/types'

const DUMMY_ENEMY: Enemy = {
  id: 'goblin',
  name: 'Гоблин',
  hp: 40,
  maxHp: 40,
  attack: 8,
  defense: 2,
  reward: { gold: 15, items: [] },
  sprite: '/assets/enemies/goblin.png',
}

export function CombatScreen() {
  const { combat, initCombat, playerAttackAction, tickAutoCombat, endCombat } = useGameStore()

  useEffect(() => {
    if (!combat) initCombat(DUMMY_ENEMY)
  }, [])

  useEffect(() => {
    if (!combat) return
    if (combat.status !== 'ongoing') {
      const timer = setTimeout(() => endCombat(), 1500)
      return () => clearTimeout(timer)
    }
  }, [combat?.status])

  if (!combat) return null

  const playerHpPct = (combat.player.stats.hp / combat.player.stats.maxHp) * 100
  const enemyHpPct  = (combat.enemy.hp / combat.enemy.maxHp) * 100

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '24px', background: '#1a1a2e', color: '#fff', gap: 16,
    }}>
      {/* Враг */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>{combat.enemy.name}</h2>
        <img src={combat.enemy.sprite} alt="" style={{ imageRendering: 'pixelated', width: 96, height: 96 }} />
        <HpBar pct={enemyHpPct} color="#ef4444" label={`${combat.enemy.hp} / ${combat.enemy.maxHp}`} />
      </div>

      {/* Лог */}
      <div style={{
        maxHeight: 100, overflowY: 'auto',
        background: '#00000044', borderRadius: 8, padding: '8px 12px',
        fontSize: 13, display: 'flex', flexDirection: 'column-reverse', gap: 2,
      }}>
        {[...combat.log].reverse().map((line, i) => (
          <div key={i} style={{ opacity: i === 0 ? 1 : 0.5 }}>{line}</div>
        ))}
      </div>

      {/* Игрок */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HpBar pct={playerHpPct} color="#4ade80" label={`${combat.player.stats.hp} / ${combat.player.stats.maxHp}`} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={playerAttackAction}
            disabled={!combat.isPlayerTurn || combat.status !== 'ongoing'}
            style={btnStyle('#ef4444')}
          >
            Атаковать
          </button>
          <button
            onClick={tickAutoCombat}
            disabled={combat.status !== 'ongoing'}
            style={btnStyle('#6366f1')}
          >
            Авто
          </button>
        </div>
      </div>

      {combat.status !== 'ongoing' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#00000088',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 700,
        }}>
          {combat.status === 'playerWon' ? '🏆 Победа!' : '💀 Поражение'}
        </div>
      )}
    </div>
  )
}

function HpBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ background: '#333', borderRadius: 4, height: 12, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 12, textAlign: 'right', marginTop: 2, opacity: 0.7 }}>{label}</div>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    flex: 1, padding: '12px 0', borderRadius: 8,
    background: bg, color: '#fff', border: 'none',
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
  }
}
