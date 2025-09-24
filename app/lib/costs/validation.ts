import type { 
  TableRow, 
  DataRow, 
  ComputedRow, 
  ValidationIssue, 
  ValidationResult, 
  MonthKey,
  KnownCategory 
} from './schema'
import { KNOWN_CATEGORIES, MONTH_KEYS } from './schema'
import { getAllComputedValues, validateExactTotal, isEmptyRow } from './math'

/**
 * Validate all rows and return comprehensive validation results
 */
export function validateTableData(rows: TableRow[]): ValidationResult {
  const issues: ValidationIssue[] = []
  
  // Validate individual rows
  rows.forEach(row => {
    issues.push(...validateRow(row, rows))
  })
  
  // Validate computed row consistency
  issues.push(...validateComputedConsistency(rows))
  
  // Validate data quality
  issues.push(...validateDataQuality(rows))
  
  // Check for duplicate categories
  issues.push(...validateUniqueness(rows))
  
  const errorCount = issues.filter(issue => issue.type === 'error').length
  const warningCount = issues.filter(issue => issue.type === 'warning').length
  
  return {
    isValid: errorCount === 0,
    canExport: errorCount === 0, // Errors block export, warnings don't
    issues,
    errorCount,
    warningCount
  }
}

/**
 * Validate individual row
 */
function validateRow(row: TableRow, allRows: TableRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Validate category
  if (!row.Category || row.Category.trim() === '') {
    issues.push({
      id: `${row.id}-category-empty`,
      rowId: row.id,
      type: 'error',
      field: 'Category',
      message: 'Category is required',
      value: row.Category
    })
  }
  
  // Validate data row specifics
  if (row.kind === 'data') {
    issues.push(...validateDataRow(row))
  }
  
  // Validate computed row specifics
  if (row.kind === 'computed') {
    issues.push(...validateComputedRow(row, allRows))
  }
  
  return issues
}

/**
 * Validate data row months and values
 */
function validateDataRow(row: DataRow): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Check each month value
  Object.entries(row.months).forEach(([month, value]) => {
    if (value !== null) {
      // Check for unrealistic values
      if (!isFinite(value)) {
        issues.push({
          id: `${row.id}-${month}-infinite`,
          rowId: row.id,
          type: 'error',
          field: month as MonthKey,
          message: 'Value must be a finite number',
          value
        })
      } else if (Math.abs(value) > 1_000_000_000) {
        issues.push({
          id: `${row.id}-${month}-extreme`,
          rowId: row.id,
          type: 'warning',
          field: month as MonthKey,
          message: 'Unusually large value - please verify',
          value
        })
      }
    }
  })
  
  // Check if row is completely empty
  if (isEmptyRow(row.months)) {
    issues.push({
      id: `${row.id}-empty-row`,
      rowId: row.id,
      type: 'warning',
      message: 'Row has no data for any month',
      value: null
    })
  }
  
  // Check for unknown category
  if (!isKnownCategory(row.Category)) {
    issues.push({
      id: `${row.id}-unknown-category`,
      rowId: row.id,
      type: 'warning',
      field: 'Category',
      message: 'Category not found in known healthcare cost types',
      value: row.Category
    })
  }
  
  return issues
}

/**
 * Validate computed row configuration
 */
function validateComputedRow(row: ComputedRow, allRows: TableRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Check if target rows exist
  row.targetRows.forEach(targetId => {
    const targetExists = allRows.some(r => r.id === targetId)
    if (!targetExists) {
      issues.push({
        id: `${row.id}-missing-target-${targetId}`,
        rowId: row.id,
        type: 'error',
        message: `Target row '${targetId}' not found`,
        value: targetId
      })
    }
  })
  
  // Check for circular references
  if (hasCircularReference(row, allRows)) {
    issues.push({
      id: `${row.id}-circular-ref`,
      rowId: row.id,
      type: 'error',
      message: 'Circular reference detected in computed row targets',
      value: row.targetRows
    })
  }
  
  // Validate formula type
  if (row.formula === 'grandtotal' && row.targetRows.length > 0) {
    issues.push({
      id: `${row.id}-grandtotal-targets`,
      rowId: row.id,
      type: 'warning',
      message: 'Grand total should not specify target rows (will use all data rows)',
      value: row.targetRows
    })
  }
  
  return issues
}

