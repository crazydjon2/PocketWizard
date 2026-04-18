export type EventEffect =
  | { type: 'gold';              amount: number }
  | { type: 'hp';                amount: number }
  | { type: 'maxHp';             amount: number }
  | { type: 'item';              itemId: string }
  | { type: 'chargesAll';        amount: number }           // +/- charges on every spell
  | { type: 'chargesRandom';     amount: number; count: number } // +/- charges on N random spells
  | { type: 'restoreAllCharges' }                           // restore all spells to max charges
  | { type: 'removeRandomItem' }                            // steal a random owned item
  | { type: 'spellDamageRandom'; amount: number }           // random spell +/- baseDamage permanently
  | { type: 'multi';             effects: EventEffect[] }
  | { type: 'gamble';            chance: number; win: EventEffect; lose: EventEffect }
  | { type: 'nothing' }

export interface EventCondition {
  minHp?:        number
  minGold?:      number
  minHpPercent?: number
  hasItems?:     true    // requires at least 1 owned item
  hasSpells?:    true    // requires at least 1 non-infinite spell in hand
}

export interface EventChoice {
  text:      string
  effect:    EventEffect
  goldCost?: number
  hpCost?:   number
  requires?: EventCondition
}

export interface GameEvent {
  id:      string
  title:   string
  desc:    string
  icon:    string
  choices: EventChoice[]
}

