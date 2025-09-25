const DEFAULT_EXPERIENCE_MONTH_HEADERS = [
  '1/1/2024',
  '2/1/2024',
  '3/1/2024',
  '4/1/2024',
  '5/1/2024',
  '6/1/2024',
  '7/1/2024',
  '8/1/2024',
  '9/1/2024',
  '10/1/2024',
  '11/1/2024',
  '12/1/2024',
] as const

export const EXPERIENCE_TEMPLATE_HEADERS = [
  'Category',
  ...DEFAULT_EXPERIENCE_MONTH_HEADERS,
] as const

export const EXPERIENCE_TEMPLATE_SAMPLE_ROW = [
  'MEDICAL CLAIMS',
  '100000',
  '98000',
  '102500',
  '99500',
  '110200',
  '108300',
  '101750',
  '99000',
  '104250',
  '107000',
  '103500',
  '109800',
] as const

export const EXPERIENCE_TEMPLATE_FILENAME = 'experience_data_template.csv'

export const HIGH_COST_TEMPLATE_HEADERS = [
  'Member ID',
  'Member Type (Employee/Spouse/Dependent)',
  'Age Band',
  'Primary Diagnosis Category',
  'Specific Diagnosis Details Short',
  'Specific Diagnosis Details',
  '% of Plan Paid',
  '% of large claims',
  'Total',
  'Facility Inpatient',
  'Facility Outpatient',
  'Professional',
  'Pharmacy',
  'Top Provider',
  'Enrolled (Y/N)',
  'Stop-Loss Deductible',
  'Estimated Stop-Loss Reimbursement',
  'Hit Stop Loss?',
] as const

export const HIGH_COST_TEMPLATE_SAMPLE_ROW = [
  '123456',
  'Employee',
  '50-54',
  'Oncology',
  'Lymphoma',
  'B-Cell non-Hodgkin lymphoma',
  '85',
  '12',
  '275000',
  '120000',
  '60000',
  '50000',
  '45000',
  'Regional Medical Center',
  'Y',
  '250000',
  '25000',
  'N',
] as const

export const HIGH_COST_TEMPLATE_FILENAME = 'high_cost_claimants_template.csv'

export interface HeaderValidationResult {
  ok: boolean
  missing: string[]
  unexpected: string[]
  outOfOrder: string[]
}

export interface ExperienceHeaderValidationResult extends HeaderValidationResult {
  monthHeaders: string[]
}

// Regex to match M/D/YYYY format (e.g., 1/1/2025, 12/1/2024)
const DATE_LABEL_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

export function downloadCsvTemplate(
  filename: string,
  headers: readonly string[],
  sampleRow: readonly (string | number)[],
) {
  const csvLines = [
    headers.join(','),
    sampleRow.map(value => (typeof value === 'string' ? value : value.toString())).join(','),
  ]
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function validateCsvHeaders(
  found: string[],
  expected: readonly string[],
): HeaderValidationResult {
  const normalizedFound = found.map(h => h.trim())
  const normalizedExpected = expected.map(h => h.trim())

  const missing = normalizedExpected.filter(header => !normalizedFound.includes(header))
  const unexpected = normalizedFound.filter(header => !normalizedExpected.includes(header))

  const outOfOrder: string[] = []
  normalizedExpected.forEach((header, index) => {
    if (normalizedFound[index] !== header && normalizedFound.includes(header)) {
      outOfOrder.push(header)
    }
  })

  const ok =
    missing.length === 0 &&
    unexpected.length === 0 &&
    outOfOrder.length === 0 &&
    normalizedFound.length === normalizedExpected.length

  return { ok, missing, unexpected, outOfOrder }
}

export function validateExperienceHeaders(found: string[]): ExperienceHeaderValidationResult {
  const normalizedFound = found.map(header => header.trim())
  const missing: string[] = []
  const unexpected: string[] = []
  const outOfOrder: string[] = []
  const monthHeaders: string[] = []

  const categoryIndex = normalizedFound.indexOf('Category')

  if (categoryIndex === -1) {
    missing.push('Category')
  } else if (categoryIndex !== 0) {
    outOfOrder.push('Category')
  }

  const bodyHeaders = normalizedFound.filter((_, index) => index !== categoryIndex)

  if (bodyHeaders.length === 0) {
    missing.push('At least one month column')
  }

  bodyHeaders.forEach(header => {
    if (!DATE_LABEL_REGEX.test(header)) {
      unexpected.push(header)
      return
    }
    
    // Validate that it's the first day of the month
    const match = header.match(DATE_LABEL_REGEX)
    if (match) {
      const day = parseInt(match[2])
      if (day !== 1) {
        unexpected.push(`${header} (must be 1st day of month)`)
        return
      }
    }
    
    monthHeaders.push(header)
  })

  const duplicateMonths = monthHeaders.filter((header, index) => monthHeaders.indexOf(header) !== index)
  duplicateMonths.forEach(header => {
    const duplicateLabel = `Duplicate: ${header}`
    if (!unexpected.includes(duplicateLabel)) {
      unexpected.push(duplicateLabel)
    }
  })

  const ok = missing.length === 0 && unexpected.length === 0 && outOfOrder.length === 0

  return { ok, missing, unexpected, outOfOrder, monthHeaders }
}

export function coercePercent(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value !== 'string') {
    return 0
  }

  const cleaned = value.replace(/%/g, '').trim()
  const parsed = parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

export function coerceCurrency(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value !== 'string') {
    return 0
  }

  const cleaned = value
    .replace(/[$,]/g, '')
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')

  const parsed = parseFloat(cleaned)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  const isNegative = value.includes('(') && value.includes(')')
  return isNegative ? -parsed : parsed
}

export function coerceYesNo(value: unknown): 'Y' | 'N' {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase()
    if (normalized === 'Y' || normalized === 'YES') {
      return 'Y'
    }
    if (normalized === 'N' || normalized === 'NO') {
      return 'N'
    }
  }
  return 'N'
}

export function experienceLabelToMonth(label: string): string {
  const trimmed = label.trim()
  const match = trimmed.match(DATE_LABEL_REGEX)
  if (!match) {
    throw new Error(`Invalid date header: ${label}`)
  }

  const month = parseInt(match[1])
  const day = parseInt(match[2])
  const year = parseInt(match[3])
  
  if (day !== 1) {
    throw new Error(`Date must be first day of month: ${label}`)
  }
  
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in date: ${label}`)
  }

  return `${year}-${month.toString().padStart(2, '0')}`
}
