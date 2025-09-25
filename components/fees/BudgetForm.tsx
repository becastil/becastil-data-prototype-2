'use client'

import { useMemo, useState } from 'react'
import {
  useAppStore,
  useBudgetByMonth,
  useBudgetMonths,
  useFinancialMetrics,
  useMonths,
} from '@/lib/store/useAppStore'

export default function BudgetForm() {
  const budgetByMonth = useBudgetByMonth()
  const budgetMonths = useBudgetMonths()
  const financialMetrics = useFinancialMetrics()
  const experienceMonths = useMonths()
  const { setBudgetEntry, removeBudgetEntry, addFeeMonth, removeFeeMonth } = useAppStore()

  const [newMonthValue, setNewMonthValue] = useState('')

  const metricsByMonth = useMemo(() => {
    return financialMetrics.reduce<Record<string, { ee: number; monthlyActual: number }>>((acc, metric) => {
      acc[metric.month] = {
        ee: metric.eeCount,
        monthlyActual: metric.monthlyClaimsAndExpenses,
      }
      return acc
    }, {})
  }, [financialMetrics])

  const totalsByMonth = useMemo(() => {
    return budgetMonths.reduce<Record<string, number>>((acc, month) => {
      const entry = budgetByMonth[month]
      const metric = metricsByMonth[month]
      if (!entry) {
        acc[month] = 0
        return acc
      }
      if (typeof entry.total === 'number') {
        acc[month] = entry.total
      } else if (typeof entry.pepm === 'number') {
        acc[month] = entry.pepm * (metric?.ee ?? 0)
      } else {
        acc[month] = 0
      }
      return acc
    }, {})
  }, [budgetByMonth, budgetMonths, metricsByMonth])

  const cumulativeData = useMemo(() => {
    let runningActual = 0
    let runningBudget = 0
    return budgetMonths.map(month => {
      const actual = metricsByMonth[month]?.monthlyActual ?? 0
      const budget = totalsByMonth[month] ?? 0
      runningActual += actual
      runningBudget += budget
      const cumulativeDiff = runningActual - runningBudget
      return {
        month,
        monthlyActual: actual,
        monthlyBudget: budget,
        monthlyDiff: actual - budget,
        monthlyPct: budget !== 0 ? (actual - budget) / budget : null,
        cumulativeActual: runningActual,
        cumulativeBudget: runningBudget,
        cumulativeDiff,
        cumulativePct: runningBudget !== 0 ? cumulativeDiff / runningBudget : null,
      }
    })
  }, [budgetMonths, metricsByMonth, totalsByMonth])

  const cumulativeLookup = useMemo(() => {
    return new Map(cumulativeData.map(item => [item.month, item]))
  }, [cumulativeData])

  const finalCumulative = cumulativeData[cumulativeData.length - 1]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black">Budget Schedule</h2>
          <p className="text-sm text-black/70">
            Enter the budget PEPM or monthly amount for each month. The dashboard compares these figures against actual claims and expenses.
          </p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={event => {
            event.preventDefault()
            if (!newMonthValue) return
            const normalized = normalizeMonthInput(newMonthValue)
            if (!normalized) return
            setBudgetEntry(normalized, {})
            addFeeMonth(normalized)
            setNewMonthValue('')
          }}
        >
          <input
            type="month"
            value={newMonthValue}
            onChange={event => setNewMonthValue(event.target.value)}
            className="rounded-md border border-black/20 px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-black px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-black/5"
          >
            Add Month
          </button>
        </form>
      </header>

      {budgetMonths.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/30 bg-white/60 p-6 text-center text-sm text-black/60">
          No budget months configured yet. Add a month to begin entering budgets.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-black/10 text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60">Month</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Budget PEPM</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Budget Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Headcount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Actual Monthly</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Budget Monthly</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Monthly Diff</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Monthly %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Cum. Actual</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Cum. Budget</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Cum. Diff</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Cum. %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {budgetMonths.map(month => {
                const entry = budgetByMonth[month] ?? {}
                const metric = metricsByMonth[month]
                const total = totalsByMonth[month] ?? 0
                const cumulative = cumulativeLookup.get(month)
                const monthlyDiff = (metric?.monthlyActual ?? 0) - total
                return (
                  <tr key={month}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-black">
                      <div>{formatMonthLabel(month)}</div>
                      {experienceMonths.includes(month) ? (
                        <div className="text-xs text-black/40">From uploaded data</div>
                      ) : (
                        <div className="text-xs text-amber-600">Manual month</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={entry.pepm ?? ''}
                        onChange={event => {
                          const value = event.target.value
                          setBudgetEntry(month, {
                            pepm: value === '' ? null : parseFloat(value),
                            total: entry.total ?? null,
                          })
                        }}
                        className="w-28 rounded-md border border-black/20 px-2 py-1 text-right text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={entry.total ?? ''}
                        onChange={event => {
                          const value = event.target.value
                          setBudgetEntry(month, {
                            pepm: entry.pepm ?? null,
                            total: value === '' ? null : parseFloat(value),
                          })
                        }}
                        className="w-32 rounded-md border border-black/20 px-2 py-1 text-right text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-black/80">
                      {metric?.ee ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-black/80">
                      {formatCurrency(metric?.monthlyActual ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-black">
                      {formatCurrency(total)}
                    </td>
                    <td className={`px-4 py-3 text-right ${monthlyDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(monthlyDiff)}
                    </td>
                    <td className="px-4 py-3 text-right text-black/70">
                      {formatPercent(cumulative?.monthlyPct ?? (total !== 0 ? monthlyDiff / total : null))}
                    </td>
                    <td className="px-4 py-3 text-right text-black/80">
                      {formatCurrency(cumulative?.cumulativeActual ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-black/80">
                      {formatCurrency(cumulative?.cumulativeBudget ?? 0)}
                    </td>
                    <td className={`px-4 py-3 text-right ${
                      (cumulative?.cumulativeDiff ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(cumulative?.cumulativeDiff ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-black/70">
                      {formatPercent(cumulative?.cumulativePct ?? null)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {experienceMonths.includes(month) ? (
                        <span className="text-[10px] uppercase tracking-wide text-black/40">From upload</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            removeBudgetEntry(month)
                            removeFeeMonth(month)
                          }}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-black/5 text-sm font-semibold text-black">
              <tr>
                <td className="px-4 py-3">Cumulative</td>
                <td className="px-4 py-3" colSpan={3}></td>
                <td className="px-4 py-3" colSpan={4}></td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(finalCumulative?.cumulativeActual ?? 0)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(finalCumulative?.cumulativeBudget ?? 0)}
                </td>
                <td className={`px-4 py-3 text-right ${
                  (finalCumulative?.cumulativeDiff ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(finalCumulative?.cumulativeDiff ?? 0)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatPercent(finalCumulative?.cumulativePct ?? null)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs text-black/50">
        Tip: Enter credits (rebates, reimbursements) as negative numbers so cumulative differences align with your P&amp;L.
      </p>
    </section>
  )
}

function formatMonthLabel(month: string): string {
  const [year, rawMonth] = month.split('-')
  const monthIndex = Number.parseInt(rawMonth, 10) - 1
  if (Number.isNaN(monthIndex)) return month
  return new Date(Number.parseInt(year, 10), monthIndex).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function normalizeMonthInput(value: string): string | null {
  if (!value) return null
  const [year, month] = value.split('-')
  if (!year || !month) return null
  return `${year}-${month}`
}