export const ALL_EVENTS: GameEvent[] = [

  // ── Заклинания ───────────────────────────────────────────────────
  {
    id: 'ruined_shrine', title: 'Разрушенное Святилище', icon: '🕍',
    desc: 'Старое святилище магии. Камни потрескались, но сила ещё чувствуется.',
    choices: [
      { text: 'Восполнить все заряды (−20 HP)',
        effect: { type: 'restoreAllCharges' },
        hpCost: 20 },
      { text: 'Усилить случайное заклинание (−25 💰)',
        effect: { type: 'spellDamageRandom', amount: 3 },
        goldCost: 25,
        requires: { minGold: 25, hasSpells: true } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'cursed_fog', title: 'Проклятый Туман', icon: '🌫️',
    desc: 'Густой туман накрывает тропу. В нём слышны голоса — и они забирают силу.',
    choices: [
      { text: 'Пробиться насквозь',
        effect: { type: 'multi', effects: [
          { type: 'chargesAll', amount: -1 },
          { type: 'hp', amount: -10 },
        ]} },
      { text: 'Обойти (−20 💰)',
        effect: { type: 'nothing' },
        goldCost: 20,
        requires: { minGold: 20 } },
      { text: 'Поглотить туман (риск)',
        effect: { type: 'gamble', chance: 0.45,
          win:  { type: 'spellDamageRandom', amount: 4 },
          lose: { type: 'chargesAll', amount: -2 },
        },
        requires: { hasSpells: true } },
    ],
  },
  {
    id: 'wandering_mage', title: 'Странствующий Маг', icon: '🧙',
    desc: 'Маг с посохом предлагает услуги. За знания он берёт знания.',
    choices: [
      { text: 'Обменять заряды (+3 урон случайному заклинанию)',
        effect: { type: 'multi', effects: [
          { type: 'chargesRandom', amount: -2, count: 1 },
          { type: 'spellDamageRandom', amount: 3 },
        ]},
        requires: { hasSpells: true } },
      { text: 'Купить восполнение зарядов (−30 💰)',
        effect: { type: 'chargesAll', amount: 2 },
        goldCost: 30,
        requires: { minGold: 30, hasSpells: true } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },

  // ── Предметы ─────────────────────────────────────────────────────
  {
    id: 'thief_night', title: 'Ночной Вор', icon: '🥷',
    desc: 'Утром обнаруживаешь, что кто-то рылся в вещах.',
    choices: [
      { text: 'Позволить — он оставил компенсацию',
        effect: { type: 'multi', effects: [
          { type: 'removeRandomItem' },
          { type: 'gold', amount: 35 },
        ]},
        requires: { hasItems: true } },
      { text: 'Догнать и отобрать (−25 HP)',
        effect: { type: 'nothing' },
        hpCost: 25,
        requires: { hasItems: true } },
      { text: 'Ничего не пропало',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'treasure_merchant', title: 'Торговец Реликвиями', icon: '🧳',
    desc: 'Торговец скупает артефакты. Платит щедро — но берёт лучшее.',
    choices: [
      { text: 'Продать случайный предмет (+50 💰)',
        effect: { type: 'multi', effects: [
          { type: 'removeRandomItem' },
          { type: 'gold', amount: 50 },
        ]},
        requires: { hasItems: true } },
      { text: 'Купить реликвию (−45 💰)',
        effect: { type: 'item', itemId: 'demon_contract' },
        goldCost: 45,
        requires: { minGold: 45 } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'dragon_hoard', title: 'Логово Дракона', icon: '🐉',
    desc: 'Дракон дремлет на куче золота. Один предмет явно лишний для него.',
    choices: [
      { text: 'Предложить обмен (отдать предмет)',
        effect: { type: 'multi', effects: [
          { type: 'removeRandomItem' },
          { type: 'gold', amount: 60 },
          { type: 'hp', amount: 20 },
        ]},
        requires: { hasItems: true } },
      { text: 'Тихо взять золото (риск)',
        effect: { type: 'gamble', chance: 0.50,
          win:  { type: 'gold', amount: 55 },
          lose: { type: 'multi', effects: [
            { type: 'hp',   amount: -40 },
            { type: 'chargesAll', amount: -1 },
          ]},
        } },
      { text: 'Обойти стороной',
        effect: { type: 'nothing' } },
    ],
  },

  // ── Смешанные / риск ────────────────────────────────────────────
  {
    id: 'demon_merchant', title: 'Демон-Торговец', icon: '👹',
    desc: 'Торговец в чёрном плаще. Его товар уникален. Цена — выбор.',
    choices: [
      { text: 'Заплатить кровью (−20 HP)',
        effect: { type: 'item', itemId: 'demon_contract' },
        hpCost: 20 },
      { text: 'Отдать силу заклинаний',
        effect: { type: 'multi', effects: [
          { type: 'item', itemId: 'demon_contract' },
          { type: 'chargesAll', amount: -1 },
        ]},
        requires: { hasSpells: true } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'fate_trial', title: 'Испытание Судьбы', icon: '🎲',
    desc: 'На пне стоит стол с картами. Незнакомец кивает — сыграем?',
    choices: [
      { text: 'Поставить предмет (выиграть — получить обратно + 40💰)',
        effect: { type: 'gamble', chance: 0.45,
          win:  { type: 'gold', amount: 40 },
          lose: { type: 'removeRandomItem' },
        },
        requires: { hasItems: true } },
      { text: 'Поставить золото (−25 💰)',
        effect: { type: 'gamble', chance: 0.55,
          win:  { type: 'gold', amount: 55 },
          lose: { type: 'chargesRandom', amount: -1, count: 2 },
        },
        goldCost: 25,
        requires: { minGold: 25 } },
      { text: 'Не играть',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'warrior_tomb', title: 'Склеп Воина', icon: '⚔️',
    desc: 'Внутри — доспехи и оружие. Дух воина предлагает испытание.',
    choices: [
      { text: 'Принять испытание (риск)',
        effect: { type: 'gamble', chance: 0.60,
          win:  { type: 'multi', effects: [
            { type: 'spellDamageRandom', amount: 4 },
            { type: 'maxHp', amount: 10 },
          ]},
          lose: { type: 'multi', effects: [
            { type: 'chargesRandom', amount: -2, count: 2 },
            { type: 'hp', amount: -20 },
          ]},
        },
        requires: { hasSpells: true } },
      { text: 'Взять золото и уйти (+25 💰)',
        effect: { type: 'gold', amount: 25 } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'witch', title: 'Лесная Ведьма', icon: '🧙‍♀️',
    desc: 'Ведьма смотрит в котёл. Видит твой путь — и предлагает изменить его.',
    choices: [
      { text: 'Попросить метку (−15 HP)',
        effect: { type: 'item', itemId: 'witch_mark' },
        hpCost: 15,
        requires: { minHp: 60 } },
      { text: 'Зарядить заклинания (−1 случайный предмет)',
        effect: { type: 'multi', effects: [
          { type: 'restoreAllCharges' },
          { type: 'removeRandomItem' },
        ]},
        requires: { hasItems: true, hasSpells: true } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'star_shard', title: 'Звёздный Осколок', icon: '⭐',
    desc: 'С неба упал камень, светящийся мягким светом. Тёплый на ощупь.',
    choices: [
      { text: 'Взять осколок (−10 макс. HP)',
        effect: { type: 'multi', effects: [
          { type: 'item', itemId: 'star_shard' },
          { type: 'maxHp', amount: -10 },
        ]} },
      { text: 'Влить в заклинания (+3 заряда всем)',
        effect: { type: 'chargesAll', amount: 3 },
        requires: { hasSpells: true } },
      { text: 'Продать (+50 💰)',
        effect: { type: 'gold', amount: 50 } },
    ],
  },
  {
    id: 'swamp', title: 'Гиблое Болото', icon: '🌿',
    desc: 'Болото затягивает. Каждый шаг — усилие. Магия рассеивается.',
    choices: [
      { text: 'Идти напролом',
        effect: { type: 'multi', effects: [
          { type: 'chargesAll', amount: -1 },
          { type: 'hp', amount: -15 },
        ]} },
      { text: 'Обойти (−20 💰)',
        effect: { type: 'nothing' },
        goldCost: 20,
        requires: { minGold: 20 } },
      { text: 'Ускориться (риск, нужно ≥70% HP)',
        effect: { type: 'gamble', chance: 0.65,
          win:  { type: 'nothing' },
          lose: { type: 'multi', effects: [
            { type: 'hp', amount: -30 },
            { type: 'chargesAll', amount: -2 },
          ]},
        },
        requires: { minHpPercent: 70 } },
    ],
  },
  {
    id: 'bandit', title: 'Разбойник', icon: '🗡️',
    desc: 'Разбойник перекрывает путь. Уверен в себе — слишком.',
    choices: [
      { text: 'Откупиться (−20 💰)',
        effect: { type: 'nothing' },
        goldCost: 20 },
      { text: 'Дать отпор (−20 HP)',
        effect: { type: 'gold', amount: 40 },
        hpCost: 20 },
      { text: 'Запугать (нужно ≥70% HP)',
        effect: { type: 'gold', amount: 25 },
        requires: { minHpPercent: 70 } },
    ],
  },
  {
    id: 'ghost_warrior', title: 'Призрак Воина', icon: '👻',
    desc: 'Призрак держит проклятую монету — и ищет того, кто достоин.',
    choices: [
      { text: 'Доказать силу (−25 HP)',
        effect: { type: 'item', itemId: 'cursed_coin' },
        hpCost: 25,
        requires: { minHp: 35 } },
      { text: 'Предложить предмет',
        effect: { type: 'multi', effects: [
          { type: 'removeRandomItem' },
          { type: 'item', itemId: 'cursed_coin' },
        ]},
        requires: { hasItems: true } },
      { text: 'Уйти',
        effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'rain', title: 'Золотой Дождь', icon: '🌧️',
    desc: 'С небес падают золотые монеты. Редкое явление.',
    choices: [
      { text: 'Собрать монеты (+40 💰)',
        effect: { type: 'gold', amount: 40 } },
    ],
  },
]
