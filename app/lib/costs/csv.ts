import Papa from 'papaparse'
import type { 
  TableRow, 
  DataRow, 
  ComputedRow, 
  HeaderRow, 
  CSVRow, 
  MonthKey, 
  ValidationIssue 
} from './schema'
import { CSVRowSchema, CSV_HEADERS, MONTH_KEYS } from './schema'
import { roundToInteger } from './math'

export interface ImportResult {
  rows: TableRow[]
  issues: ValidationIssue[]
  stats: {
    totalRows: number
    importedRows: number
    skippedRows: number
    convertedTotals: number
  }
}

export interface ExportOptions {
  includeHeaders?: boolean
  includeComputedRows?: boolean
  format?: 'csv' | 'tsv'
}

/**
 * Parse CSV file and convert to TableRow format
 */
export async function importCSV(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const issues: ValidationIssue[] = []
    const importedRows: TableRow[] = []
    let rowIndex = 0
    let convertedTotals = 0
    let skippedRows = 0
    
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for better control
      complete: (results) => {
        try {
          // Validate headers
          const actualHeaders = results.meta.fields || []
          const missingHeaders = CSV_HEADERS.filter(header => !actualHeaders.includes(header))
          const extraHeaders = actualHeaders.filter(header => !CSV_HEADERS.includes(header as any))
          
          if (missingHeaders.length > 0) {
            issues.push({
              id: `header-missing`,
              rowId: 'header',
              type: 'error',
              message: `Missing required headers: ${missingHeaders.join(', ')}`,
              value: missingHeaders
            })
          }
          
          if (extraHeaders.length > 0) {
            issues.push({
              id: `header-extra`,
              rowId: 'header', 
              type: 'warning',
              message: `Extra headers found (will be ignored): ${extraHeaders.join(', ')}`,
              value: extraHeaders
            })
          }
          
          // Process each row
          results.data.forEach((rawRow, index) => {
            rowIndex = index + 1
            const rowId = `imported-${rowIndex}`
            
            try {
              // Validate row structure
              const validatedRow = CSVRowSchema.parse(rawRow)
              
              // Skip blank rows
              if (!validatedRow.Category || validatedRow.Category.trim() === '') {
                skippedRows++
                return
              }
              
              // Detect if this is a manual total row
              const category = validatedRow.Category.toLowerCase()
              const isManualTotal = category.includes('total') || 
                                   category.includes('sum') || 
                                   category.includes('subtotal')
              
              // Convert months to numbers
              const months = {} as Record<MonthKey, number | null>
              const monthIssues: ValidationIssue[] = []
              
              for (const month of MONTH_KEYS) {
                const rawValue = validatedRow[month]
                const converted = convertToNumber(rawValue)
                
                if (converted.error) {
                  monthIssues.push({
                    id: `${rowId}-${month}`,
                    rowId,
                    type: 'error',
                    field: month,
                    message: `Invalid number: ${converted.error}`,
                    value: rawValue
                  })
                  months[month] = null
                } else {
                  months[month] = converted.value
                }
              }
              
              // Add row-level issues to main issues array
              issues.push(...monthIssues)
              
              // Create appropriate row type
              if (isManualTotal) {
                // Convert manual totals to computed rows
                const computedRow: ComputedRow = {
                  id: rowId,
                  Category: validatedRow.Category,
                  kind: 'computed',
                  order: rowIndex,
                  formula: category.includes('grand') || category.includes('overall') ? 'grandtotal' : 'subtotal',
                  targetRows: [], // Will be populated by grouping logic
                }
                
                importedRows.push(computedRow)
                convertedTotals++
                
                // Log conversion note
                issues.push({
                  id: `${rowId}-converted`,
                  rowId,
                  type: 'warning',
                  message: `Converted manual total to computed row. Original values ignored.`,
                  value: validatedRow.Category
                })
              } else {
                // Create data row
                const dataRow: DataRow = {
                  id: rowId,
                  Category: validatedRow.Category,
                  kind: 'data',
                  order: rowIndex,
                  months,
                  isManualTotal: false
                }
                
                importedRows.push(dataRow)
              }
              
            } catch (error) {
              skippedRows++
              issues.push({
                id: `${rowId}-parse`,
                rowId,
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to parse row',
                value: rawRow
              })
            }
          })
          
          resolve({
            rows: importedRows,
            issues,
            stats: {
              totalRows: results.data.length,
              importedRows: importedRows.length,
              skippedRows,
              convertedTotals
            }
          })
          
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      }
    })
  })
}

/**
 * Export TableRows to CSV format
 */
export function exportCSV(
  rows: TableRow[], 
  options: ExportOptions = {}
): string {
  const { 
    includeHeaders = true, 
    includeComputedRows = false,
    format = 'csv' 
  } = options
  
  const delimiter = format === 'tsv' ? '\t' : ','
  
  // Filter rows based on options
  let rowsToExport = rows.slice()
  
  if (!includeComputedRows) {
    rowsToExport = rowsToExport.filter(row => row.kind !== 'computed')
  }
  
  // Sort by order
  rowsToExport.sort((a, b) => a.order - b.order)
  
  // Convert to CSV format
  const csvRows: CSVRow[] = rowsToExport.map(row => {
    const csvRow = { Category: row.Category } as CSVRow
    
    if (row.kind === 'data') {
      // Add month values for data rows
      for (const month of MONTH_KEYS) {
        const value = row.months[month]
        csvRow[month] = value !== null ? value : ''
      }
    } else {
      // Empty month values for header/computed rows
      for (const month of MONTH_KEYS) {
        csvRow[month] = ''
      }
    }
    
    return csvRow
  })
  
  // Use Papa Parse to generate CSV
  return Papa.unparse(csvRows, {
    header: includeHeaders,
    delimiter,
    columns: CSV_HEADERS,
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    newline: '\n'
  })
}

