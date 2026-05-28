import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { themeAtom, autoAdvanceAtom } from '../../atoms'
import Button from '../Button/Button'
import type { Durations } from '../../types'
import './Settings.css'

interface SettingsProps {
  durations: Durations
  onSave: (durations: Durations) => void
  onClose: () => void
}

export default function Settings({ durations, onSave, onClose }: SettingsProps) {
  const [theme, setTheme] = useAtom(themeAtom)
  const [autoAdvance, setAutoAdvance] = useAtom(autoAdvanceAtom)
  const [values, setValues] = useState({
    pomodoro:   Math.round(durations.pomodoro   / 60),
    shortBreak: Math.round(durations.shortBreak / 60),
    longBreak:  Math.round(durations.longBreak  / 60),
  })

  const handleChange = (key: keyof Durations, val: string): void => {
    const num = Math.max(1, Math.min(99, Number(val)))
    setValues(v => ({ ...v, [key]: num }))
  }

  const handleSave = (): void => {
    onSave({
      pomodoro:   values.pomodoro   * 60,
      shortBreak: values.shortBreak * 60,
      longBreak:  values.longBreak  * 60,
    })
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <motion.div
      className="settings-overlay"
      onClick={handleOverlayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="settings-panel"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h2>Settings</h2>

        <div className="settings-row">
          <label>Appearance</label>
          <div className="settings-theme-toggle">
            <Button variant={theme === 'light' ? 'solid' : 'outline'} size="sm" color={theme === 'light' ? 'dark' : 'gray'} onClick={() => setTheme('light')}>light</Button>
            <Button variant={theme === 'dark' ? 'solid' : 'outline'} size="sm" color={theme === 'dark' ? 'dark' : 'gray'} onClick={() => setTheme('dark')}>dark</Button>
          </div>
        </div>

        <div className="settings-row">
          <label>Auto-advance</label>
          <div className="settings-theme-toggle">
            <Button variant={autoAdvance ? 'solid' : 'outline'} size="sm" color={autoAdvance ? 'dark' : 'gray'} onClick={() => setAutoAdvance(true)}>on</Button>
            <Button variant={!autoAdvance ? 'solid' : 'outline'} size="sm" color={!autoAdvance ? 'dark' : 'gray'} onClick={() => setAutoAdvance(false)}>off</Button>
          </div>
        </div>

        <div className="settings-row">
          <label htmlFor="set-pomodoro">Pomodoro (min)</label>
          <input
            id="set-pomodoro"
            type="number"
            min="1"
            max="99"
            value={values.pomodoro}
            onChange={e => handleChange('pomodoro', e.target.value)}
          />
        </div>

        <div className="settings-row">
          <label htmlFor="set-short">Short break (min)</label>
          <input
            id="set-short"
            type="number"
            min="1"
            max="99"
            value={values.shortBreak}
            onChange={e => handleChange('shortBreak', e.target.value)}
          />
        </div>

        <div className="settings-row">
          <label htmlFor="set-long">Long break (min)</label>
          <input
            id="set-long"
            type="number"
            min="1"
            max="99"
            value={values.longBreak}
            onChange={e => handleChange('longBreak', e.target.value)}
          />
        </div>

        <div className="settings-actions">
          <Button variant="outline" size="sm" color="gray" onClick={onClose}>cancel</Button>
          <Button variant="solid" size="sm" color="dark" onClick={handleSave}>save</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
