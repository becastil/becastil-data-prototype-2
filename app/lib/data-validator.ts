import dayjs from 'dayjs'
import { 
  ClaimRecord, 
  FieldMapping, 
  ValidationError, 
  DataQualityStats, 
  RawClaimData,
  REQUIRED_FIELDS 
} from '@/app/types/claims'

export interface ValidationRule {
  field: string
  validator: (value: any, row: RawClaimData, index: number) => ValidationError | null
  required?: boolean
}

export interface ValidationOptions {
  strictMode?: boolean
  skipInvalidRows?: boolean
  maxErrors?: number
  dateFormats?: string[]
  amountFormats?: string[]
}

export class DataValidator {
  private static defaultDateFormats = [
    'MM/DD/YYYY',
    'YYYY-MM-DD',
    'MM-DD-YYYY',
    'DD/MM/YYYY',
    'YYYYMMDD',
    'MM/DD/YY',
    'M/D/YYYY',
    'M/D/YY'
  ]

  private static parseDate(value: any, formats: string[] = this.defaultDateFormats): dayjs.Dayjs | null {
    if (!value) return null
    
    const stringValue = String(value).trim()
    if (!stringValue) return null
    
    // Try each format
    for (const format of formats) {
      const parsed = dayjs(stringValue, format, true)
      if (parsed.isValid()) {
        return parsed
      }
    }
    
    // Try default parsing as fallback
    const fallback = dayjs(stringValue)
    return fallback.isValid() ? fallback : null
  }

  private static parseAmount(value: any): number {
    if (value === null || value === undefined || value === '') return 0
    
    // Convert to string and clean
    const stringValue = String(value)
      .trim()
      .replace(/[$,\s]/g, '') // Remove dollar signs, commas, spaces
      .replace(/[()]/g, '') // Remove parentheses
    
    if (!stringValue) return 0
    
    const parsed = Number(stringValue)
    return Number.isNaN(parsed) ? 0 : Math.abs(parsed) // Use absolute value
  }

  private static validateClaimantId(value: any, row: RawClaimData, index: number): ValidationError | null {
    if (!value || String(value).trim() === '') {
      return {
        row: index + 1,
        field: 'claimantId',
        value,
        message: 'Claimant ID is required',
        severity: 'error'
      }
    }
    
    const stringValue = String(value).trim()
    if (stringValue.length > 50) {
      return {
        row: index + 1,
        field: 'claimantId',
        value,
        message: 'Claimant ID too long (max 50 characters)',
        severity: 'warning'
      }
    }
    
    return null
  }

  private static validateClaimDate(value: any, row: RawClaimData, index: number, dateFormats?: string[]): ValidationError | null {
    const parsed = this.parseDate(value, dateFormats)
    
    if (!parsed) {
      return {
        row: index + 1,
        field: 'claimDate',
        value,
        message: 'Invalid or missing claim date',
        severity: 'error'
      }
    }
    
    const now = dayjs()
    const maxFutureDate = now.add(1, 'year')
    const minPastDate = now.subtract(10, 'years')
    
    if (parsed.isAfter(maxFutureDate)) {
      return {
        row: index + 1,
        field: 'claimDate',
        value,
        message: 'Claim date is too far in the future',
        severity: 'warning'
      }
    }
    
    if (parsed.isBefore(minPastDate)) {
      return {
        row: index + 1,
        field: 'claimDate',
        value,
        message: 'Claim date is very old (more than 10 years)',
        severity: 'warning'
      }
    }
    
    return null
  }

  private static validateServiceType(value: any, row: RawClaimData, index: number): ValidationError | null {
    if (!value || String(value).trim() === '') {
      return {
        row: index + 1,
        field: 'serviceType',
        value,
        message: 'Service type is required',
        severity: 'error'
      }
    }
    
    return null
  }

  private static validateAmount(
    value: any, 
    row: RawClaimData, 
    index: number, 
    fieldName: string
  ): ValidationError | null {
    const amount = this.parseAmount(value)
    
    if (amount < 0) {
      return {
        row: index + 1,
        field: fieldName,
        value,
        message: `Negative ${fieldName} amount`,
        severity: 'warning'
      }
    }
    
    if (amount > 1000000) { // $1M threshold
      return {
        row: index + 1,
        field: fieldName,
        value,
        message: `Unusually high ${fieldName} amount: $${amount.toLocaleString()}`,
        severity: 'warning'
      }
    }
    
    return null
  }

