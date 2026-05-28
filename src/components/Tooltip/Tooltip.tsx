import './Tooltip.css'

interface TooltipProps {
  text: string
  children: React.ReactNode
  placement?: 'top' | 'bottom'
}

export default function Tooltip({ text, children, placement = 'top' }: TooltipProps) {
  return (
    <span className="tooltip-root">
      {children}
      <span className={`tooltip-bubble tooltip-bubble--${placement}`} role="tooltip">
        {text}
      </span>
    </span>
  )
}
