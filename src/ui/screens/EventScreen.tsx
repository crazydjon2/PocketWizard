import type { GameEvent, EventChoice } from '@game/data/events'
import { PX } from '../../constants'
import s from './EventScreen.module.css'

interface Props {
  event:      GameEvent
  resolved:   boolean
  gold:       number
  onChoice:   (choice: EventChoice) => void
  onContinue: () => void
}

export function EventScreen({ event, resolved, gold, onChoice, onContinue }: Props) {
  return (
    <div className={s.backdrop}>
      <div className={s.panel} style={{ fontFamily: PX }}>

        {/* Header strip */}
        <div className={s.header}>
          <span className={s.headerIcon}>{event.icon}</span>
          <span className={s.headerTitle}>{event.title.toUpperCase()}</span>
        </div>

        {/* Description */}
        <div className={s.desc}>
          <p className={s.descText}>{event.desc}</p>
        </div>

        {/* Choices */}
        <div className={s.choices}>
          {!resolved ? (
            event.choices.map((choice, idx) => {
              const hasGoldCost = !!choice.goldCost
              const canAfford   = !hasGoldCost || gold >= (choice.goldCost ?? 0)
              return (
                <button
                  key={idx}
                  onClick={() => canAfford && onChoice(choice)}
                  disabled={!canAfford}
                  className={`${s.choiceBtn} ${canAfford ? s['choiceBtn--on'] : s['choiceBtn--off']}`}
                  style={{ fontFamily: PX }}
                >
                  <span>▶ {choice.text}</span>
                  {hasGoldCost && (
                    <span className={`${s.goldCost} ${canAfford ? s['goldCost--on'] : s['goldCost--off']}`}>
                      💰{choice.goldCost}
                    </span>
                  )}
                </button>
              )
            })
          ) : (
            <button onClick={onContinue} className={s.continueBtn} style={{ fontFamily: PX }}>
              ПРОДОЛЖИТЬ →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
