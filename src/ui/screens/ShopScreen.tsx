import type { ChestOption } from '../../types'
import type { Spell } from '@game/data/spells'
import type { GameItem } from '@game/data/items'
import { itemIconSrc } from '@game/data/items'
import { ELEM_DISPLAY, RARITY_COLOR, SHOP_PRICE, SPELL_PRICE, PX } from '../../constants'

interface Props {
  items:      ChestOption[]
  gold:       number
  rerollCost: number
  onBuy:      (choice: ChestOption) => void
  onReroll:   () => void
  onLeave:    () => void
}

export function ShopScreen({ items, gold, rerollCost, onBuy, onReroll, onLeave }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,2,8,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
      animation: 'overlayIn 0.2s ease forwards',
    }}>
      <div style={{
        background: '#08080f',
        border: '3px solid #c8a800',
        boxShadow: 'inset 0 0 0 1px #3a2000, 6px 6px 0 #000',
        width: '100%', maxWidth: 360,
        display: 'flex', flexDirection: 'column',
        maxHeight: '85vh', overflow: 'hidden',
        animation: 'panelIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{
          background: '#1a1200',
          borderBottom: '2px solid #3a2000',
          padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🛒</span>
            <span style={{ color: '#ffd700', fontSize: 8, letterSpacing: 1 }}>ТОРГОВЕЦ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>💰</span>
            <span style={{ color: '#ffd700', fontSize: 10 }}>{gold}</span>
          </div>
        </div>

        {/* Item list */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {items.length === 0 && (
            <div style={{ padding: '28px', textAlign: 'center', color: '#777', fontSize: 7 }}>
              ПОЛКИ ПУСТЫ
            </div>
          )}
          {items.map((choice, idx) => {
            const isSpell   = choice.kind === 'spell'
            const color     = isSpell
              ? (ELEM_DISPLAY.find(e => e.key === (choice.data as Spell).element)?.color ?? '#ffd700')
              : RARITY_COLOR[(choice.data as GameItem).rarity]
            const price     = isSpell ? SPELL_PRICE : SHOP_PRICE[(choice.data as GameItem).rarity]
            const canAfford = gold >= price
            const badge     = isSpell ? 'ЗАКЛ.' : (choice.data as GameItem).rarity.toUpperCase()

            return (
              <button key={idx}
                onClick={() => canAfford && onBuy(choice)}
                disabled={!canAfford}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: '1px solid #ffffff06',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  fontFamily: PX,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  opacity: canAfford ? 1 : 0.4,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: '#0e0c1e',
                  border: `2px solid ${canAfford ? color : '#2a2a3a'}`,
                  boxShadow: canAfford ? `inset 0 0 0 1px ${color}22, 2px 2px 0 #000` : '2px 2px 0 #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  {isSpell
                    ? <span style={{ fontSize: 22 }}>{choice.data.icon}</span>
                    : <img src={itemIconSrc(choice.data.id)} draggable={false}
                        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', objectFit: 'contain' }} />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      color: canAfford ? color : '#444',
                      fontSize: 7, flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {choice.data.name.toUpperCase()}
                    </span>
                    <span style={{
                      background: canAfford ? `${color}22` : '#111',
                      border: `1px solid ${canAfford ? `${color}44` : '#222'}`,
                      color: canAfford ? color : '#333',
                      fontSize: 5, padding: '1px 5px', flexShrink: 0,
                    }}>
                      {badge}
                    </span>
                  </div>
                  <span style={{ color: '#8888aa', fontSize: 5, lineHeight: 1.6 }}>
                    {choice.data.description}
                  </span>
                </div>

                {/* Price */}
                <div style={{
                  flexShrink: 0,
                  background: canAfford ? '#1a1200' : '#0a0a0a',
                  border: `2px solid ${canAfford ? '#c8a800' : '#2a2a2a'}`,
                  boxShadow: canAfford ? 'inset 0 0 0 1px #3a2000, 2px 2px 0 #000' : 'none',
                  padding: '4px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  minWidth: 44,
                }}>
                  <span style={{ fontSize: 10 }}>💰</span>
                  <span style={{ color: canAfford ? '#ffd700' : '#444', fontSize: 8, fontFamily: PX }}>
                    {price}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '2px solid #3a2000',
          background: '#0c0a00',
          padding: '8px 14px',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={() => gold >= rerollCost && onReroll()}
            disabled={gold < rerollCost}
            style={{
              flex: 1,
              background: '#0a0e1a',
              border: `2px solid ${gold >= rerollCost ? '#4a7ab8' : '#1a1a2a'}`,
              boxShadow: gold >= rerollCost ? 'inset 0 0 0 1px #1a3060, 2px 2px 0 #000' : 'none',
              color: gold >= rerollCost ? '#60a5fa' : '#2a2a3a',
              cursor: gold >= rerollCost ? 'pointer' : 'not-allowed',
              padding: '10px 0', fontSize: 6, fontFamily: PX,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            🔄 РЕРОЛЛ 💰{rerollCost}
          </button>
          <button onClick={onLeave} style={{
            flex: 1,
            background: '#1a1200',
            border: '2px solid #c8a800',
            boxShadow: 'inset 0 0 0 1px #3a2000, 2px 2px 0 #000',
            color: '#ffd700', cursor: 'pointer',
            padding: '10px 0', fontSize: 7, fontFamily: PX, letterSpacing: 1,
          }}>
            УЙТИ
          </button>
        </div>
      </div>
    </div>
  )
}
