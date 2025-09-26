'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useExperienceData } from '@/lib/store/useAppStore'
import { getUniqueMonths } from '@/lib/calc/aggregations'
import exportSummaryTable from '@/lib/pdf/exportSummaryTable'
import exportStyles from '@/lib/pdf/styles.module.css'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatMonthLabel(month: string) {
  const [year, monthPart] = month.split('-')
  const date = new Date(Number(year), Number(monthPart) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function SummaryTable() {
  const experience = useExperienceData()
  const [isExporting, setIsExporting] = useState(false)
  const [startMonth, setStartMonth] = useState('')
  const [endMonth, setEndMonth] = useState('')
  const captureRef = useRef<HTMLDivElement | null>(null)

  const months = useMemo(() => getUniqueMonths(experience), [experience])
  useEffect(() => {
    if (months.length === 0) {
      setStartMonth('')
      setEndMonth('')
      return
    }

    setStartMonth(prev => (prev && months.includes(prev) ? prev : months[0]))
    setEndMonth(prev => (prev && months.includes(prev) ? prev : months[months.length - 1]))
  }, [months])

  const [rangeStart, rangeEnd] = useMemo(() => {
    if (!startMonth || !endMonth) return ['', '']
    return startMonth <= endMonth ? [startMonth, endMonth] : [endMonth, startMonth]
  }, [startMonth, endMonth])

  const visibleMonths = useMemo(() => {
    if (!rangeStart || !rangeEnd) return months
    return months.filter(month => month >= rangeStart && month <= rangeEnd)
  }, [months, rangeStart, rangeEnd])

  const startValue = rangeStart || (months[0] ?? '')
  const endValue = rangeEnd || (months[months.length - 1] ?? '')
  const categories = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    experience.forEach(row => {
      if (!seen.has(row.category)) {
        seen.add(row.category)
        ordered.push(row.category)
      }
    })
    return ordered
  }, [experience])

  const valuesByCategory = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    experience.forEach(row => {
      const byMonth = map.get(row.category) ?? new Map<string, number>()
      byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.amount)
      map.set(row.category, byMonth)
    })
    return map
  }, [experience])

  const totalsByMonth = useMemo(() => {
    return visibleMonths.map(month =>
      experience
        .filter(row => row.month === month)
        .reduce((sum, row) => sum + row.amount, 0),
    )
  }, [experience, visibleMonths])

  if (experience.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No experience data available. Upload the template to populate this summary.
      </div>
    )
  }

  const handleExport = async () => {
    if (!captureRef.current) return

    try {
      setIsExporting(true)
      captureRef.current.classList.add(exportStyles.exportRoot)
      await exportSummaryTable(captureRef.current)
    } catch (error) {
      console.error('Failed to export summary table', error)
      window.alert('Unable to export the summary table. Please try again.')
    } finally {
      captureRef.current.classList.remove(exportStyles.exportRoot)
      setIsExporting(false)
    }
  }

  const applyRange = (start: string, end: string) => {
    if (!start || !end) return
    if (start <= end) {
      setStartMonth(start)
      setEndMonth(end)
    } else {
      setStartMonth(end)
      setEndMonth(start)
    }
  }

  const handleStartSelect = (value: string) => {
    if (!value) return
    const effectiveEnd = endValue || value
    if (value <= effectiveEnd) {
      applyRange(value, effectiveEnd)
    } else {
      applyRange(value, value)
    }
  }

  const handleEndSelect = (value: string) => {
    if (!value) return
    const effectiveStart = startValue || value
    if (value >= effectiveStart) {
      applyRange(effectiveStart, value)
    } else {
      applyRange(value, value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-full border border-black/80 px-5 py-2 text-sm font-semibold tracking-wide text-black transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-black/30 disabled:text-black/40 disabled:hover:bg-transparent"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isExporting ? 'Exporting…' : 'Export PDF Report'}
        </button>
      </div>

      {months.length > 1 && (
        <div className="rounded-3xl border border-black/10 bg-white/90 p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-black">Quick Select:</span>
            <button
              onClick={() => {
                const startIndex = Math.max(0, months.length - 3)
                applyRange(months[startIndex], months[months.length - 1])
              }}
              className="rounded-full border border-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              Last 3 Months
            </button>
            <button
              onClick={() => {
                const startIndex = Math.max(0, months.length - 6)
                applyRange(months[startIndex], months[months.length - 1])
              }}
              className="rounded-full border border-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              Last 6 Months
            </button>
            <button
              onClick={() => {
                const currentYear = new Date().getFullYear().toString()
                const ytdStart = months.find(month => month.startsWith(currentYear)) || months[0]
                applyRange(ytdStart, months[months.length - 1])
              }}
              className="rounded-full border border-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              YTD
            </button>
            <button
              onClick={() => {
                applyRange(months[0], months[months.length - 1])
              }}
              className="rounded-full border border-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              All Data
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
            <label className="flex items-center gap-2">
              <span>From</span>
              <select
                value={startValue}
                onChange={event => handleStartSelect(event.target.value)}
                className="rounded-md border border-black/20 bg-white px-2 py-1 text-sm text-black shadow-sm focus:outline-none"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span>To</span>
              <select
                value={endValue}
                onChange={event => handleEndSelect(event.target.value)}
                className="rounded-md border border-black/20 bg-white px-2 py-1 text-sm text-black shadow-sm focus:outline-none"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              Showing {visibleMonths.length} month{visibleMonths.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      )}

      <div
        id="summary-table"
        ref={captureRef}
        className="overflow-x-auto rounded-3xl border border-black/10 bg-white/90 p-1 shadow-[0_40px_100px_-60px_rgba(15,15,25,0.75)]"
      >
        <table className="min-w-[720px] table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-black text-white">
              <th className="border border-black/40 px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-white">
                Cost Category
              </th>
              {visibleMonths.map(month => (
                <th
                  key={month}
                  className="border border-black/40 px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.3em] text-white whitespace-nowrap"
                >
                  {formatMonthLabel(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(category => {
              const monthValues = valuesByCategory.get(category) ?? new Map<string, number>()
              return (
                <tr
                  key={category}
                  className="bg-white/95 transition-colors duration-150 hover:bg-black/[0.04]"
                >
                  <td className="border border-black/10 px-5 py-4 text-left text-[0.95rem] font-semibold text-black">
                    {category}
                  </td>
                  {visibleMonths.map(month => {
                    const amount = monthValues.get(month) ?? 0
                    return (
                      <td
                        key={month}
                        className="border border-black/10 px-5 py-4 text-right text-sm font-medium tabular-nums text-black/80"
                      >
                        {amount === 0 ? '—' : currencyFormatter.format(amount)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-black text-white">
              <td className="border border-black px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.25em] text-white">
                Total
              </td>
              {totalsByMonth.map((total, index) => (
                <td
                  key={visibleMonths[index]}
                  className="border border-black px-5 py-4 text-right text-sm font-semibold tabular-nums text-white"
                >
                  {currencyFormatter.format(total)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
