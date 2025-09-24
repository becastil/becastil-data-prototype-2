import { z } from 'zod'

// Month keys for 2024
export type MonthKey = 
  | 'Jan-2024' | 'Feb-2024' | 'Mar-2024' | 'Apr-2024' 
  | 'May-2024' | 'Jun-2024' | 'Jul-2024' | 'Aug-2024' 
  | 'Sep-2024' | 'Oct-2024' | 'Nov-2024' | 'Dec-2024'

export const MONTH_KEYS: MonthKey[] = [
  'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024',
  'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 
  'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
]

export const MONTH_DISPLAY_NAMES: Record<MonthKey, string> = {
  'Jan-2024': 'Jan',
  'Feb-2024': 'Feb', 
  'Mar-2024': 'Mar',
  'Apr-2024': 'Apr',
  'May-2024': 'May',
  'Jun-2024': 'Jun',
  'Jul-2024': 'Jul',
  'Aug-2024': 'Aug',
  'Sep-2024': 'Sep',
  'Oct-2024': 'Oct',
  'Nov-2024': 'Nov',
  'Dec-2024': 'Dec'
}

// Number coercion for form inputs - handles strings to integers with rounding
const numericField = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return null
  if (typeof val === 'number') return Math.round(val)
  
  // Handle string inputs - remove formatting and parse
  const str = String(val).replace(/[,$\s%]/g, '')
  if (str === '') return null
  
  const num = parseFloat(str)
  return isNaN(num) ? null : Math.round(num)
}, z.number().nullable())

// Base row interface
export type RowBase = {
  id: string
  Category: string
  order: number // For manual reordering
}

// Data row with monthly values
export type DataRow = RowBase & {
  kind: 'data'
  months: Record<MonthKey, number | null>
  isManualTotal?: boolean // Flag for imported manual totals
}

// Header row (labels only, no numeric data)
export type HeaderRow = RowBase & {
  kind: 'header'
}

// Computed row for subtotals and grand total
export type ComputedRow = RowBase & {
  kind: 'computed'
  formula: 'subtotal' | 'grandtotal'
  targetRows: string[] // IDs of rows to sum
  groupId?: string // For grouping subtotals
}

export type TableRow = DataRow | HeaderRow | ComputedRow

// Zod schemas for validation
export const DataRowSchema = z.object({
  id: z.string(),
  Category: z.string().min(1, 'Category is required'),
  kind: z.literal('data'),
  order: z.number(),
  months: z.object({
    'Jan-2024': numericField,
    'Feb-2024': numericField,
    'Mar-2024': numericField,
    'Apr-2024': numericField,
    'May-2024': numericField,
    'Jun-2024': numericField,
    'Jul-2024': numericField,
    'Aug-2024': numericField,
    'Sep-2024': numericField,
    'Oct-2024': numericField,
    'Nov-2024': numericField,
    'Dec-2024': numericField,
  }),
  isManualTotal: z.boolean().optional(),
})

export const HeaderRowSchema = z.object({
  id: z.string(),
  Category: z.string().min(1, 'Category is required'),
  kind: z.literal('header'),
  order: z.number(),
})

export const ComputedRowSchema = z.object({
  id: z.string(),
  Category: z.string().min(1, 'Category is required'),
  kind: z.literal('computed'),
  order: z.number(),
  formula: z.enum(['subtotal', 'grandtotal']),
  targetRows: z.array(z.string()),
  groupId: z.string().optional(),
})

export const TableRowSchema = z.discriminatedUnion('kind', [
  DataRowSchema,
  HeaderRowSchema,
  ComputedRowSchema,
])

export const TableDataSchema = z.object({
  rows: z.array(TableRowSchema),
  version: z.number().default(1),
  lastModified: z.date().default(() => new Date()),
})

export type TableData = z.infer<typeof TableDataSchema>

// Validation issue types
export type ValidationIssue = {
  id: string
  rowId: string
  type: 'error' | 'warning'
  field?: MonthKey | 'Category'
  message: string
  value?: any
}

export type ValidationResult = {
  isValid: boolean
  canExport: boolean // False if any errors exist
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
}

