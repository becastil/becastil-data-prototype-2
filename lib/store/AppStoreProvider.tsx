'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AppStoreContext } from './useAppStore'
import type {
  AppState,
  AppActions,
  AppStore,
  ExperienceRow,
  HighCostClaimant,
  FeesRow,
  FeeDefinition,
  FeeOverrides,
} from './useAppStore'
import { computeMonthlySummaries } from '../calc/lossRatio'
import { getUniqueMonths } from '../calc/aggregations'
import { computeFinancialMetrics } from '../calc/financialMetrics'
import type { FinancialMetrics } from '../calc/financialMetrics'

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const initialState: AppState = {
  experience: [],
  highCostClaimants: [],
  feesByMonth: {},
  step: { upload: false, fees: false, table: false, charts: false },
  summaries: [],
  months: [],
  financialMetrics: [],
  feeDefinitions: [],
  feeMonths: [],
  feeOverrides: {},
  feeComputedByMonth: {},
  budgetByMonth: {},
  budgetMonths: [],
}

// Storage key
const STORAGE_KEY = 'healthcare-dashboard-data'

// Helper to load from localStorage
function loadFromStorage(): Partial<AppState> {
  try {
    if (typeof window === 'undefined') return {}
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    return {
      ...parsed,
      feeDefinitions: parsed.feeDefinitions ?? [],
      feeMonths: parsed.feeMonths ?? [],
      feeOverrides: parsed.feeOverrides ?? {},
      budgetByMonth: parsed.budgetByMonth ?? {},
      budgetMonths: parsed.budgetMonths ?? [],
    }
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
      highCostClaimants: state.highCostClaimants,
      feeDefinitions: state.feeDefinitions,
      feeMonths: state.feeMonths,
      feeOverrides: state.feeOverrides,
      budgetByMonth: state.budgetByMonth,
      budgetMonths: state.budgetMonths,
    }))
  } catch {
    // Ignore storage errors
  }
}

