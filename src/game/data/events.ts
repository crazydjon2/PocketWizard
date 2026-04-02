export type EventEffect =
  | { type: 'gold';    amount: number }
  | { type: 'hp';      amount: number }
  | { type: 'nothing' }

export interface EventChoice {
  text: string
  effect: EventEffect
  goldCost?: number
}

export interface GameEvent {
  id: string
  title: string
  desc: string
  icon: string
  choices: EventChoice[]
}

export const ALL_EVENTS: GameEvent[] = [
  {
    id: 'altar', title: 'Забытый Алтарь', icon: '🗿',
    desc: 'Древний алтарь светится тусклым светом. Силы неизвестны.',
    choices: [
      { text: 'Помолиться (+20 HP)',  effect: { type: 'hp',   amount:  20 } },
      { text: 'Осквернить (+30 💰)',  effect: { type: 'gold', amount:  30 } },
      { text: 'Уйти',                 effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'wanderer', title: 'Странник', icon: '🧙',
    desc: 'На дороге сидит старый странник. В его глазах мудрость.',
    choices: [
      { text: 'Выслушать (+25 HP)',   effect: { type: 'hp',   amount:  25 } },
      { text: 'Обобрать (+25 💰)',    effect: { type: 'gold', amount:  25 } },
      { text: 'Пройти мимо',          effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'rain', title: 'Золотой Дождь', icon: '🌧️',
    desc: 'С небес падают золотые монеты. Удача на твоей стороне!',
    choices: [
      { text: 'Собрать монеты (+35 💰)', effect: { type: 'gold', amount: 35 } },
    ],
  },
  {
    id: 'trap', title: 'Ловушка', icon: '⚠️',
    desc: 'Ты замечаешь ловушку на дороге. Как поступишь?',
    choices: [
      { text: 'Обойти (+10 💰)',       effect: { type: 'gold', amount:  10 } },
      { text: 'Активировать (−20 HP)', effect: { type: 'hp',   amount: -20 } },
    ],
  },
  {
    id: 'chest_event', title: 'Таинственный Сундук', icon: '📦',
    desc: 'Закрытый сундук лежит на дороге. Внутри что-то гремит.',
    choices: [
      { text: 'Открыть (+30 💰)', effect: { type: 'gold', amount: 30 } },
      { text: 'Не трогать',       effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'healer', title: 'Знахарка', icon: '💉',
    desc: 'Знахарка предлагает своё снадобье за скромную плату.',
    choices: [
      { text: 'Купить (+40 HP)', effect: { type: 'hp', amount: 40 }, goldCost: 20 },
      { text: 'Отказаться',      effect: { type: 'nothing' } },
    ],
  },
  {
    id: 'bandit', title: 'Разбойник', icon: '🗡️',
    desc: 'Разбойник преграждает путь. Откупиться или рискнуть?',
    choices: [
      { text: 'Откупиться (−15 💰)', effect: { type: 'gold', amount: -15 } },
      { text: 'Дать отпор (−15 HP)', effect: { type: 'hp',   amount: -15 } },
    ],
  },
]
