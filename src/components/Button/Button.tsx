import './Button.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: 'dark' | 'gray' | 'danger'
  shape?: 'pill' | 'circle'
  active?: boolean
}

export default function Button({
  variant = 'solid',
  size = 'md',
  color = 'dark',
  shape = 'pill',
  active = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    `btn--${color}`,
    shape === 'circle' && 'btn--circle',
    active && 'btn--active',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