// Helper to compute derived state
function computeDerivedState(baseState: AppState): AppState {
  const months = getUniqueMonths(baseState.experience)
  const sanitizedBudgetByMonth: Record<string, { pepm?: number; total?: number }> = {}
  const budgetMonthSet = new Set<string>()

  Object.entries(baseState.budgetByMonth ?? {}).forEach(([month, entry]) => {
    const normalized = normalizeMonthKey(month)
    if (!normalized) return
    const sanitized = sanitizeBudgetEntry(entry)
    if (!sanitized) return
    sanitizedBudgetByMonth[normalized] = sanitized
    budgetMonthSet.add(normalized)
  })

  baseState.budgetMonths.forEach(month => {
    const normalized = normalizeMonthKey(month)
    if (normalized) {
      budgetMonthSet.add(normalized)
    }
  })

  months.forEach(month => {
    const normalized = normalizeMonthKey(month)
    if (normalized) {
      budgetMonthSet.add(normalized)
    }
  })

  const sortedBudgetMonths = Array.from(budgetMonthSet).sort()

  const summaries = computeMonthlySummaries({
    experience: baseState.experience,
    feesByMonth: baseState.feesByMonth,
  })
  const financialMetrics = computeFinancialMetrics(baseState.experience, sanitizedBudgetByMonth)
  const metricsByMonth = new Map(financialMetrics.map(metric => [metric.month, metric]))

  const feeMonthsSet = new Set<string>([...baseState.feeMonths, ...months, ...sortedBudgetMonths])
  const sortedFeeMonths = Array.from(feeMonthsSet).sort()

  let feeComputedByMonth: Record<string, Record<string, number>> = {}
  let feesByMonth: Record<string, FeesRow> = baseState.feesByMonth

  if (baseState.feeDefinitions.length > 0) {
    feeComputedByMonth = {}
    const overrides = baseState.feeOverrides ?? {}
    const monthsForAnnual = sortedFeeMonths.length || 12

    sortedFeeMonths.forEach(month => {
      const computed: Record<string, number> = {}
      baseState.feeDefinitions.forEach(def => {
        const override = overrides[month]?.[def.id]
        const amount = override !== undefined && override !== null
          ? override
          : computeFeeAmount(def, month, metricsByMonth, monthsForAnnual)
        computed[def.id] = amount
      })
      feeComputedByMonth[month] = computed
    })

    feesByMonth = sortedFeeMonths.reduce<Record<string, FeesRow>>((acc, month) => {
      const total = Object.values(feeComputedByMonth[month] ?? {}).reduce((sum, value) => sum + value, 0)
      acc[month] = {
        month,
        tpaFee: total,
        networkFee: 0,
        stopLossPremium: 0,
        otherFees: 0,
      }
      return acc
    }, {})
  }

  const upload = baseState.experience.length > 0 && baseState.highCostClaimants.length > 0
  const hasFeeCoverage = baseState.feeDefinitions.length > 0 && sortedFeeMonths.length > 0 && sortedFeeMonths.every(month => !!feesByMonth[month])
  const hasBudgetCoverage = sortedBudgetMonths.length > 0 && sortedBudgetMonths.every(month => {
    const entry = sanitizedBudgetByMonth[month]
    return entry && (typeof entry.total === 'number' || typeof entry.pepm === 'number')
  })
  const fees = upload && hasFeeCoverage && hasBudgetCoverage
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
    financialMetrics,
    feeMonths: sortedFeeMonths,
    feeComputedByMonth,
    feesByMonth,
    budgetByMonth: sanitizedBudgetByMonth,
    budgetMonths: sortedBudgetMonths,
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
    
    setHighCostClaimants: (rows: HighCostClaimant[]) => {
      setState(prevState => computeDerivedState({
        ...prevState,
        highCostClaimants: rows,
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
        feeDefinitions: [],
        feeOverrides: {},
        feeComputedByMonth: {},
        feeMonths: [],
        budgetByMonth: {},
        budgetMonths: [],
      }))
    },
    
    clearAllData: () => {
      setState(computeDerivedState(initialState))
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    addFeeDefinition: () => {
      setState(prevState => computeDerivedState({
        ...prevState,
        feeDefinitions: [...prevState.feeDefinitions, createDefaultFeeDefinition(prevState.feeDefinitions.length + 1)],
      }))
    },

    updateFeeDefinition: (id, updates) => {
      setState(prevState => computeDerivedState({
        ...prevState,
        feeDefinitions: prevState.feeDefinitions.map(def =>
          def.id === id ? { ...def, ...updates, rateValue: sanitizeNumber(updates.rateValue ?? def.rateValue) } : def
        ),
      }))
    },

    removeFeeDefinition: (id) => {
      setState(prevState => {
        const nextOverrides: FeeOverrides = {}
        Object.entries(prevState.feeOverrides).forEach(([month, map]) => {
          const { [id]: _removed, ...rest } = map
          if (Object.keys(rest).length > 0) {
            nextOverrides[month] = rest
          }
        })
        return computeDerivedState({
          ...prevState,
          feeDefinitions: prevState.feeDefinitions.filter(def => def.id !== id),
          feeOverrides: nextOverrides,
        })
      })
    },

    addFeeMonth: (month) => {
      const normalized = normalizeMonthKey(month)
      if (!normalized) return
      setState(prevState => {
        if (prevState.feeMonths.includes(normalized)) {
          return prevState
        }
        return computeDerivedState({
          ...prevState,
          feeMonths: [...prevState.feeMonths, normalized],
        })
      })
    },

    removeFeeMonth: (month) => {
      setState(prevState => computeDerivedState({
        ...prevState,
        feeMonths: prevState.feeMonths.filter(item => item !== month),
        feeOverrides: Object.fromEntries(
          Object.entries(prevState.feeOverrides).filter(([key]) => key !== month)
        ),
      }))
    },

    setFeeOverride: (month, feeId, amount) => {
      const normalizedMonth = normalizeMonthKey(month)
      if (!normalizedMonth) return
      setState(prevState => {
        const overrides: FeeOverrides = { ...prevState.feeOverrides }
        const monthOverrides = { ...(overrides[normalizedMonth] ?? {}) }

        if (amount === null || Number.isNaN(amount)) {
          delete monthOverrides[feeId]
        } else {
          monthOverrides[feeId] = amount
        }

        if (Object.keys(monthOverrides).length > 0) {
          overrides[normalizedMonth] = monthOverrides
        } else {
          delete overrides[normalizedMonth]
        }

        return computeDerivedState({
          ...prevState,
          feeOverrides: overrides,
        })
      })
    },

    setBudgetEntry: (month, entry) => {
      const normalized = normalizeMonthKey(month)
      if (!normalized) return
      setState(prevState => {
        const nextBudget = { ...prevState.budgetByMonth }
        const sanitized = sanitizeBudgetEntry(entry)
        if (sanitized) {
          nextBudget[normalized] = sanitized
        } else {
          delete nextBudget[normalized]
        }

        const nextBudgetMonths = prevState.budgetMonths.includes(normalized)
          ? prevState.budgetMonths
          : [...prevState.budgetMonths, normalized]

        return computeDerivedState({
          ...prevState,
          budgetByMonth: nextBudget,
          budgetMonths: nextBudgetMonths,
        })
      })
    },

    removeBudgetEntry: (month) => {
      const normalized = normalizeMonthKey(month)
      if (!normalized) return
      setState(prevState => {
        const nextBudget = { ...prevState.budgetByMonth }
        delete nextBudget[normalized]
        return computeDerivedState({
          ...prevState,
          budgetByMonth: nextBudget,
          budgetMonths: prevState.budgetMonths.filter(item => item !== normalized),
        })
      })
    },
  }
  
  const store: AppStore = { ...state, ...actions }
  
  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  )
}

