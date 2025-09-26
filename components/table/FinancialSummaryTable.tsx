'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
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
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Info, LayoutDashboard, Layers3, LineChart as LineChartIcon, Search, Table as TableIcon } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts'

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

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
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

const groupIcons: Partial<Record<GroupName, LucideIcon>> = {
  'Medical Claims': Layers3,
  'Rx Claims': Layers3,
  'Stop Loss': LineChartIcon,
  'Admin Fees': LayoutDashboard,
  'Monthly Totals': TableIcon,
  'Counts & PEPM': LineChartIcon,
  'Variance Analysis': LayoutDashboard,
  [CUSTOM_GROUP_LABEL]: TableIcon,
}

type HighlightTone = 'default' | 'positive' | 'negative'

interface HighlightCardData {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone?: HighlightTone
  deltaLabel?: string
}

function SummaryHighlightCard({ card }: { card: HighlightCardData }) {
  const Icon = card.icon
  const toneClass =
    card.tone === 'positive' ? 'text-emerald-600' : card.tone === 'negative' ? 'text-rose-600' : 'text-slate-900'
  const badgeClass =
    card.tone === 'positive'
      ? 'bg-emerald-100 text-emerald-600'
      : card.tone === 'negative'
      ? 'bg-rose-100 text-rose-600'
      : 'bg-sky-100 text-sky-600'

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg">
      <div className="flex items-start gap-3">
        <span className={`rounded-2xl p-2 ${badgeClass}`} aria-hidden="true">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{card.value}</p>
          <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          {card.deltaLabel && <p className="mt-1 text-xs font-medium text-slate-500">{card.deltaLabel}</p>}
        </div>
      </div>
    </div>
  )
}

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

