import type { GameEvent, EventChoice } from '@game/data/events'
import { PX } from '../../constants'

interface Props {
  event:      GameEvent
  resolved:   boolean
  gold:       number
  onChoice:   (choice: EventChoice) => void
  onContinue: () => void
}

export function EventScreen({ event, resolved, gold, onChoice, onContinue }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(2,2,8,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
      animation: 'overlayIn 0.2s ease forwards',
    }}>
      <div style={{
        background: '#08080f',
        border: '3px solid #a78bfa',
        boxShadow: 'inset 0 0 0 1px #2a0060, 6px 6px 0 #000',
        width: '100%', maxWidth: 360, margin: '0 12px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'panelIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header strip */}
        <div style={{
          background: '#1a0030',
          borderBottom: '2px solid #3a0060',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{event.icon}</span>
          <span style={{ color: '#a78bfa', fontSize: 8, letterSpacing: 1, flex: 1 }}>
            {event.title.toUpperCase()}
          </span>
        </div>

        {/* Description */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{
            color: '#9090b0', fontSize: 6,
            lineHeight: 2.2, margin: 0,
          }}>
            {event.desc}
          </p>
        </div>

        {/* Choices */}
        <div style={{
          padding: '0 12px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {!resolved ? (
            event.choices.map((choice, idx) => {
              const hasGoldCost = !!choice.goldCost
              const canAfford   = !hasGoldCost || gold >= (choice.goldCost ?? 0)
              return (
                <button key={idx}
                  onClick={() => canAfford && onChoice(choice)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? '#12102a' : '#0a0a14',
                    border: `2px solid ${canAfford ? '#a78bfa' : '#2a2a3a'}`,
                    boxShadow: canAfford ? 'inset 0 0 0 1px #2a0060, 2px 2px 0 #000' : 'none',
                    color: canAfford ? '#c4b5fd' : '#444',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    padding: '10px 14px',
                    fontSize: 6, fontFamily: PX,
                    textAlign: 'left', lineHeight: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 8,
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >
                  <span>▶ {choice.text}</span>
                  {hasGoldCost && (
                    <span style={{
                      background: canAfford ? '#1a1200' : 'transparent',
                      border: `1px solid ${canAfford ? '#c8a800' : '#333'}`,
                      color: canAfford ? '#ffd700' : '#444',
                      padding: '2px 6px', fontSize: 6, flexShrink: 0,
                    }}>
                      💰{choice.goldCost}
                    </span>
                  )}
                </button>
              )
            })
          ) : (
            <button onClick={onContinue} style={{
              background: '#12102a',
              border: '2px solid #a78bfa',
              boxShadow: 'inset 0 0 0 1px #2a0060, 2px 2px 0 #000',
              color: '#a78bfa', cursor: 'pointer',
              padding: '12px', fontSize: 7, fontFamily: PX,
              letterSpacing: 1, textAlign: 'center',
              width: '100%',
            }}>
              ПРОДОЛЖИТЬ →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
