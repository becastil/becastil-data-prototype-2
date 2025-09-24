/**
 * Data validation utilities for template generation
 */

import * as XLSX from 'xlsx'
import { 
  MemberTypeSchema, 
  AgeBandSchema, 
  EnrolledSchema, 
  HitStopLossSchema,
  HEALTHCARE_COST_ROW_ORDER,
  HIGH_COST_CLAIMS_COLUMN_ORDER
} from './schemas'

/**
 * Create data validation for dropdown lists
 */
export function createDataValidation(values: string[]) {
  return {
    type: 'list' as const,
    allowBlank: false,
    showInputMessage: true,
    showErrorMessage: true,
    errorTitle: 'Invalid Value',
    errorMessage: `Please select from the dropdown list: ${values.join(', ')}`,
    values: values
  }
}

/**
 * Validation configurations for High Cost Claims template
 */
export const HIGH_COST_CLAIMS_VALIDATIONS = {
  MEMBER_TYPE: createDataValidation(MemberTypeSchema.options),
  AGE_BAND: createDataValidation(AgeBandSchema.options),
  ENROLLED: createDataValidation(EnrolledSchema.options),
  HIT_STOP_LOSS: createDataValidation(HitStopLossSchema.options),
  PERCENTAGE: {
    type: 'decimal' as const,
    operator: 'between',
    formula1: 0,
    formula2: 1,
    allowBlank: false,
    showInputMessage: true,
    showErrorMessage: true,
    inputTitle: 'Percentage',
    inputMessage: 'Enter a decimal between 0 and 1 (e.g., 0.85 for 85%)',
    errorTitle: 'Invalid Percentage',
    errorMessage: 'Percentage must be between 0 and 1'
  },
  POSITIVE_NUMBER: {
    type: 'decimal' as const,
    operator: 'greaterThanOrEqual',
    formula1: 0,
    allowBlank: false,
    showInputMessage: true,
    showErrorMessage: true,
    inputTitle: 'Positive Number',
    inputMessage: 'Enter a positive number (0 or greater)',
    errorTitle: 'Invalid Number',
    errorMessage: 'Value must be 0 or greater'
  },
  POSITIVE_INTEGER: {
    type: 'whole' as const,
    operator: 'greaterThan',
    formula1: 0,
    allowBlank: false,
    showInputMessage: true,
    showErrorMessage: true,
    inputTitle: 'Positive Integer',
    inputMessage: 'Enter a positive whole number',
    errorTitle: 'Invalid Number',
    errorMessage: 'Value must be a positive whole number'
  }
}

/**
 * Apply data validation to a worksheet range
 */
export function applyDataValidation(
  worksheet: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  column: number,
  validation: any
) {
  if (!worksheet['!dataValidation']) {
    worksheet['!dataValidation'] = []
  }

  const range = XLSX.utils.encode_range({
    s: { r: startRow, c: column },
    e: { r: endRow, c: column }
  })

  worksheet['!dataValidation'].push({
    sqref: range,
    ...validation
  })
}

/**
 * Validate Healthcare Cost template structure
 */