// CSV row structure for import/export
export type CSVRow = {
  Category: string
  'Jan-2024': string | number
  'Feb-2024': string | number
  'Mar-2024': string | number
  'Apr-2024': string | number
  'May-2024': string | number
  'Jun-2024': string | number
  'Jul-2024': string | number
  'Aug-2024': string | number
  'Sep-2024': string | number
  'Oct-2024': string | number
  'Nov-2024': string | number
  'Dec-2024': string | number
}

export const CSVRowSchema = z.object({
  Category: z.string(),
  'Jan-2024': z.union([z.string(), z.number()]),
  'Feb-2024': z.union([z.string(), z.number()]),
  'Mar-2024': z.union([z.string(), z.number()]),
  'Apr-2024': z.union([z.string(), z.number()]),
  'May-2024': z.union([z.string(), z.number()]),
  'Jun-2024': z.union([z.string(), z.number()]),
  'Jul-2024': z.union([z.string(), z.number()]),
  'Aug-2024': z.union([z.string(), z.number()]),
  'Sep-2024': z.union([z.string(), z.number()]),
  'Oct-2024': z.union([z.string(), z.number()]),
  'Nov-2024': z.union([z.string(), z.number()]),
  'Dec-2024': z.union([z.string(), z.number()]),
})

// Known healthcare cost categories for validation warnings
export const KNOWN_CATEGORIES = [
  'Domestic Medical Facility Claims (Inpatient)',
  'Domestic Medical Facility Claims (Outpatient)',
  'Non-Domestic Medical Claims',
  'Non-Hospital Medical Claims',
  'Prescription Drug Claims',
  'Dental Claims',
  'Vision Claims',
  'Administrative Fees',
  'Stop-Loss Premium',
  'Total Hospital Medical Claims',
  'Grand Total',
  // Additional common categories
  'Medical Claims',
  'Pharmacy Claims',
  'Hospital Claims',
  'Outpatient Claims',
  'Inpatient Claims',
  'Preventive Care',
  'Emergency Services',
  'Mental Health Services',
  'Specialist Services',
  'Laboratory Services',
  'Radiology Services',
  'Physical Therapy',
  'Occupational Therapy',
  'Chiropractic Services',
  'Case Management Fees',
  'Network Access Fees',
  'Claims Processing Fees',
  'TPA Fees',
  'Cobra Administration',
  'Reinsurance Premium',
  'Stop-Loss Claims',
  'Aggregate Stop-Loss',
  'Specific Stop-Loss',
] as const

export type KnownCategory = typeof KNOWN_CATEGORIES[number]

// Default template rows
export const DEFAULT_TEMPLATE_ROWS: TableRow[] = [
  {
    id: 'row-1',
    kind: 'data',
    Category: 'Domestic Medical Facility Claims (Inpatient)',
    order: 1,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-2',
    kind: 'data',
    Category: 'Domestic Medical Facility Claims (Outpatient)',
    order: 2,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-3',
    kind: 'data',
    Category: 'Non-Domestic Medical Claims',
    order: 3,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-4',
    kind: 'data',
    Category: 'Non-Hospital Medical Claims',
    order: 4,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-5',
    kind: 'data',
    Category: 'Prescription Drug Claims',
    order: 5,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-6',
    kind: 'data',
    Category: 'Dental Claims',
    order: 6,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-7',
    kind: 'data',
    Category: 'Vision Claims',
    order: 7,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-8',
    kind: 'data',
    Category: 'Administrative Fees',
    order: 8,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-9',
    kind: 'data',
    Category: 'Stop-Loss Premium',
    order: 9,
    months: {
      'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
      'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
      'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
    },
  },
  {
    id: 'row-10',
    kind: 'computed',
    Category: 'Total Hospital Medical Claims',
    order: 10,
    formula: 'subtotal',
    targetRows: ['row-1', 'row-2'],
    groupId: 'hospital-medical',
  },
  {
    id: 'row-11',
    kind: 'computed',
    Category: 'Grand Total',
    order: 11,
    formula: 'grandtotal',
    targetRows: [], // Will compute from all data rows
  },
]

// CSV headers in exact order for import/export
export const CSV_HEADERS = ['Category', ...MONTH_KEYS] as const