'use client'

/**
 * Simple store implementation using React Context and localStorage
 * TODO: Replace with Zustand once dependency is installed
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ExperienceRow, MemberClaim } from '../schemas/experience'
import { FeesRow, MonthlySummary } from '../schemas/fees'
import { computeMonthlySummaries } from '../calc/lossRatio'
import { getUniqueMonths } from '../calc/aggregations'

interface StepCompletion {
  upload: boolean
  fees: boolean
  table: boolean
  charts: boolean
}

interface AppState {
  experience: ExperienceRow[]
  memberClaims: MemberClaim[]
  feesByMonth: Record<string, FeesRow>
  step: StepCompletion
  summaries: MonthlySummary[]
  months: string[]
}

interface AppActions {
  setExperience: (rows: ExperienceRow[]) => void
  setMemberClaims: (claims: MemberClaim[]) => void
  upsertFees: (row: FeesRow) => void
  resetFees: () => void
  clearAllData: () => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  experience: [],
  memberClaims: [],
  feesByMonth: {},
  step: { upload: false, fees: false, table: false, charts: false },
  summaries: [],
  months: [],
}

const AppStoreContext = createContext<AppStore | null>(null)

// Storage key
const STORAGE_KEY = 'healthcare-dashboard-data'

// Helper to load from localStorage
function loadFromStorage(): Partial<AppState> {
  try {
    if (typeof window === 'undefined') return {}
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Helper to save to localStorage
function saveToStorage(state: AppState) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      experience: state.experience,
      memberClaims: state.memberClaims,
      feesByMonth: state.feesByMonth,
    }))
  } catch {
    // Ignore storage errors
  }
}

// Helper to compute derived state
function computeDerivedState(baseState: AppState): AppState {
  const months = getUniqueMonths(baseState.experience)
  const summaries = computeMonthlySummaries({
    experience: baseState.experience,
    feesByMonth: baseState.feesByMonth,
  })
  
  const upload = baseState.experience.length > 0
  const fees = upload && months.every(month => !!baseState.feesByMonth[month])
  const step = {
    upload,
    fees,
    table: upload && fees,
    charts: upload && fees,
  }
  
  return {
    ...baseState,
    months,
    summaries,
    step,
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const stored = loadFromStorage()
    return computeDerivedState({ ...initialState, ...stored })
  })
  
  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state)
  }, [state])
  
  const actions: AppActions = {
    setExperience: (rows: ExperienceRow[]) => {
      setState(prevState => computeDerivedState({
        ...prevState,
        experience: rows,
      }))
    },
    
    setMemberClaims: (claims: MemberClaim[]) => {
      setState(prevState => ({
        ...prevState,
        memberClaims: claims,
      }))
    },
    
    upsertFees: (row: FeesRow) => {
      setState(prevState => computeDerivedState({
        ...prevState,
        feesByMonth: { ...prevState.feesByMonth, [row.month]: row },
      }))
    },
    
    resetFees: () => {
      setState(prevState => computeDerivedState({
        ...prevState,
        feesByMonth: {},
      }))
    },
    
    clearAllData: () => {
      setState(computeDerivedState(initialState))
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
  }
  
  const store: AppStore = { ...state, ...actions }
  
  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  )
}

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