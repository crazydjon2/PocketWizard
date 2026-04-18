import type { ElemType } from './spells'

export type ItemEffect =
  | { type: 'lifeSteal'; amount: number }           // +N HP за каждый удар заклинанием
  | { type: 'lastChargeDamage'; bonus: number }     // +N урона когда у заклинания последний заряд
  | { type: 'regenPerRoom'; amount: number }        // +N HP при переходе в новую комнату
  | { type: 'goldScaling'; per: number }            // +1 урон за каждые N монет
  | { type: 'firstHitBonus'; bonus: number }        // +N урона к первому удару в каждом бою
  | { type: 'elementStreak'; bonus: number }        // +N урона при повторе той же стихии
  | { type: 'chargePreserve'; chance: number }      // шанс не потерять заряд (0–1)
  | { type: 'fireBurn'; ratio: number }             // огонь: +ratio*100% урона поджогом
  | { type: 'waterKillHeal'; amount: number }       // вода: убийство = +N HP
  | { type: 'lightningChain'; chance: number }      // молния: шанс ударить ещё раз (×0.5)
  | { type: 'earthArmor'; amount: number }          // земля: удар = -N к следующему удару врага
  | { type: 'darkDrain'; ratio: number }            // тьма: восстанавливает ratio*100% урона HP
  | { type: 'physicalMomentum'; bonus: number }     // физика: +bonus к урону за каждый удар в бою
  | { type: 'flatResistElement'; element: ElemType; amount: number }  // >0 защита, <0 уязвимость
  | { type: 'goldBonus'; amount: number }
  | { type: 'flatAttack'; amount: number }
  | { type: 'flatAttackElement'; element: ElemType; amount: number }
  | { type: 'flatDefense'; amount: number }
  | { type: 'maxHp'; amount: number }
  | { type: 'healStreak'; count: number; hp: number }
  | { type: 'moreChoices' }
  | { type: 'selfDamageOnHit'; amount: number }
  | { type: 'lowHpMultiplier'; threshold: number; multiplier: number }
  | { type: 'restHealBonus';  amount: number }
  | { type: 'restChargeBonus'; amount: number }
  | { type: 'elementDiversity'; bonus: number }   // +bonus per unique element used this fight
  | { type: 'chargeBonus'; bonus: number }         // +bonus per remaining charge on spell
  | { type: 'shopDiscount'; amount: number }       // flat gold reduction on shop prices
  | { type: 'elementCombo'; from: ElemType; to: ElemType; effect: 'damage' | 'heal' | 'shield' | 'weaken'; amount: number }

export type ItemRarity = 'common' | 'rare' | 'epic'

export interface GameItem {
  id: string
  name: string
  icon: string
  flavor: string       // short lore line, shown below effects
  effects: ItemEffect[]
  rarity: ItemRarity
  eventOnly?: boolean  // only obtainable through events, never in shop/chest
  description?: string
}

const ITEMS_WITH_ICONS = new Set([
  'arcane_shard', 'arcane_tome', 'ash_brand',
  'battle_focus', 'battle_tome', 'berserker_fist',
  'chaos_crystal', 'charged_core',
  'cloth_bandage', 'coin_bag', 'conductor', 'crystal_lens', 'cursed_eye',
  'dark_mantle', 'dark_ring', 'dark_torch', 'death_wish', 'deep_chalice', 'dew_root',
  'discharger', 'earth_ring', 'echo_gem', 'ember_brand', 'executioner',
  'fire_mantle', 'fire_ring', 'fire_sigil', 'force_ring',
  'granite_bastion', 'granite_shell', 'guild_ring',
  'harmony_stone', 'healers_flask', 'herb_pouch',
  'inferno_core', 'iron_fist',
  'last_resort', 'leech_ring', 'life_bead', 'living_water', 'lucky_coin',
  'mana_crystal', 'merchant_eye', 'merchants_seal', 'midas_touch',
  'plasma_orb', 'prism', 'resonance_ring',
  'shadow_blade', 'shadow_leech', 'shadow_sigil', 'shock_fist', 'small_pouch',
  'steam_valve', 'stone_mantle', 'storm_fork', 'storm_ring',
  'storm_sigil', 'storm_tide',
  'tide_chalice', 'tide_sigil', 'tome', 'trade_token', 'twin_bolt',
  'vampire_fang', 'void_mist', 'void_parasite', 'void_tide',
  'wanderer_boots', 'water_ring', 'world_shard',
  // rune items (share visuals with element sigils)
  'fire_rune', 'water_rune', 'dark_rune', 'lightning_rune', 'earth_rune',
])

