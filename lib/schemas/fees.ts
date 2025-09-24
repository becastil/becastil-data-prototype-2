import { z } from 'zod'
import { MonthSchema } from './experience'

export const FeesRowSchema = z.object({
  month: MonthSchema,
  tpaFee: z.coerce.number().nonnegative('TPA fee must be non-negative').default(0),
  networkFee: z.coerce.number().nonnegative('Network fee must be non-negative').default(0),
  stopLossPremium: z.coerce.number().nonnegative('Stop loss premium must be non-negative').default(0),
  otherFees: z.coerce.number().nonnegative('Other fees must be non-negative').default(0),
})

export type FeesRow = z.infer<typeof FeesRowSchema>

export const FeesDataSchema = z.record(z.string(), FeesRowSchema)

export type FeesData = z.infer<typeof FeesDataSchema>

// Derived calculations
export interface MonthlySummary {
  month: string
  claims: number
  premium: number
  feesTotal: number
  totalCost: number
  lossRatio: number | null
  r12LossRatio: number | null
}

export interface CategoryTotal {
  category: string
  amount: number
  percentage: number
}

export interface TopClaimant {
  memberId: string
  totalAmount: number
  claimCount: number
  percentage: number
}

export interface ChartDataPoint {
  month: string
  [key: string]: any
}