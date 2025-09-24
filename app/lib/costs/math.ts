import type { TableRow, DataRow, ComputedRow, MonthKey, MONTH_KEYS } from './schema'

/**
 * Calculate sum for a specific month across given row IDs
 */
export function calculateMonthSum(
  rows: TableRow[],
  targetRowIds: string[],
  month: MonthKey
): number {
  return targetRowIds.reduce((sum, rowId) => {
    const row = rows.find(r => r.id === rowId)
    if (row?.kind === 'data') {
      const value = row.months[month]
      return sum + (value || 0)
    }
    return sum
  }, 0)
}

/**
 * Calculate subtotal for a computed row across all months
 */
export function calculateSubtotal(
  rows: TableRow[],
  computedRow: ComputedRow
): Record<MonthKey, number> {
  const result = {} as Record<MonthKey, number>
  
  for (const month of ['Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'] as MonthKey[]) {
    result[month] = calculateMonthSum(rows, computedRow.targetRows, month)
  }
  
  return result
}

/**
 * Calculate grand total from all data rows (excluding computed rows)
 */
export function calculateGrandTotal(rows: TableRow[]): Record<MonthKey, number> {
  const dataRows = rows.filter((row): row is DataRow => row.kind === 'data')
  const result = {} as Record<MonthKey, number>
  
  for (const month of ['Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'] as MonthKey[]) {
    result[month] = dataRows.reduce((sum, row) => {
      const value = row.months[month]
      return sum + (value || 0)
    }, 0)
  }
  
  return result
}

/**
 * Get computed values for all computed rows
 */
export function getAllComputedValues(rows: TableRow[]): Map<string, Record<MonthKey, number>> {
  const computedValues = new Map<string, Record<MonthKey, number>>()
  
  // Process computed rows in order
  const computedRows = rows
    .filter((row): row is ComputedRow => row.kind === 'computed')
    .sort((a, b) => a.order - b.order)
  
  for (const computedRow of computedRows) {
    if (computedRow.formula === 'grandtotal') {
      computedValues.set(computedRow.id, calculateGrandTotal(rows))
    } else if (computedRow.formula === 'subtotal') {
      computedValues.set(computedRow.id, calculateSubtotal(rows, computedRow))
    }
  }
  
  return computedValues
}

/**
 * Validate that totals are exactly equal (no tolerance)
 */
export function validateExactTotal(computed: number, manual: number): boolean {
  return computed === manual
}

/**
 * Check if a row's monthly totals match expected computed values
 */
export function validateRowTotals(
  rows: TableRow[],
  rowId: string,
  expectedValues: Record<MonthKey, number>
): { isValid: boolean; mismatches: MonthKey[] } {
  const row = rows.find(r => r.id === rowId)
  if (!row || row.kind !== 'data') {
    return { isValid: false, mismatches: [] }
  }
  
  const mismatches: MonthKey[] = []
  
  for (const month of ['Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'] as MonthKey[]) {
    const actual = row.months[month] || 0
    const expected = expectedValues[month]
    
    if (!validateExactTotal(actual, expected)) {
      mismatches.push(month)
    }
  }
  
  return {
    isValid: mismatches.length === 0,
    mismatches
  }
}

/**
 * Calculate year-to-date total for a row
 */
export function calculateYTD(monthlyData: Record<MonthKey, number | null>): number {
  return Object.values(monthlyData).reduce((sum, value) => sum + (value || 0), 0)
}

/**
 * Calculate monthly total for all rows combined
 */
export function calculateMonthlyTotals(rows: TableRow[]): Record<MonthKey, number> {
  const dataRows = rows.filter((row): row is DataRow => row.kind === 'data')
  const result = {} as Record<MonthKey, number>
  
  for (const month of ['Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'] as MonthKey[]) {
    result[month] = dataRows.reduce((sum, row) => {
      const value = row.months[month]
      return sum + (value || 0)
    }, 0)
  }
  
  return result
}

/**
 * Get summary statistics for the dataset
 */
