export interface ClaimRecord {
  id: string
  claimantId: string
  claimDate: string // ISO string
  monthKey: string // YYYY-MM format
  serviceType: string
  medicalAmount: number
  pharmacyAmount: number
  totalAmount: number
  icdCode?: string
  medicalDesc?: string
  laymanTerm?: string
  provider?: string
  location?: string
  originalRow: Record<string, any>
}

export interface RawClaimData {
  [key: string]: string | number | null | undefined
}

export interface FieldMapping {
  claimantId?: string
  claimDate?: string
  serviceType?: string
  medicalAmount?: string
  pharmacyAmount?: string
  totalAmount?: string
  icdCode?: string
  medicalDesc?: string
  laymanTerm?: string
  provider?: string
  location?: string
}

export interface ValidationError {
  row: number
  field: string
  value: any
  message: string
  severity: 'error' | 'warning'
}

export interface DataQualityStats {
  rowCount: number
  validRows: number
  invalidRows: number
  missingRequired: Record<string, number>
  invalidDates: number
  duplicateIds: number
  dataCompleteness: number // percentage
}

export interface ProcessingResult {
  claims: ClaimRecord[]
  errors: ValidationError[]
  stats: DataQualityStats
  mapping: FieldMapping
  carrier?: string
  confidence?: number
}

export interface CarrierFormat {
  name: string
  confidence: number
  indicators: string[]
  defaultMapping: FieldMapping
}

export const REQUIRED_FIELDS = ['claimantId', 'claimDate', 'serviceType', 'medicalAmount', 'pharmacyAmount'] as const
export const OPTIONAL_FIELDS = ['totalAmount', 'icdCode', 'medicalDesc', 'laymanTerm', 'provider', 'location'] as const
export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const

export type RequiredField = typeof REQUIRED_FIELDS[number]
export type OptionalField = typeof OPTIONAL_FIELDS[number]
export type ClaimField = typeof ALL_FIELDS[number]