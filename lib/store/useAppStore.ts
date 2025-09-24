/**
 * Simple store implementation using React Context and localStorage
 * TODO: Replace with Zustand once dependency is installed
 */

import { createContext, useContext } from 'react'
import { ExperienceRow, MemberClaim } from '../schemas/experience'
import { FeesRow, MonthlySummary } from '../schemas/fees'

export interface StepCompletion {
  upload: boolean
  fees: boolean
  table: boolean
  charts: boolean
}

export interface AppState {
  experience: ExperienceRow[]
  memberClaims: MemberClaim[]
  feesByMonth: Record<string, FeesRow>
  step: StepCompletion
  summaries: MonthlySummary[]
  months: string[]
}

export interface AppActions {
  setExperience: (rows: ExperienceRow[]) => void
  setMemberClaims: (claims: MemberClaim[]) => void
  upsertFees: (row: FeesRow) => void
  resetFees: () => void
  clearAllData: () => void
}

export type AppStore = AppState & AppActions

export type { ExperienceRow, MemberClaim, FeesRow }

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

export function useMemberClaims() {
  const store = useAppStore()
  return store.memberClaims
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