function createDefaultFeeDefinition(index: number): FeeDefinition {
  return {
    id: generateId(),
    name: `Fee ${index}`,
    rateBasis: 'FLAT_MONTHLY',
    rateValue: 0,
  }
}

function sanitizeBudgetEntry(entry: { pepm?: number | null; total?: number | null } | undefined) {
  if (!entry) return undefined
  const result: { pepm?: number; total?: number } = {}
  if (entry.pepm !== undefined && entry.pepm !== null) {
    result.pepm = sanitizeNumber(entry.pepm)
  }
  if (entry.total !== undefined && entry.total !== null) {
    result.total = sanitizeNumber(entry.total)
  }
  if (result.pepm === undefined && result.total === undefined) {
    return undefined
  }
  return result
}

function computeFeeAmount(
  definition: FeeDefinition,
  month: string,
  metricsByMonth: Map<string, FinancialMetrics>,
  monthsForAnnual: number,
): number {
  const metric = metricsByMonth.get(month)
  const eeCount = metric?.eeCount ?? 0
  const memberCount = metric?.memberCount ?? 0
  const rate = sanitizeNumber(definition.rateValue)

  switch (definition.rateBasis) {
    case 'FLAT_MONTHLY':
      return rate
    case 'PER_EMPLOYEE_PER_MONTH':
      return rate * eeCount
    case 'PER_MEMBER_PER_MONTH':
      return rate * memberCount
    case 'ANNUAL':
      return monthsForAnnual > 0 ? rate / monthsForAnnual : rate
    case 'CUSTOM':
    default:
      return 0
  }
}

function normalizeMonthKey(raw: string): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (MONTH_KEY_REGEX.test(value)) {
    return value
  }
  return null
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

function sanitizeNumber(value: number): number {
  if (typeof value !== 'number') return 0
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  return value
}
