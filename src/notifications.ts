import type { Mode } from './types'

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function sendNotification(mode: Mode, pomodoroCount: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return

  const messages: Record<Mode, string> = {
    pomodoro: `Pomodoro ${pomodoroCount + 1} complete — time for a break!`,
    shortBreak: 'Break over — back to focus.',
    longBreak: 'Long break over — back to focus.',
  }
  new Notification('Pomodoro', { body: messages[mode], icon: '/favicon.ico' })
}
