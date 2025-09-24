import { z } from 'zod'

// Data coercion utilities
const currencyField = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return 0
  const str = String(val).replace(/[$,\s%]/g, '')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}, z.number().min(0))

const percentageField = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return 0
  const str = String(val).replace(/[%\s]/g, '')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num / 100 // Convert percentage to decimal
}, z.number().min(0).max(1))

const stringField = z.preprocess((val) => {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}, z.string())

const optionalStringField = z.preprocess((val) => {
  if (val === null || val === undefined || String(val).trim() === '') return undefined
  return String(val).trim()
}, z.string().optional())

// Provider normalization map for consistent analytics
export const PROVIDER_ALIASES = {
  // Anthem variations
  'anthem': ['anthem blue cross', 'anthem bc', 'anthem health', 'anthem medical', 'anthem inc'],
  
  // Kaiser variations
  'kaiser': ['kaiser permanente', 'kaiser health', 'kp', 'kaiser medical'],
  
  // UnitedHealth variations
  'unitedhealthcare': ['united healthcare', 'united health', 'uhc', 'united medical'],
  
  // Aetna variations
  'aetna': ['aetna health', 'aetna medical', 'aetna inc'],
  
  // Cigna variations
  'cigna': ['cigna health', 'cigna medical', 'cigna corp'],
  
  // Blue Cross Blue Shield variations
  'bcbs': ['blue cross blue shield', 'blue cross', 'blue shield', 'bcbs health'],
  
  // Humana variations
  'humana': ['humana health', 'humana medical', 'humana inc'],
  
  // Generic categories
  'other': ['other provider', 'miscellaneous', 'unknown', 'n/a', 'not specified']
} as const

// HCC CSV Schema - 18 required columns
export const HCCRowSchema = z.object({
  // Core member identification
  'Member ID': stringField,
  'Member Type': z.enum(['Employee', 'Spouse', 'Child', 'Dependent']),
  'Age Band': z.enum(['0-17', '18-25', '26-35', '36-45', '46-55', '56-64', '65+']),
  
  // Diagnosis information  
  'Primary Diagnosis Category': optionalStringField,
  'Secondary Diagnosis Category': optionalStringField,
  'ICD-10 Primary Code': optionalStringField,
  'ICD-10 Secondary Code': optionalStringField,
  
  // Financial data with currency coercion
  'Total Paid YTD': currencyField,
  'Medical Costs YTD': currencyField,
  'Pharmacy Costs YTD': currencyField,
  'Total Projected Annual': currencyField,
  
  // Provider and facility information
  'Primary Provider': optionalStringField,
  'Provider Network': z.enum(['In-Network', 'Out-of-Network', 'Mixed']).optional(),
  'Primary Facility': optionalStringField,
  
  // Risk and management
  'Risk Adjustment Factor': percentageField,
  'Stop Loss Applicable': z.enum(['Yes', 'No']).optional(),
  'Case Management Required': z.enum(['Yes', 'No']).optional(),
  
  // Claims status
  'Claims Status': z.enum(['Active', 'Resolved', 'Under Review', 'Projected']).optional(),
})

export type HCCRow = z.infer<typeof HCCRowSchema>

// Expected column headers for validation
export const HCC_EXPECTED_COLUMNS = [
  'Member ID',
  'Member Type', 
  'Age Band',
  'Primary Diagnosis Category',
  'Secondary Diagnosis Category',
  'ICD-10 Primary Code',
  'ICD-10 Secondary Code',
  'Total Paid YTD',
  'Medical Costs YTD', 
  'Pharmacy Costs YTD',
  'Total Projected Annual',
  'Primary Provider',
  'Provider Network',
  'Primary Facility',
  'Risk Adjustment Factor',
  'Stop Loss Applicable',
  'Case Management Required',
  'Claims Status'
] as const

// Required columns (minimum needed for basic functionality)
export const HCC_REQUIRED_COLUMNS = [
  'Member ID',
  'Member Type',
  'Age Band', 
  'Total Paid YTD',
  'Medical Costs YTD',
  'Pharmacy Costs YTD'
] as const

