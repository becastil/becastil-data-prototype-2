import type { TableRow, DataRow, ComputedRow, MonthKey } from './schema'
import { getAllComputedValues, calculateGrandTotal, calculateSubtotal } from './math'

// Group definitions for healthcare cost categories
export interface CostGroup {
  id: string
  name: string
  description: string
  pattern: string[] // Keywords that match this group
  color: string // For visual grouping
  order: number
}

export const COST_GROUPS: CostGroup[] = [
  {
    id: 'medical-inpatient',
    name: 'Inpatient Medical',
    description: 'Hospital inpatient claims and services',
    pattern: ['inpatient', 'hospital inpatient', 'facility inpatient'],
    color: 'blue',
    order: 1
  },
  {
    id: 'medical-outpatient', 
    name: 'Outpatient Medical',
    description: 'Hospital outpatient and ambulatory services',
    pattern: ['outpatient', 'hospital outpatient', 'facility outpatient'],
    color: 'indigo',
    order: 2
  },
  {
    id: 'medical-non-hospital',
    name: 'Non-Hospital Medical',
    description: 'Physician visits, specialist care, and non-facility services',
    pattern: ['non-hospital', 'physician', 'specialist', 'non-domestic'],
    color: 'purple',
    order: 3
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'Prescription drugs and pharmacy services',
    pattern: ['prescription', 'pharmacy', 'drug', 'medication'],
    color: 'green',
    order: 4
  },
  {
    id: 'dental',
    name: 'Dental',
    description: 'Dental care and oral health services',
    pattern: ['dental', 'oral health', 'dentist'],
    color: 'yellow',
    order: 5
  },
  {
    id: 'vision',
    name: 'Vision',
    description: 'Eye care and vision services',
    pattern: ['vision', 'optical', 'eye care', 'optometry'],
    color: 'pink',
    order: 6
  },
  {
    id: 'administrative',
    name: 'Administrative',
    description: 'Plan administration and processing fees',
    pattern: ['administrative', 'admin', 'tpa', 'processing', 'management'],
    color: 'gray',
    order: 7
  },
  {
    id: 'stop-loss',
    name: 'Stop-Loss',
    description: 'Stop-loss insurance and reinsurance',
    pattern: ['stop-loss', 'stop loss', 'reinsurance', 'excess'],
    color: 'red',
    order: 8
  }
]

/**
 * Auto-assign group based on category name
 */
export function autoAssignGroup(category: string): string | null {
  const lowercaseCategory = category.toLowerCase()
  
  for (const group of COST_GROUPS) {
    for (const pattern of group.pattern) {
      if (lowercaseCategory.includes(pattern)) {
        return group.id
      }
    }
  }
  
  return null
}

/**
 * Get group info by ID
 */
export function getGroupById(groupId: string): CostGroup | null {
  return COST_GROUPS.find(g => g.id === groupId) || null
}

/**
 * Auto-generate computed rows based on data patterns
 */
export function autoGenerateComputedRows(dataRows: DataRow[]): ComputedRow[] {
  const computedRows: ComputedRow[] = []
  
  // Group data rows by their inferred group
  const groupedRows = new Map<string, DataRow[]>()
  const ungroupedRows: DataRow[] = []
  
  dataRows.forEach(row => {
    const groupId = autoAssignGroup(row.Category)
    if (groupId) {
      if (!groupedRows.has(groupId)) {
        groupedRows.set(groupId, [])
      }
      groupedRows.get(groupId)!.push(row)
    } else {
      ungroupedRows.push(row)
    }
  })
  
  // Create subtotal rows for each group with multiple items
  let computedOrder = Math.max(...dataRows.map(r => r.order)) + 1
  
  groupedRows.forEach((rows, groupId) => {
    if (rows.length > 1) { // Only create subtotal if group has multiple rows
      const group = getGroupById(groupId)
      if (group) {
        const subtotalRow: ComputedRow = {
          id: `computed-${groupId}-subtotal`,
          Category: `Total ${group.name}`,
          kind: 'computed',
          order: computedOrder++,
          formula: 'subtotal',
          targetRows: rows.map(r => r.id),
          groupId: groupId
        }
        computedRows.push(subtotalRow)
      }
    }
  })
  
  // Create grand total row
  const grandTotalRow: ComputedRow = {
    id: 'computed-grand-total',
    Category: 'Grand Total',
    kind: 'computed',
    order: computedOrder,
    formula: 'grandtotal',
    targetRows: [], // Grand total includes all data rows
  }
  computedRows.push(grandTotalRow)
  
  return computedRows
}

