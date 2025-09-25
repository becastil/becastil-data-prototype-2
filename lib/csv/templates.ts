const EXPERIENCE_MONTH_HEADERS = [
  'Jan-2024',
  'Feb-2024',
  'Mar-2024',
  'Apr-2024',
  'May-2024',
  'Jun-2024',
  'Jul-2024',
  'Aug-2024',
  'Sep-2024',
  'Oct-2024',
  'Nov-2024',
  'Dec-2024',
] as const

export const EXPERIENCE_TEMPLATE_HEADERS = [
  'Category',
  ...EXPERIENCE_MONTH_HEADERS,
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
  const [monthPart, yearPart] = label.trim().split('-')
  if (!monthPart || !yearPart) {
    throw new Error(`Invalid month header: ${label}`)
  }

  const monthIndex = EXPERIENCE_MONTH_HEADERS.findIndex(h => h.startsWith(monthPart))
  if (monthIndex === -1) {
    throw new Error(`Unsupported month label: ${label}`)
  }

  const monthNum = (monthIndex + 1).toString().padStart(2, '0')
  return `${yearPart}-${monthNum}`
}

export { EXPERIENCE_MONTH_HEADERS }
