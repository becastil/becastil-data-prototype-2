import { z } from 'zod'

export const HighCostClaimantSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  memberType: z.string().min(1, 'Member type is required'),
  ageBand: z.string().min(1, 'Age band is required'),
  primaryDiagnosisCategory: z.string().min(1, 'Primary diagnosis category is required'),
  specificDiagnosisShort: z.string().min(1, 'Short diagnosis description is required'),
  specificDiagnosis: z.string().min(1, 'Diagnosis detail is required'),
  percentPlanPaid: z.number().min(0),
  percentLargeClaims: z.number().min(0),
  total: z.number().min(0),
  facilityInpatient: z.number().min(0),
  facilityOutpatient: z.number().min(0),
  professional: z.number().min(0),
  pharmacy: z.number().min(0),
  topProvider: z.string().min(1, 'Top provider is required'),
  enrolled: z.enum(['Y', 'N']),
  stopLossDeductible: z.number().min(0),
  estimatedStopLossReimbursement: z.number().min(0),
  hitStopLoss: z.enum(['Y', 'N']),
})

export type HighCostClaimant = z.infer<typeof HighCostClaimantSchema>

export const HighCostClaimantsSchema = z.array(HighCostClaimantSchema)