export function getDataSummary(rows: TableRow[]) {
  const dataRows = rows.filter((row): row is DataRow => row.kind === 'data')
  const monthlyTotals = calculateMonthlyTotals(rows)
  const yearTotal = Object.values(monthlyTotals).reduce((sum, value) => sum + value, 0)
  
  // Find highest and lowest months
  const monthEntries = Object.entries(monthlyTotals) as [MonthKey, number][]
  const highestMonth = monthEntries.reduce((max, [month, value]) => 
    value > max.value ? { month, value } : max, 
    { month: monthEntries[0][0], value: monthEntries[0][1] }
  )
  const lowestMonth = monthEntries.reduce((min, [month, value]) => 
    value < min.value ? { month, value } : min,
    { month: monthEntries[0][0], value: monthEntries[0][1] }
  )
  
  // Count non-empty cells
  let filledCells = 0
  let totalCells = 0
  
  dataRows.forEach(row => {
    Object.values(row.months).forEach(value => {
      totalCells++
      if (value !== null && value !== 0) {
        filledCells++
      }
    })
  })
  
  return {
    totalRows: dataRows.length,
    yearTotal,
    monthlyTotals,
    highestMonth,
    lowestMonth,
    dataCompleteness: totalCells > 0 ? (filledCells / totalCells) * 100 : 0,
    filledCells,
    totalCells,
  }
}

/**
 * Detect potential formula patterns for auto-computation
 */
export function detectComputationPattern(
  rows: TableRow[],
  targetRowId: string
): { 
  suggestedFormula?: 'subtotal' | 'grandtotal'
  suggestedTargets?: string[]
  confidence: number 
} {
  const targetRow = rows.find(r => r.id === targetRowId)
  if (!targetRow || targetRow.kind !== 'data') {
    return { confidence: 0 }
  }
  
  const category = targetRow.Category.toLowerCase()
  
  // Check for "total" patterns
  if (category.includes('total') || category.includes('sum')) {
    if (category.includes('grand') || category.includes('overall')) {
      return {
        suggestedFormula: 'grandtotal',
        confidence: 0.9
      }
    } else {
      // Look for rows that might sum to this total
      const dataRows = rows.filter((r): r is DataRow => 
        r.kind === 'data' && 
        r.id !== targetRowId &&
        r.order < targetRow.order
      )
      
      // Simple heuristic: suggest rows with similar category prefixes
      const categoryWords = category.split(/\s+/)
      const relatedRows = dataRows.filter(row => {
        const rowWords = row.Category.toLowerCase().split(/\s+/)
        return rowWords.some(word => categoryWords.includes(word))
      })
      
      if (relatedRows.length > 0) {
        return {
          suggestedFormula: 'subtotal',
          suggestedTargets: relatedRows.map(r => r.id),
          confidence: 0.7
        }
      }
    }
  }
  
  return { confidence: 0 }
}

/**
 * Utility to round numbers consistently
 */
export function roundToInteger(value: number): number {
  return Math.round(value)
}

/**
 * Safe addition that handles null values
 */
export function safeAdd(...values: (number | null)[]): number {
  return values.reduce((sum, value) => sum + (value || 0), 0)
}

/**
 * Check if all values in a row are zero or null
 */
export function isEmptyRow(months: Record<MonthKey, number | null>): boolean {
  return Object.values(months).every(value => value === null || value === 0)
}

/**
 * Calculate percentage change between two months
 */
export function calculateMonthlyGrowth(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Get rolling average for specified window
 */
export function getRollingAverage(
  monthlyData: Record<MonthKey, number>,
  windowSize: number = 3
): Record<MonthKey, number | null> {
  const months = ['Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'] as MonthKey[]
  const result = {} as Record<MonthKey, number | null>
  
  months.forEach((month, index) => {
    if (index < windowSize - 1) {
      result[month] = null
    } else {
      const windowSum = months
        .slice(index - windowSize + 1, index + 1)
        .reduce((sum, m) => sum + (monthlyData[m] || 0), 0)
      result[month] = windowSum / windowSize
    }
  })
  
  return result
}