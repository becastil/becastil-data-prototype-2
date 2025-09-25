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
  feeTierCounts: {},
  budgetByMonth: {},
  budgetMonths: [],
  adjustmentOverrides: {},
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
      feeTierCounts: parsed.feeTierCounts ?? {},
      budgetByMonth: parsed.budgetByMonth ?? {},
      budgetMonths: parsed.budgetMonths ?? [],
      adjustmentOverrides: parsed.adjustmentOverrides ?? {},
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
      feeTierCounts: state.feeTierCounts,
      budgetByMonth: state.budgetByMonth,
      budgetMonths: state.budgetMonths,
      adjustmentOverrides: state.adjustmentOverrides,
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

  const sanitizedAdjustments: Record<string, { rxRebates?: number; stopLossReimbursement?: number }> = {}
  Object.entries(baseState.adjustmentOverrides ?? {}).forEach(([month, entry]) => {
    const normalized = normalizeMonthKey(month)
    if (!normalized) return
    const cleaned = sanitizeAdjustmentEntry(entry)
    if (!cleaned) return
    sanitizedAdjustments[normalized] = cleaned
  })

  const sortedBudgetMonths = Array.from(budgetMonthSet).sort()

  const adminFeeOverrides: Record<string, number> = {}
  const baseFinancialMetrics = computeFinancialMetrics(
    baseState.experience,
    sanitizedBudgetByMonth,
    sanitizedAdjustments,
  )
  const metricsByMonthForFees = new Map(baseFinancialMetrics.map(metric => [metric.month, metric]))
  let financialMetrics: FinancialMetrics[] = baseFinancialMetrics

  const tierCountsSource = baseState.feeTierCounts ?? {}
  const sanitizedTierCounts: Record<string, Record<string, Record<string, number>>> = {}

  Object.entries(tierCountsSource).forEach(([month, feeMap]) => {
    const normalizedMonth = normalizeMonthKey(month)
    if (!normalizedMonth) return
    const normalizedFeeMap: Record<string, Record<string, number>> = {}
    Object.entries(feeMap).forEach(([feeId, tiers]) => {
      const definition = baseState.feeDefinitions.find(def => def.id === feeId)
      if (!definition || !definition.tiers || definition.tiers.length === 0) return
      const allowedTierIds = new Set(definition.tiers.map(tier => tier.id))
      const normalizedTierMap: Record<string, number> = {}
      Object.entries(tiers).forEach(([tierId, count]) => {
        if (!allowedTierIds.has(tierId)) return
        const numericCount = sanitizeNumber(count)
        if (Number.isFinite(numericCount) && numericCount !== 0) {
          normalizedTierMap[tierId] = numericCount
        }
      })
      if (Object.keys(normalizedTierMap).length > 0) {
        normalizedFeeMap[feeId] = normalizedTierMap
      }
    })
    if (Object.keys(normalizedFeeMap).length > 0) {
      sanitizedTierCounts[normalizedMonth] = normalizedFeeMap
    }
  })

  const feeMonthsSet = new Set<string>([...baseState.feeMonths, ...months, ...sortedBudgetMonths])
  Object.keys(sanitizedTierCounts).forEach(month => feeMonthsSet.add(month))
  const sortedFeeMonths = Array.from(feeMonthsSet).sort()

  let feeComputedByMonth: Record<string, Record<string, number>> = {}
  let feesByMonth: Record<string, FeesRow> = { ...baseState.feesByMonth }

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
          : computeFeeAmount(def, month, metricsByMonthForFees, monthsForAnnual, sanitizedTierCounts)
        computed[def.id] = amount
      })
      feeComputedByMonth[month] = computed
    })

    const computedFees = sortedFeeMonths.reduce<Record<string, FeesRow>>((acc, month) => {
      const total = Object.values(feeComputedByMonth[month] ?? {}).reduce((sum, value) => sum + value, 0)
      adminFeeOverrides[month] = total
      acc[month] = {
        month,
        tpaFee: total,
        networkFee: 0,
        stopLossPremium: 0,
        otherFees: 0,
      }
      return acc
    }, {})
    feesByMonth = { ...feesByMonth, ...computedFees }
  }

  const summaries = computeMonthlySummaries({
    experience: baseState.experience,
    feesByMonth,
  })

  financialMetrics = computeFinancialMetrics(
    baseState.experience,
    sanitizedBudgetByMonth,
    sanitizedAdjustments,
    adminFeeOverrides,
  )
  const upload = baseState.experience.length > 0 && baseState.highCostClaimants.length > 0
  const hasFeeCoverage = months.length > 0 ? months.every(month => !!feesByMonth[month]) : Object.keys(feesByMonth).length > 0
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
    feeMonths: Array.from(new Set([...sortedFeeMonths, ...Object.keys(feesByMonth)])).sort(),
    feeComputedByMonth,
    feesByMonth,
    feeTierCounts: sanitizedTierCounts,
    budgetByMonth: sanitizedBudgetByMonth,
    budgetMonths: sortedBudgetMonths,
    adjustmentOverrides: sanitizedAdjustments,
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
        feeTierCounts: {},
        adjustmentOverrides: {},
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
          def.id === id
            ? {
                ...def,
                ...updates,
                rateValue: sanitizeNumber(updates.rateValue ?? def.rateValue),
                effectiveFrom: updates.effectiveFrom !== undefined
                  ? normalizeMonthKey(updates.effectiveFrom || '')
                  : def.effectiveFrom ?? null,
                effectiveTo: updates.effectiveTo !== undefined
                  ? normalizeMonthKey(updates.effectiveTo || '')
                  : def.effectiveTo ?? null,
              }
            : def
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
        const nextTierCounts: Record<string, Record<string, Record<string, number>>> = {}
        Object.entries(prevState.feeTierCounts ?? {}).forEach(([month, feeMap]) => {
          const { [id]: _removedFee, ...rest } = feeMap
          if (Object.keys(rest).length > 0) {
            nextTierCounts[month] = rest
          }
        })
        return computeDerivedState({
          ...prevState,
          feeDefinitions: prevState.feeDefinitions.filter(def => def.id !== id),
          feeOverrides: nextOverrides,
          feeTierCounts: nextTierCounts,
        })
      })
    },

    addFeeTier: (feeId) => {
      setState(prevState => {
        const index = prevState.feeDefinitions.findIndex(def => def.id === feeId)
        if (index === -1) return prevState
        const definition = prevState.feeDefinitions[index]
        const tiers = definition.tiers ?? []
        if (tiers.length >= 5) return prevState
        const nextDefinitions = [...prevState.feeDefinitions]
        nextDefinitions[index] = {
          ...definition,
          rateBasis: 'TIERED',
          tiers: [...tiers, createDefaultTier(tiers.length + 1)],
        }
        return computeDerivedState({
          ...prevState,
          feeDefinitions: nextDefinitions,
        })
      })
    },

    updateFeeTier: (feeId, tierId, updates) => {
      setState(prevState => {
        const nextDefinitions = prevState.feeDefinitions.map(def => {
          if (def.id !== feeId) return def
          const tiers = def.tiers ?? []
          return {
            ...def,
            tiers: tiers.map(tier =>
              tier.id === tierId
                ? {
                    ...tier,
                    ...updates,
                    rate: updates.rate !== undefined ? sanitizeNumber(updates.rate) : tier.rate,
                  }
                : tier
            ),
          }
        })
        return computeDerivedState({
          ...prevState,
          feeDefinitions: nextDefinitions,
        })
      })
    },

    removeFeeTier: (feeId, tierId) => {
      setState(prevState => {
        const nextDefinitions = prevState.feeDefinitions.map(def => {
          if (def.id !== feeId) return def
          const tiers = def.tiers ?? []
          const filtered = tiers.filter(tier => tier.id !== tierId)
          return {
            ...def,
            tiers: filtered,
            rateBasis: filtered.length > 0 ? 'TIERED' : def.rateBasis === 'TIERED' ? 'FLAT_MONTHLY' : def.rateBasis,
          }
        })

        const nextTierCounts: Record<string, Record<string, Record<string, number>>> = {}
        Object.entries(prevState.feeTierCounts ?? {}).forEach(([month, feeMap]) => {
          const tierMap = feeMap[feeId]
          if (!tierMap) {
            nextTierCounts[month] = feeMap
            return
          }
          const { [tierId]: _removedTier, ...restTiers } = tierMap
          const updatedFeeMap = { ...feeMap }
          if (Object.keys(restTiers).length > 0) {
            updatedFeeMap[feeId] = restTiers
          } else {
            delete updatedFeeMap[feeId]
          }
          if (Object.keys(updatedFeeMap).length > 0) {
            nextTierCounts[month] = updatedFeeMap
          }
        })

        return computeDerivedState({
          ...prevState,
          feeDefinitions: nextDefinitions,
          feeTierCounts: nextTierCounts,
        })
      })
    },

    setFeeTierCount: (month, feeId, tierId, count) => {
      const normalized = normalizeMonthKey(month)
      if (!normalized) return
      setState(prevState => {
        const tierCounts = { ...(prevState.feeTierCounts ?? {}) }
        const monthCounts = { ...(tierCounts[normalized] ?? {}) }
        const feeCounts = { ...(monthCounts[feeId] ?? {}) }

        if (count === null || Number.isNaN(count)) {
          delete feeCounts[tierId]
        } else {
          feeCounts[tierId] = Math.max(0, Math.round(sanitizeNumber(count)))
        }

        if (Object.keys(feeCounts).length > 0) {
          monthCounts[feeId] = feeCounts
        } else {
          delete monthCounts[feeId]
        }

        if (Object.keys(monthCounts).length > 0) {
          tierCounts[normalized] = monthCounts
        } else {
          delete tierCounts[normalized]
        }

        return computeDerivedState({
          ...prevState,
          feeTierCounts: tierCounts,
        })
      })
    },

    setAdjustmentOverride: (month, entry) => {
      const normalized = normalizeMonthKey(month)
      if (!normalized) return
      setState(prevState => {
        const next = { ...(prevState.adjustmentOverrides ?? {}) }
        const sanitized = sanitizeAdjustmentEntry(entry)
        if (sanitized) {
          next[normalized] = sanitized
        } else {
          delete next[normalized]
        }
        return computeDerivedState({
          ...prevState,
          adjustmentOverrides: next,
        })
      })
    },

    removeAdjustmentOverride: (month) => {
      const normalized = normalizeMonthKey(month)
      if (!normalized) return
      setState(prevState => {
        const next = { ...(prevState.adjustmentOverrides ?? {}) }
        delete next[normalized]
        return computeDerivedState({
          ...prevState,
          adjustmentOverrides: next,
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
        feeTierCounts: Object.fromEntries(
          Object.entries(prevState.feeTierCounts ?? {}).filter(([key]) => key !== month)
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
    tiers: [],
    effectiveFrom: null,
    effectiveTo: null,
  }
}

function createDefaultTier(index: number) {
  return {
    id: generateId(),
    label: `Tier ${index}`,
    rate: 0,
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

function sanitizeAdjustmentEntry(entry: { rxRebates?: number | null; stopLossReimbursement?: number | null } | undefined) {
  if (!entry) return undefined
  const result: { rxRebates?: number; stopLossReimbursement?: number } = {}
  if (entry.rxRebates !== undefined && entry.rxRebates !== null) {
    result.rxRebates = sanitizeNumber(entry.rxRebates)
  }
  if (entry.stopLossReimbursement !== undefined && entry.stopLossReimbursement !== null) {
    result.stopLossReimbursement = sanitizeNumber(entry.stopLossReimbursement)
  }
  if (result.rxRebates === undefined && result.stopLossReimbursement === undefined) {
    return undefined
  }
  return result
}

function computeFeeAmount(
  definition: FeeDefinition,
  month: string,
  metricsByMonth: Map<string, FinancialMetrics>,
  monthsForAnnual: number,
  tierCounts: Record<string, Record<string, Record<string, number>>>,
): number {
  if (!isFeeActiveForMonth(definition, month)) {
    return 0
  }

  if (definition.tiers && definition.tiers.length > 0) {
    const monthTiers = tierCounts[month]?.[definition.id] ?? {}
    return definition.tiers.reduce((sum, tier) => {
      const count = monthTiers[tier.id] ?? 0
      return sum + sanitizeNumber(tier.rate) * sanitizeNumber(count)
    }, 0)
  }

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
    case 'TIERED':
    case 'CUSTOM':
    default:
      return 0
  }
}

function isFeeActiveForMonth(definition: FeeDefinition, month: string): boolean {
  const from = definition.effectiveFrom
  const to = definition.effectiveTo
  if (from && month < from) return false
  if (to && month > to) return false
  return true
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