/** Returns path to item PNG icon, or null if no icon available */
export function itemIconSrc(id: string): string | null {
  return ITEMS_WITH_ICONS.has(id) ? `/assets/items/${id}.png` : null
}

const OPPOSITES: Partial<Record<ElemType, ElemType>> = {
  fire: 'water', water: 'fire',
  lightning: 'earth', earth: 'lightning',
  dark: 'physical', physical: 'dark',
}

function runeOf(element: ElemType, name: string, icon: string): GameItem {
  const opp = OPPOSITES[element]!
  return {
    id: `${element}_rune`, name, icon, rarity: 'common',
    flavor: 'Сила стихии требует жертвы.',
    effects: [
      { type: 'flatAttackElement', element, amount: 2 },
      { type: 'flatResistElement', element: opp, amount: -1 },
    ],
  }
}

export const ALL_ITEMS: GameItem[] = [
  // ══ COMMON ══════════════════════════════════════════════════════
  {
    id: 'fire_ring', name: 'Кольцо огня', icon: '🔴', rarity: 'common',
    flavor: 'Пламя бежит по жилам.',
    effects: [{ type: 'flatAttackElement', element: 'fire', amount: 1 }],
  },
  {
    id: 'water_ring', name: 'Кольцо воды', icon: '🔵', rarity: 'common',
    flavor: 'Холод дисциплинирует.',
    effects: [{ type: 'flatAttackElement', element: 'water', amount: 1 }],
  },
  {
    id: 'storm_ring', name: 'Кольцо бури', icon: '🟡', rarity: 'common',
    flavor: 'Статический разряд в каждом ударе.',
    effects: [{ type: 'flatAttackElement', element: 'lightning', amount: 1 }],
  },
  {
    id: 'earth_ring', name: 'Кольцо земли', icon: '🟤', rarity: 'common',
    flavor: 'Сила камня — в постоянстве.',
    effects: [{ type: 'flatAttackElement', element: 'earth', amount: 1 }],
  },
  {
    id: 'dark_ring', name: 'Кольцо тьмы', icon: '⚫', rarity: 'common',
    flavor: 'Темнота даёт силу.',
    effects: [{ type: 'flatAttackElement', element: 'dark', amount: 1 }],
  },
  {
    id: 'force_ring', name: 'Кольцо силы', icon: '⚪', rarity: 'common',
    flavor: 'Грубая сила без прикрас.',
    effects: [{ type: 'flatAttackElement', element: 'physical', amount: 1 }],
  },
  {
    id: 'lucky_coin', name: 'Монетка удачи', icon: '🪙', rarity: 'common',
    flavor: 'Судьба благосклонна к нищим.',
    effects: [
      { type: 'goldBonus', amount: 5 },
      { type: 'maxHp', amount: -5 },
    ],
  },
  {
    id: 'small_pouch', name: 'Кошелёк', icon: '👛', rarity: 'common',
    flavor: 'Лёгкий — не мешает в бою.',
    effects: [
      { type: 'goldBonus', amount: 6 },
    ],
  },
  runeOf('fire',      'Руна Огня',   '🔥'),
  runeOf('water',     'Руна Воды',   '💧'),
  runeOf('dark',      'Руна Тьмы',   '🌑'),
  runeOf('lightning', 'Руна Молнии', '⚡'),
  runeOf('earth',     'Руна Земли',  '🌿'),
  runeOf('physical',  'Руна Силы',   '⚔️'),

  // ── +HP ─────────────────────────────────────────────────────────
  {
    id: 'cloth_bandage', name: 'Льняная повязка', icon: '🩹', rarity: 'common',
    flavor: 'Простое, но надёжное.',
    effects: [{ type: 'maxHp', amount: 8 }],
  },
  {
    id: 'life_bead', name: 'Бусина жизни', icon: '🟢', rarity: 'common',
    flavor: 'Говорят, пульсирует в унисон с сердцем.',
    effects: [{ type: 'maxHp', amount: 12 }],
  },

  // ── Первый удар ──────────────────────────────────────────────────
  {
    id: 'charged_glove', name: 'Заряженная перчатка', icon: '🥊', rarity: 'common',
    flavor: 'Первый удар всегда самый сильный.',
    effects: [{ type: 'firstHitBonus', bonus: 4 }],
  },

  // ── Повтор стихии ────────────────────────────────────────────────
  {
    id: 'harmony_stone', name: 'Камень гармонии', icon: '🔗', rarity: 'common',
    flavor: 'Стихии усиляют друг друга в потоке.',
    effects: [{ type: 'elementStreak', bonus: 2 }],
  },

  // ── Шанс сохранить заряд ────────────────────────────────────────
  {
    id: 'arcane_shard', name: 'Магический осколок', icon: '🔷', rarity: 'common',
    flavor: 'Иногда магия возвращается.',
    effects: [{ type: 'chargePreserve', chance: 0.2 }],
  },

  // ══ RARE ════════════════════════════════════════════════════════
  {
    id: 'blade_oil', name: 'Масло клинка', icon: '⚗️', rarity: 'rare',
    flavor: 'Каждый удар отдаётся в ладони.',
    effects: [
      { type: 'flatAttack', amount: 3 },
      { type: 'selfDamageOnHit', amount: 1 },
    ],
  },
  {
    id: 'fire_sigil', name: 'Печать огня', icon: '🔥', rarity: 'rare',
    flavor: 'Огонь всесилен — но вода его гасит.',
    effects: [
      { type: 'flatAttackElement', element: 'fire', amount: 5 },
      { type: 'flatResistElement', element: 'water', amount: -2 },
    ],
  },
  {
    id: 'storm_sigil', name: 'Печать бури', icon: '⚡', rarity: 'rare',
    flavor: 'Молния ищет землю.',
    effects: [
      { type: 'flatAttackElement', element: 'lightning', amount: 5 },
      { type: 'flatResistElement', element: 'earth', amount: -2 },
    ],
  },
  {
    id: 'shadow_sigil', name: 'Печать тени', icon: '🌑', rarity: 'rare',
    flavor: 'Тьма уязвима для стали.',
    effects: [
      { type: 'flatAttackElement', element: 'dark', amount: 5 },
      { type: 'flatResistElement', element: 'physical', amount: -2 },
    ],
  },
  {
    id: 'tide_sigil', name: 'Печать прилива', icon: '🌊', rarity: 'rare',
    flavor: 'Вода гасит огонь, но сама горит.',
    effects: [
      { type: 'flatAttackElement', element: 'water', amount: 5 },
      { type: 'flatResistElement', element: 'fire', amount: -2 },
    ],
  },
  {
    id: 'coin_bag', name: 'Кошель', icon: '💰', rarity: 'rare',
    flavor: 'Руки заняты монетами.',
    effects: [
      { type: 'goldBonus', amount: 14 },
      { type: 'flatAttack', amount: -2 },
    ],
  },
  {
    id: 'fire_mantle', name: 'Огненная мантия', icon: '🧥', rarity: 'rare',
    flavor: 'Огонь защищает, но вода теряет силу.',
    effects: [
      { type: 'flatResistElement', element: 'fire', amount: 3 },
      { type: 'flatAttackElement', element: 'water', amount: -2 },
    ],
  },
  {
    id: 'dark_mantle', name: 'Тёмная мантия', icon: '🌒', rarity: 'rare',
    flavor: 'Тьма скрывает, но гасит пламя.',
    effects: [
      { type: 'flatResistElement', element: 'dark', amount: 3 },
      { type: 'flatAttackElement', element: 'fire', amount: -2 },
    ],
  },
  {
    id: 'battle_tome', name: 'Книга силы', icon: '📖', rarity: 'rare',
    flavor: 'Теория — враг инстинкта.',
    effects: [
      { type: 'flatAttack', amount: 2 },
      { type: 'flatResistElement', element: 'dark', amount: -2 },
    ],
  },
  {
    id: 'healstone', name: 'Камень исцеления', icon: '💎', rarity: 'rare',
    flavor: 'Сила уходит в восстановление.',
    effects: [
      { type: 'healStreak', count: 3, hp: 6 },
      { type: 'flatAttackElement', element: 'physical', amount: -1 },
    ],
  },
  {
    id: 'tome', name: 'Том знаний', icon: '📗', rarity: 'rare',
    flavor: 'Книжник слаб телом.',
    effects: [
      { type: 'moreChoices' },
      { type: 'flatResistElement', element: 'physical', amount: -2 },
    ],
  },
  {
    id: 'cursed_eye', name: 'Проклятый глаз', icon: '👁️', rarity: 'rare',
    flavor: 'Проклятье притягивает тьму.',
    effects: [
      { type: 'flatAttack', amount: 4 },
      { type: 'flatResistElement', element: 'dark', amount: -3 },
    ],
  },
  {
    id: 'adrenaline', name: 'Адреналин', icon: '💉', rarity: 'rare',
    flavor: 'В ярости теряешь осторожность.',
    effects: [
      { type: 'lowHpMultiplier', threshold: 0.3, multiplier: 2 },
      { type: 'flatResistElement', element: 'physical', amount: -2 },
    ],
  },
  {
    id: 'berserker_band', name: 'Обруч берсерка', icon: '🔴', rarity: 'rare',
    flavor: 'Боль превращается в ярость.',
    effects: [
      { type: 'lowHpMultiplier', threshold: 0.5, multiplier: 1.5 },
      { type: 'flatDefense', amount: -2 },
    ],
  },
  {
    id: 'leech_ring', name: 'Кольцо пиявки', icon: '🩸', rarity: 'rare',
    flavor: 'Холодная кровь не дружит с огнём.',
    effects: [
      { type: 'lifeSteal', amount: 1 },
      { type: 'flatAttackElement', element: 'fire', amount: -2 },
    ],
  },
  {
    id: 'last_resort', name: 'Последний довод', icon: '💥', rarity: 'rare',
    flavor: 'Отчаяние притягивает молнию.',
    effects: [
      { type: 'lastChargeDamage', bonus: 4 },
      { type: 'flatResistElement', element: 'lightning', amount: -2 },
    ],
  },
  {
    id: 'wanderer_boots', name: 'Сапоги странника', icon: '👢', rarity: 'rare',
    flavor: 'Долгий путь утомляет руку.',
    effects: [
      { type: 'regenPerRoom', amount: 3 },
      { type: 'flatAttack', amount: -1 },
    ],
  },
  {
    id: 'merchant_eye', name: 'Глаз торговца', icon: '🔍', rarity: 'rare',
    flavor: 'Кто считает монеты — тот силён.',
    effects: [
      { type: 'goldScaling', per: 15 },
    ],
  },

  {
    id: 'battle_focus', name: 'Боевой фокус', icon: '🎯', rarity: 'rare',
    flavor: 'Фокус на атаке — слепое пятно к земле.',
    effects: [
      { type: 'firstHitBonus', bonus: 9 },
      { type: 'flatResistElement', element: 'earth', amount: -2 },
    ],
  },
  {
    id: 'resonance_ring', name: 'Кольцо резонанса', icon: '🌀', rarity: 'rare',
    flavor: 'Монотонность ослабляет физическую защиту.',
    effects: [
      { type: 'elementStreak', bonus: 5 },
      { type: 'flatResistElement', element: 'physical', amount: -2 },
    ],
  },
  {
    id: 'echo_gem', name: 'Камень эха', icon: '💠', rarity: 'rare',
    flavor: 'Эхо отнимает силу удара.',
    effects: [
      { type: 'chargePreserve', chance: 0.35 },
      { type: 'flatAttack', amount: -1 },
    ],
  },

  // ══ EPIC ════════════════════════════════════════════════════════
  {
    id: 'vampire_fang', name: 'Клык вампира', icon: '🦷', rarity: 'epic',
    flavor: 'Каждый удар пьёт кровь.',
    effects: [
      { type: 'lifeSteal', amount: 2 },
      { type: 'maxHp', amount: -15 },
    ],
  },
  {
    id: 'executioner', name: 'Топор палача', icon: '🪓', rarity: 'epic',
    flavor: 'Последний удар — самый сильный.',
    effects: [
      { type: 'lastChargeDamage', bonus: 8 },
      { type: 'maxHp', amount: -12 },
    ],
  },
  {
    id: 'midas_touch', name: 'Прикосновение Мидаса', icon: '👑', rarity: 'epic',
    flavor: 'Золото — вместо заклинаний.',
    effects: [
      { type: 'goldScaling', per: 8 },
      { type: 'flatAttack', amount: -3 },
    ],
  },
  {
    id: 'blood_blade', name: 'Кровавый клинок', icon: '🗡️', rarity: 'epic',
    flavor: 'Твоя кровь — его пища.',
    effects: [
      { type: 'flatAttack', amount: 7 },
      { type: 'selfDamageOnHit', amount: 3 },
    ],
  },
  {
    id: 'death_wish', name: 'Желание смерти', icon: '💀', rarity: 'epic',
    flavor: 'Кто не боится умереть — непобедим.',
    effects: [
      { type: 'lowHpMultiplier', threshold: 0.2, multiplier: 3 },
      { type: 'maxHp', amount: -15 },
    ],
  },

  // ══ ELEMENT DIVERSITY (гибридный билд) ══════════════════════════
  {
    id: 'prism', name: 'Призма', icon: '🔷', rarity: 'common',
    flavor: 'Чем богаче цвет — тем ярче свет.',
    effects: [{ type: 'elementDiversity', bonus: 1 }],
  },
  {
    id: 'chaos_crystal', name: 'Кристалл хаоса', icon: '🌈', rarity: 'rare',
    flavor: 'Порядок слабее хаоса.',
    effects: [
      { type: 'elementDiversity', bonus: 2 },
      { type: 'flatAttack', amount: -2 },
    ],
  },
  {
    id: 'world_shard', name: 'Осколок мира', icon: '💠', rarity: 'epic',
    flavor: 'Все стихии — одна.',
    effects: [
      { type: 'elementDiversity', bonus: 3 },
      { type: 'maxHp', amount: -10 },
    ],
  },

  // ── Гибридные (двойные стихии) ───────────────────────────────────
  {
    id: 'plasma_orb', name: 'Плазменный шар', icon: '🟠', rarity: 'rare',
    flavor: 'Огонь и разряд — нестабильная смесь.',
    effects: [
      { type: 'flatAttackElement', element: 'fire',      amount: 2 },
      { type: 'flatAttackElement', element: 'lightning', amount: 2 },
      { type: 'selfDamageOnHit',   amount: 1 },
    ],
  },
  {
    id: 'dew_root', name: 'Корень росы', icon: '🌿', rarity: 'rare',
    flavor: 'Земля и вода питают друг друга.',
    effects: [
      { type: 'flatAttackElement', element: 'water', amount: 2 },
      { type: 'flatAttackElement', element: 'earth', amount: 2 },
      { type: 'regenPerRoom', amount: 1 },
    ],
  },
  {
    id: 'void_tide', name: 'Прилив бездны', icon: '🌊', rarity: 'rare',
    flavor: 'Тьма и вода — текут вместе.',
    effects: [
      { type: 'flatAttackElement', element: 'water', amount: 2 },
      { type: 'flatAttackElement', element: 'dark',  amount: 2 },
      { type: 'maxHp', amount: -5 },
    ],
  },
  {
    id: 'shock_fist', name: 'Громовой кулак', icon: '⚡', rarity: 'rare',
    flavor: 'Сталь проводит разряд.',
    effects: [
      { type: 'flatAttackElement', element: 'lightning', amount: 2 },
      { type: 'flatAttackElement', element: 'physical',  amount: 2 },
      { type: 'firstHitBonus', bonus: 3 },
    ],
  },
  {
    id: 'ash_brand', name: 'Пепельное клеймо', icon: '🖤', rarity: 'rare',
    flavor: 'Тёмный огонь сжигает душу.',
    effects: [
      { type: 'flatAttackElement', element: 'fire', amount: 2 },
      { type: 'flatAttackElement', element: 'dark', amount: 2 },
      { type: 'flatResistElement', element: 'water', amount: -1 },
    ],
  },
  {
    id: 'storm_tide', name: 'Штормовой прибой', icon: '🌩️', rarity: 'epic',
    flavor: 'Вода несёт молнию.',
    effects: [
      { type: 'flatAttackElement', element: 'water',     amount: 3 },
      { type: 'flatAttackElement', element: 'lightning', amount: 3 },
      { type: 'elementDiversity',  bonus: 1 },
    ],
  },

  // ══ CHARGE BONUS ════════════════════════════════════════════════
  {
    id: 'crystal_lens', name: 'Хрустальная линза', icon: '🔮', rarity: 'rare',
    flavor: 'Полный заряд — полная сила.',
    effects: [
      { type: 'chargeBonus', bonus: 2 },
      { type: 'flatAttack', amount: -1 },
    ],
  },
  {
    id: 'charged_core', name: 'Заряженное ядро', icon: '⚪', rarity: 'epic',
    flavor: 'Сила внутри — пока не истрачена.',
    effects: [
      { type: 'chargeBonus', bonus: 3 },
      { type: 'maxHp', amount: -12 },
    ],
  },

  // ══ SHOP DISCOUNT ════════════════════════════════════════════════
  {
    id: 'trade_token', name: 'Торговый жетон', icon: '🎫', rarity: 'common',
    flavor: 'Старый знакомый торговца.',
    effects: [{ type: 'shopDiscount', amount: 1 }],
  },
  {
    id: 'merchants_seal', name: 'Печать торговца', icon: '📜', rarity: 'rare',
    flavor: 'Торговцы уважают своих.',
    effects: [
      { type: 'shopDiscount', amount: 2 },
      { type: 'flatAttack', amount: -1 },
    ],
  },
  {
    id: 'guild_ring', name: 'Кольцо гильдии', icon: '🏷️', rarity: 'epic',
    flavor: 'Гильдия открывает любые двери.',
    effects: [
      { type: 'shopDiscount', amount: 4 },
      { type: 'maxHp', amount: -8 },
    ],
  },

  // ══ ELEMENT COMBOS ══════════════════════════════════════════════
  // damage combos
  {
    id: 'conductor', name: 'Проводник', icon: '🔌', rarity: 'common',
    flavor: 'Мокрое тело хорошо проводит ток.',
    effects: [{ type: 'elementCombo', from: 'water', to: 'lightning', effect: 'damage', amount: 5 }],
  },
  {
    id: 'discharger', name: 'Разрядник', icon: '⚡', rarity: 'rare',
    flavor: 'Земля поглощает молнию и возвращает удвоенной.',
    effects: [
      { type: 'elementCombo', from: 'lightning', to: 'earth', effect: 'damage', amount: 7 },
      { type: 'flatAttackElement', element: 'earth', amount: 1 },
    ],
  },
  {
    id: 'shadow_blade', name: 'Теневой клинок', icon: '🗡️', rarity: 'rare',
    flavor: 'Сталь разрывает броню — тьма проникает внутрь.',
    effects: [
      { type: 'elementCombo', from: 'physical', to: 'dark', effect: 'damage', amount: 8 },
      { type: 'flatAttackElement', element: 'dark', amount: 1 },
    ],
  },

  // heal combos
  {
    id: 'dark_torch', name: 'Тёмный факел', icon: '🕯️', rarity: 'rare',
    flavor: 'Проклятое пламя пьёт жизнь у врага.',
    effects: [{ type: 'elementCombo', from: 'dark', to: 'fire', effect: 'heal', amount: 5 }],
  },
  {
    id: 'living_water', name: 'Живая вода', icon: '💧', rarity: 'rare',
    flavor: 'Земля и вода вместе дают жизнь.',
    effects: [{ type: 'elementCombo', from: 'water', to: 'earth', effect: 'heal', amount: 4 }],
  },

  // shield combos
  {
    id: 'steel_earth', name: 'Стальная земля', icon: '🪨', rarity: 'rare',
    flavor: 'Физический удар от земли — непробиваем.',
    effects: [{ type: 'elementCombo', from: 'earth', to: 'physical', effect: 'shield', amount: 5 }],
  },
  {
    id: 'granite_shell', name: 'Гранитный панцирь', icon: '🏔️', rarity: 'epic',
    flavor: 'Ничто не пробьёт камень в движении.',
    effects: [
      { type: 'elementCombo', from: 'earth', to: 'physical', effect: 'shield', amount: 9 },
      { type: 'flatAttack', amount: -2 },
    ],
  },

  // weaken combos
  {
    id: 'steam_valve', name: 'Паровой клапан', icon: '♨️', rarity: 'rare',
    flavor: 'Пар ослепляет — следующий удар мимо.',
    effects: [{ type: 'elementCombo', from: 'fire', to: 'water', effect: 'weaken', amount: 5 }],
  },
  {
    id: 'void_mist', name: 'Туман пустоты', icon: '🌫️', rarity: 'epic',
    flavor: 'Тёмная вода дезориентирует.',
    effects: [
      { type: 'elementCombo', from: 'water', to: 'dark', effect: 'weaken', amount: 7 },
      { type: 'flatAttackElement', element: 'dark', amount: 2 },
    ],
  },

  // ══ ELEMENTAL UNIQUE ════════════════════════════════════════════
  // Fire — burn: extra damage after hit
  {
    id: 'ember_brand', name: 'Клеймо горящего', icon: '🔥', rarity: 'rare',
    flavor: 'Рана продолжает гореть.',
    effects: [
      { type: 'fireBurn', ratio: 0.3 },
      { type: 'flatAttackElement', element: 'fire', amount: 2 },
    ],
  },
  {
    id: 'inferno_core', name: 'Ядро инферно', icon: '🌋', rarity: 'epic',
    flavor: 'Пламя поглощает пламя.',
    effects: [
      { type: 'fireBurn', ratio: 0.5 },
      { type: 'flatAttackElement', element: 'fire', amount: 3 },
      { type: 'flatResistElement', element: 'water', amount: -3 },
    ],
  },

  // Water — kill heal: killing blow restores HP
  {
    id: 'tide_chalice', name: 'Чаша прилива', icon: '🏺', rarity: 'rare',
    flavor: 'Смерть врага питает жизнь.',
    effects: [
      { type: 'waterKillHeal', amount: 8 },
      { type: 'flatAttackElement', element: 'water', amount: 2 },
    ],
  },
  {
    id: 'deep_chalice', name: 'Чаша глубин', icon: '🌊', rarity: 'epic',
    flavor: 'Каждое убийство — волна исцеления.',
    effects: [
      { type: 'waterKillHeal', amount: 20 },
      { type: 'flatAttackElement', element: 'water', amount: 3 },
      { type: 'flatDefense', amount: -2 },
    ],
  },

  // Lightning — chain: chance to hit again for 50%
  {
    id: 'storm_fork', name: 'Вилы бури', icon: '⚡', rarity: 'rare',
    flavor: 'Молния ищет второй путь.',
    effects: [
      { type: 'lightningChain', chance: 0.3 },
      { type: 'flatAttackElement', element: 'lightning', amount: 2 },
    ],
  },
  {
    id: 'twin_bolt', name: 'Двойной разряд', icon: '🌩️', rarity: 'epic',
    flavor: 'Гром бьёт дважды.',
    effects: [
      { type: 'lightningChain', chance: 0.55 },
      { type: 'flatAttackElement', element: 'lightning', amount: 3 },
      { type: 'flatResistElement', element: 'earth', amount: -3 },
    ],
  },

  // Earth — armor: reduce next incoming hit after earth attack
  {
    id: 'stone_mantle', name: 'Каменный плащ', icon: '🪨', rarity: 'rare',
    flavor: 'Удар о камень отражается.',
    effects: [
      { type: 'earthArmor', amount: 3 },
      { type: 'flatAttackElement', element: 'earth', amount: 2 },
    ],
  },
  {
    id: 'granite_bastion', name: 'Гранитный бастион', icon: '🏔️', rarity: 'epic',
    flavor: 'Земля поглощает удары.',
    effects: [
      { type: 'earthArmor', amount: 6 },
      { type: 'flatAttackElement', element: 'earth', amount: 2 },
      { type: 'flatAttack', amount: -2 },
    ],
  },

  // Dark — drain: heal a fraction of dark damage dealt
  {
    id: 'shadow_leech', name: 'Тёмная пиявка', icon: '🌑', rarity: 'rare',
    flavor: 'Тьма забирает чужую жизнь.',
    effects: [
      { type: 'darkDrain', ratio: 0.2 },
      { type: 'flatAttackElement', element: 'dark', amount: 2 },
    ],
  },
  {
    id: 'void_parasite', name: 'Паразит пустоты', icon: '🕳️', rarity: 'epic',
    flavor: 'Чем больше урон — тем больше жизни.',
    effects: [
      { type: 'darkDrain', ratio: 0.4 },
      { type: 'flatAttackElement', element: 'dark', amount: 3 },
      { type: 'flatResistElement', element: 'physical', amount: -3 },
    ],
  },

  // Physical — momentum: +N damage per physical hit this fight
  {
    id: 'iron_fist', name: 'Железный кулак', icon: '🥊', rarity: 'rare',
    flavor: 'Каждый удар сильнее предыдущего.',
    effects: [
      { type: 'physicalMomentum', bonus: 1 },
      { type: 'flatAttackElement', element: 'physical', amount: 2 },
    ],
  },
  {
    id: 'berserker_fist', name: 'Кулак берсерка', icon: '💢', rarity: 'epic',
    flavor: 'Ярость накапливается с каждым ударом.',
    effects: [
      { type: 'physicalMomentum', bonus: 2 },
      { type: 'flatAttackElement', element: 'physical', amount: 3 },
      { type: 'maxHp', amount: -10 },
    ],
  },

  // ══ REST ITEMS ═══════════════════════════════════════════════════
  {
    id: 'herb_pouch', name: 'Мешочек трав', icon: '🌿', rarity: 'common',
    flavor: 'Горькие корни. Быстрое восстановление.',
    effects: [
      { type: 'restHealBonus', amount: 6 },
    ],
  },
  {
    id: 'healers_flask', name: 'Фляга целителя', icon: '🧪', rarity: 'rare',
    flavor: 'Один глоток — и рана затягивается.',
    effects: [
      { type: 'restHealBonus', amount: 14 },
      { type: 'flatDefense', amount: -1 },
    ],
  },
  {
    id: 'mana_crystal', name: 'Кристалл маны', icon: '🔮', rarity: 'common',
    flavor: 'Хранит частицу силы заклинаний.',
    effects: [
      { type: 'restChargeBonus', amount: 1 },
    ],
  },
  {
    id: 'arcane_tome', name: 'Тайный том', icon: '📚', rarity: 'rare',
    flavor: 'Книжник слаб к грубой силе.',
    effects: [
      { type: 'restChargeBonus', amount: 2 },
      { type: 'flatResistElement', element: 'physical', amount: -2 },
    ],
  },
]

