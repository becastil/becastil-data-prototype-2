'use client'

import { ReactNode } from 'react'
import { Card, Statistic, Skeleton } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'

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

const formatValue = (value: string | number): string | number => {
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
      return value
    }
  }
  return value
}

const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return <ArrowUpOutlined />
    case 'down':
      return <ArrowDownOutlined />
    case 'neutral':
    default:
      return <MinusOutlined />
  }
}

const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return '#3f8600'
    case 'down':
      return '#cf1322'
    case 'neutral':
    default:
      return '#8c8c8c'
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
  
  const cardStyles = {
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'all 0.2s',
    ...(isClickable && {
      ':hover': {
        transform: 'scale(1.02)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }
    })
  }

  const valueStyle = {
    color: color === 'success' ? '#3f8600' :
           color === 'warning' ? '#faad14' :
           color === 'error' ? '#cf1322' :
           color === 'primary' ? '#1890ff' :
           undefined
  }
  
  return (
    <Card 
      style={cardStyles}
      className={className}
      onClick={onClick}
      size="small"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Statistic
              title={title}
              value={formatValue(value)}
              valueStyle={valueStyle}
              prefix={icon}
              suffix={
                change !== undefined ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span style={{ color: getTrendColor(trend), fontSize: '12px' }}>
                      {getTrendIcon(trend)}
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                ) : null
              }
            />
            {subtitle && (
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}