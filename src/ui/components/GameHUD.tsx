import { BIOME_EVERY, PX } from '../../constants'
import s from './GameHUD.module.css'

interface Props {
  gold:           number
  stepCount:      number
  hitStreak:      number
  playerHp:       number
  effectiveMaxHp: number
  onStats:        () => void
}

export function GameHUD({ gold, stepCount, hitStreak, playerHp, effectiveMaxHp, onStats }: Props) {
  const stepsLeft = BIOME_EVERY - (stepCount % BIOME_EVERY)
  const pct       = Math.max(0, Math.min(1, playerHp / effectiveMaxHp))
  const hpColor   = pct > 0.5 ? '#3af3a0' : pct > 0.25 ? '#f0c040' : '#f04545'
  const isLow     = pct <= 0.25

  return (
    <div className={s.bar} style={{ fontFamily: PX }}>

      {/* Gold */}
      <div className={s.gold}>
        <div className={s.goldCoin} />
        <span className={s.goldVal}>{gold}</span>
      </div>

      <div className={s.sep} />

      {/* HP */}
      <div className={s.hp}>
        <span
          className={s.hpHeart}
          style={{
            filter: isLow ? 'drop-shadow(0 0 5px #f04545)' : 'none',
            animation: isLow ? `hpPulse 1s ease-in-out infinite alternate` : 'none',
          }}
        >❤</span>
        <div className={s.hpBlock}>
          <div className={s.hpNumRow}>
            <span className={s.hpCurrent} style={{ color: hpColor }}>{playerHp}</span>
            <span className={s.hpMax}>/{effectiveMaxHp}</span>
          </div>
          <div className={s.hpTrack}>
            <div
              className={s.hpFill}
              style={{
                width: `${pct * 100}%`,
                background: `linear-gradient(90deg, ${hpColor}88, ${hpColor})`,
                boxShadow: isLow ? `0 0 6px ${hpColor}` : `0 0 4px ${hpColor}66`,
              }}
            />
            {[0.25, 0.5, 0.75].map(t => (
              <div key={t} className={s.hpTick} style={{ left: `${t * 100}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className={s.spacer} />

      {hitStreak >= 3 && (
        <div className={s.streak}>
          <span className={s.streakIcon}>🔥</span>
          <span className={s.streakVal}>×{hitStreak}</span>
        </div>
      )}

      <div className={s.spacer} />

      {/* Stats button */}
      <button className={s.statsBtn} onClick={onStats}>
        {[['#1a1a1a','#2e2e2e','#1a1a1a'], ['#2e2e2e','#c8a800','#2e2e2e'], ['#1a1a1a','#2e2e2e','#1a1a1a']].map((row, ri) => (
          <div key={ri} className={s.statsBtnRow}>
            {row.map((c, i) => <div key={i} className={s.statsBtnPx} style={{ background: c }} />)}
          </div>
        ))}
      </button>

      <div className={s.sep} />

      {/* Steps to next biome */}
      <div className={s.steps}>
        <span className={s.stepsIcon}>⚑</span>
        <span className={s.stepsVal}>{stepsLeft}</span>
      </div>

    </div>
  )
}
