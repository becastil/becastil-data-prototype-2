'use client'

interface SimpleKPICardProps {
  title: string
  value: number
  change?: number
  format?: 'currency' | 'number' | 'percentage'
  className?: string
}

export default function SimpleKPICard({
  title,
  value,
  change = 0,
  format = 'currency',
  className = ''
}: SimpleKPICardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        if (val >= 1000000) {
          return `$${(val / 1000000).toFixed(1)}M`
        } else if (val >= 1000) {
          return `$${(val / 1000).toFixed(0)}k`
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(val)
      
      case 'percentage':
        return `${val.toFixed(1)}%`
      
      case 'number':
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(0)}k`
        }
        return val.toLocaleString()
      
      default:
        return val.toString()
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V8m0 0H8" />
        </svg>
      )
    }
    if (change < 0) {
      return (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 7l-9.2 9.2M7 7v9m0 0h9" />
        </svg>
      )
    }
    return null
  }

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
      role="region"
      aria-label={`${title} KPI card`}
    >
      {/* Title */}
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>

      {/* Value */}
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {formatValue(value)}
      </div>
      
      {/* Change indicator */}
      {change !== 0 && (
        <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(change)}`}>
          {getChangeIcon(change)}
          <span>
            {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Screen reader description */}
      <div className="sr-only">
        {title}: {formatValue(value)}
        {change !== 0 && `, ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}%`}
      </div>
    </div>
  )
}