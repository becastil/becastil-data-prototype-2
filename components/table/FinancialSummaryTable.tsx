'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import type { MouseEvent } from 'react'
import {
  useAppStore,
  useCustomSummaryConfig,
  useExperienceData,
  useFeeComputedByMonth,
  useFeeDefinitions,
  useFeeOverrides,
  useFinancialMetrics,
} from '@/lib/store/useAppStore'
import type { FinancialMetrics } from '@/lib/calc/financialMetrics'
import CustomSummaryBuilder from './CustomSummaryBuilder'
import type { AvailableField, ValueType } from './summaryTypes'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const acronyms: Record<string, string> = {
  'IP/OP': 'Inpatient/Outpatient',
  'EBA': 'Employee Benefits Account',
  'HMNH': 'High Medical Needs Handler',
  'ESI': 'Express Scripts International',
  'JAA': 'Joint Administrative Agreement',
  'KPPC': 'Kaiser Permanente Pharmacy Claims',
  'KPCM': 'Kaiser Permanente Care Management',
  'PEPM': 'Per Employee Per Month',
}

const groupOrder = [
  'Medical Claims',
  'Rx Claims',
  'Stop Loss',
  'Admin Fees',
  'Monthly Totals',
  'Counts & PEPM',
  'Variance Analysis',
] as const

const CUSTOM_GROUP_LABEL = 'Custom Layout' as const

export type GroupName = typeof groupOrder[number] | typeof CUSTOM_GROUP_LABEL

const EXPERIENCE_CATEGORY_ALIASES = {
  domesticHospital: [
    'Domestic Medical Facility Claims (IP/OP)',
    'Domestic Hospital Claims',
  ],
  nonDomesticHospital: [
    'Non-Domestic Medical Claims (IP/OP)',
    'Non Domestic Hospital Claims',
  ],
  totalHospital: [
    'Total Hospital Medical Claims (IP/OP)',
    'Total Hospital Medical Claims',
  ],
  nonHospital: ['Non-Hospital Medical Claims'],
  totalAllMedical: ['Total All Medical Claims'],
  ucAdjustment: ['UC Claims Settlement Adjustment'],
  runOut: ['Run Out Claims'],
  medicalEba: ['Medical Claims Paid via EBA'],
  totalMedical: ['Total Medical Claims'],
  hmnhHighCost: ['High Cost Claims paid via HMNH'],
  rxGross: ['ESI Pharmacy Claims', 'Pharmacy Claims'],
  rxRebates: ['Rx Rebates', 'Pharmacy Rebates'],
  stopLossFees: ['Total Stop Loss Fees'],
  consulting: ['Consulting'],
  tpa: ['TPA Claims/COBRA Administration Fee (PEPM)', 'TPA Administration Fee'],
  anthemJaa: ['Anthem JAA'],
  kppc: ['KPPC Fees'],
  kpcm: ['KPCM Fees'],
  esiPrograms: ['Optional ESI Programs'],
  incurredTargetPepm: ['Incurred Target PEPM', 'INCURED TARGET PEPM'],
} as const

type ExperienceAliasKey = keyof typeof EXPERIENCE_CATEGORY_ALIASES

interface TableRow {
  key: string
  label: string
  group: GroupName
  values: Record<string, number | null>
  valueType: ValueType
}

interface RowDefinition {
  key: string
  label: string
  group: GroupName
  valueType?: ValueType
  aliasKey?: ExperienceAliasKey
  metricField?: keyof FinancialMetrics
  transformMetric?: (
    value: number | null,
    month: string,
    metric?: FinancialMetrics
  ) => number | null
  compute?: (context: BuildContext) => Record<string, number | null>
}

interface BuildContext {
  months: string[]
  metricsByMonth: Record<string, FinancialMetrics | undefined>
  getAliasValues: (aliasKey: ExperienceAliasKey) => Record<string, number | null>
}

