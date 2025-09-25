/**
 * Simple store implementation using React Context and localStorage
 * TODO: Replace with Zustand once dependency is installed
 */

import { createContext, useContext } from 'react'
import { ExperienceRow } from '../schemas/experience'
import { FinancialMetrics } from '../calc/financialMetrics'
import { HighCostClaimant } from '../schemas/highCost'
import { FeesRow, MonthlySummary } from '../schemas/fees'

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
}

export interface AppActions {
  setExperience: (rows: ExperienceRow[]) => void
  setHighCostClaimants: (rows: HighCostClaimant[]) => void
  upsertFees: (row: FeesRow) => void
  resetFees: () => void
  clearAllData: () => void
}

export type AppStore = AppState & AppActions

export type { ExperienceRow, HighCostClaimant, FeesRow }

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