/**
 * Convert string/number input to integer
 */
function convertToNumber(input: string | number): {
  value: number | null
  error?: string
} {
  // Handle null/undefined/empty
  if (input === null || input === undefined || input === '') {
    return { value: null }
  }
  
  // Already a number
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input)) {
      return { error: 'Invalid number value' }
    }
    return { value: roundToInteger(input) }
  }
  
  // String conversion
  const str = String(input).trim()
  if (str === '') {
    return { value: null }
  }
  
  // Remove common formatting
  const cleaned = str.replace(/[,$\s%()]/g, '')
  
  // Handle negative numbers in parentheses (accounting format)
  const isNegative = str.includes('(') && str.includes(')')
  const numberStr = isNegative ? cleaned.replace(/[()]/g, '') : cleaned
  
  // Parse the number
  const parsed = parseFloat(numberStr)
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return { error: `Cannot convert "${input}" to number` }
  }
  
  const result = isNegative ? -parsed : parsed
  return { value: roundToInteger(result) }
}

/**
 * Validate CSV headers match expected format
 */
export function validateCSVHeaders(headers: string[]): {
  isValid: boolean
  missing: string[]
  extra: string[]
} {
  const missing = CSV_HEADERS.filter(header => !headers.includes(header))
  const extra = headers.filter(header => !CSV_HEADERS.includes(header as any))
  
  return {
    isValid: missing.length === 0,
    missing,
    extra
  }
}

/**
 * Generate template CSV file content
 */
export function generateTemplateCSV(): string {
  const templateRows: CSVRow[] = [
    {
      Category: 'Domestic Medical Facility Claims (Inpatient)',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
    {
      Category: 'Domestic Medical Facility Claims (Outpatient)',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
    {
      Category: 'Non-Domestic Medical Claims',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
    {
      Category: 'Non-Hospital Medical Claims',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
    {
      Category: 'Prescription Drug Claims',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
    {
      Category: 'Administrative Fees',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
    {
      Category: 'Stop-Loss Premium',
      'Jan-2024': '', 'Feb-2024': '', 'Mar-2024': '', 'Apr-2024': '',
      'May-2024': '', 'Jun-2024': '', 'Jul-2024': '', 'Aug-2024': '',
      'Sep-2024': '', 'Oct-2024': '', 'Nov-2024': '', 'Dec-2024': ''
    },
  ]
  
  return Papa.unparse(templateRows, {
    header: true,
    columns: CSV_HEADERS
  })
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(content: string, filename: string = 'healthcare-costs-2024.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}

/**
 * Parse clipboard data for bulk paste operations
 */
export function parseClipboardData(clipboardData: string): {
  data: (string | number)[][]
  rows: number
  cols: number
} {
  // Split by newlines and remove empty lines
  const lines = clipboardData
    .split(/\r?\n/)
    .filter(line => line.trim() !== '')
  
  if (lines.length === 0) {
    return { data: [], rows: 0, cols: 0 }
  }
  
  // Split each line by tabs or commas (prefer tabs for Excel compatibility)
  const data = lines.map(line => {
    const delimiter = line.includes('\t') ? '\t' : ','
    return line.split(delimiter).map(cell => {
      const trimmed = cell.trim()
      // Try to convert to number, but keep as string if it fails
      const num = parseFloat(trimmed)
      return isNaN(num) ? trimmed : num
    })
  })
  
  const maxCols = Math.max(...data.map(row => row.length))
  
  // Pad rows to have consistent column count
  const paddedData = data.map(row => {
    while (row.length < maxCols) {
      row.push('')
    }
    return row
  })
  
  return {
    data: paddedData,
    rows: lines.length,
    cols: maxCols
  }
}

/**
 * Validate imported data quality
 */
export function analyzeImportQuality(rows: TableRow[]): {
  score: number // 0-100
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100
  
  const dataRows = rows.filter((row): row is DataRow => row.kind === 'data')
  
  if (dataRows.length === 0) {
    issues.push('No data rows found')
    score -= 50
  }
  
  // Check for data completeness
  let totalCells = 0
  let filledCells = 0
  
  dataRows.forEach(row => {
    Object.values(row.months).forEach(value => {
      totalCells++
      if (value !== null && value !== 0) filledCells++
    })
  })
  
  const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0
  
  if (completeness < 50) {
    issues.push('Low data completeness (less than 50% of cells filled)')
    score -= 20
    recommendations.push('Consider filling in missing monthly values')
  }
  
  // Check for categories without known patterns
  const unknownCategories = dataRows.filter(row => 
    !row.Category.toLowerCase().includes('medical') &&
    !row.Category.toLowerCase().includes('pharmacy') &&
    !row.Category.toLowerCase().includes('admin') &&
    !row.Category.toLowerCase().includes('stop-loss')
  )
  
  if (unknownCategories.length > dataRows.length * 0.3) {
    issues.push('Many categories do not match standard healthcare cost patterns')
    score -= 10
    recommendations.push('Review category names for consistency with healthcare cost standards')
  }
  
  // Check for extreme values that might be errors
  const allValues = dataRows.flatMap(row => 
    Object.values(row.months).filter(v => v !== null) as number[]
  )
  
  if (allValues.length > 0) {
    const sorted = allValues.slice().sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    const outlierThreshold = q3 + (iqr * 3)
    
    const outliers = allValues.filter(v => v > outlierThreshold)
    
    if (outliers.length > 0) {
      issues.push(`${outliers.length} potential outlier values detected`)
      recommendations.push('Review unusually high values for accuracy')
    }
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations
  }
}