/**
 * Validate computed row consistency (totals match expected values)
 */
function validateComputedConsistency(rows: TableRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const computedValues = getAllComputedValues(rows)
  
  // Find any manual total rows that should match computed values
  const dataRows = rows.filter((r): r is DataRow => r.kind === 'data' && r.isManualTotal)
  
  dataRows.forEach(dataRow => {
    // Look for corresponding computed row
    const correspondingComputed = rows.find((r): r is ComputedRow => 
      r.kind === 'computed' && 
      r.Category.toLowerCase().includes('total') &&
      dataRow.Category.toLowerCase().includes('total')
    )
    
    if (correspondingComputed) {
      const expected = computedValues.get(correspondingComputed.id)
      if (expected) {
        // Check each month
        Object.entries(expected).forEach(([month, expectedValue]) => {
          const actualValue = dataRow.months[month as MonthKey] || 0
          
          if (!validateExactTotal(actualValue, expectedValue)) {
            issues.push({
              id: `${dataRow.id}-${month}-mismatch`,
              rowId: dataRow.id,
              type: 'error',
              field: month as MonthKey,
              message: `Manual total (${actualValue}) does not match computed value (${expectedValue})`,
              value: actualValue
            })
          }
        })
      }
    }
  })
  
  return issues
}

/**
 * Validate data quality across all rows
 */
function validateDataQuality(rows: TableRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const dataRows = rows.filter((r): r is DataRow => r.kind === 'data')
  
  if (dataRows.length === 0) {
    issues.push({
      id: 'no-data-rows',
      rowId: 'global',
      type: 'error',
      message: 'No data rows found',
      value: null
    })
    return issues
  }
  
  // Calculate data completeness
  let totalCells = 0
  let filledCells = 0
  
  dataRows.forEach(row => {
    Object.values(row.months).forEach(value => {
      totalCells++
      if (value !== null && value !== 0) {
        filledCells++
      }
    })
  })
  
  const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0
  
  if (completeness < 25) {
    issues.push({
      id: 'low-completeness',
      rowId: 'global',
      type: 'warning',
      message: `Low data completeness (${completeness.toFixed(1)}%)`,
      value: completeness
    })
  }
  
  // Check for unusual patterns
  const monthlyTotals = MONTH_KEYS.map(month => 
    dataRows.reduce((sum, row) => sum + (row.months[month] || 0), 0)
  )
  
  // Detect if all months have same value (possible copy-paste error)
  const uniqueValues = new Set(monthlyTotals.filter(v => v !== 0))
  if (uniqueValues.size === 1 && uniqueValues.values().next().value !== 0) {
    issues.push({
      id: 'uniform-values',
      rowId: 'global',
      type: 'warning',
      message: 'All months have identical totals - verify data accuracy',
      value: Array.from(uniqueValues)[0]
    })
  }
  
  // Detect extreme month-to-month variations
  for (let i = 1; i < monthlyTotals.length; i++) {
    const current = monthlyTotals[i]
    const previous = monthlyTotals[i - 1]
    
    if (previous > 0 && current > 0) {
      const changePercent = Math.abs((current - previous) / previous) * 100
      
      if (changePercent > 500) { // More than 500% change
        const currentMonth = MONTH_KEYS[i]
        const previousMonth = MONTH_KEYS[i - 1]
        
        issues.push({
          id: `extreme-change-${i}`,
          rowId: 'global',
          type: 'warning',
          message: `Extreme change from ${previousMonth} to ${currentMonth} (${changePercent.toFixed(0)}%)`,
          value: { previous, current, changePercent }
        })
      }
    }
  }
  
  return issues
}

/**
 * Validate uniqueness constraints
 */
function validateUniqueness(rows: TableRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const categoryMap = new Map<string, string[]>()
  
  // Check for duplicate categories
  rows.forEach(row => {
    const category = row.Category.toLowerCase().trim()
    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
    }
    categoryMap.get(category)!.push(row.id)
  })
  
  categoryMap.forEach((rowIds, category) => {
    if (rowIds.length > 1) {
      rowIds.forEach(rowId => {
        issues.push({
          id: `${rowId}-duplicate-category`,
          rowId,
          type: 'error',
          field: 'Category',
          message: `Duplicate category: "${category}"`,
          value: category
        })
      })
    }
  })
  
  return issues
}