const ROW_DEFINITIONS: RowDefinition[] = [
  {
    key: 'domesticMedical',
    label: 'Domestic Medical Facility Claims (IP/OP)',
    group: 'Medical Claims',
    aliasKey: 'domesticHospital',
  },
  {
    key: 'nonDomesticMedical',
    label: 'Non-Domestic Medical Claims (IP/OP)',
    group: 'Medical Claims',
    compute: ({ months, metricsByMonth, getAliasValues }) => {
      const values = getAliasValues('nonDomesticHospital')
      const domestic = getAliasValues('domesticHospital')
      return months.reduce<Record<string, number | null>>((acc, month) => {
        if (values[month] !== null) {
          acc[month] = values[month]
        } else {
          const metric = metricsByMonth[month]
          if (!metric) {
            acc[month] = null
          } else if (domestic[month] !== null) {
            acc[month] = metric.totalHospitalMedicalClaims - (domestic[month] ?? 0)
          } else {
            acc[month] = null
          }
        }
        return acc
      }, {})
    },
  },
  {
    key: 'totalHospitalMedical',
    label: 'Total Hospital Medical Claims (IP/OP)',
    group: 'Medical Claims',
    metricField: 'totalHospitalMedicalClaims',
  },
  {
    key: 'nonHospitalMedical',
    label: 'Non-Hospital Medical Claims',
    group: 'Medical Claims',
    compute: ({ months, metricsByMonth, getAliasValues }) => {
      const explicit = getAliasValues('nonHospital')
      return months.reduce<Record<string, number | null>>((acc, month) => {
        if (explicit[month] !== null) {
          acc[month] = explicit[month]
        } else {
          const metric = metricsByMonth[month]
          if (!metric) {
            acc[month] = null
          } else {
            acc[month] = metric.totalAllMedicalClaims - metric.totalHospitalMedicalClaims
          }
        }
        return acc
      }, {})
    },
  },
  {
    key: 'totalAllMedical',
    label: 'Total All Medical Claims',
    group: 'Medical Claims',
    metricField: 'totalAllMedicalClaims',
  },
  {
    key: 'ucAdjustment',
    label: 'UC Claims Settlement Adjustment',
    group: 'Medical Claims',
    aliasKey: 'ucAdjustment',
  },
  {
    key: 'totalAdjustedMedical',
    label: 'Total Adjusted Medical Claims',
    group: 'Medical Claims',
    metricField: 'totalAdjustedMedicalClaims',
  },
  {
    key: 'runOutClaims',
    label: 'Run Out Claims',
    group: 'Medical Claims',
    aliasKey: 'runOut',
  },
  {
    key: 'medicalClaimsPaidViaEba',
    label: 'Medical Claims Paid via EBA',
    group: 'Medical Claims',
    aliasKey: 'medicalEba',
  },
  {
    key: 'totalMedicalClaims',
    label: 'Total Medical Claims',
    group: 'Medical Claims',
    metricField: 'totalMedicalClaims',
  },
  {
    key: 'highCostHmnh',
    label: 'High Cost Claims paid via HMNH',
    group: 'Rx Claims',
    aliasKey: 'hmnhHighCost',
  },
  {
    key: 'esiPharmacyClaims',
    label: 'ESI Pharmacy Claims',
    group: 'Rx Claims',
    aliasKey: 'rxGross',
  },
  {
    key: 'totalRxClaims',
    label: 'Total Rx Claims',
    group: 'Rx Claims',
    metricField: 'totalRxClaims',
  },
  {
    key: 'rxRebates',
    label: 'Rx Rebates',
    group: 'Rx Claims',
    metricField: 'rxRebates',
  },
  {
    key: 'totalStopLossFees',
    label: 'Total Stop Loss Fees',
    group: 'Stop Loss',
    aliasKey: 'stopLossFees',
  },
  {
    key: 'stopLossReimbursement',
    label: 'Stop Loss Reimbursement',
    group: 'Stop Loss',
    metricField: 'stopLossReimbursement',
  },
  {
    key: 'consultingFees',
    label: 'Consulting',
    group: 'Admin Fees',
    aliasKey: 'consulting',
  },
  {
    key: 'tpaFees',
    label: 'TPA Claims/COBRA Administration Fee (PEPM)',
    group: 'Admin Fees',
    aliasKey: 'tpa',
  },
  {
    key: 'anthemJaa',
    label: 'Anthem JAA',
    group: 'Admin Fees',
    aliasKey: 'anthemJaa',
  },
  {
    key: 'kppcFees',
    label: 'KPPC Fees',
    group: 'Admin Fees',
    aliasKey: 'kppc',
  },
  {
    key: 'kpcmFees',
    label: 'KPCM Fees',
    group: 'Admin Fees',
    aliasKey: 'kpcm',
  },
  {
    key: 'optionalEsiPrograms',
    label: 'Optional ESI Programs',
    group: 'Admin Fees',
    aliasKey: 'esiPrograms',
  },
  {
    key: 'totalAdminFees',
    label: 'Total Admin Fees',
    group: 'Admin Fees',
    metricField: 'totalAdminFees',
  },
  {
    key: 'monthlyClaimsAndExpenses',
    label: 'Monthly Claims and Expenses',
    group: 'Monthly Totals',
    metricField: 'monthlyClaimsAndExpenses',
  },
  {
    key: 'cumulativeClaimsAndExpenses',
    label: 'Cumulative Claims and Expenses',
    group: 'Monthly Totals',
    metricField: 'cumulativeClaimsAndExpenses',
  },
  {
    key: 'eeCount',
    label: 'EE COUNT (Active & COBRA)',
    group: 'Counts & PEPM',
    metricField: 'eeCount',
    valueType: 'number',
  },
  {
    key: 'memberCount',
    label: 'MEMBER COUNT',
    group: 'Counts & PEPM',
    metricField: 'memberCount',
    valueType: 'number',
  },
  {
    key: 'pepmActual',
    label: 'PEPM Non-Lagged Actual',
    group: 'Counts & PEPM',
    metricField: 'pepmActual',
  },
  {
    key: 'pepmCumulative',
    label: 'PEPM Non-Lagged Cumulative',
    group: 'Counts & PEPM',
    metricField: 'pepmCumulative',
  },
  {
    key: 'incurredTargetPepm',
    label: 'Incurred Target PEPM',
    group: 'Counts & PEPM',
    aliasKey: 'incurredTargetPepm',
  },
  {
    key: 'budgetPepm',
    label: '2025-2026 PEPM BUDGET (with 0% Margin)',
    group: 'Counts & PEPM',
    metricField: 'budgetPepm',
  },
  {
    key: 'monthlyBudget',
    label: '2025-2026 PEPM BUDGET x EE COUNTS',
    group: 'Counts & PEPM',
    metricField: 'monthlyBudget',
  },
  {
    key: 'cumulativeBudget',
    label: 'Annual Cumulative Budget',
    group: 'Counts & PEPM',
    metricField: 'cumulativeBudget',
  },
  {
    key: 'monthlyDifference',
    label: 'Actual Monthly Difference',
    group: 'Variance Analysis',
    metricField: 'monthlyDifference',
  },
  {
    key: 'monthlyDifferencePct',
    label: '% Difference (Monthly)',
    group: 'Variance Analysis',
    metricField: 'monthlyDifferencePct',
    valueType: 'percent',
  },
  {
    key: 'cumulativeDifference',
    label: 'Cumulative Difference',
    group: 'Variance Analysis',
    metricField: 'cumulativeDifference',
  },
  {
    key: 'cumulativeDifferencePct',
    label: '% Difference (Cumulative)',
    group: 'Variance Analysis',
    metricField: 'cumulativeDifferencePct',
    valueType: 'percent',
  },
]

