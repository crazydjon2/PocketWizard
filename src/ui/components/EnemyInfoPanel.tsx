import type { EnemyDef } from '@game/data/enemies'
import { ELEM_DISPLAY, PX } from '../../constants'
import { PixelHpBar } from './PixelHpBar'
import s from './EnemyInfoPanel.module.css'

interface Props {
  enemy:     EnemyDef
  enemyHp:   number
  flatDef:   number
  onClose:   () => void
}

export function EnemyInfoPanel({ enemy, enemyHp, flatDef, onClose }: Props) {
  const pct       = Math.max(0, Math.min(1, enemyHp / enemy.hp))
  const hpColor   = pct > 0.5 ? '#f04545' : pct > 0.25 ? '#f0a030' : '#ff3030'
  const elem      = ELEM_DISPLAY.find(d => d.key === enemy.element)
  const incomingDmg = Math.max(1, enemy.damage - flatDef)
  const tierColor = enemy.tier === 3 ? '#f04545' : enemy.tier === 2 ? '#f0a030' : '#888'

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.panel} style={{ fontFamily: PX }} onClick={e => e.stopPropagation()}>

        <div className={s.header}>
          <div className={s.headerLeft}>
            <span className={s.headerIcon}>{elem?.icon ?? '👾'}</span>
            <span className={s.headerName}>{enemy.name.toUpperCase()}</span>
          </div>
          <button className={s.closeBtn} style={{ fontFamily: PX }} onClick={onClose}>✕</button>
        </div>

        <div className={s.hpSection}>
          <div className={s.hpBarWrap}><PixelHpBar pct={pct * 100} color={hpColor} /></div>
          <div className={s.hpRow}>
            <span className={s.hpLabel}>❤ HP</span>
            <span style={{ color: hpColor, fontSize: 9 }}>
              {enemyHp}<span className={s.hpMax}> / {enemy.hp}</span>
            </span>
          </div>
        </div>

        <div className={s.stats}>
          <div className={s.statRow}>
            <span className={s.statLabel}>⚔ Атакует</span>
            <span className={s.statVal} style={{ color: '#f97316' }}>
              {incomingDmg}
              {flatDef > 0 && <span style={{ color: '#444', fontSize: 5 }}> ({enemy.damage}−{flatDef})</span>}
            </span>
          </div>

          {elem && (
            <div className={s.statRow}>
              <span className={s.statLabel}>⚡ Стихия атаки</span>
              <span className={s.statVal} style={{ color: elem.color }}>{elem.icon} {elem.label}</span>
            </div>
          )}

          <div className={s.statRow}>
            <span className={s.statLabel}>★ Уровень угрозы</span>
            <span className={s.statVal} style={{ color: tierColor }}>
              {enemy.tier === 1 ? 'Слабый' : enemy.tier === 2 ? 'Опасный' : 'Элита'}
            </span>
          </div>

          {enemy.weaknesses && enemy.weaknesses.length > 0 && (
            <div className={s.statRow}>
              <span className={s.statLabel}>💥 Слабость ×1.5</span>
              <div className={s.elemList}>
                {enemy.weaknesses.map(w => {
                  const ed = ELEM_DISPLAY.find(d => d.key === w)
                  return <span key={w} className={s.elemWeak}>{ed?.icon} {ed?.label}</span>
                })}
              </div>
            </div>
          )}

          {enemy.resistances && enemy.resistances.length > 0 && (
            <div className={s.statRow}>
              <span className={s.statLabel}>🛡 Сопр. ×0.5</span>
              <div className={s.elemList}>
                {enemy.resistances.map(r => {
                  const ed = ELEM_DISPLAY.find(d => d.key === r)
                  return <span key={r} className={s.elemResist}>{ed?.icon} {ed?.label}</span>
                })}
              </div>
            </div>
          )}

          <div className={s.statRow}>
            <span className={s.statLabel}>💰 Награда</span>
            <span className={s.statVal} style={{ color: '#fbbf24' }}>{enemy.goldReward}</span>
          </div>
        </div>

        {enemy.description && (
          <div className={s.description}>
            <p className={s.descText}>"{enemy.description}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
