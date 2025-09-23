import { z } from 'zod'

// Utility function to convert string to number, treating empty strings as 0
const numericField = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return 0
  const num = parseFloat(String(val).replace(/,/g, ''))
  return isNaN(num) ? 0 : num
}, z.number())

// Healthcare Cost Data Schema
export const HealthcareCostRowSchema = z.object({
  Category: z.string(),
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
})

export type HealthcareCostRow = z.infer<typeof HealthcareCostRowSchema>

// Normalized healthcare cost data (long format)
export const HealthcareCostNormalizedSchema = z.object({
  category: z.string(),
  month: z.string(),
  amount: z.number(),
  year: z.number(),
  monthNum: z.number(), // 1-12 for sorting
})

export type HealthcareCostNormalized = z.infer<typeof HealthcareCostNormalizedSchema>

// High Cost Claimant Schema
export const HighCostClaimantRowSchema = z.object({
  Claimant_ID: z.string(),
  Member_Type: z.string().optional(),
  Age_Band: z.string().optional(),
  Gender: z.string().optional(),
  Primary_Diagnosis: z.string().optional(),
  Secondary_Diagnosis: z.string().optional(),
  ICD10_Primary: z.string().optional(),
  ICD10_Secondary: z.string().optional(),
  Claim_Start_Date: z.string().optional(),
  Current_Status: z.string().optional(),
  Total_Paid_YTD: numericField,
  Total_Pending: numericField,
  Total_Projected: numericField,
  Prior_Year_Claims: numericField,
  Provider_Network: z.string().optional(),
  Primary_Facility: z.string().optional(),
  Treatment_Category: z.string().optional(),
  Stop_Loss_Threshold: numericField,
  Amount_Over_Threshold: numericField,
  Stop_Loss_Recovery: numericField,
  Case_Management_Status: z.string().optional(),
  Risk_Score: numericField,
  Months_Active: numericField,
  Jan_2024: numericField,
  Feb_2024: numericField,
  Mar_2024: numericField,
  Apr_2024: numericField,
  May_2024: numericField,
  Jun_2024: numericField,
  Jul_2024: numericField,
  Aug_2024: numericField,
  Sep_2024: numericField,
  Oct_2024: numericField,
  Nov_2024: numericField,
  Dec_2024_Proj: numericField,
})

export type HighCostClaimantRow = z.infer<typeof HighCostClaimantRowSchema>

// Normalized claimant monthly data (long format)
export const ClaimantMonthlySchema = z.object({
  claimant_id: z.string(),
  month: z.string(),
  amount: z.number(),
  year: z.number(),
  monthNum: z.number(),
  isProjected: z.boolean(),
})

export type ClaimantMonthly = z.infer<typeof ClaimantMonthlySchema>

// CSV Schema Detection
export enum CSVSchemaType {
  HEALTHCARE_COSTS = 'healthcare_costs',
  HIGH_COST_CLAIMANTS = 'high_cost_claimants',
  UNKNOWN = 'unknown'
}

// Column mapping interface
export interface ColumnMapping {
  source: string
  target: string
  confidence: number // 0-1 score from fuzzy matching
  isRequired: boolean
  isPerfectMatch: boolean
}

export interface SchemaValidationResult {
  schemaType: CSVSchemaType
  isValid: boolean
  validRows: number
  totalRows: number
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
  missingColumns: string[]
  extraColumns: string[]
  suggestions: ColumnMapping[]
}

// Expected column sets for schema detection
export const HEALTHCARE_COST_EXPECTED_COLUMNS = [
  'Category',
  'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024',
  'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
]

