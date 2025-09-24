import Papa from 'papaparse'
import { CSV_HEADER_MAPPINGS } from '../schemas/experience'

export interface ParsedCSV {
  data: any[]
  headers: string[]
}

export interface HeaderMapping {
  csvHeader: string
  mappedField: string
}

/**
 * Parse CSV file using PapaParse
 */
export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
          return
        }
        
        const data = results.data as any[]
        const headers = results.meta.fields || []
        
        if (headers.length === 0) {
          reject(new Error('No headers found in CSV file'))
          return
        }
        
        if (data.length === 0) {
          reject(new Error('No data rows found in CSV file'))
          return
        }
        
        resolve({ data, headers })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      }
    })
  })
}

/**
 * Detect whether the CSV contains experience data or member-level claims
 */
export function detectDataType(data: any[], headers: string[]): 'experience' | 'member' {
  const lowerHeaders = headers.map(h => h.toLowerCase())
  
  // Check for member-specific indicators
  const hasMemberIndicators = lowerHeaders.some(h => 
    h.includes('member') || 
    h.includes('claimant') || 
    h.includes('subscriber') ||
    h.includes('patient')
  )
  
  // Check for aggregated data indicators
  const hasAggregatedIndicators = lowerHeaders.some(h => 
    h.includes('month') || 
    h.includes('period') ||
    h.includes('category') ||
    h.includes('total')
  )
  
  // Look at sample data
  const sampleRow = data[0] || {}
  const hasDetailedClaims = Object.values(sampleRow).some(val => 
    typeof val === 'string' && val.length > 20 // Likely detailed description
  )
  
  if (hasMemberIndicators && !hasAggregatedIndicators) {
    return 'member'
  }
  
  if (hasAggregatedIndicators && !hasMemberIndicators) {
    return 'experience'
  }
  
  // Default to experience data for ambiguous cases
  return 'experience'
}

/**
 * Auto-map CSV headers to expected fields
 */
export function mapHeaders(headers: string[], dataType: 'experience' | 'member'): HeaderMapping[] {
  const mappings = CSV_HEADER_MAPPINGS[dataType]
  
  return headers.map(csvHeader => {
    const lowerHeader = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '_')
    
    // Find best match
    let bestMatch = ''
    let bestScore = 0
    
    for (const [fieldName, variations] of Object.entries(mappings)) {
      for (const variation of variations) {
        const score = calculateSimilarity(lowerHeader, variation.toLowerCase().replace(/[^a-z0-9]/g, '_'))
        if (score > bestScore && score > 0.7) { // 70% similarity threshold
          bestScore = score
          bestMatch = fieldName
        }
      }
    }
    
    return {
      csvHeader,
      mappedField: bestMatch
    }
  })
}

/**
 * Calculate string similarity (Jaro-Winkler-like algorithm)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0
  
  // Exact substring matches get high scores
  if (str1.includes(str2) || str2.includes(str1)) {
    const shorter = str1.length < str2.length ? str1 : str2
    const longer = str1.length >= str2.length ? str1 : str2
    return shorter.length / longer.length * 0.9
  }
  
  // Simple character overlap scoring
  const chars1 = new Set(str1.split(''))
  const chars2 = new Set(str2.split(''))
  const intersection = new Set([...chars1].filter(x => chars2.has(x)))
  const union = new Set([...chars1, ...chars2])
  
  return intersection.size / union.size
}

/**
 * Validate month format and normalize to YYYY-MM
 */
export function normalizeMonth(monthStr: string): string {
  if (!monthStr) throw new Error('Month is required')
  
  const str = monthStr.trim()
  
  // Already in YYYY-MM format
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(str)) {
    return str
  }
  
  // Try parsing as date
  const date = new Date(str)
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }
  
  // Handle MM/YYYY or MM-YYYY format
  const mmYyyyMatch = str.match(/^(0?[1-9]|1[0-2])[\/\-](\d{4})$/)
  if (mmYyyyMatch) {
    const month = mmYyyyMatch[1].padStart(2, '0')
    const year = mmYyyyMatch[2]
    return `${year}-${month}`
  }
  
  throw new Error(`Invalid month format: ${monthStr}. Expected YYYY-MM, MM/YYYY, or parseable date.`)
}

/**
 * Clean and normalize numeric values
 */
export function normalizeNumber(value: any): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  
  // Remove currency symbols, commas, parentheses
  const cleaned = value.toString()
    .replace(/[$,()]/g, '')
    .replace(/^\s+|\s+$/g, '')
  
  // Handle negative values in parentheses
  const isNegative = value.toString().includes('(') && value.toString().includes(')')
  
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  
  return isNegative ? -num : num
}