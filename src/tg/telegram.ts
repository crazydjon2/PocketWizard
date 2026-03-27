// Обёртка над Telegram Mini Apps SDK
// Документация: https://docs.telegram-mini-apps.com/

let tg: ReturnType<typeof getTelegramApp> | null = null

function getTelegramApp() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Telegram?.WebApp
}

export function initTelegram() {
  tg = getTelegramApp()
  if (!tg) {
    console.warn('[TG] Запущено вне Telegram, используем моки')
    return
  }
  tg.ready()
  tg.expand()
  tg.setHeaderColor('#1a1a2e')
  tg.setBackgroundColor('#1a1a2e')
}

export function getTgUser() {
  if (!tg) return { id: 'dev_user', first_name: 'Dev' }
  return tg.initDataUnsafe?.user ?? { id: 'unknown', first_name: 'Гость' }
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  tg?.HapticFeedback?.impactOccurred(style)
}

export function hapticNotification(type: 'success' | 'warning' | 'error') {
  tg?.HapticFeedback?.notificationOccurred(type)
}

export function showTgAlert(message: string) {
  tg ? tg.showAlert(message) : alert(message)
}

export function closeMiniApp() {
  tg?.close()
}
