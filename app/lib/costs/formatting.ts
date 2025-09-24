import type { MonthKey } from './schema'

/**
 * Format number with thousand separators for display
 */
export function formatNumber(value: number | null, options: {
  showZero?: boolean
  prefix?: string
  suffix?: string
  decimals?: number
} = {}): string {
  const { showZero = false, prefix = '', suffix = '', decimals = 0 } = options
  
  if (value === null || (value === 0 && !showZero)) {
    return ''
  }
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true
    })
    
    return `${prefix}${formatter.format(value)}${suffix}`
  } catch {
    // Fallback for older browsers
    const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()
    const parts = rounded.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${prefix}${parts.join('.')}${suffix}`
  }
}

/**
 * Format as currency (dollars)
 */
export function formatCurrency(value: number | null, options: {
  showZero?: boolean
  showCents?: boolean
} = {}): string {
  const { showZero = false, showCents = false } = options
  
  if (value === null || (value === 0 && !showZero)) {
    return ''
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(value)
  } catch {
    // Fallback
    const formatted = formatNumber(value, { decimals: showCents ? 2 : 0 })
    return `$${formatted}`
  }
}

/**
 * Parse user input and return number
 */
export function parseNumberInput(input: string): number | null {
  if (!input || input.trim() === '') {
    return null
  }
  
  // Remove common formatting characters
  let cleaned = input.trim()
  
  // Handle negative numbers in parentheses (accounting format)
  const isAccountingNegative = cleaned.startsWith('(') && cleaned.endsWith(')')
  if (isAccountingNegative) {
    cleaned = cleaned.slice(1, -1)
  }
  
  // Remove currency symbols, commas, and spaces
  cleaned = cleaned.replace(/[$,\s]/g, '')
  
  // Handle percentage (convert to decimal)
  const isPercentage = cleaned.endsWith('%')
  if (isPercentage) {
    cleaned = cleaned.slice(0, -1)
  }
  
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null
  }
  
  let result = parsed
  
  if (isPercentage) {
    result = result / 100
  }
  
  if (isAccountingNegative) {
    result = -result
  }
  
  return Math.round(result)
}

/**
 * Format number for CSV export (raw integers)
 */
export function formatForCSV(value: number | null): string {
  if (value === null) {
    return ''
  }
  return Math.round(value).toString()
}

/**
 * Get display value for grid cells
 */
export function getCellDisplayValue(value: number | null, editing: boolean = false): string {
  if (editing) {
    // When editing, show raw number without formatting for easier input
    return value === null ? '' : Math.round(value).toString()
  } else {
    // When displaying, show formatted number with separators
    return formatNumber(value, { showZero: false })
  }
}

/**
 * Format month key for display
 */
export function formatMonthDisplay(monthKey: MonthKey, style: 'short' | 'long' = 'short'): string {
  const month = monthKey.split('-')[0] as string
  
  if (style === 'long') {
    const monthNames = {
      'Jan': 'January',
      'Feb': 'February', 
      'Mar': 'March',
      'Apr': 'April',
      'May': 'May',
      'Jun': 'June',
      'Jul': 'July',
      'Aug': 'August',
      'Sep': 'September',
      'Oct': 'October',
      'Nov': 'November',
      'Dec': 'December'
    } as const
    
    return monthNames[month as keyof typeof monthNames] || month
  }
  
  return month
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | null, decimals: number = 1): string {
  if (value === null) {
    return ''
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  } catch {
    // Fallback
    return `${(value * 100).toFixed(decimals)}%`
  }
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatCompactNumber(value: number | null): string {
  if (value === null || value === 0) {
    return ''
  }
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`
  } else if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`
  } else if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1)}K`
  } else {
    return formatNumber(value)
  }
}

/**
 * Get color class for positive/negative values
 */
export function getValueColorClass(value: number | null, neutralZero: boolean = true): string {
  if (value === null || (value === 0 && neutralZero)) {
    return 'text-gray-900'
  }
  
  return value > 0 ? 'text-green-700' : 'text-red-700'
}

/**
 * Format value with trend indicator
 */
export function formatWithTrend(
  current: number | null, 
  previous: number | null, 
  options: {
    showPercentage?: boolean
    showArrow?: boolean
  } = {}
): {
  formatted: string
  trend: 'up' | 'down' | 'flat' | null
  changePercent: number | null
  colorClass: string
} {
  const { showPercentage = true, showArrow = true } = options
  
  if (current === null) {
    return {
      formatted: '',
      trend: null,
      changePercent: null,
      colorClass: 'text-gray-900'
    }
  }
  
  let trend: 'up' | 'down' | 'flat' | null = null
  let changePercent: number | null = null
  
  if (previous !== null && previous !== 0) {
    const change = current - previous
    changePercent = (change / Math.abs(previous)) * 100
    
    if (Math.abs(changePercent) < 0.1) {
      trend = 'flat'
    } else {
      trend = change > 0 ? 'up' : 'down'
    }
  }
  
  let formatted = formatNumber(current)
  
  if (showPercentage && changePercent !== null) {
    const percentStr = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
    formatted += ` (${percentStr})`
  }
  
  if (showArrow && trend) {
    const arrows = {
      up: '↗',
      down: '↘',
      flat: '→'
    }
    formatted += ` ${arrows[trend]}`
  }
  
  const colorClass = trend === 'up' 
    ? 'text-green-700' 
    : trend === 'down' 
      ? 'text-red-700' 
      : 'text-gray-900'
  
  return {
    formatted,
    trend,
    changePercent,
    colorClass
  }
}

/**
 * Validate number input format
 */
export function validateNumberFormat(input: string): {
  isValid: boolean
  error?: string
  parsed?: number
} {
  if (!input || input.trim() === '') {
    return { isValid: true, parsed: undefined }
  }
  
  const parsed = parseNumberInput(input)
  
  if (parsed === null) {
    return {
      isValid: false,
      error: 'Invalid number format'
    }
  }
  
  if (!isFinite(parsed)) {
    return {
      isValid: false,
      error: 'Number is too large'
    }
  }
  
  return {
    isValid: true,
    parsed
  }
}

/**
 * Create input mask for number formatting
 */
export function createNumberMask() {
  return {
    mask: (value: string) => {
      // Remove non-numeric characters except for decimal point, minus, and parentheses
      const cleaned = value.replace(/[^\d.-()]/g, '')
      
      // Basic validation - don't allow multiple decimal points or minus signs
      const parts = cleaned.split('.')
      if (parts.length > 2) {
        return cleaned.slice(0, -1)
      }
      
      return cleaned
    },
    
    format: (value: string) => {
      const parsed = parseNumberInput(value)
      return parsed !== null ? formatNumber(parsed) : value
    }
  }
}

/**
 * Get appropriate width for column based on content
 */
export function getColumnWidth(values: (number | null)[], minWidth: number = 80): number {
  if (values.length === 0) {
    return minWidth
  }
  
  // Find the longest formatted value
  const maxLength = Math.max(
    ...values.map(v => formatNumber(v).length),
    3 // Minimum for column header
  )
  
  // Rough estimate: 8 pixels per character + padding
  return Math.max(minWidth, maxLength * 8 + 20)
}

/**
 * Format summary statistics
 */
export function formatSummary(stats: {
  total: number
  average: number
  min: number
  max: number
  count: number
}): {
  total: string
  average: string
  min: string
  max: string
  count: string
} {
  return {
    total: formatCurrency(stats.total),
    average: formatCurrency(stats.average),
    min: formatCurrency(stats.min),
    max: formatCurrency(stats.max),
    count: stats.count.toString()
  }
}