/**
 * Check if category is in known list
 */
function isKnownCategory(category: string): boolean {
  const lowercaseCategory = category.toLowerCase()
  return KNOWN_CATEGORIES.some(known => 
    known.toLowerCase() === lowercaseCategory ||
    lowercaseCategory.includes(known.toLowerCase()) ||
    known.toLowerCase().includes(lowercaseCategory)
  )
}

/**
 * Check for circular references in computed rows
 */
function hasCircularReference(
  computedRow: ComputedRow, 
  allRows: TableRow[], 
  visited: Set<string> = new Set()
): boolean {
  if (visited.has(computedRow.id)) {
    return true // Found a cycle
  }
  
  visited.add(computedRow.id)
  
  // Check each target row
  for (const targetId of computedRow.targetRows) {
    const targetRow = allRows.find(r => r.id === targetId)
    
    if (targetRow?.kind === 'computed') {
      if (hasCircularReference(targetRow, allRows, new Set(visited))) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): {
  status: 'valid' | 'warnings' | 'errors'
  message: string
  canProceed: boolean
} {
  if (result.errorCount > 0) {
    return {
      status: 'errors',
      message: `${result.errorCount} error${result.errorCount !== 1 ? 's' : ''} must be fixed before proceeding`,
      canProceed: false
    }
  }
  
  if (result.warningCount > 0) {
    return {
      status: 'warnings',
      message: `${result.warningCount} warning${result.warningCount !== 1 ? 's' : ''} detected`,
      canProceed: true
    }
  }
  
  return {
    status: 'valid',
    message: 'All validations passed',
    canProceed: true
  }
}

/**
 * Filter issues by row ID
 */
export function getIssuesForRow(issues: ValidationIssue[], rowId: string): ValidationIssue[] {
  return issues.filter(issue => issue.rowId === rowId)
}

/**
 * Filter issues by type
 */
export function getIssuesByType(issues: ValidationIssue[], type: 'error' | 'warning'): ValidationIssue[] {
  return issues.filter(issue => issue.type === type)
}

/**
 * Get issues grouped by row
 */
export function groupIssuesByRow(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
  const grouped = new Map<string, ValidationIssue[]>()
  
  issues.forEach(issue => {
    if (!grouped.has(issue.rowId)) {
      grouped.set(issue.rowId, [])
    }
    grouped.get(issue.rowId)!.push(issue)
  })
  
  return grouped
}

/**
 * Real-time validation with debouncing
 */
export function createValidationDebouncer(
  onValidation: (result: ValidationResult) => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (rows: TableRow[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      const result = validateTableData(rows)
      onValidation(result)
    }, delay)
  }
}

/**
 * Validate specific field change
 */
export function validateFieldChange(
  rows: TableRow[],
  rowId: string,
  field: MonthKey | 'Category',
  value: any
): ValidationIssue[] {
  const row = rows.find(r => r.id === rowId)
  if (!row) return []
  
  const issues: ValidationIssue[] = []
  
  if (field === 'Category') {
    if (!value || value.trim() === '') {
      issues.push({
        id: `${rowId}-category-empty`,
        rowId,
        type: 'error',
        field: 'Category',
        message: 'Category is required',
        value
      })
    }
    
    // Check for duplicates
    const duplicateExists = rows.some(r => 
      r.id !== rowId && 
      r.Category.toLowerCase().trim() === value.toLowerCase().trim()
    )
    
    if (duplicateExists) {
      issues.push({
        id: `${rowId}-category-duplicate`,
        rowId,
        type: 'error',
        field: 'Category',
        message: 'Category already exists',
        value
      })
    }
  } else {
    // Month field validation
    if (value !== null) {
      if (typeof value !== 'number' || !isFinite(value)) {
        issues.push({
          id: `${rowId}-${field}-invalid`,
          rowId,
          type: 'error',
          field,
          message: 'Must be a valid number',
          value
        })
      } else if (Math.abs(value) > 1_000_000_000) {
        issues.push({
          id: `${rowId}-${field}-extreme`,
          rowId,
          type: 'warning',
          field,
          message: 'Unusually large value',
          value
        })
      }
    }
  }
  
  return issues
}