// Normalized HCC data for analytics (transformed from wide to long format)
export const HCCNormalizedSchema = z.object({
  member_id: z.string(),
  member_type: z.string(),
  age_band: z.string(),
  primary_diagnosis: z.string().optional(),
  secondary_diagnosis: z.string().optional(),
  icd10_primary: z.string().optional(),
  icd10_secondary: z.string().optional(),
  total_paid_ytd: z.number(),
  medical_costs_ytd: z.number(),
  pharmacy_costs_ytd: z.number(),
  total_projected_annual: z.number(),
  primary_provider: z.string().optional(),
  provider_network: z.string().optional(),
  primary_facility: z.string().optional(),
  risk_adjustment_factor: z.number(),
  stop_loss_applicable: z.boolean().optional(),
  case_management_required: z.boolean().optional(),
  claims_status: z.string().optional(),
  // Analytics-friendly fields
  provider_normalized: z.string().optional(),
  cost_category: z.enum(['Low', 'Medium', 'High', 'Critical']),
  risk_tier: z.enum(['Low', 'Medium', 'High']),
  projected_savings_potential: z.number(),
})

export type HCCNormalized = z.infer<typeof HCCNormalizedSchema>

// Analytics aggregations for dashboard
export const HCCAnalyticsSchema = z.object({
  // KPI tiles data
  total_members: z.number(),
  total_costs_ytd: z.number(),
  average_cost_per_member: z.number(),
  projected_annual_costs: z.number(),
  high_cost_members: z.number(),
  
  // Chart data structures
  cost_by_age_band: z.array(z.object({
    age_band: z.string(),
    total_costs: z.number(),
    member_count: z.number(),
    avg_cost: z.number(),
  })),
  
  cost_by_provider: z.array(z.object({
    provider: z.string(),
    total_costs: z.number(),
    member_count: z.number(),
    percentage_of_total: z.number(),
  })),
  
  medical_vs_pharmacy: z.object({
    medical_total: z.number(),
    pharmacy_total: z.number(),
    medical_percentage: z.number(),
    pharmacy_percentage: z.number(),
  }),
  
  risk_distribution: z.array(z.object({
    risk_tier: z.string(),
    member_count: z.number(),
    average_cost: z.number(),
  })),
  
  monthly_trend: z.array(z.object({
    month: z.string(),
    cumulative_costs: z.number(),
    projected_costs: z.number(),
  })),
})

export type HCCAnalytics = z.infer<typeof HCCAnalyticsSchema>

// Validation result structure
export interface HCCValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{
    row: number
    field: string
    message: string
    value: any
  }>
  warnings: Array<{
    row: number
    field: string
    message: string
    value: any
  }>
  summary: {
    member_count: number
    total_costs: number
    data_completeness: number
    provider_coverage: number
  }
}

// Column aliases for fuzzy matching during upload
export const HCC_COLUMN_ALIASES = {
  'Member ID': ['MemberID', 'Member_ID', 'ID', 'Patient ID', 'Patient_ID'],
  'Member Type': ['MemberType', 'Member_Type', 'Type', 'Relationship'],
  'Age Band': ['AgeBand', 'Age_Band', 'Age Group', 'AgeGroup', 'Age_Group'],
  'Primary Diagnosis Category': ['Primary_Diagnosis', 'PrimaryDiagnosis', 'Diagnosis1', 'Diag1'],
  'Secondary Diagnosis Category': ['Secondary_Diagnosis', 'SecondaryDiagnosis', 'Diagnosis2', 'Diag2'],
  'Total Paid YTD': ['Total_Paid_YTD', 'TotalPaidYTD', 'Total Paid', 'Total_Paid'],
  'Medical Costs YTD': ['Medical_Costs_YTD', 'MedicalCostsYTD', 'Medical Costs', 'Medical_Costs'],
  'Pharmacy Costs YTD': ['Pharmacy_Costs_YTD', 'PharmacyCostsYTD', 'Pharmacy Costs', 'Pharmacy_Costs'],
  'Primary Provider': ['Primary_Provider', 'PrimaryProvider', 'Provider', 'Main Provider'],
  'Provider Network': ['Provider_Network', 'ProviderNetwork', 'Network', 'Network Status'],
  'Risk Adjustment Factor': ['Risk_Adjustment_Factor', 'RiskAdjustmentFactor', 'Risk Factor', 'RAF'],
} as const

// CSV parsing and validation configuration
export const HCC_PARSE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB limit
  allowedMimeTypes: ['text/csv', 'application/csv'],
  skipEmptyLines: true,
  trimHeaders: true,
  delimiter: ',',
  encoding: 'utf8',
} as const

// Cost categorization thresholds for analytics
export const COST_THRESHOLDS = {
  LOW: 0,
  MEDIUM: 5000,
  HIGH: 25000,
  CRITICAL: 100000,
} as const

// Risk tier calculation thresholds
export const RISK_THRESHOLDS = {
  LOW: 0,
  MEDIUM: 0.5,
  HIGH: 1.5,
} as const