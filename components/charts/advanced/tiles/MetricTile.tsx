'use client'

import { ReactNode } from 'react'
import PremiumCard from '@/components/ui/PremiumCard'

export interface MetricTileProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  loading?: boolean
  onClick?: () => void
  className?: string
}

const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    // If it's a currency value (large numbers), format accordingly
    if (value >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
        notation: 'compact',
        compactDisplay: 'short'
      }).format(value)
    } else if (value >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    } else if (value < 1 && value > 0) {
      // Percentage values
      return `${(value * 100).toFixed(1)}%`
    } else {
      return value.toLocaleString()
    }
  }
  return value.toString()
}

const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return (
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7M17 7H7" />
        </svg>
      )
    case 'down':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7l-9.2 9.2M7 7v10M7 7h10" />
        </svg>
      )
    case 'neutral':
    default:
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
        </svg>
      )
  }
}

const getColorClasses = (color: MetricTileProps['color']) => {
  switch (color) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50'
    case 'warning':
      return 'border-amber-200 bg-amber-50'
    case 'error':
      return 'border-red-200 bg-red-50'
    case 'primary':
      return 'border-cyan-200 bg-cyan-50'
    default:
      return ''
  }
}

export default function MetricTile({
  title,
  value,
  subtitle,
  change,
  trend = 'neutral',
  icon,
  color = 'neutral',
  loading = false,
  onClick,
  className = ''
}: MetricTileProps) {
  const isClickable = Boolean(onClick)
  
  return (
    <PremiumCard 
      variant="default" 
      className={`p-4 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''
      } ${getColorClasses(color)} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2 w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-black mb-1">
                {formatValue(value)}
              </div>
              
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
              
              {change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(trend)}
                  <span className={`text-xs font-medium ${
                    trend === 'up' ? 'text-emerald-600' :
                    trend === 'down' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        {icon && (
          <div className="ml-3 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </PremiumCard>
  )
}