import { PROVIDER_ALIASES, COST_THRESHOLDS, RISK_THRESHOLDS, HCCNormalized } from './schema'

/**
 * Normalize provider names using the provider aliases map
 */
export function normalizeProviderName(providerName: string | undefined): string {
  if (!providerName) return 'unknown'
  
  const normalized = providerName.toLowerCase().trim()
  
  // Check each provider category for matches
  for (const [canonical, aliases] of Object.entries(PROVIDER_ALIASES)) {
    // Check exact match with canonical name
    if (normalized === canonical) {
      return canonical
    }
    
    // Check aliases
    const isMatch = aliases.some(alias => 
      normalized.includes(alias) || alias.includes(normalized)
    )
    
    if (isMatch) {
      return canonical
    }
  }
  
  // If no match found, return the normalized original
  return normalized
}

/**
 * Categorize cost level based on total paid amount
 */
export function categorizeCost(totalPaid: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (totalPaid >= COST_THRESHOLDS.CRITICAL) return 'Critical'
  if (totalPaid >= COST_THRESHOLDS.HIGH) return 'High'
  if (totalPaid >= COST_THRESHOLDS.MEDIUM) return 'Medium'
  return 'Low'
}

/**
 * Categorize risk tier based on risk adjustment factor
 */
export function categorizeRisk(riskFactor: number): 'Low' | 'Medium' | 'High' {
  if (riskFactor >= RISK_THRESHOLDS.HIGH) return 'High'
  if (riskFactor >= RISK_THRESHOLDS.MEDIUM) return 'Medium'
  return 'Low'
}

/**
 * Calculate projected savings potential based on cost and risk factors
 */
export function calculateSavingsPotential(
  totalPaid: number,
  riskFactor: number,
  caseManagementRequired: boolean = false
): number {
  let baseSavings = 0
  
  // Higher cost members have more savings potential
  if (totalPaid >= COST_THRESHOLDS.CRITICAL) {
    baseSavings = totalPaid * 0.15 // 15% potential savings for critical cost members
  } else if (totalPaid >= COST_THRESHOLDS.HIGH) {
    baseSavings = totalPaid * 0.10 // 10% for high cost
  } else if (totalPaid >= COST_THRESHOLDS.MEDIUM) {
    baseSavings = totalPaid * 0.05 // 5% for medium cost
  } else {
    baseSavings = totalPaid * 0.02 // 2% for low cost
  }
  
  // Adjust for risk factor - higher risk may need more intervention
  const riskMultiplier = Math.min(1.5, 1 + riskFactor * 0.2)
  baseSavings *= riskMultiplier
  
  // Case management can increase savings potential
  if (caseManagementRequired) {
    baseSavings *= 1.25
  }
  
  return Math.round(baseSavings)
}

/**
 * Format currency values for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage values for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  return total > 0 ? value / total : 0
}

/**
 * Fuzzy match column headers for mapping suggestions
 */
export function fuzzyMatchColumn(sourceColumn: string, targetColumns: string[]): string | null {
  const source = sourceColumn.toLowerCase().trim()
  
  // Try exact match first
  const exactMatch = targetColumns.find(col => col.toLowerCase() === source)
  if (exactMatch) return exactMatch
  
  // Try partial matches
  const partialMatch = targetColumns.find(col => 
    col.toLowerCase().includes(source) || source.includes(col.toLowerCase())
  )
  if (partialMatch) return partialMatch
  
  // Try word-based matching
  const sourceWords = source.split(/[\s_-]+/)
  const bestMatch = targetColumns.find(col => {
    const targetWords = col.toLowerCase().split(/[\s_-]+/)
    return sourceWords.some(word => 
      targetWords.some(targetWord => 
        word.includes(targetWord) || targetWord.includes(word)
      )
    )
  })
  
  return bestMatch || null
}

/**
 * Validate data completeness for analytics quality
 */
export function calculateDataCompleteness(data: HCCNormalized[]): number {
  if (data.length === 0) return 0
  
  const requiredFields = [
    'member_id',
    'member_type', 
    'age_band',
    'total_paid_ytd',
    'medical_costs_ytd',
    'pharmacy_costs_ytd'
  ] as const
  
  let totalCompleteness = 0
  
  data.forEach(row => {
    let rowCompleteness = 0
    requiredFields.forEach(field => {
      if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
        rowCompleteness += 1
      }
    })
    totalCompleteness += rowCompleteness / requiredFields.length
  })
  
  return totalCompleteness / data.length
}

/**
 * Generate color for charts based on data value
 */
export function getChartColor(index: number): string {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
  ]
  return colors[index % colors.length]
}

/**
 * Sort data by specified field and direction
 */
export function sortData<T>(
  data: T[], 
  field: keyof T, 
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return direction === 'asc' ? 1 : -1
    if (bVal == null) return direction === 'asc' ? -1 : 1
    
    // Handle different data types
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    // Default string comparison
    const aStr = String(aVal)
    const bStr = String(bVal)
    return direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: any[], filename: string): void {
  if (data.length === 0) return
  
  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}