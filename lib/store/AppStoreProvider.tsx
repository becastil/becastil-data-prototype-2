'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AppStoreContext } from './useAppStore'
import type { AppState, AppActions, AppStore, ExperienceRow, MemberClaim, FeesRow } from './useAppStore'
import { computeMonthlySummaries } from '../calc/lossRatio'
import { getUniqueMonths } from '../calc/aggregations'

const initialState: AppState = {
  experience: [],
  memberClaims: [],
  feesByMonth: {},
  step: { upload: false, fees: false, table: false, charts: false },
  summaries: [],
  months: [],
}

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