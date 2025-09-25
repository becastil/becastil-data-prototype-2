/**
 * Simple store implementation using React Context and localStorage
 * TODO: Replace with Zustand once dependency is installed
 */

import { createContext, useContext } from 'react'
import { ExperienceRow } from '../schemas/experience'
import { FinancialMetrics } from '../calc/financialMetrics'
import { HighCostClaimant } from '../schemas/highCost'
import { FeesRow, MonthlySummary } from '../schemas/fees'

export type FeeRateBasis =
  | 'FLAT_MONTHLY'
  | 'PER_EMPLOYEE_PER_MONTH'
  | 'PER_MEMBER_PER_MONTH'
  | 'ANNUAL'
  | 'TIERED'
  | 'CUSTOM'

export interface FeeTier {
  id: string
  label: string
  rate: number
}

export interface FeeDefinition {
  id: string
  name: string
  rateBasis: FeeRateBasis
  rateValue: number
  notes?: string
  tiers?: FeeTier[]
}

export type FeeOverrides = Record<string, Record<string, number>>

export interface StepCompletion {
  upload: boolean
  fees: boolean
  table: boolean
  charts: boolean
}

export interface AppState {
  experience: ExperienceRow[]
  highCostClaimants: HighCostClaimant[]
  feesByMonth: Record<string, FeesRow>
  step: StepCompletion
  summaries: MonthlySummary[]
  months: string[]
  financialMetrics: FinancialMetrics[]
  feeDefinitions: FeeDefinition[]
  feeMonths: string[]
  feeOverrides: FeeOverrides
  feeComputedByMonth: Record<string, Record<string, number>>
  feeTierCounts: Record<string, Record<string, Record<string, number>>>
  budgetByMonth: Record<string, { pepm?: number; total?: number }>
  budgetMonths: string[]
  adjustmentOverrides: Record<string, { rxRebates?: number; stopLossReimbursement?: number }>
}

export interface AppActions {
  setExperience: (rows: ExperienceRow[]) => void
  setHighCostClaimants: (rows: HighCostClaimant[]) => void
  upsertFees: (row: FeesRow) => void
  resetFees: () => void
  clearAllData: () => void
  addFeeDefinition: () => void
  updateFeeDefinition: (id: string, updates: Partial<Omit<FeeDefinition, 'id'>>) => void
  removeFeeDefinition: (id: string) => void
  addFeeTier: (feeId: string) => void
  updateFeeTier: (feeId: string, tierId: string, updates: Partial<Omit<FeeTier, 'id'>>) => void
  removeFeeTier: (feeId: string, tierId: string) => void
  setFeeTierCount: (month: string, feeId: string, tierId: string, count: number | null) => void
  addFeeMonth: (month: string) => void
  removeFeeMonth: (month: string) => void
  setFeeOverride: (month: string, feeId: string, amount: number | null) => void
  setBudgetEntry: (month: string, entry: { pepm?: number | null; total?: number | null }) => void
  removeBudgetEntry: (month: string) => void
  setAdjustmentOverride: (
    month: string,
    entry: { rxRebates?: number | null; stopLossReimbursement?: number | null }
  ) => void
  removeAdjustmentOverride: (month: string) => void
}

export type AppStore = AppState & AppActions

export type { ExperienceRow, HighCostClaimant, FeesRow, FeeDefinition, FeeRateBasis, FeeTier }

export const AppStoreContext = createContext<AppStore | null>(null)

export function useAppStore(): AppStore {
  const context = useContext(AppStoreContext)
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider')
  }
  return context
}

// Selector hooks for specific data
export function useExperienceData() {
  const store = useAppStore()
  return store.experience
}

export function useHighCostClaimants() {
  const store = useAppStore()
  return store.highCostClaimants
}

export function useFeesByMonth() {
  const store = useAppStore()
  return store.feesByMonth
}

export function useStepCompletion() {
  const store = useAppStore()
  return store.step
}

export function useSummaries() {
  const store = useAppStore()
  return store.summaries
}

export function useMonths() {
  const store = useAppStore()
  return store.months
}

export function useFinancialMetrics() {
  const store = useAppStore()
  return store.financialMetrics
}

export function useFeeDefinitions() {
  const store = useAppStore()
  return store.feeDefinitions
}

export function useFeeMonths() {
  const store = useAppStore()
  return store.feeMonths
}

export function useFeeOverrides() {
  const store = useAppStore()
  return store.feeOverrides
}

export function useFeeComputedByMonth() {
  const store = useAppStore()
  return store.feeComputedByMonth
}

export function useFeeTierCounts() {
  const store = useAppStore()
  return store.feeTierCounts
}

export function useBudgetByMonth() {
  const store = useAppStore()
  return store.budgetByMonth
}

export function useBudgetMonths() {
  const store = useAppStore()
  return store.budgetMonths
}

export function useAdjustmentOverrides() {
  const store = useAppStore()
  return store.adjustmentOverrides
}