function formatMonthShort(month: string): string {
  const [year, monthPart] = month.split('-')
  const date = new Date(Number(year), Number(monthPart) - 1)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value)
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

  const baseTotalsByMonth = useMemo(() => {
    return months.reduce<Record<string, number>>((acc, month) => {
      acc[month] = baseRows.reduce((sum, row) => {
        if (row.valueType !== 'currency') return sum
        const value = row.values[month]
        return typeof value === 'number' ? sum + value : sum
      }, 0)
      return acc
    }, {})
  }, [months, baseRows])

  const miniChartData = useMemo(() => {
    return months.map(month => ({
      month: formatMonthLabel(month),
      total: baseTotalsByMonth[month] ?? 0,
    }))
  }, [months, baseTotalsByMonth])

  const areaGradientId = useMemo(() => `summaryAreaGradient-${Math.random().toString(36).slice(2)}`, [])

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

  const highlightCards = useMemo<HighlightCardData[]>(() => {
    const cards: HighlightCardData[] = []
    if (months.length === 0) return cards

    const latestMonth = months[months.length - 1]
    const latestTotal = baseTotalsByMonth[latestMonth] ?? 0
    const previousMonth = months.length > 1 ? months[months.length - 2] : undefined

    let deltaLabel: string | undefined
    let tone: HighlightTone = 'default'
    if (previousMonth) {
      const previousTotal = baseTotalsByMonth[previousMonth] ?? 0
      const delta = latestTotal - previousTotal
      if (delta !== 0) {
        const prefix = delta >= 0 ? '+' : '−'
        deltaLabel = `${prefix}${formatCompactCurrency(Math.abs(delta))} vs ${formatMonthShort(previousMonth)}`
        tone = delta <= 0 ? 'positive' : 'negative'
      }
    }

    cards.push({
      label: 'Latest Spend',
      value: currencyFormatter.format(latestTotal),
      helper: formatMonthLabel(latestMonth),
      icon: LineChartIcon,
      tone,
      deltaLabel,
    })

    cards.push({
      label: 'Visible Categories',
      value: filteredData.length.toLocaleString(),
      helper: `${baseRows.length.toLocaleString()} total tracked`,
      icon: TableIcon,
    })

    const latestMetric = metricsByMonth[latestMonth]
    if (latestMetric) {
      const variance = latestMetric.monthlyDifference ?? 0
      const varianceTone: HighlightTone = variance <= 0 ? 'positive' : 'negative'
      const deltaPercent = latestMetric.monthlyDifferencePct
      cards.push({
        label: 'Monthly Variance',
        value: currencyFormatter.format(variance),
        helper: variance <= 0 ? 'Under budget' : 'Over budget',
        icon: LayoutDashboard,
        tone: varianceTone,
        deltaLabel: typeof deltaPercent === 'number' ? `${(deltaPercent * 100).toFixed(2)}% vs budget` : undefined,
      })
    }

    return cards
  }, [months, baseTotalsByMonth, filteredData.length, baseRows.length, metricsByMonth])

  const renderAreaTooltip = useCallback(({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload || payload.length === 0) return null
    const datum = payload[0]
    const monthLabel = datum.payload?.month as string
    const total = datum.payload?.total as number
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur">
        <div className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">{monthLabel}</div>
        <div className="mt-1 text-sm font-semibold text-slate-800">{currencyFormatter.format(total)}</div>
      </div>
    )
  }, [])

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
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/90 px-8 py-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Summary table is waiting for data</h2>
        <p className="mt-3 text-sm text-slate-600">
          Upload experience data and complete the monthly fee configuration to unlock interactive financial summaries and charts.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <div className="space-y-6 border-b border-slate-200 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Financial Benefits Claims Analysis</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Monitor medical, pharmacy, stop-loss, and administrative spend with contextual grouping, variance trends, and export-ready detail.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="relative flex w-full max-w-xs items-center">
                    <span className="sr-only">Search all data</span>
                    <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      type="text"
                      value={globalSearch}
                      onChange={event => setGlobalSearch(event.target.value)}
                      className="w-full rounded-full border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Search categories or values"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDerivedMetrics(prev => !prev)}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      showDerivedMetrics
                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                        : 'border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600'
                    }`}
                    aria-pressed={showDerivedMetrics}
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    {showDerivedMetrics ? 'Hide derived metrics' : 'Show derived metrics'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
                  >
                    <TableIcon className="h-4 w-4" aria-hidden="true" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
                  >
                    <LineChartIcon className="h-4 w-4" aria-hidden="true" />
                    Print
                  </button>
                </div>
              </div>
            </div>
            <CustomSummaryBuilder
              availableFields={availableFields}
              selectedFieldIds={sanitizedCustomFields}
              enabled={customSummary.enabled}
              useCustomLayout={useCustomLayout}
              onToggleEnabled={setCustomSummaryEnabled}
              onLayoutChange={setCustomSummaryLayout}
            />
          </div>
          {highlightCards.length > 0 && (
            <div className="space-y-6 border-b border-slate-200 px-6 pb-8 pt-6 sm:px-8">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {highlightCards.map((card, index) => (
                  <SummaryHighlightCard key={`${card.label}-${index}`} card={card} />
                ))}
              </div>
              {miniChartData.length > 1 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trend</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">Monthly totals</p>
                    </div>
                    <Info className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </div>
                  <div className="mt-4 h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniChartData}>
                        <defs>
                          <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#2563EB"
                          strokeWidth={2}
                          fill={`url(#${areaGradientId})`}
                          name="Total"
                        />
                        <RechartsTooltip content={renderAreaTooltip} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={tableRef} className="overflow-x-auto px-2 pb-2 pt-4 sm:px-6">
            <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-2xl text-sm">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-30 bg-white/95 px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                    aria-sort={currentSort.column === 'category' ? currentSort.direction || 'none' : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort('category')}
                      className="flex items-center gap-2 text-slate-700 transition hover:text-blue-600"
                    >
                      <span className="text-sm font-semibold text-slate-800">Cost Category</span>
                      <span className="flex flex-col text-[10px] leading-[10px] text-slate-400">
                        <span className={currentSort.column === 'category' && currentSort.direction === 'asc' ? 'text-blue-600' : ''}>▲</span>
                        <span className={currentSort.column === 'category' && currentSort.direction === 'desc' ? 'text-blue-600' : ''}>▼</span>
                      </span>
                    </button>
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        placeholder="Filter…"
                        onChange={event => handleColumnFilter('category', event.target.value)}
                      />
                    </div>
                  </th>
                  {months.map(month => (
                    <th
                      key={month}
                      scope="col"
                      className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                      aria-sort={currentSort.column === month ? currentSort.direction || 'none' : 'none'}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(month)}
                        className="flex w-full items-center justify-end gap-2 text-slate-700 transition hover:text-blue-600"
                      >
                        <span className="text-sm font-semibold text-slate-800">{formatMonthLabel(month)}</span>
                        <span className="flex flex-col text-[10px] leading-[10px] text-slate-400">
                          <span className={currentSort.column === month && currentSort.direction === 'asc' ? 'text-blue-600' : ''}>▲</span>
                          <span className={currentSort.column === month && currentSort.direction === 'desc' ? 'text-blue-600' : ''}>▼</span>
                        </span>
                      </button>
                      <div className="mt-2">
                        <input
                          type="text"
                          className="w-full rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                          placeholder=">=, <=, = value"
                          onChange={event => handleColumnFilter(month, event.target.value)}
                        />
                      </div>
                    </th>
                  ))}
                  {showDerivedMetrics && months.length >= 2 && (
                    <>
                      <th scope="col" className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        MoM Δ
                      </th>
                      <th scope="col" className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        %Δ MoM
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {(() => {
                  const rows: JSX.Element[] = []
                  let lastGroup: GroupName | null = null

                  filteredData.forEach((row, dataIndex) => {
                    const groupSlug = row.group.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'group'
                    const groupIsCollapsed = collapsedGroups.has(row.group)
                    const isNewGroup = row.group !== lastGroup

                    if (isNewGroup) {
                      lastGroup = row.group
                      const isCollapsed = groupIsCollapsed
                      const colspan = months.length + 1 + (showDerivedMetrics && months.length >= 2 ? 2 : 0)
                      const IconComponent = groupIcons[row.group] ?? Layers3

                      rows.push(
                        <tr key={`group-${row.group}`} className="bg-white">
                          <td colSpan={colspan} className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => toggleGroup(row.group)}
                              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              aria-expanded={!isCollapsed}
                              aria-controls={`${groupSlug}-rows`}
                            >
                              <span className="flex items-center gap-3">
                                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${isCollapsed ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                                  <IconComponent className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span id={`${groupSlug}-label`} className="text-sm font-semibold text-slate-800">
                                  {row.group}
                                </span>
                              </span>
                              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                                <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} aria-hidden="true" />
                              </span>
                            </button>
                          </td>
                        </tr>
                      )

                      if (isCollapsed) {
                        return
                      }
                    }

                    if (groupIsCollapsed) {
                      return
                    }

                    const rowBackground = dataIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    const { delta, percent } = showDerivedMetrics && months.length >= 2 ? deriveMetrics(row) : { delta: null, percent: null }
                    const rowId = isNewGroup ? `${groupSlug}-rows` : undefined

                    rows.push(
                      <tr
                        key={row.key}
                        className={`group ${rowBackground} border-b border-slate-200 hover:bg-blue-50 focus-within:bg-blue-50 transition-colors`}
                        data-group={groupSlug}
                      >
                        <th
                          scope="row"
                          className={`sticky left-0 z-10 ${rowBackground} px-5 py-4 text-left font-semibold text-slate-800 shadow-[1px_0_0_rgba(148,163,184,0.35)] group-hover:bg-blue-50`}
                          aria-labelledby={`${groupSlug}-label`}
                          id={rowId}
                          onMouseEnter={event => {
                            const tooltipKey = Object.keys(acronyms).find(acronym => row.label.includes(acronym))
                            if (tooltipKey) showTooltipAt(event, acronyms[tooltipKey])
                          }}
                          onMouseLeave={hideTooltip}
                        >
                          {row.label}
                        </th>
                        {months.map(month => {
                          const value = row.values[month]
                          const { text, isNegative } = formatDisplay(value, row.valueType)
                          return (
                            <td key={month} className={`px-5 py-4 text-right tabular-nums ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
                              {text}
                            </td>
                          )
                        })}
                        {showDerivedMetrics && months.length >= 2 && (
                          <>
                            <td className={`px-5 py-4 text-right tabular-nums ${delta !== null && delta < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {formatDisplay(delta, row.valueType).text}
                            </td>
                            <td className={`px-5 py-4 text-right tabular-nums ${percent !== null && percent < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {formatDisplay(percent, 'percent').text}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })

                  return rows
                })()}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-4 text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
                {months.map(month => (
                  <div key={month} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm">
                    <div className="text-[0.65rem] tracking-[0.3em] text-slate-400">{formatMonthShort(month)}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{currencyFormatter.format(totalsByMonth[month] ?? 0)}</div>
                  </div>
                ))}
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm">
                  <div className="text-[0.65rem] tracking-[0.3em] text-slate-400">Visible Rows</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{filteredData.length.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/fees"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                  Back to Fees
                </Link>
                <Link
                  href="/dashboard/charts"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Continue to Charts
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      {tooltip.show && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