export function validateHealthcareCostTemplate(data: any[][]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if we have the right number of columns (13: Category + 12 months)
  if (data.length === 0 || data[0].length !== 13) {
    errors.push('Template must have exactly 13 columns (Category + 12 months)')
  }

  // Check header row
  if (data.length > 0) {
    const expectedHeaders = [
      'Category', 'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024',
      'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
    ]
    
    const headers = data[0]
    expectedHeaders.forEach((expectedHeader, index) => {
      if (headers[index] !== expectedHeader) {
        errors.push(`Column ${index + 1} should be "${expectedHeader}" but found "${headers[index]}"`)
      }
    })
  }

  // Check row order (allowing for blank rows)
  if (data.length > 1) {
    let expectedIndex = 0
    for (let i = 1; i < data.length && expectedIndex < HEALTHCARE_COST_ROW_ORDER.length; i++) {
      const categoryValue = data[i][0]
      const expectedValue = HEALTHCARE_COST_ROW_ORDER[expectedIndex]
      
      // Handle blank rows
      if (categoryValue === '' || categoryValue === null || categoryValue === undefined) {
        if (expectedValue === '') {
          expectedIndex++
          continue
        } else {
          // Unexpected blank row
          errors.push(`Row ${i + 1}: Expected "${expectedValue}" but found blank row`)
        }
      } else if (categoryValue === expectedValue) {
        expectedIndex++
      } else {
        errors.push(`Row ${i + 1}: Expected "${expectedValue}" but found "${categoryValue}"`)
        expectedIndex++
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate High Cost Claims template structure
 */
export function validateHighCostClaimsTemplate(data: any[][]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if we have the right number of columns (18)
  if (data.length === 0 || data[0].length !== HIGH_COST_CLAIMS_COLUMN_ORDER.length) {
    errors.push(`Template must have exactly ${HIGH_COST_CLAIMS_COLUMN_ORDER.length} columns`)
  }

  // Check header row
  if (data.length > 0) {
    const headers = data[0]
    HIGH_COST_CLAIMS_COLUMN_ORDER.forEach((expectedHeader, index) => {
      if (headers[index] !== expectedHeader) {
        errors.push(`Column ${index + 1} should be "${expectedHeader}" but found "${headers[index]}"`)
      }
    })
  }

  // Check data types in sample rows (if any)
  if (data.length > 1) {
    for (let i = 1; i < Math.min(data.length, 4); i++) { // Check first 3 data rows
      const row = data[i]
      
      // Member ID should be a positive integer
      if (row[0] !== null && row[0] !== undefined && row[0] !== '') {
        const memberId = Number(row[0])
        if (!Number.isInteger(memberId) || memberId <= 0) {
          errors.push(`Row ${i + 1}: Member ID must be a positive integer`)
        }
      }

      // Member Type should be valid enum
      if (row[1] && !MemberTypeSchema.options.includes(row[1])) {
        errors.push(`Row ${i + 1}: Invalid Member Type "${row[1]}"`)
      }

      // Age Band should be valid enum
      if (row[2] && !AgeBandSchema.options.includes(row[2])) {
        errors.push(`Row ${i + 1}: Invalid Age Band "${row[2]}"`)
      }

      // Percentage columns should be between 0 and 1
      [6, 7].forEach(colIndex => { // % of Plan Paid, % of large claims
        const value = Number(row[colIndex])
        if (!isNaN(value) && (value < 0 || value > 1)) {
          errors.push(`Row ${i + 1}, Column ${colIndex + 1}: Percentage must be between 0 and 1`)
        }
      })

      // Currency columns should be non-negative
      [8, 9, 10, 11, 12, 15, 16].forEach(colIndex => {
        const value = Number(row[colIndex])
        if (!isNaN(value) && value < 0) {
          errors.push(`Row ${i + 1}, Column ${colIndex + 1}: Currency values must be non-negative`)
        }
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate column width configurations
 */
export const COLUMN_WIDTHS = {
  HEALTHCARE_COST: [
    { wch: 40 }, // Category column - wider for long names
    ...Array(12).fill({ wch: 12 }) // Month columns - narrower
  ],
  HIGH_COST_CLAIMS: [
    { wch: 12 }, // Member ID
    { wch: 15 }, // Member Type
    { wch: 12 }, // Age Band
    { wch: 25 }, // Primary Diagnosis Category
    { wch: 25 }, // Specific Diagnosis Details Short
    { wch: 35 }, // Specific Diagnosis Details
    { wch: 15 }, // % of Plan Paid
    { wch: 15 }, // % of large claims
    { wch: 15 }, // Total
    { wch: 18 }, // Facility Inpatient
    { wch: 18 }, // Facility Outpatient
    { wch: 15 }, // Professional
    { wch: 12 }, // Pharmacy
    { wch: 25 }, // Top Provider
    { wch: 10 }, // Enrolled
    { wch: 18 }, // Stop-Loss Deductible
    { wch: 22 }, // Estimated Stop-Loss Reimbursement
    { wch: 15 }  // Hit Stop Loss?
  ]
}

/**
 * Freeze panes configuration
 */
export function setFreezePane(worksheet: XLSX.WorkSheet, row: number, col: number) {
  worksheet['!freeze'] = { xSplit: col, ySplit: row }
}