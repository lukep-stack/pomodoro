import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { useAtom } from 'jotai'
import { choreListAtom, choreSelectionAtom, recentChoresAtom } from '../../atoms'
import Button from '../Button/Button'
import ChoreSettings from '../ChoreSettings/ChoreSettings'
import './ChoreWheel.css'

export interface ChoreWheelHandle {
  spin: () => void
}

const RAINBOW = [
  '#FF6B6B',
  '#FF9E4A',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#C77DFF',
]

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const SPIN_DURATION = 2000

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const ChoreWheel = forwardRef<ChoreWheelHandle, {}>(
  (_props, ref) => {
    const [chores] = useAtom(choreListAtom)
    const [choreSelection, setChoreSelection] = useAtom(choreSelectionAtom)
    const [recentChores, setRecentChores] = useAtom(recentChoresAtom)
    const [showSettings, setShowSettings] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rotationRef = useRef<number>(0)
    const isSpinningRef = useRef(false)
    const rafRef = useRef<number | null>(null)

    const drawWheel = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = canvas.width
      const cx = size / 2
      const cy = size / 2
      const radius = size / 2 - 4

      ctx.clearRect(0, 0, size, size)

      if (chores.length === 0) {
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#e0e0e0'
        ctx.fill()
        ctx.fillStyle = '#999'
        ctx.font = '14px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Add chores below', cx, cy)
        drawPointer(ctx, cx, size)
        return
      }

      const sliceAngle = (2 * Math.PI) / chores.length
      const rotation = rotationRef.current

      for (let i = 0; i < chores.length; i++) {
        const startAngle = rotation + i * sliceAngle - Math.PI / 2
        const endAngle = startAngle + sliceAngle
        const color = RAINBOW[i % RAINBOW.length]

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()

        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        const midAngle = startAngle + sliceAngle / 2
        const textRadius = radius * 0.85
        const tx = cx + textRadius * Math.cos(midAngle)
        const ty = cy + textRadius * Math.sin(midAngle)

        ctx.save()
        ctx.translate(tx, ty)
        ctx.rotate(midAngle + Math.PI / 2)
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        ctx.font = `bold ${clampFontSize(chores.length)}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const label = truncate(chores[i], 12)
        ctx.fillText(label, 0, 0)
        ctx.restore()
      }

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 2
      ctx.stroke()

      drawPointer(ctx, cx, size)
    }, [chores])

    function drawPointer(ctx: CanvasRenderingContext2D, cx: number, size: number) {
      const tipY = 2
      const baseY = 18
      const halfBase = 9
      ctx.beginPath()
      ctx.moveTo(cx, tipY)
      ctx.lineTo(cx - halfBase, baseY)
      ctx.lineTo(cx + halfBase, baseY)
      ctx.closePath()
      ctx.fillStyle = '#1a1a1a'
      ctx.fill()
      void size
    }

    function clampFontSize(count: number): number {
      if (count <= 4) return 13
      if (count <= 8) return 11
      return 9
    }

    function truncate(s: string, max: number): string {
      return s.length > max ? s.slice(0, max - 1) + '…' : s
    }

    useEffect(() => {
      const maxLen = Math.floor(chores.length / 2)
      setRecentChores(prev => prev.slice(0, maxLen))
    }, [chores.length, setRecentChores])

    useEffect(() => {
      drawWheel()
    }, [drawWheel])

    const spin = useCallback(() => {
      if (isSpinningRef.current || chores.length === 0) return
      isSpinningRef.current = true

      const sliceAngle = (2 * Math.PI) / chores.length
      const recentSet = new Set(recentChores)
      const eligible = chores.map((_, i) => i).filter(i => !recentSet.has(chores[i]))
      const pool = eligible.length > 0 ? eligible : chores.map((_, i) => i)
      const winnerIndex = pool[Math.floor(Math.random() * pool.length)]

      const TWO_PI = 2 * Math.PI
      const startRotation = rotationRef.current

      const targetMod =
        ((-(winnerIndex * sliceAngle + sliceAngle / 2) % TWO_PI) + TWO_PI) % TWO_PI
      const startMod = ((startRotation % TWO_PI) + TWO_PI) % TWO_PI
      const delta = (targetMod - startMod + TWO_PI) % TWO_PI
      const extraFullTurns = (3 + Math.floor(Math.random() * 3)) * TWO_PI
      const targetRotation = startRotation + extraFullTurns + delta

      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / SPIN_DURATION, 1)
        const eased = easeOutCubic(t)

        rotationRef.current = startRotation + eased * (targetRotation - startRotation)
        drawWheel()

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          rotationRef.current = targetRotation
          isSpinningRef.current = false
          setChoreSelection(chores[winnerIndex])
          const maxLen = Math.floor(chores.length / 2)
          setRecentChores(prev => [chores[winnerIndex], ...prev].slice(0, maxLen))
          drawWheel()
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, [chores, drawWheel, setChoreSelection, recentChores, setRecentChores])

    useImperativeHandle(ref, () => ({ spin }), [spin])

    useEffect(() => {
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      }
    }, [])

    return (
      <>
        <div className="chore-wheel-section">
          <div className="chore-wheel-wrapper">
            <canvas
              ref={canvasRef}
              className="chore-wheel-canvas"
              width={350}
              height={350}
              onClick={spin}
              aria-label="Chore wheel – click to spin"
              role="button"
            />
          </div>

          <p className="chore-selection">{choreSelection ?? ''}</p>

          <Button
            variant="ghost"
            size="md"
            color="dark"
            shape="circle"
            onClick={() => setShowSettings(true)}
            aria-label="Chore settings"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Button>
        </div>

        {showSettings && (
          <ChoreSettings onClose={() => setShowSettings(false)} />
        )}
      </>
    )
  },
)

ChoreWheel.displayName = 'ChoreWheel'

export default ChoreWheel