/**
 * Update computed row targets based on current data
 */
export function updateComputedTargets(
  rows: TableRow[]
): TableRow[] {
  const updatedRows = [...rows]
  const dataRows = rows.filter((r): r is DataRow => r.kind === 'data')
  const computedRows = rows.filter((r): r is ComputedRow => r.kind === 'computed')
  
  // Update each computed row
  computedRows.forEach(computedRow => {
    const rowIndex = updatedRows.findIndex(r => r.id === computedRow.id)
    if (rowIndex === -1) return
    
    const updatedComputedRow = { ...computedRow }
    
    if (computedRow.formula === 'grandtotal') {
      // Grand total includes all data rows
      updatedComputedRow.targetRows = dataRows.map(r => r.id)
    } else if (computedRow.formula === 'subtotal' && computedRow.groupId) {
      // Subtotal includes data rows from the same group
      const groupRows = dataRows.filter(r => 
        autoAssignGroup(r.Category) === computedRow.groupId
      )
      updatedComputedRow.targetRows = groupRows.map(r => r.id)
    }
    
    updatedRows[rowIndex] = updatedComputedRow
  })
  
  return updatedRows
}

/**
 * Validate computed rows against their targets
 */
export function validateComputedRows(rows: TableRow[]): {
  isValid: boolean
  issues: Array<{
    rowId: string
    message: string
    expectedValue: Record<MonthKey, number>
    actualValue?: Record<MonthKey, number | null>
  }>
} {
  const issues: Array<{
    rowId: string
    message: string
    expectedValue: Record<MonthKey, number>
    actualValue?: Record<MonthKey, number | null>
  }> = []
  
  const computedValues = getAllComputedValues(rows)
  const computedRows = rows.filter((r): r is ComputedRow => r.kind === 'computed')
  
  computedRows.forEach(computedRow => {
    const expected = computedValues.get(computedRow.id)
    if (!expected) {
      issues.push({
        rowId: computedRow.id,
        message: 'Cannot compute values for this row',
        expectedValue: {} as Record<MonthKey, number>
      })
      return
    }
    
    // For computed rows, we don't have actual values to compare against
    // This is mainly for validation when importing manual totals
    const manualDataRow = rows.find(r => 
      r.id === computedRow.id && r.kind === 'data'
    ) as DataRow | undefined
    
    if (manualDataRow) {
      // Compare expected vs manual values
      const hasDiscrepancy = Object.entries(expected).some(([month, expectedVal]) => {
        const actualVal = manualDataRow.months[month as MonthKey] || 0
        return expectedVal !== actualVal
      })
      
      if (hasDiscrepancy) {
        issues.push({
          rowId: computedRow.id,
          message: 'Manual total values do not match computed values',
          expectedValue: expected,
          actualValue: manualDataRow.months
        })
      }
    }
  })
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Get suggested groupings for existing data
 */
export function suggestGroupings(rows: TableRow[]): Array<{
  groupId: string
  groupName: string
  rowIds: string[]
  confidence: number
}> {
  const dataRows = rows.filter((r): r is DataRow => r.kind === 'data')
  const suggestions: Array<{
    groupId: string
    groupName: string
    rowIds: string[]
    confidence: number
  }> = []
  
  // Group by auto-detected patterns
  const groups = new Map<string, { rows: DataRow[], scores: number[] }>()
  
  dataRows.forEach(row => {
    const category = row.Category.toLowerCase()
    
    COST_GROUPS.forEach(group => {
      let maxScore = 0
      
      group.pattern.forEach(pattern => {
        if (category.includes(pattern)) {
          // Exact match gets higher score
          const score = category === pattern ? 1.0 : 0.7
          maxScore = Math.max(maxScore, score)
        }
      })
      
      if (maxScore > 0) {
        if (!groups.has(group.id)) {
          groups.set(group.id, { rows: [], scores: [] })
        }
        groups.get(group.id)!.rows.push(row)
        groups.get(group.id)!.scores.push(maxScore)
      }
    })
  })
  
  // Convert to suggestions
  groups.forEach(({ rows, scores }, groupId) => {
    if (rows.length > 0) {
      const group = getGroupById(groupId)
      if (group) {
        const avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length
        
        suggestions.push({
          groupId,
          groupName: group.name,
          rowIds: rows.map(r => r.id),
          confidence: avgConfidence
        })
      }
    }
  })
  
  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Create group hierarchy for display
 */
export function createGroupHierarchy(rows: TableRow[]): Array<{
  group?: CostGroup
  rows: TableRow[]
  subtotalRow?: ComputedRow
  isExpanded: boolean
}> {
  const hierarchy: Array<{
    group?: CostGroup
    rows: TableRow[]
    subtotalRow?: ComputedRow
    isExpanded: boolean
  }> = []
  
  // Group data rows
  const groupedData = new Map<string, DataRow[]>()
  const ungroupedData: DataRow[] = []
  const headerRows: TableRow[] = []
  const computedRows: ComputedRow[] = []
  
  rows.forEach(row => {
    if (row.kind === 'header') {
      headerRows.push(row)
    } else if (row.kind === 'computed') {
      computedRows.push(row)
    } else if (row.kind === 'data') {
      const groupId = autoAssignGroup(row.Category)
      if (groupId) {
        if (!groupedData.has(groupId)) {
          groupedData.set(groupId, [])
        }
        groupedData.get(groupId)!.push(row)
      } else {
        ungroupedData.push(row)
      }
    }
  })
  
  // Create hierarchy sections
  COST_GROUPS.forEach(group => {
    const groupRows = groupedData.get(group.id) || []
    if (groupRows.length > 0) {
      const subtotalRow = computedRows.find(r => 
        r.formula === 'subtotal' && r.groupId === group.id
      )
      
      const allRows = [...groupRows]
      if (subtotalRow) {
        allRows.push(subtotalRow)
      }
      
      hierarchy.push({
        group,
        rows: allRows.sort((a, b) => a.order - b.order),
        subtotalRow,
        isExpanded: true // Default to expanded
      })
    }
  })
  
  // Add ungrouped data
  if (ungroupedData.length > 0) {
    hierarchy.push({
      rows: ungroupedData.sort((a, b) => a.order - b.order),
      isExpanded: true
    })
  }
  
  // Add headers at the top
  if (headerRows.length > 0) {
    hierarchy.unshift({
      rows: headerRows.sort((a, b) => a.order - b.order),
      isExpanded: true
    })
  }
  
  // Add grand total at the bottom
  const grandTotalRow = computedRows.find(r => r.formula === 'grandtotal')
  if (grandTotalRow) {
    hierarchy.push({
      rows: [grandTotalRow],
      isExpanded: true
    })
  }
  
  return hierarchy
}

/**
 * Get group color classes for styling
 */
export function getGroupColorClasses(groupId: string): {
  background: string
  border: string
  text: string
} {
  const group = getGroupById(groupId)
  if (!group) {
    return {
      background: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900'
    }
  }
  
  const colorMap: Record<string, { background: string; border: string; text: string }> = {
    blue: { background: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
    indigo: { background: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
    purple: { background: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
    green: { background: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
    yellow: { background: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
    pink: { background: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
    gray: { background: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
    red: { background: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
  }
  
  return colorMap[group.color] || colorMap.gray
}