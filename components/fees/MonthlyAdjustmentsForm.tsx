'use client'

import { useMemo, useState } from 'react'
import {
  useAdjustmentOverrides,
  useAppStore,
  useFinancialMetrics,
  useMonths,
} from '@/lib/store/useAppStore'

export default function MonthlyAdjustmentsForm() {
  const adjustmentOverrides = useAdjustmentOverrides()
  const financialMetrics = useFinancialMetrics()
  const experienceMonths = useMonths()
  const { setAdjustmentOverride, removeAdjustmentOverride } = useAppStore()

  const [newMonth, setNewMonth] = useState('')

  const normalizedAdjustments = useMemo(() => {
    return Object.keys(adjustmentOverrides).sort()
  }, [adjustmentOverrides])

  const metricsByMonth = useMemo(() => {
    return financialMetrics.reduce<Record<string, { monthlyActual: number }>>((acc, metric) => {
      acc[metric.month] = { monthlyActual: metric.monthlyClaimsAndExpenses }
      return acc
    }, {})
  }, [financialMetrics])

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black">One-Off Adjustments</h2>
          <p className="text-sm text-black/70">
            Enter lump-sum rebates or stop-loss reimbursements that hit specific months. Use negative values for credits so the amounts roll up correctly in the medical P&amp;L.
          </p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={event => {
            event.preventDefault()
            if (!newMonth) return
            const normalized = normalizeMonthInput(newMonth)
            if (!normalized) return
            setAdjustmentOverride(normalized, { rxRebates: 0, stopLossReimbursement: 0 })
            setNewMonth('')
          }}
        >
          <input
            type="month"
            value={newMonth}
            onChange={event => setNewMonth(event.target.value)}
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

      {normalizedAdjustments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/30 bg-white/60 p-6 text-center text-sm text-black/60">
          No adjustments configured yet. Add a month to record rebate or stop-loss entries.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-black/10 text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60">Month</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Rebate Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Stop-Loss Reimb.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Monthly Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {normalizedAdjustments.map(month => {
                const override = adjustmentOverrides[month] ?? {}
                const metric = metricsByMonth[month]
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
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={override.rxRebates ?? ''}
                        onChange={event => {
                          const value = event.target.value
                          setAdjustmentOverride(month, {
                            rxRebates: value === '' ? null : parseFloat(value),
                            stopLossReimbursement: override.stopLossReimbursement ?? null,
                          })
                        }}
                        className="w-32 rounded-md border border-black/20 px-2 py-1 text-right text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={override.stopLossReimbursement ?? ''}
                        onChange={event => {
                          const value = event.target.value
                          setAdjustmentOverride(month, {
                            rxRebates: override.rxRebates ?? null,
                            stopLossReimbursement: value === '' ? null : parseFloat(value),
                          })
                        }}
                        className="w-32 rounded-md border border-black/20 px-2 py-1 text-right text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-black/70">
                      {formatCurrency(metric?.monthlyActual ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {experienceMonths.includes(month) ? (
                        <span className="text-[10px] uppercase tracking-wide text-black/40">From upload</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeAdjustmentOverride(month)}
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
          </table>
        </div>
      )}

      <p className="text-xs text-black/50">
        Example: paste the rebate amount for the month it hits, leave other months blank, and the dashboard will carry zeros for the rest.
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

function normalizeMonthInput(value: string): string | null {
  if (!value) return null
  const [year, month] = value.split('-')
  if (!year || !month) return null
  return `${year}-${month}`
}
