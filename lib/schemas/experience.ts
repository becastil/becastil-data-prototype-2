import { z } from 'zod'

export const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format')

export const ExperienceRowSchema = z.object({
  month: MonthSchema,
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().nonnegative('Amount must be non-negative'),
  premium: z.coerce.number().nonnegative().optional(),
  claims: z.coerce.number().nonnegative().optional(),
})

export type ExperienceRow = z.infer<typeof ExperienceRowSchema>

export const ExperienceDataSchema = z.array(ExperienceRowSchema)

export type ExperienceData = z.infer<typeof ExperienceDataSchema>

// Member-level data for high-cost claimant analysis
export const MemberClaimSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  month: MonthSchema,
  paidAmount: z.coerce.number().nonnegative('Paid amount must be non-negative'),
  diagnosisCode: z.string().optional(),
  serviceType: z.string().optional(),
  category: z.string().optional(),
})

export type MemberClaim = z.infer<typeof MemberClaimSchema>

export const MemberClaimsSchema = z.array(MemberClaimSchema)

export type MemberClaimsData = z.infer<typeof MemberClaimsSchema>

// CSV header mapping
export const CSV_HEADER_MAPPINGS = {
  experience: {
    month: ['month', 'date', 'period', 'month_year'],
    category: ['category', 'service_type', 'claim_type', 'type'],
    amount: ['amount', 'paid_amount', 'claim_amount', 'cost', 'total'],
    premium: ['premium', 'premium_amount', 'monthly_premium'],
    claims: ['claims', 'claim_count', 'total_claims'],
  },
  member: {
    memberId: ['member_id', 'claimant_id', 'subscriber_id', 'id'],
    month: ['month', 'date', 'service_date', 'claim_date'],
    paidAmount: ['paid_amount', 'amount', 'claim_amount', 'cost'],
    diagnosisCode: ['diagnosis', 'diagnosis_code', 'icd_code'],
    serviceType: ['service_type', 'type', 'category'],
    category: ['category', 'service_category', 'claim_type'],
  },
} as const