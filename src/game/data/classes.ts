import type { Spell } from './spells'
import { ALL_SPELLS } from './spells'

export interface ElemStat {
  element: string
  value: number   // положительное = бонус к урону / сопр., отрицательное = уязвимость
}

export interface ClassDef {
  id:           string
  name:         string
  tagline:      string
  flavor:       string
  icon:         string
  element:      string
  color:        string
  startingHp:   number
  startingGold: number
  spells:       Spell[]   // без PUNCH_SPELL — он добавляется CardHand автоматически
  statNotes:    string[]  // пояснения к стилю игры
  dmgBonus:     ElemStat[]  // бонус к урону своей стихии
  resist:       ElemStat[]  // сопротивление / уязвимость к входящему урону
}

const sp = (id: string) => ALL_SPELLS.find(s => s.id === id)!

export const ALL_CLASSES: ClassDef[] = [
  {
    id:           'fire_mage',
    name:         'Огненный маг',
    tagline:      'Стекло с огромным уроном',
    flavor:       'Огонь не знает жалости — и его слуга тоже.',
    icon:         '🔥',
    element:      'fire',
    color:        '#f97316',
    startingHp:   70,
    startingGold: 0,
    spells:       [sp('fireball'), sp('fireball')],
    statNotes:    [],
    dmgBonus:     [{ element: 'fire',  value: 5 }],
    resist:       [{ element: 'water', value: -4 }],
  },
  {
    id:           'water_mage',
    name:         'Водный маг',
    tagline:      'Исцеление за убийства',
    flavor:       'Вода принимает любую форму — и любой удар.',
    icon:         '💧',
    element:      'water',
    color:        '#38bdf8',
    startingHp:   110,
    startingGold: 0,
    spells:       [sp('water_wave'), sp('water_wave')],
    statNotes:    [],
    dmgBonus:     [{ element: 'water', value: 4 }],
    resist:       [{ element: 'fire',  value: -5 }, { element: 'water', value: 3 }],
  },
  {
    id:           'warrior',
    name:         'Воин',
    tagline:      'Танк. Просто не умирает.',
    flavor:       'Он не колдует. Он просто не падает.',
    icon:         '⚔️',
    element:      'physical',
    color:        '#94a3b8',
    startingHp:   145,
    startingGold: 0,
    spells:       [sp('staff'), sp('staff')],
    statNotes:    [],
    dmgBonus:     [{ element: 'physical', value: 4 }],
    resist:       [{ element: 'physical', value: 4 }, { element: 'dark', value: -3 }],
  },
  {
    id:           'dark_mage',
    name:         'Тёмный маг',
    tagline:      'Высасывает силу из врагов',
    flavor:       'Сила рождается из тени.',
    icon:         '🌑',
    element:      'dark',
    color:        '#a855f7',
    startingHp:   80,
    startingGold: 0,
    spells:       [sp('dark_essence'), sp('dark_essence')],
    statNotes:    [],
    dmgBonus:     [{ element: 'dark', value: 5 }],
    resist:       [{ element: 'dark', value: 4 }, { element: 'fire', value: -3 }],
  },
  {
    id:           'storm_mage',
    name:         'Громовержец',
    tagline:      'Максимальный урон, нулевая защита',
    flavor:       'Удар. Молния. Конец.',
    icon:         '⚡',
    element:      'lightning',
    color:        '#facc15',
    startingHp:   65,
    startingGold: 0,
    spells:       [sp('lightning'), sp('lightning')],
    statNotes:    [],
    dmgBonus:     [{ element: 'lightning', value: 6 }],
    resist:       [{ element: 'earth',     value: -4 }],
  },
  {
    id:           'druid',
    name:         'Друид',
    tagline:      'Стабильный урон, много HP',
    flavor:       'Земля держит всех. Даже врагов.',
    icon:         '🪨',
    element:      'earth',
    color:        '#84cc16',
    startingHp:   120,
    startingGold: 0,
    spells:       [sp('earth_slam'), sp('earth_slam')],
    statNotes:    [],
    dmgBonus:     [{ element: 'earth',     value: 4 }],
    resist:       [{ element: 'earth',     value: 3 }, { element: 'lightning', value: -3 }],
  },
  {
    id:           'universal',
    name:         'Универсал',
    tagline:      'Гибкость вместо специализации',
    flavor:       'Без стихии нет слабости. Есть только выбор.',
    icon:         '🌀',
    element:      'physical',
    color:        '#c8a800',
    startingHp:   95,
    startingGold: 0,
    spells:       [sp('fireball'), sp('water_wave')],
    statNotes:    [],
    dmgBonus:     [{ element: 'fire', value: 2 }, { element: 'water', value: 2 }],
    resist:       [],
  },
]
