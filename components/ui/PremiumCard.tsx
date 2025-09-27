import type { ReactNode } from 'react'
import SurfaceCard from './SurfaceCard'

interface PremiumCardProps {
  title?: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  padding?: 'default' | 'snug' | 'none'
  hover?: boolean
  id?: string
  variant?: 'default' | 'glass' | 'elevated' | 'glow'
  interactive?: boolean
}

export default function PremiumCard({
  variant = 'default',
  interactive = false,
  className = '',
  hover = true,
  ...props
}: PremiumCardProps) {
  const variantClasses = {
    default: '',
    glass: 'surface-card--glass',
    elevated: 'surface-card--elevated',
    glow: 'surface-card--glow',
  }

  const interactiveClass = interactive ? 'surface-card--interactive' : ''
  
  const combinedClassName = [
    variantClasses[variant],
    interactiveClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <SurfaceCard
      {...props}
      className={combinedClassName}
      hover={hover && !interactive}
    />
  )
}