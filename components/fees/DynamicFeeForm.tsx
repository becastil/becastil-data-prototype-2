'use client'

import { useMemo, useState } from 'react'
import {
  useAppStore,
  useFeeComputedByMonth,
  useFeeDefinitions,
  useFeeMonths,
  useFeeOverrides,
  useFeeTierCounts,
  useFinancialMetrics,
  useMonths,
} from '@/lib/store/useAppStore'

const RATE_BASIS_OPTIONS = [
  { value: 'FLAT_MONTHLY', label: 'Flat Monthly Amount' },
  { value: 'PER_EMPLOYEE_PER_MONTH', label: 'Per Employee Per Month (PEPM)' },
  { value: 'PER_MEMBER_PER_MONTH', label: 'Per Member Per Month (PMPM)' },
  { value: 'ANNUAL', label: 'Annual (evenly allocated)' },
  { value: 'TIERED', label: 'Tiered Rates (Single / Family, etc.)' },
  { value: 'CUSTOM', label: 'Custom / Manual Entry' },
] as const

export default function DynamicFeeForm() {
  const feeDefinitions = useFeeDefinitions()
  const feeMonths = useFeeMonths()
  const feeOverrides = useFeeOverrides()
  const feeComputedByMonth = useFeeComputedByMonth()
  const feeTierCounts = useFeeTierCounts()
  const financialMetrics = useFinancialMetrics()
  const experienceMonths = useMonths()
  const {
    addFeeDefinition,
    updateFeeDefinition,
    removeFeeDefinition,
    addFeeTier,
    updateFeeTier,
    removeFeeTier,
    addFeeMonth,
    removeFeeMonth,
    setFeeOverride,
    setFeeTierCount,
  } = useAppStore()

  const [newMonthValue, setNewMonthValue] = useState('')

  const metricsByMonth = useMemo(() => {
    return financialMetrics.reduce<Record<string, { ee: number; members: number }>>((acc, metric) => {
      acc[metric.month] = { ee: metric.eeCount, members: metric.memberCount }
      return acc
    }, {})
  }, [financialMetrics])

  const totalByMonth = useMemo(() => {
    return feeMonths.reduce<Record<string, number>>((acc, month) => {
      const monthFees = feeComputedByMonth[month] ?? {}
      const overrides = feeOverrides[month] ?? {}
      acc[month] = feeDefinitions.reduce((sum, def) => {
        const override = overrides[def.id]
        const base = monthFees[def.id] ?? 0
        return sum + (override ?? base)
      }, 0)
      return acc
    }, {})
  }, [feeComputedByMonth, feeDefinitions, feeMonths, feeOverrides])

  const grandTotal = useMemo(() => {
    return Object.values(totalByMonth).reduce((sum, value) => sum + value, 0)
  }, [totalByMonth])

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Fee Definitions</h2>
            <p className="text-sm text-black/70">
              Define every fee you track, choose its rate basis, and enter the rate provided on invoices. Override monthly values as needed below.
            </p>
          </div>
          <button
            type="button"
            onClick={addFeeDefinition}
            className="inline-flex items-center gap-2 rounded-lg border border-black px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/5"
          >
            Add Fee
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </header>

        {feeDefinitions.length === 0 && (
          <div className="rounded-lg border border-dashed border-black/30 bg-white/60 p-6 text-center text-sm text-black/60">
            No fees defined yet. Add a fee to begin configuring your schedule.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {feeDefinitions.map(definition => (
            <article key={definition.id} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-black/60">Fee Name</label>
                    <input
                      value={definition.name}
                      onChange={event => updateFeeDefinition(definition.id, { name: event.target.value })}
                      className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="e.g., TPA Administration Fee"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-black/60">Rate Basis</label>
                      <select
                        value={definition.rateBasis}
                        onChange={event => {
                          const newBasis = event.target.value as typeof RATE_BASIS_OPTIONS[number]['value']
                          if (newBasis === 'TIERED') {
                            updateFeeDefinition(definition.id, { rateBasis: newBasis, rateValue: 0 })
                            if (!definition.tiers || definition.tiers.length === 0) {
                              addFeeTier(definition.id)
                              addFeeTier(definition.id)
                            }
                          } else {
                            updateFeeDefinition(definition.id, {
                              rateBasis: newBasis,
                              tiers: [],
                            })
                            if (definition.tiers && definition.tiers.length > 0) {
                              definition.tiers.forEach(tier => removeFeeTier(definition.id, tier.id))
                            }
                          }
                        }}
                        className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                      >
                        {RATE_BASIS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-black/60">
                        {definition.rateBasis === 'ANNUAL' ? 'Annual Amount' : 'Rate'}
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={Number.isFinite(definition.rateValue) ? definition.rateValue : 0}
                        onChange={event => updateFeeDefinition(definition.id, { rateValue: parseFloat(event.target.value) })}
                        disabled={definition.rateBasis === 'TIERED'}
                        className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 disabled:bg-black/5 disabled:text-black/40"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-black/60">Notes</label>
                    <textarea
                      value={definition.notes ?? ''}
                      onChange={event => updateFeeDefinition(definition.id, { notes: event.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-black/20 px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Optional notes or invoice references"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeeDefinition(definition.id)}
                  className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              {definition.rateBasis === 'CUSTOM' && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Provide monthly values manually in the table below. Custom basis treats rate as informational only.
                </p>
              )}
              {definition.rateBasis === 'ANNUAL' && (
                <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Annual amounts are allocated evenly across the months currently in your schedule ({feeMonths.length || 12} months).
                </p>
              )}
              {definition.rateBasis === 'TIERED' && (
                <div className="mt-4 space-y-3 rounded-md border border-purple-200 bg-purple-50/70 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                      Tiered Rates (max 5)
                    </span>
                    <button
                      type="button"
                      onClick={() => addFeeTier(definition.id)}
                      disabled={(definition.tiers?.length ?? 0) >= 5}
                      className="inline-flex items-center gap-1 rounded-md border border-purple-300 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add Tier
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(definition.tiers ?? []).map(tier => (
                      <div key={tier.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm">
                        <input
                          value={tier.label}
                          onChange={event => updateFeeTier(definition.id, tier.id, { label: event.target.value })}
                          className="rounded-md border border-purple-200 px-2 py-1 text-sm text-black focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="Tier label"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={Number.isFinite(tier.rate) ? tier.rate : 0}
                          onChange={event => updateFeeTier(definition.id, tier.id, { rate: parseFloat(event.target.value) })}
                          className="w-24 rounded-md border border-purple-200 px-2 py-1 text-right text-sm text-black focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeeTier(definition.id, tier.id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {(definition.tiers?.length ?? 0) === 0 && (
                      <p className="text-xs text-purple-700">
                        Add at least one tier to enable tier-based calculations.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Monthly Fee Schedule</h2>
            <p className="text-sm text-black/70">
              Override calculated amounts as needed. PEPM/PMPM calculations use the uploaded headcounts, and tiered fees multiply each tier’s rate by the counts you enter below.
            </p>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={event => {
              event.preventDefault()
              if (!newMonthValue) return
              addFeeMonth(newMonthValue)
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

        {feeMonths.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/30 bg-white/60 p-6 text-center text-sm text-black/60">
            No months configured yet. Add at least one month to build your schedule.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-black/10 text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60">Fee</th>
                {feeMonths.map(month => {
                  const isLocked = experienceMonths.includes(month)
                  return (
                      <th key={month} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">
                        <div className="flex items-center justify-end gap-2">
                          <span>{formatMonthLabel(month)}</span>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => removeFeeMonth(month)}
                              className="rounded border border-black/20 px-1 text-[10px] uppercase tracking-wide text-black/60 hover:bg-black/5"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-black/40">
                          EE: {metricsByMonth[month]?.ee ?? 0} • Members: {metricsByMonth[month]?.members ?? 0}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {feeDefinitions.map(definition => (
                  <tr key={definition.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-black">
                      <div>{definition.name || 'Untitled Fee'}</div>
                      <div className="text-xs text-black/50">{getRateBasisLabel(definition.rateBasis)}</div>
                    </td>
                    {feeMonths.map(month => {
                      const overrides = feeOverrides[month] ?? {}
                      const monthFees = feeComputedByMonth[month] ?? {}
                      const override = overrides[definition.id]
                      const baseAmount = monthFees[definition.id] ?? 0
                      const displayAmount = override ?? baseAmount
                      const tiers = definition.tiers ?? []
                      const tierCountsForMonth = feeTierCounts[month]?.[definition.id] ?? {}
                      const hasTiers = tiers.length > 0

                      return (
                        <td key={month} className="px-4 py-2 text-right align-middle">
                          <div className="flex flex-col items-end gap-1">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={Number.isFinite(displayAmount) ? displayAmount : 0}
                              onChange={event => {
                                const value = event.target.value
                                setFeeOverride(month, definition.id, value === '' ? null : parseFloat(value))
                              }}
                              className="w-28 rounded-md border border-black/20 px-2 py-1 text-right text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                            {override !== undefined && (
                              <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600">Override</span>
                            )}
                            {override === undefined && (
                              <span className="text-[10px] text-black/40">{formatCurrency(baseAmount)}</span>
                            )}
                            {hasTiers && (
                              <div className="mt-2 w-full rounded-md border border-black/10 bg-black/5 p-2 text-xs text-black">
                                {tiers.map(tier => {
                                  const count = tierCountsForMonth[tier.id] ?? 0
                                  const tierTotal = tier.rate * count
                                  return (
                                    <div key={tier.id} className="flex items-center justify-between gap-2">
                                      <span className="truncate" title={tier.label}>{tier.label}</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        value={Number.isFinite(count) ? count : 0}
                                        onChange={event => {
                                          const value = event.target.value
                                          setFeeTierCount(month, definition.id, tier.id, value === '' ? null : parseFloat(value))
                                        }}
                                        className="w-16 rounded-md border border-black/20 px-1 py-0.5 text-right text-xs text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                                      />
                                      <span className="w-20 text-right text-black/60">{formatCurrency(tierTotal)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-black/5">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-black">Monthly Total</td>
                  {feeMonths.map(month => (
                    <td key={month} className="px-4 py-3 text-right text-sm font-semibold text-black">
                      {formatCurrency(totalByMonth[month] ?? 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="rounded-lg border border-black/10 bg-white p-4 text-sm text-black/70">
          <p><strong>Total scheduled fees:</strong> {formatCurrency(grandTotal)}</p>
          <p className="mt-2 text-xs text-black/50">
            EE counts come from the experience upload. If a month is missing headcount, override the calculated amount above.
          </p>
        </div>
      </section>
    </div>
  )
}

function formatMonthLabel(month: string): string {
  const [year, rawMonth] = month.split('-')
  const monthIndex = Number.parseInt(rawMonth, 10) - 1
  if (Number.isNaN(monthIndex)) return month
  return new Date(Number.parseInt(year, 10), monthIndex).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

function getRateBasisLabel(basis: string): string {
  const found = RATE_BASIS_OPTIONS.find(option => option.value === basis)
  return found ? found.label : basis
}