export const HIGH_COST_CLAIMANT_EXPECTED_COLUMNS = [
  'Claimant_ID', 'Member_Type', 'Age_Band', 'Gender', 'Primary_Diagnosis',
  'Secondary_Diagnosis', 'ICD10_Primary', 'ICD10_Secondary', 'Claim_Start_Date',
  'Current_Status', 'Total_Paid_YTD', 'Total_Pending', 'Total_Projected',
  'Prior_Year_Claims', 'Provider_Network', 'Primary_Facility', 'Treatment_Category',
  'Stop_Loss_Threshold', 'Amount_Over_Threshold', 'Stop_Loss_Recovery',
  'Case_Management_Status', 'Risk_Score', 'Months_Active',
  'Jan_2024', 'Feb_2024', 'Mar_2024', 'Apr_2024', 'May_2024', 'Jun_2024',
  'Jul_2024', 'Aug_2024', 'Sep_2024', 'Oct_2024', 'Nov_2024', 'Dec_2024_Proj'
]

// Required columns for each schema (minimum needed for basic functionality)
export const HEALTHCARE_COST_REQUIRED_COLUMNS = [
  'Category',
  'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024'
]

export const HIGH_COST_CLAIMANT_REQUIRED_COLUMNS = [
  'Claimant_ID', 'Total_Paid_YTD', 'Jan_2024', 'Feb_2024', 'Mar_2024'
]

// Column aliases for fuzzy matching
export const COLUMN_ALIASES = {
  // Healthcare costs aliases
  'Jan-2024': ['Jan 2024', 'January 2024', 'Jan_2024', 'January-2024'],
  'Feb-2024': ['Feb 2024', 'February 2024', 'Feb_2024', 'February-2024'],
  'Mar-2024': ['Mar 2024', 'March 2024', 'Mar_2024', 'March-2024'],
  'Apr-2024': ['Apr 2024', 'April 2024', 'Apr_2024', 'April-2024'],
  'May-2024': ['May 2024', 'May_2024'],
  'Jun-2024': ['Jun 2024', 'June 2024', 'Jun_2024', 'June-2024'],
  'Jul-2024': ['Jul 2024', 'July 2024', 'Jul_2024', 'July-2024'],
  'Aug-2024': ['Aug 2024', 'August 2024', 'Aug_2024', 'August-2024'],
  'Sep-2024': ['Sep 2024', 'September 2024', 'Sep_2024', 'September-2024'],
  'Oct-2024': ['Oct 2024', 'October 2024', 'Oct_2024', 'October-2024'],
  'Nov-2024': ['Nov 2024', 'November 2024', 'Nov_2024', 'November-2024'],
  'Dec-2024': ['Dec 2024', 'December 2024', 'Dec_2024', 'December-2024'],
  
  // High cost claimant aliases
  'Claimant_ID': ['Member_ID', 'ID', 'MemberID', 'ClaimantID'],
  'Total_Paid_YTD': ['Total Paid YTD', 'Total_Allowed', 'Total Allowed', 'Member_Paid', 'Plan_Paid'],
  'Jan_2024': ['Jan 2024', 'January 2024', 'Jan-2024', 'January-2024'],
  'Feb_2024': ['Feb 2024', 'February 2024', 'Feb-2024', 'February-2024'],
  'Mar_2024': ['Mar 2024', 'March 2024', 'Mar-2024', 'March-2024'],
  'Apr_2024': ['Apr 2024', 'April 2024', 'Apr-2024', 'April-2024'],
  'May_2024': ['May 2024', 'May-2024'],
  'Jun_2024': ['Jun 2024', 'June 2024', 'Jun-2024', 'June-2024'],
  'Jul_2024': ['Jul 2024', 'July 2024', 'Jul-2024', 'July-2024'],
  'Aug_2024': ['Aug 2024', 'August 2024', 'Aug-2024', 'August-2024'],
  'Sep_2024': ['Sep 2024', 'September 2024', 'Sep-2024', 'September-2024'],
  'Oct_2024': ['Oct 2024', 'October 2024', 'Oct-2024', 'October-2024'],
  'Nov_2024': ['Nov 2024', 'November 2024', 'Nov-2024', 'November-2024'],
  'Dec_2024_Proj': ['Dec 2024 Proj', 'December 2024 Proj', 'Dec-2024-Proj', 'December-2024-Proj'],
}