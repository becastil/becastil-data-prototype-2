import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  sparkline?: ReactNode
  className?: string
  variant?: 'default' | 'glow'
  size?: 'default' | 'large'
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  sparkline,
  className = '',
  variant = 'default',
  size = 'default',
}: StatCardProps) {
  const baseClasses = 'stat-card'
  const variantClasses = {
    default: '',
    glow: 'stat-card--glow',
  }
  
  const sizeClasses = {
    default: 'p-6',
    large: 'p-8',
  }

  const valueSize = size === 'large' ? 'text-3xl' : 'text-2xl'

  const cardClassName = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-emerald-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'down':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className={cardClassName}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-cyan-400">
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-gray-300 uppercase tracking-wide">
            {label}
          </span>
        </div>
        {sparkline && (
          <div className="w-16 h-8 opacity-70">
            {sparkline}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div className={`font-bold text-white text-tabular ${valueSize}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend.direction)}`}>
            {getTrendIcon(trend.direction)}
            <span className="font-medium">{trend.value}%</span>
            <span className="text-xs text-gray-400">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}