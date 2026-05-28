import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAtom } from 'jotai'
import { durationsAtom, themeAtom, DEFAULT_DURATIONS, pomodoroCountAtom, autoAdvanceAtom } from './atoms'
import ModeSelector from './components/ModeSelector/ModeSelector'
import TimerDisplay from './components/TimerDisplay/TimerDisplay'
import Controls from './components/Controls/Controls'
import Settings from './components/Settings/Settings'
import SessionDots from './components/SessionDots/SessionDots'
import ActivityWheel, { type ActivityWheelHandle } from './components/ActivityWheel/ActivityWheel'
import { playChime, unlockAudio } from './chime'
import { requestNotificationPermission, sendNotification } from './notifications'
import type { Mode } from './types'
import './App.css'

const TIMER_KEY = 'pomodoro-timer'

interface PersistedTimer {
  mode: Mode
  isRunning: boolean
  secondsLeft: number
  endTime: number | null
}

function loadTimer(): { mode: Mode; secondsLeft: number; isRunning: boolean } {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    if (raw) {
      const saved: PersistedTimer = JSON.parse(raw)
      const secondsLeft = saved.isRunning && saved.endTime != null
        ? Math.max(0, Math.round((saved.endTime - Date.now()) / 1000))
        : saved.secondsLeft
      return { mode: saved.mode, secondsLeft, isRunning: saved.isRunning && secondsLeft > 0 }
    }
  } catch { /* fall through to defaults */ }
  try {
    const durRaw = localStorage.getItem('pomodoro-settings')
    const dur = durRaw ? JSON.parse(durRaw) : DEFAULT_DURATIONS
    return { mode: 'pomodoro', secondsLeft: dur.pomodoro ?? DEFAULT_DURATIONS.pomodoro, isRunning: false }
  } catch {
    return { mode: 'pomodoro', secondsLeft: DEFAULT_DURATIONS.pomodoro, isRunning: false }
  }
}

function saveTimer(mode: Mode, secondsLeft: number, isRunning: boolean) {
  const data: PersistedTimer = {
    mode,
    secondsLeft,
    isRunning,
    endTime: isRunning ? Date.now() + secondsLeft * 1000 : null,
  }
  localStorage.setItem(TIMER_KEY, JSON.stringify(data))
}

export default function App() {
  const [durations, setDurations] = useAtom(durationsAtom)
  const [theme] = useAtom(themeAtom)
  const [pomodoroCount, setPomodoroCount] = useAtom(pomodoroCountAtom)
  const [autoAdvance] = useAtom(autoAdvanceAtom)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const [timerInit] = useState(loadTimer)
  const [mode, setMode] = useState<Mode>(timerInit.mode)
  const [secondsLeft, setSecondsLeft] = useState<number>(timerInit.secondsLeft)
  const [isRunning, setIsRunning] = useState(timerInit.isRunning)
  const [showSettings, setShowSettings] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wheelRef = useRef<ActivityWheelHandle>(null)
  const didMountRef = useRef(false)

  // Always-fresh completion handler — reads current state via closure
  const onTimerCompleteRef = useRef<(() => void) | undefined>(undefined)
  onTimerCompleteRef.current = () => {
    playChime()
    sendNotification(mode, pomodoroCount)

    if (mode === 'pomodoro') {
      const newCount = pomodoroCount + 1
      setPomodoroCount(newCount)
      const nextMode = newCount % 4 === 0 ? 'longBreak' : 'shortBreak'
      const nextSecs = durations[nextMode]
      setMode(nextMode)
      setSecondsLeft(nextSecs)
      setIsRunning(autoAdvance)
      saveTimer(nextMode, nextSecs, autoAdvance)
    } else {
      if (mode === 'longBreak' && pomodoroCount % 4 === 0) setPomodoroCount(0)
      const nextSecs = durations.pomodoro
      setMode('pomodoro')
      setSecondsLeft(nextSecs)
      setIsRunning(autoAdvance)
      saveTimer('pomodoro', nextSecs, autoAdvance)
    }
  }

  // Tick
  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current ?? undefined)
          setIsRunning(false)
          saveTimer(mode, 0, false)
          setTimeout(() => onTimerCompleteRef.current?.(), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current ?? undefined)
  }, [isRunning, mode])

  const handleModeChange = (newMode: Mode): void => {
    setMode(newMode)
    setSecondsLeft(durations[newMode])
    setIsRunning(false)
    saveTimer(newMode, durations[newMode], false)
  }

  const toggleTimer = (): void => {
    unlockAudio()
    requestNotificationPermission()
    const next = !isRunning
    setIsRunning(next)
    saveTimer(mode, secondsLeft, next)
  }

  const resetTimer = (): void => {
    setIsRunning(false)
    setSecondsLeft(durations[mode])
    saveTimer(mode, durations[mode], false)
  }

  // Auto-spin activity wheel when a break timer starts (skip on initial mount to avoid re-spinning on reload)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    if (isRunning && (mode === 'shortBreak' || mode === 'longBreak')) {
      wheelRef.current?.spin()
    }
  }, [isRunning, mode])

  // Update document title
  useEffect(() => {
    const mins = Math.floor(secondsLeft / 60)
    const secs = secondsLeft % 60
    document.title = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} — Pomodoro`
  }, [secondsLeft])

  return (
    <div className="app" data-mode={mode}>
      <div className="app-bg app-bg--pomodoro" />
      <div className="app-bg app-bg--shortBreak" />
      <div className="app-bg app-bg--longBreak" />
      <div className="app-panel app-panel--left">
        <div className="timer-row">
          <TimerDisplay secondsLeft={secondsLeft} totalSeconds={durations[mode]} />
          <ModeSelector mode={mode} onChange={handleModeChange} />
        </div>
        <SessionDots count={pomodoroCount} onReset={() => setPomodoroCount(0)} isActive={isRunning && mode === 'pomodoro'} secondsLeft={secondsLeft} />
        <Controls
          isRunning={isRunning}
          onToggle={toggleTimer}
          onReset={resetTimer}
          onSettings={() => setShowSettings(true)}
        />
      </div>

      <div className="app-panel app-panel--right">
        <ActivityWheel ref={wheelRef} />
      </div>

      <AnimatePresence>
        {showSettings && (
          <Settings
            durations={durations}
            onSave={newDurations => {
              setDurations(newDurations)
              saveTimer(mode, secondsLeft, isRunning)
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