  private static validateIcdCode(value: any, row: RawClaimData, index: number): ValidationError | null {
    if (!value) return null // Optional field
    
    const stringValue = String(value).trim()
    
    // Basic ICD-10 format validation (simplified)
    const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,4})?$/
    const icd9Pattern = /^\d{3}(\.\d{1,2})?$/
    
    if (!icd10Pattern.test(stringValue) && !icd9Pattern.test(stringValue)) {
      return {
        row: index + 1,
        field: 'icdCode',
        value,
        message: 'Invalid ICD code format',
        severity: 'warning'
      }
    }
    
    return null
  }

  static createValidationRules(options: ValidationOptions = {}): ValidationRule[] {
    const { dateFormats } = options
    
    return [
      {
        field: 'claimantId',
        validator: this.validateClaimantId,
        required: true
      },
      {
        field: 'claimDate',
        validator: (value, row, index) => this.validateClaimDate(value, row, index, dateFormats),
        required: true
      },
      {
        field: 'serviceType',
        validator: this.validateServiceType,
        required: true
      },
      {
        field: 'medicalAmount',
        validator: (value, row, index) => this.validateAmount(value, row, index, 'medical'),
        required: false
      },
      {
        field: 'pharmacyAmount',
        validator: (value, row, index) => this.validateAmount(value, row, index, 'pharmacy'),
        required: false
      },
      {
        field: 'totalAmount',
        validator: (value, row, index) => this.validateAmount(value, row, index, 'total'),
        required: false
      },
      {
        field: 'icdCode',
        validator: this.validateIcdCode,
        required: false
      }
    ]
  }

  static validateRow(
    row: RawClaimData, 
    index: number, 
    mapping: FieldMapping, 
    rules: ValidationRule[]
  ): ValidationError[] {
    const errors: ValidationError[] = []
    
    for (const rule of rules) {
      const mappedField = mapping[rule.field as keyof FieldMapping]
      if (!mappedField) {
        if (rule.required) {
          errors.push({
            row: index + 1,
            field: rule.field,
            value: null,
            message: `Required field '${rule.field}' not mapped`,
            severity: 'error'
          })
        }
        continue
      }
      
      const value = row[mappedField]
      const error = rule.validator(value, row, index)
      if (error) {
        errors.push(error)
      }
    }
    
    return errors
  }

  static validateData(
    data: RawClaimData[], 
    mapping: FieldMapping, 
    options: ValidationOptions = {}
  ): { errors: ValidationError[]; stats: DataQualityStats } {
    const {
      strictMode = false,
      maxErrors = 1000,
      dateFormats,
      amountFormats
    } = options
    
    const errors: ValidationError[] = []
    const rules = this.createValidationRules({ dateFormats, amountFormats })
    
    let validRows = 0
    let invalidRows = 0
    let duplicateIds = 0
    const seenIds = new Set<string>()
    const missingRequired: Record<string, number> = {}
    let invalidDates = 0
    
    // Initialize missing required counts
    REQUIRED_FIELDS.forEach(field => {
      missingRequired[field] = 0
    })
    
    for (let i = 0; i < data.length; i++) {
      if (errors.length >= maxErrors) {
        break
      }
      
      const row = data[i]
      const rowErrors = this.validateRow(row, i, mapping, rules)
      
      // Check for duplicate IDs
      const claimantIdField = mapping.claimantId
      if (claimantIdField) {
        const claimantId = String(row[claimantIdField] || '').trim()
        if (claimantId) {
          if (seenIds.has(claimantId)) {
            duplicateIds++
            rowErrors.push({
              row: i + 1,
              field: 'claimantId',
              value: claimantId,
              message: 'Duplicate claimant ID',
              severity: 'warning'
            })
          } else {
            seenIds.add(claimantId)
          }
        }
      }
      
      // Count missing required fields
      REQUIRED_FIELDS.forEach(field => {
        const mappedField = mapping[field]
        if (!mappedField || !row[mappedField] || String(row[mappedField]).trim() === '') {
          missingRequired[field]++
        }
      })
      
      // Count invalid dates
      const claimDateField = mapping.claimDate
      if (claimDateField) {
        const parsed = this.parseDate(row[claimDateField])
        if (!parsed) {
          invalidDates++
        }
      }
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
        if (rowErrors.some(e => e.severity === 'error')) {
          invalidRows++
        } else {
          validRows++
        }
      } else {
        validRows++
      }
    }
    
    const dataCompleteness = data.length > 0 ? (validRows / data.length) * 100 : 0
    
    const stats: DataQualityStats = {
      rowCount: data.length,
      validRows,
      invalidRows,
      missingRequired,
      invalidDates,
      duplicateIds,
      dataCompleteness: Math.round(dataCompleteness * 100) / 100
    }
    
    return { errors, stats }
  }

  static normalizeRow(row: RawClaimData, mapping: FieldMapping, index: number): ClaimRecord | null {
    try {
      const claimantIdField = mapping.claimantId
      const claimDateField = mapping.claimDate
      
      if (!claimantIdField || !claimDateField) {
        return null
      }
      
      const claimantId = String(row[claimantIdField] || '').trim()
      const claimDate = this.parseDate(row[claimDateField])
      
      if (!claimantId || !claimDate) {
        return null
      }
      
      const serviceType = String(row[mapping.serviceType || ''] || 'Unknown').trim()
      const medicalAmount = this.parseAmount(row[mapping.medicalAmount || ''])
      const pharmacyAmount = this.parseAmount(row[mapping.pharmacyAmount || ''])
      
      let totalAmount = medicalAmount + pharmacyAmount
      if (mapping.totalAmount && row[mapping.totalAmount]) {
        const explicitTotal = this.parseAmount(row[mapping.totalAmount])
        if (explicitTotal > 0) {
          totalAmount = explicitTotal
        }
      }
      
      return {
        id: `${claimantId}-${index}`,
        claimantId,
        claimDate: claimDate.toISOString(),
        monthKey: claimDate.format('YYYY-MM'),
        serviceType,
        medicalAmount,
        pharmacyAmount,
        totalAmount,
        icdCode: mapping.icdCode ? String(row[mapping.icdCode] || '').trim() || undefined : undefined,
        medicalDesc: mapping.medicalDesc ? String(row[mapping.medicalDesc] || '').trim() || undefined : undefined,
        laymanTerm: mapping.laymanTerm ? String(row[mapping.laymanTerm] || '').trim() || undefined : undefined,
        provider: mapping.provider ? String(row[mapping.provider] || '').trim() || undefined : undefined,
        location: mapping.location ? String(row[mapping.location] || '').trim() || undefined : undefined,
        originalRow: row
      }
    } catch (error) {
      return null
    }
  }

  static normalizeData(
    data: RawClaimData[], 
    mapping: FieldMapping, 
    options: ValidationOptions = {}
  ): ClaimRecord[] {
    const { skipInvalidRows = true } = options
    const normalized: ClaimRecord[] = []
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const normalizedRow = this.normalizeRow(row, mapping, i)
      
      if (normalizedRow) {
        normalized.push(normalizedRow)
      } else if (!skipInvalidRows) {
        // Could add a placeholder record or throw error
        console.warn(`Failed to normalize row ${i + 1}`)
      }
    }
    
    return normalized
  }

  static generateDataQualityReport(stats: DataQualityStats): string {
    const lines: string[] = []
    
    lines.push(`Data Quality Report`)
    lines.push(`===================`)
    lines.push(`Total Rows: ${stats.rowCount.toLocaleString()}`)
    lines.push(`Valid Rows: ${stats.validRows.toLocaleString()} (${((stats.validRows / stats.rowCount) * 100).toFixed(1)}%)`)
    lines.push(`Invalid Rows: ${stats.invalidRows.toLocaleString()}`)
    lines.push(`Data Completeness: ${stats.dataCompleteness}%`)
    lines.push(``)
    
    if (Object.keys(stats.missingRequired).length > 0) {
      lines.push(`Missing Required Fields:`)
      Object.entries(stats.missingRequired).forEach(([field, count]) => {
        if (count > 0) {
          lines.push(`  ${field}: ${count.toLocaleString()} rows`)
        }
      })
      lines.push(``)
    }
    
    if (stats.invalidDates > 0) {
      lines.push(`Invalid Dates: ${stats.invalidDates.toLocaleString()} rows`)
    }
    
    if (stats.duplicateIds > 0) {
      lines.push(`Duplicate IDs: ${stats.duplicateIds.toLocaleString()} occurrences`)
    }
    
    return lines.join('\n')
  }
}