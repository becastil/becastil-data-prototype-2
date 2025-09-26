'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import LossRatioGaugeCanvas from './LossRatioGaugeCanvas'
import { LineChart, Line, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts'

const MARKET_CONFIG = {
  individual: { label: 'Individual', threshold: 0.8 },
  small: { label: 'Small Group', threshold: 0.82 },
  large: { label: 'Large Group', threshold: 0.85 },
} as const

const AUTO_INTERVAL = 3000

interface ScenarioState {
  premium: number
  claims: number
  quality: number
  admin: number
}

export default function LossRatioDashboard() {
  const [market, setMarket] = useState<keyof typeof MARKET_CONFIG>('small')
  const [state, setState] = useState<ScenarioState>(() => seedScenario())
  const [history, setHistory] = useState(() => seedHistory())
  const [auto, setAuto] = useState(false)
  const [autoKey, setAutoKey] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const initialDarkRef = useRef<boolean | null>(null)

  const lossRatio = useMemo(() => calcLossRatio(state), [state])
  const target = MARKET_CONFIG[market].threshold
  const status = lossRatio >= target ? 'Compliant' : 'Non-Compliant'
  const rebate = useMemo(() => {
    if (lossRatio >= target) return 0
    return (target - lossRatio) * state.premium
  }, [lossRatio, target, state.premium])

  const comparisons = useMemo(() => {
    const industry = Math.min(1, target + 0.02)
    const previousQuarter = history[history.length - 4]?.value ?? lossRatio
    const annualTarget = Math.min(1, target + 0.03)
    return {
      industry,
      previousQuarter,
      annualTarget,
    }
  }, [history, lossRatio, target])

  const handleRangeChange = useCallback((field: keyof ScenarioState, value: number) => {
    setState(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'premium') {
        const admin = Math.max(0, value - next.claims - next.quality)
        next.admin = admin
      }
      if (field === 'claims' || field === 'quality') {
        const admin = Math.max(0, next.premium - (field === 'claims' ? value : next.claims) - (field === 'quality' ? value : next.quality))
        next.admin = admin
      }
      if (field === 'quality') {
        next.quality = value
      }
      return next
    })
    setAuto(false)
  }, [])

  const handleRandomize = useCallback(() => {
    setState(seedScenario())
    setHistory(seedHistory())
    setAutoKey(key => key + 1)
  }, [])

  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => {
      setState(prev => {
        const nextScenario = randomScenario(prev.premium)
        setHistory(prevHistory => {
          const nextValue = calcLossRatio(nextScenario)
          const nextMonthLabel = nextMonth(prevHistory[prevHistory.length - 1]?.month)
          return [...prevHistory.slice(1), { month: nextMonthLabel, value: nextValue }]
        })
        setAutoKey(key => key + 1)
        return nextScenario
      })
    }, AUTO_INTERVAL)
    return () => clearInterval(id)
  }, [auto])

  useEffect(() => {
    const body = document.body
    if (initialDarkRef.current === null) {
      initialDarkRef.current = body.classList.contains('dark')
    }
    if (darkMode) {
      body.classList.add('dark')
    } else {
      body.classList.remove('dark')
    }
    return () => {
      if (initialDarkRef.current) {
        body.classList.add('dark')
      } else {
        body.classList.remove('dark')
      }
    }
  }, [darkMode])

  useEffect(() => {
    if (!showHelp) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowHelp(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showHelp])

  const breakdown = useMemo(() => {
    const total = state.premium || 1
    return [
      { label: 'Medical Claims', value: state.claims, percent: state.claims / total },
      { label: 'Quality Improvements', value: state.quality, percent: state.quality / total },
      { label: 'Administrative Costs', value: state.admin, percent: state.admin / total },
    ]
  }, [state])

  const trendData = useMemo(() => history.map(item => ({ ...item, threshold: target })), [history, target])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Interactive Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Healthcare Loss Ratio Fuel Gauge</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Model premium revenue, medical claims, and quality investments to understand MLR compliance in real time. Adjust inputs, compare against industry benchmarks, and export the scenario for executive reporting.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200"
          >
            How MLR Works
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(mode => !mode)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loss Ratio Gauge</h2>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Target {Math.round(target * 100)}%</p>
                </div>
                <select
                  value={market}
                  onChange={event => setMarket(event.target.value as keyof typeof MARKET_CONFIG)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {Object.entries(MARKET_CONFIG).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex flex-col items-center">
                <LossRatioGaugeCanvas value={lossRatio} target={target} autoAnimateKey={autoKey} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MetricCard label="Current Loss Ratio" value={(lossRatio * 100).toFixed(1) + '%'} accent="text-blue-600" />
                <MetricCard label="MLR Threshold" value={(target * 100).toFixed(0) + '%'} accent="text-emerald-600" />
                <MetricCard label="Status" value={status} accent={status === 'Compliant' ? 'text-emerald-600' : 'text-rose-600'} />
              </div>
            </div>

            <div className="h-full border-l border-slate-200 dark:border-slate-700" />

            <div className="flex w-full max-w-sm flex-col gap-5">
              <NumberSlider
                label="Premium Revenue"
                min={1000000}
                max={10000000}
                step={50000}
                value={state.premium}
                onChange={value => handleRangeChange('premium', value)}
                format={formatCurrency}
              />
              <NumberSlider
                label="Medical Claims"
                min={500000}
                max={9000000}
                step={50000}
                value={state.claims}
                onChange={value => handleRangeChange('claims', value)}
                format={formatCurrency}
              />
              <NumberSlider
                label="Quality Improvements"
                min={50000}
                max={500000}
                step={10000}
                value={state.quality}
                onChange={value => handleRangeChange('quality', value)}
                format={formatCurrency}
              />
              <ReadOnlyInput label="Administrative Costs" value={formatCurrency(state.admin)} />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  Randomize Data
                </button>
                <button
                  type="button"
                  onClick={() => setAuto(prev => !prev)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition ${
                    auto
                      ? 'border border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                      : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {auto ? 'Auto-Update On' : 'Auto-Update Off'}
                </button>
                <button
                  type="button"
                  onClick={() => exportScenario(state, market, lossRatio, target)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scenario Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Total Premium</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(state.premium)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Medical Claims</span>
              <span>{formatCurrency(state.claims)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Quality Improvements</span>
              <span>{formatCurrency(state.quality)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Administrative Costs</span>
              <span>{formatCurrency(state.admin)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
              <span>Potential Rebate</span>
              <span className={`font-semibold ${rebate > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {rebate > 0 ? formatCurrency(rebate) : '—'}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Breakdown</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {breakdown.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {(item.percent * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            When the loss ratio falls below the threshold, rebates must be issued to policyholders. Use this tool to stay ahead of compliance conversations.
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">12-Month Loss Ratio Trend</h2>
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">YTD</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5F5" opacity={darkMode ? 0.2 : 0.6} />
                <XAxis dataKey="month" stroke={darkMode ? '#94A3B8' : '#475569'} tickMargin={8} fontSize={12} />
                <YAxis
                  domain={[0.6, 1]}
                  tickFormatter={value => `${Math.round(value * 100)}%`}
                  stroke={darkMode ? '#94A3B8' : '#475569'}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Loss Ratio']}
                />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="threshold" stroke="#14B8A6" strokeDasharray="6 6" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comparisons</h2>
          <div className="mt-4 space-y-4">
            <ComparisonRow label="Industry Average" value={comparisons.industry} current={lossRatio} />
            <ComparisonRow label="Previous Quarter" value={comparisons.previousQuarter} current={lossRatio} />
            <ComparisonRow label="Annual Target" value={comparisons.annualTarget} current={lossRatio} />
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            Alerts trigger when the loss ratio drops more than 2 points below threshold. Current scenario is {lossRatio >= target ? 'stable' : 'at risk'}.
          </div>
        </div>
      </section>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Medical Loss Ratio (MLR)</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  MLR compares clinical spending plus quality improvements to premium revenue. Plans must spend a minimum share of premiums on members, or issue rebates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300"
              >
                ×
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• Individual plans must hit 80%; small group requirements vary by state.</li>
              <li>• Quality improvements can include care coordination, telehealth enablement, or health IT.</li>
              <li>• Administrative costs should trend down as care management improves.</li>
              <li>• Rebates are calculated on a rolling 3-year basis for most markets.</li>
            </ul>
            <div className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">Press Esc to close</div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  accent?: string
}

function MetricCard({ label, value, accent = 'text-slate-900' }: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 shadow-inner dark:bg-slate-800/70">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

interface NumberSliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  format: (value: number) => string
}

function NumberSlider({ label, min, max, step, value, onChange, format }: NumberSliderProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-500"
      />
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{format(value)}</span>
    </label>
  )
}

interface ReadOnlyInputProps {
  label: string
  value: string
}

function ReadOnlyInput({ label, value }: ReadOnlyInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</span>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </div>
    </label>
  )
}

interface ComparisonRowProps {
  label: string
  value: number
  current: number
}

function ComparisonRow({ label, value, current }: ComparisonRowProps) {
  const delta = (current - value) * 100
  const direction = delta >= 0 ? 'up' : 'down'
  const color = delta >= 0 ? 'text-emerald-600' : 'text-rose-600'

  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500">Benchmark {Math.round(value * 100)}%</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{(current * 100).toFixed(1)}%</p>
        <p className={`text-xs font-medium ${color}`}>
          {direction === 'up' ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} pts
        </p>
      </div>
    </div>
  )
}

function calcLossRatio(state: ScenarioState) {
  if (state.premium <= 0) return 0
  return Math.min(1, Math.max(0, (state.claims + state.quality) / state.premium))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function seedScenario(): ScenarioState {
  const premium = randomBetween(4_500_000, 7_500_000)
  const claims = premium * randomBetween(0.76, 0.86)
  const quality = premium * randomBetween(0.025, 0.045)
  const admin = Math.max(0, premium - claims - quality)
  return { premium, claims, quality, admin }
}

function randomScenario(premium: number): ScenarioState {
  const drift = premium * randomBetween(0.74, 0.88)
  const quality = premium * randomBetween(0.02, 0.05)
  const admin = Math.max(0, premium - drift - quality)
  return { premium, claims: drift, quality, admin }
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function seedHistory() {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  return months.map((month, index) => {
    const raw = 0.78 + Math.sin(index / 3) * 0.025 + (Math.random() - 0.5) * 0.015
    return {
      month,
      value: Math.min(1, Math.max(0.68, raw)),
    }
  })
}

function nextMonth(current?: string) {
  const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (!current) return 'Jan'
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

function exportScenario(state: ScenarioState, market: keyof typeof MARKET_CONFIG, lossRatio: number, threshold: number) {
  const rows = [
    ['Market', MARKET_CONFIG[market].label],
    ['Premium Revenue', formatCurrency(state.premium)],
    ['Medical Claims', formatCurrency(state.claims)],
    ['Quality Improvements', formatCurrency(state.quality)],
    ['Administrative Costs', formatCurrency(state.admin)],
    ['Loss Ratio', `${(lossRatio * 100).toFixed(1)}%`],
    ['Threshold', `${(threshold * 100).toFixed(1)}%`],
    ['Status', lossRatio >= threshold ? 'Compliant' : 'Non-Compliant'],
  ]
  const csv = rows.map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mlr-scenario-${market}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