function formatMonthLabel(month: string): string {
  const [year, monthPart] = month.split('-')
  const date = new Date(Number(year), Number(monthPart) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatDisplay(value: number | null, type: ValueType) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { text: '—', isNegative: false }
  }

  if (type === 'currency') {
    return { text: currencyFormatter.format(value), isNegative: value < 0 }
  }

  if (type === 'percent') {
    return { text: percentFormatter.format(value), isNegative: value < 0 }
  }

  return { text: numberFormatter.format(value), isNegative: value < 0 }
}

function formatForCsv(value: number | null, type: ValueType): string {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  if (type === 'currency') return value.toFixed(2)
  if (type === 'percent') return (value * 100).toFixed(2)
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

function valueMatchesFilter(value: number, filter: string): boolean {
  if (filter.startsWith('>=')) {
    const threshold = Number(filter.substring(2))
    if (!Number.isNaN(threshold)) return value >= threshold
  } else if (filter.startsWith('<=')) {
    const threshold = Number(filter.substring(2))
    if (!Number.isNaN(threshold)) return value <= threshold
  } else if (filter.startsWith('=')) {
    const threshold = Number(filter.substring(1))
    if (!Number.isNaN(threshold)) return Math.abs(value - threshold) < 0.01
  } else {
    return value.toString().toLowerCase().includes(filter.toLowerCase())
  }
  return false
}

export default function FinancialSummaryTable() {
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  const feeDefinitions = useFeeDefinitions()
  const feeComputedByMonth = useFeeComputedByMonth()
  const feeOverrides = useFeeOverrides()
  const customSummary = useCustomSummaryConfig()
  const { setCustomSummaryLayout, setCustomSummaryEnabled } = useAppStore()

  const months = useMemo(() => {
    const monthSet = new Set<string>()
    experience.forEach(row => monthSet.add(row.month))
    financialMetrics.forEach(metric => monthSet.add(metric.month))
    Object.keys(feeComputedByMonth ?? {}).forEach(month => monthSet.add(month))
    Object.keys(feeOverrides ?? {}).forEach(month => monthSet.add(month))
    return Array.from(monthSet).sort()
  }, [experience, financialMetrics, feeComputedByMonth, feeOverrides])

  const metricsByMonth = useMemo(() => {
    return financialMetrics.reduce<Record<string, FinancialMetrics>>((acc, metric) => {
      acc[metric.month] = metric
      return acc
    }, {})
  }, [financialMetrics])

  const { experienceCategoryValues, experienceCategoryLabels } = useMemo(() => {
    const values: Record<string, Record<string, number>> = {}
    const labels: Record<string, string> = {}

    experience.forEach(row => {
      const label = row.category.trim()
      const key = label.toLowerCase()
      if (!labels[key]) {
        labels[key] = label
      }
      const monthMap = values[key] ?? {}
      monthMap[row.month] = (monthMap[row.month] ?? 0) + row.amount
      values[key] = monthMap
    })

    return { experienceCategoryValues: values, experienceCategoryLabels: labels }
  }, [experience])

  const { defaultRows, createRowFromDefinition } = useMemo(() => {
    if (months.length === 0) {
      return {
        defaultRows: [] as TableRow[],
        createRowFromDefinition: (_definition: RowDefinition): TableRow => ({
          key: _definition.key,
          label: _definition.label,
          group: _definition.group,
          values: months.reduce<Record<string, number | null>>((acc, month) => {
            acc[month] = null
            return acc
          }, {}),
          valueType: _definition.valueType ?? 'currency',
        }),
      }
    }

    const aliasCache = new Map<ExperienceAliasKey, Record<string, number | null>>()

    const getAliasValues = (aliasKey: ExperienceAliasKey) => {
      if (aliasCache.has(aliasKey)) {
        return aliasCache.get(aliasKey)!
      }

      const aliases = EXPERIENCE_CATEGORY_ALIASES[aliasKey]
      const monthTotals = months.reduce<Record<string, { value: number; hasValue: boolean }>>((acc, month) => {
        acc[month] = { value: 0, hasValue: false }
        return acc
      }, {})

      aliases.forEach(alias => {
        const normalized = alias.trim().toLowerCase()
        const data = experienceCategoryValues[normalized]
        if (!data) return
        Object.entries(data).forEach(([month, amount]) => {
          if (!monthTotals[month]) {
            monthTotals[month] = { value: 0, hasValue: false }
          }
          monthTotals[month].value += amount
          monthTotals[month].hasValue = true
        })
      })

      const result: Record<string, number | null> = {}
      months.forEach(month => {
        const entry = monthTotals[month]
        if (!entry || !entry.hasValue) {
          result[month] = null
        } else {
          result[month] = entry.value
        }
      })

      aliasCache.set(aliasKey, result)
      return result
    }

    const buildMetricValues = (
      field: keyof FinancialMetrics,
      transform?: (
        value: number | null,
        month: string,
        metric?: FinancialMetrics
      ) => number | null,
    ) => {
      return months.reduce<Record<string, number | null>>((acc, month) => {
        const metric = metricsByMonth[month]
        let value: number | null | undefined = metric ? (metric[field] as number | null) : null
        if (transform) {
          value = transform(value ?? null, month, metric)
        }
        acc[month] = value ?? null
        return acc
      }, {})
    }

    const createRowFromDefinition = (definition: RowDefinition): TableRow => {
      let values: Record<string, number | null>

      if (definition.compute) {
        values = definition.compute({ months, metricsByMonth, getAliasValues })
      } else if (definition.metricField) {
        values = buildMetricValues(definition.metricField, definition.transformMetric)
      } else if (definition.aliasKey) {
        values = getAliasValues(definition.aliasKey)
      } else {
        values = months.reduce<Record<string, number | null>>((acc, month) => {
          acc[month] = null
          return acc
        }, {})
      }

      return {
        key: definition.key,
        label: definition.label,
        group: definition.group,
        values,
        valueType: definition.valueType ?? 'currency',
      }
    }

    const rows = ROW_DEFINITIONS.map(createRowFromDefinition)

    return { defaultRows: rows, createRowFromDefinition }
  }, [experienceCategoryValues, metricsByMonth, months])

  const availableFields = useMemo<AvailableField[]>(() => {
    const fields: AvailableField[] = []

    Object.entries(experienceCategoryLabels).forEach(([key, label]) => {
      fields.push({
        id: `experience:${key}`,
        label,
        source: 'experience',
        valueType: 'currency',
        description: 'Experience CSV column',
      })
    })

    ROW_DEFINITIONS.forEach(definition => {
      const isAliasOnly = Boolean(definition.aliasKey && !definition.metricField && !definition.compute)
      if (isAliasOnly) return
      fields.push({
        id: `financial:${definition.key}`,
        label: definition.label,
        source: 'financial',
        valueType: definition.valueType ?? 'currency',
        description: 'Derived financial metric',
      })
    })

    feeDefinitions.forEach(definition => {
      const label = definition.name?.trim() || 'Unnamed Fee'
      fields.push({
        id: `fee:${definition.id}`,
        label,
        source: 'fee',
        valueType: 'currency',
        description: 'Monthly fee schedule entry',
      })
    })

    return fields
  }, [experienceCategoryLabels, feeDefinitions])

  const feeValuesByMonth = useMemo(() => {
    const allMonths = new Set<string>()
    Object.keys(feeComputedByMonth ?? {}).forEach(month => allMonths.add(month))
    Object.keys(feeOverrides ?? {}).forEach(month => allMonths.add(month))

    const map: Record<string, Record<string, number>> = {}
    const feeIds = feeDefinitions.map(def => def.id)

    allMonths.forEach(month => {
      const computed = feeComputedByMonth[month] ?? {}
      const overrides = feeOverrides[month] ?? {}
      const monthValues: Record<string, number> = {}

      feeIds.forEach(feeId => {
        const override = overrides[feeId]
        const base = computed[feeId]
        if (override !== undefined && override !== null) {
          monthValues[feeId] = override
        } else if (base !== undefined && base !== null) {
          monthValues[feeId] = base
        }
      })

      map[month] = monthValues
    })

    return map
  }, [feeComputedByMonth, feeOverrides, feeDefinitions])

  const availableFieldMap = useMemo(() => {
    return availableFields.reduce<Map<string, AvailableField>>((acc, field) => {
      acc.set(field.id, field)
      return acc
    }, new Map())
  }, [availableFields])

  const sanitizedCustomFields = useMemo(() => {
    return customSummary.fieldIds.filter(id => availableFieldMap.has(id))
  }, [customSummary.fieldIds, availableFieldMap])

  useEffect(() => {
    const original = customSummary.fieldIds
    if (original.length === sanitizedCustomFields.length && original.every((id, index) => id === sanitizedCustomFields[index])) {
      return
    }
    setCustomSummaryLayout(sanitizedCustomFields)
  }, [sanitizedCustomFields, customSummary.fieldIds, setCustomSummaryLayout])

  const useCustomLayout = customSummary.enabled && sanitizedCustomFields.length > 0

  const customRows = useMemo<TableRow[]>(() => {
    if (!useCustomLayout) return []

    return sanitizedCustomFields
      .map(fieldId => {
        const field = availableFieldMap.get(fieldId)
        if (!field) return null

        if (field.source === 'experience') {
          const key = fieldId.split(':')[1]
          const categoryValues = experienceCategoryValues[key] ?? {}
          const values = months.reduce<Record<string, number | null>>((acc, month) => {
            const value = categoryValues[month]
            acc[month] = typeof value === 'number' ? value : null
            return acc
          }, {})

          return {
            key: fieldId,
            label: field.label,
            group: CUSTOM_GROUP_LABEL,
            values,
            valueType: field.valueType,
          }
        }

        if (field.source === 'financial') {
          const definitionKey = fieldId.split(':')[1]
          const definition = ROW_DEFINITIONS.find(item => item.key === definitionKey)
          if (!definition) return null
          const resolved = createRowFromDefinition(definition)
          return {
            ...resolved,
            key: fieldId,
            label: field.label,
            group: CUSTOM_GROUP_LABEL,
          }
        }

        if (field.source === 'fee') {
          const feeId = fieldId.split(':')[1]
          const values = months.reduce<Record<string, number | null>>((acc, month) => {
            const monthValues = feeValuesByMonth[month] ?? {}
            const value = monthValues[feeId]
            acc[month] = typeof value === 'number' ? value : null
            return acc
          }, {})

          return {
            key: fieldId,
            label: field.label,
            group: CUSTOM_GROUP_LABEL,
            values,
            valueType: field.valueType,
          }
        }

        return null
      })
      .filter((row): row is TableRow => row !== null)
  }, [useCustomLayout, sanitizedCustomFields, availableFieldMap, experienceCategoryValues, months, createRowFromDefinition, feeValuesByMonth])

  const baseRows = useMemo(() => {
    return useCustomLayout ? customRows : defaultRows
  }, [useCustomLayout, customRows, defaultRows])

  const [currentSort, setCurrentSort] = useState<{ column: string | null; direction: 'asc' | 'desc' | null }>({
    column: null,
    direction: null,
  })
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [globalSearch, setGlobalSearch] = useState('')
  const [showDerivedMetrics, setShowDerivedMetrics] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<GroupName>>(new Set())
  const [tooltip, setTooltip] = useState<{ show: boolean; text: string; x: number; y: number }>({
    show: false,
    text: '',
    x: 0,
    y: 0,
  })

  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!useCustomLayout) return
    setCollapsedGroups(prev => {
      if (!prev.has(CUSTOM_GROUP_LABEL)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(CUSTOM_GROUP_LABEL)
      return next
    })
  }, [useCustomLayout])

  const hasData = useMemo(() => {
    return baseRows.some(row => months.some(month => row.values[month] !== null))
  }, [months, baseRows])

  const filteredData = useMemo(() => {
    let data = [...baseRows]

    if (globalSearch.trim()) {
      const searchTerm = globalSearch.toLowerCase()
      data = data.filter(row => {
        if (row.label.toLowerCase().includes(searchTerm)) return true
        return months.some(month => {
          const formatted = formatDisplay(row.values[month], row.valueType).text.toLowerCase()
          return formatted.includes(searchTerm)
        })
      })
    }

    Object.entries(columnFilters).forEach(([column, filter]) => {
      if (!filter.trim()) return
      if (column === 'category') {
        data = data.filter(row => row.label.toLowerCase().includes(filter.toLowerCase()))
        return
      }

      if (months.includes(column)) {
        data = data.filter(row => {
          const value = row.values[column]
          if (value === null || value === undefined) return false
          return valueMatchesFilter(value, filter)
        })
      }
    })

    if (currentSort.column) {
      const { column, direction } = currentSort
      if (direction) {
        data.sort((a, b) => {
          let aValue: number | string | null = null
          let bValue: number | string | null = null

          if (column === 'category') {
            aValue = a.label.toLowerCase()
            bValue = b.label.toLowerCase()
          } else if (months.includes(column)) {
            aValue = a.values[column]
            bValue = b.values[column]
          }

          if (aValue === null || aValue === undefined) return 1
          if (bValue === null || bValue === undefined) return -1

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue
          }

          return 0
        })
      }
    }

    return data
  }, [baseRows, globalSearch, columnFilters, currentSort, months])

  const totalsByMonth = useMemo(() => {
    return months.reduce<Record<string, number>>((acc, month) => {
      acc[month] = filteredData.reduce((sum, row) => {
        if (row.valueType !== 'currency') return sum
        const value = row.values[month]
        if (typeof value === 'number') return sum + value
        return sum
      }, 0)
      return acc
    }, {})
  }, [filteredData, months])

  const handleSort = (column: string) => {
    setCurrentSort(prev => {
      if (prev.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' }
        if (prev.direction === 'desc') return { column: null, direction: null }
      }
      return { column, direction: 'asc' }
    })
  }

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => {
      if (!value.trim()) {
        const { [column]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [column]: value }
    })
  }

  const toggleGroup = (group: GroupName) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  const showTooltipAt = useCallback((event: MouseEvent<HTMLTableCellElement>, text: string) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      show: true,
      text,
      x: rect.left,
      y: rect.top - 40,
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, show: false }))
  }, [])

  const deriveMetrics = useCallback(
    (row: TableRow) => {
      if (months.length < 2) return { delta: null, percent: null }
      const latestMonth = months[months.length - 1]
      const previousMonth = months[months.length - 2]
      const latest = row.values[latestMonth]
      const previous = row.values[previousMonth]
      if (latest === null || latest === undefined || previous === null || previous === undefined) {
        return { delta: null, percent: null }
      }
      const delta = latest - previous
      const percent = previous !== 0 ? delta / Math.abs(previous) : null
      return { delta, percent }
    },
    [months],
  )

  const exportCSV = () => {
    const headers = ['Cost Category', ...months.map(formatMonthLabel)]
    if (showDerivedMetrics && months.length >= 2) {
      headers.push('MoM Δ', '%Δ MoM')
    }

    let csv = headers.join(',') + '\n'

    filteredData.forEach(row => {
      const values = [
        `"${row.label}"`,
        ...months.map(month => formatForCsv(row.values[month], row.valueType)),
      ]

      if (showDerivedMetrics && months.length >= 2) {
        const { delta, percent } = deriveMetrics(row)
        values.push(formatForCsv(delta, row.valueType))
        values.push(percent === null ? '' : (percent * 100).toFixed(2))
      }

      csv += values.join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-summary-table.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!hasData) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No financial data available. Upload the templates and configure fees to populate this summary.
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Financial Benefits Claims Analysis
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={globalSearch}
                onChange={event => setGlobalSearch(event.target.value)}
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search all data..."
                aria-label="Global search"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDerivedMetrics(prev => !prev)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showDerivedMetrics
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
              aria-pressed={showDerivedMetrics}
            >
              {showDerivedMetrics ? 'Hide' : 'Show'} Derived Metrics
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Print
            </button>
          </div>
        </div>

        <div className="mt-6">
          <CustomSummaryBuilder
            availableFields={availableFields}
            selectedFieldIds={sanitizedCustomFields}
            enabled={customSummary.enabled}
            useCustomLayout={useCustomLayout}
            onToggleEnabled={setCustomSummaryEnabled}
            onLayoutChange={setCustomSummaryLayout}
          />
        </div>
      </div>

      <div ref={tableRef} className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <th
                className="text-left p-4 font-semibold text-gray-900 bg-white border-r border-gray-200 sticky left-0 min-w-80 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('category')}
                tabIndex={0}
                role="columnheader"
                aria-sort={currentSort.column === 'category' ? currentSort.direction || 'none' : 'none'}
              >
                <div className="flex items-center justify-between">
                  <span>Cost Category</span>
                  <div className="flex flex-col text-xs text-gray-400">
                    <span className={currentSort.column === 'category' && currentSort.direction === 'asc' ? 'text-blue-600' : ''}>▲</span>
                    <span className={currentSort.column === 'category' && currentSort.direction === 'desc' ? 'text-blue-600' : ''}>▼</span>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Filter..."
                    onChange={event => handleColumnFilter('category', event.target.value)}
                    onClick={event => event.stopPropagation()}
                  />
                </div>
              </th>

              {months.map(month => (
                <th
                  key={month}
                  className="text-right p-4 font-semibold text-gray-900 min-w-32 cursor-pointer hover:bg-gray-50 transition-colors border-r border-gray-200"
                  onClick={() => handleSort(month)}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={currentSort.column === month ? currentSort.direction || 'none' : 'none'}
                >
                  <div className="flex items-center justify-between">
                    <span>{formatMonthLabel(month)}</span>
                    <div className="flex flex-col text-xs text-gray-400">
                      <span className={currentSort.column === month && currentSort.direction === 'asc' ? 'text-blue-600' : ''}>▲</span>
                      <span className={currentSort.column === month && currentSort.direction === 'desc' ? 'text-blue-600' : ''}>▼</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=">=, <=, = value"
                      onChange={event => handleColumnFilter(month, event.target.value)}
                      onClick={event => event.stopPropagation()}
                    />
                  </div>
                </th>
              ))}

              {showDerivedMetrics && months.length >= 2 && (
                <>
                  <th className="text-right p-4 font-semibold text-gray-900 min-w-32 border-r border-gray-200">
                    MoM Δ
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-900 min-w-24 border-r border-gray-200">
                    %Δ MoM
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {(() => {
              const rows: JSX.Element[] = []
              let lastGroup: GroupName | null = null

              filteredData.forEach(row => {
                if (row.group !== lastGroup) {
                  lastGroup = row.group
                  const isCollapsed = collapsedGroups.has(row.group)
                  const colspan = months.length + 1 + (showDerivedMetrics && months.length >= 2 ? 2 : 0)

                  rows.push(
                    <tr key={`group-${row.group}`} className="bg-gradient-to-r from-blue-50 to-white border-t-2 border-blue-200">
                      <td colSpan={colspan} className="p-3">
                        <button
                          type="button"
                          onClick={() => toggleGroup(row.group)}
                          className="flex items-center gap-2 w-full text-left font-medium text-blue-900 hover:text-blue-700 transition-colors"
                          aria-expanded={!isCollapsed}
                        >
                          <span className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                          <span>{row.group}</span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const isCollapsed = collapsedGroups.has(row.group)
                const { delta, percent } = showDerivedMetrics && months.length >= 2 ? deriveMetrics(row) : { delta: null, percent: null }

                if (!isCollapsed) {
                  rows.push(
                    <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td
                        className="p-4 bg-white border-r border-gray-200 sticky left-0 font-medium text-gray-900"
                        onMouseEnter={event => {
                          const hasAcronym = Object.keys(acronyms).some(acronym => row.label.includes(acronym))
                          if (hasAcronym) {
                            const tooltipKey = Object.keys(acronyms).find(acronym => row.label.includes(acronym))
                            if (tooltipKey) showTooltipAt(event, acronyms[tooltipKey])
                          }
                        }}
                        onMouseLeave={hideTooltip}
                      >
                        {row.label}
                      </td>

                      {months.map(month => {
                        const value = row.values[month]
                        const { text, isNegative } = formatDisplay(value, row.valueType)
                        return (
                          <td key={month} className={`p-4 text-right tabular-nums border-r border-gray-200 ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
                            {text}
                          </td>
                        )
                      })}

                      {showDerivedMetrics && months.length >= 2 && (
                        <>
                          <td className={`p-4 text-right tabular-nums border-r border-gray-200 ${delta !== null && delta < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDisplay(delta, row.valueType).text}
                          </td>
                          <td className={`p-4 text-right tabular-nums border-r border-gray-200 ${percent !== null && percent < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDisplay(percent, 'percent').text}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                }
              })

              return rows
            })()}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
        <div className="flex gap-8 text-sm">
          {months.map(month => (
            <div key={month} className="text-center">
              <div className="font-medium text-gray-600 uppercase text-xs">
                {formatMonthLabel(month)}
              </div>
              <div className="font-bold text-gray-900">
                {currencyFormatter.format(totalsByMonth[month] ?? 0)}
              </div>
            </div>
          ))}
          <div className="text-center">
            <div className="font-medium text-gray-600 uppercase text-xs">Rows</div>
            <div className="font-bold text-gray-900">{filteredData.length}</div>
          </div>
        </div>
      </div>

      {tooltip.show && (
        <div
          className="absolute bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-50 max-w-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
