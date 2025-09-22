'use client'

import { useState, useEffect } from 'react'

interface KPICardProps {
  title: string
  value: number
  change?: number
  trend?: number[]
  format?: 'currency' | 'number' | 'percentage'
  theme?: 'professional' | 'accessible' | 'dark'
  className?: string
}

export default function KPICard({
  title,
  value,
  change = 0,
  trend = [],
  format = 'currency',
  theme = 'professional',
  className = ''
}: KPICardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

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
    return (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    )
  }

  // Sparkline chart using SVG
  const renderSparkline = () => {
    if (!trend || trend.length < 2) return null

    const width = 80
    const height = 24
    const maxValue = Math.max(...trend)
    const minValue = Math.min(...trend)
    const range = maxValue - minValue || 1

    const points = trend.map((value, index) => {
      const x = (index / (trend.length - 1)) * width
      const y = height - ((value - minValue) / range) * height
      return `${x},${y}`
    }).join(' ')

    const lineColor = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'
    const fillColor = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'

    return (
      <svg width={width} height={height} className="flex-shrink-0">
        <defs>
          <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Fill area */}
        <path
          d={`M 0,${height} L ${points} L ${width},${height} Z`}
          fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {trend.map((value, index) => {
          const x = (index / (trend.length - 1)) * width
          const y = height - ((value - minValue) / range) * height
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={lineColor}
              className="opacity-60"
            />
          )
        })}
      </svg>
    )
  }

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
        isVisible ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0'
      } ${className}`}
      role="region"
      aria-label={`${title} KPI card`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate pr-2">
          {title}
        </h3>
        {trend.length > 0 && (
          <div className="flex-shrink-0">
            {renderSparkline()}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div 
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-500"
            style={{
              transform: isVisible ? 'scale(1)' : 'scale(0.8)',
              opacity: isVisible ? 1 : 0
            }}
          >
            {formatValue(value)}
          </div>
          
          {change !== 0 && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${getChangeColor(change)}`}>
              {getChangeIcon(change)}
              <span>
                {Math.abs(change).toFixed(1)}% vs last period
              </span>
            </div>
          )}
        </div>

        {/* Optional icon based on KPI type */}
        <div className="ml-3 flex-shrink-0">
          {title.toLowerCase().includes('claims') && (
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          
          {title.toLowerCase().includes('amount') && (
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          )}
          
          {title.toLowerCase().includes('success') && (
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          
          {!title.toLowerCase().includes('claims') && 
           !title.toLowerCase().includes('amount') && 
           !title.toLowerCase().includes('success') && (
            <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Accessibility description for screen readers */}
      <div className="sr-only">
        {title}: {formatValue(value)}
        {change !== 0 && `, ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last period`}
        {trend.length > 0 && `. Trend data shows ${trend.length} data points.`}
      </div>
    </div>
  )
}