/** Items obtainable only through events — never appear in shop or chest */
export const EVENT_ITEMS: GameItem[] = [
  {
    id: 'demon_contract', name: 'Демонический Договор', icon: '📜', rarity: 'epic',
    flavor: 'Цена была высокой. Но сила — реальна.',
    eventOnly: true,
    effects: [
      { type: 'flatAttack', amount: 8 },
      { type: 'maxHp', amount: -15 },
    ],
  },
  {
    id: 'blood_rune_carved', name: 'Кровавая Руна', icon: '🩸', rarity: 'rare',
    flavor: 'Кровь — лучшие чернила.',
    eventOnly: true,
    effects: [
      { type: 'firstHitBonus', bonus: 12 },
      { type: 'maxHp', amount: -8 },
    ],
  },
  {
    id: 'star_shard', name: 'Звёздный Осколок', icon: '⭐', rarity: 'epic',
    flavor: 'Свет давно мёртвой звезды.',
    eventOnly: true,
    effects: [
      { type: 'elementDiversity', bonus: 2 },
      { type: 'moreChoices' },
    ],
  },
  {
    id: 'cursed_coin', name: 'Проклятая Монета', icon: '🪙', rarity: 'rare',
    flavor: 'Золото никогда не бывает бесплатным.',
    eventOnly: true,
    effects: [
      { type: 'goldScaling', per: 20 },
      { type: 'maxHp', amount: -8 },
    ],
  },
  {
    id: 'witch_mark', name: 'Метка Ведьмы', icon: '🔮', rarity: 'rare',
    flavor: 'Она отметила тебя. Зачем — неизвестно.',
    eventOnly: true,
    effects: [
      { type: 'regenPerRoom', amount: 4 },
      { type: 'chargePreserve', chance: 0.25 },
    ],
  },
]
