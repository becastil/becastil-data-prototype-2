'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { ClaimRecord, ValidationError, FieldMapping, DataQualityStats } from '@/app/types/claims'

interface DataReviewProps {
  claims: ClaimRecord[]
  errors: ValidationError[]
  mapping: FieldMapping
  stats?: DataQualityStats
  onMappingChange?: (mapping: FieldMapping) => void
  onExport?: (format: 'csv' | 'json') => void
}

interface ClaimFilters {
  startDate: string
  endDate: string
  providers: string[]
  serviceTypes: string[]
  minAmount: string
  maxAmount: string
}

interface VirtualizedTableProps {
  data: any[]
  columns: Array<{
    key: string
    header: string
    width: number
    render?: (value: any, row: any) => React.ReactNode
    sortable?: boolean
  }>
  height: number
  rowHeight: number
  onSort?: (key: string) => void
  sortConfig?: {
    key: string
    direction: 'asc' | 'desc'
  } | null
}

function VirtualizedTable({ data, columns, height, rowHeight, onSort, sortConfig }: VirtualizedTableProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const visibleRowCount = Math.ceil(height / rowHeight)
  const totalHeight = data.length * rowHeight
  const startIndex = Math.floor(scrollTop / rowHeight)
  const endIndex = Math.min(startIndex + visibleRowCount + 1, data.length)
  const visibleData = data.slice(startIndex, endIndex)
  const offsetY = startIndex * rowHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
        <div className="flex">
          {columns.map((column) => {
            const isSorted = sortConfig?.key === column.key
            const direction = isSorted ? sortConfig?.direction : undefined
            return (
              <div
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400 last:border-r-0"
                style={{ width: column.width, minWidth: column.width }}
              >
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                      isSorted ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <span>{column.header}</span>
                    <span className="inline-flex h-3 w-3 items-center justify-center">
                      <svg className="h-3 w-3 text-current" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          className={direction === 'desc' ? 'opacity-40' : 'opacity-100'}
                          d="M10 4l4 6H6l4-6z"
                        />
                        <path
                          className={direction === 'asc' ? 'opacity-40' : 'opacity-100'}
                          d="M10 16l-4-6h8l-4 6z"
                        />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <span>{column.header}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Scrollable Body */}
      <div
        ref={scrollElementRef}
        className="overflow-auto bg-white dark:bg-gray-900"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleData.map((row, index) => {
              const actualIndex = startIndex + index
              return (
                <div
                  key={actualIndex}
                  className={`flex ${
                    actualIndex % 2 === 0 
                      ? 'bg-white dark:bg-gray-900' 
                      : 'bg-gray-50 dark:bg-gray-800'
                  } hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                  style={{ height: rowHeight }}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0 overflow-hidden"
                      style={{ 
                        width: column.width, 
                        minWidth: column.width,
                        lineHeight: `${rowHeight - 16}px`
                      }}
                      title={String(row[column.key] || '')}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')
                      }
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DataReview({ 
  claims, 
  errors, 
  mapping, 
  stats,
  onMappingChange,
  onExport 
}: DataReviewProps) {
  const [currentView, setCurrentView] = useState<'data' | 'errors' | 'mapping'>('data')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ClaimFilters>({
    startDate: '',
    endDate: '',
    providers: [],
    serviceTypes: [],
    minAmount: '',
    maxAmount: ''
  })

  const providerOptions = useMemo(() => {
    const values = new Set<string>()
    claims.forEach((claim) => {
      const provider = claim.provider && claim.provider.trim().length > 0 ? claim.provider.trim() : 'Unknown Provider'
      values.add(provider)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [claims])

  const serviceTypeOptions = useMemo(() => {
    const values = new Set<string>()
    claims.forEach((claim) => {
      if (claim.serviceType) {
        values.add(claim.serviceType)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [claims])

  const amountBounds = useMemo(() => {
    if (claims.length === 0) {
      return { min: 0, max: 0 }
    }

    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY

    claims.forEach((claim) => {
      const total = typeof claim.totalAmount === 'number' && !Number.isNaN(claim.totalAmount)
        ? claim.totalAmount
        : (claim.medicalAmount || 0) + (claim.pharmacyAmount || 0)
      if (total < min) min = total
      if (total > max) max = total
    })

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: 0, max: 0 }
    }

    return {
      min: Math.max(Math.floor(min), 0),
      max: Math.ceil(max)
    }
  }, [claims])

  const filtersApplied = Boolean(
    filters.startDate ||
    filters.endDate ||
    filters.providers.length ||
    filters.serviceTypes.length ||
    filters.minAmount ||
    filters.maxAmount
  )

  const toggleProvider = useCallback((value: string) => {
    setFilters((prev) => {
      const exists = prev.providers.includes(value)
      return {
        ...prev,
        providers: exists
          ? prev.providers.filter((provider) => provider !== value)
          : [...prev.providers, value]
      }
    })
  }, [])

  const toggleServiceType = useCallback((value: string) => {
    setFilters((prev) => {
      const exists = prev.serviceTypes.includes(value)
      return {
        ...prev,
        serviceTypes: exists
          ? prev.serviceTypes.filter((service) => service !== value)
          : [...prev.serviceTypes, value]
      }
    })
  }, [])

  const removeProvider = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      providers: prev.providers.filter((provider) => provider !== value)
    }))
  }, [])

  const removeServiceType = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.filter((service) => service !== value)
    }))
  }, [])

  const clearMinAmount = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      minAmount: ''
    }))
  }, [])

  const clearMaxAmount = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      maxAmount: ''
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      providers: [],
      serviceTypes: [],
      minAmount: '',
      maxAmount: ''
    })
  }, [])

  const clearDateFilter = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      startDate: '',
      endDate: ''
    }))
  }, [])

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove?: () => void }> = []

    if (filters.startDate || filters.endDate) {
      const startLabel = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Any'
      const endLabel = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Any'
      chips.push({
        key: 'date-range',
        label: `Date: ${startLabel} → ${endLabel}`,
        onRemove: clearDateFilter,
      })
    }

    filters.providers.forEach((provider) => {
      chips.push({
        key: `provider-${provider}`,
        label: `Provider: ${provider}`,
        onRemove: () => removeProvider(provider)
      })
    })

    filters.serviceTypes.forEach((serviceType) => {
      chips.push({
        key: `service-${serviceType}`,
        label: `Service: ${serviceType}`,
        onRemove: () => removeServiceType(serviceType)
      })
    })

    if (filters.minAmount) {
      chips.push({
        key: 'min-amount',
        label: `Min Total ≥ $${Number(filters.minAmount).toLocaleString()}`,
        onRemove: clearMinAmount
      })
    }

    if (filters.maxAmount) {
      chips.push({
        key: 'max-amount',
        label: `Max Total ≤ $${Number(filters.maxAmount).toLocaleString()}`,
        onRemove: clearMaxAmount
      })
    }

    return chips
  }, [filters, removeProvider, removeServiceType, clearMinAmount, clearMaxAmount, clearDateFilter])

  const activeFilterCount = activeFilterChips.length

  const errorRatePercent = claims.length > 0 ? (errors.length / claims.length) * 100 : 0
  const completenessPercent = stats?.dataCompleteness ?? Math.max(0, 100 - errorRatePercent)

  const dataQualityBadges = useMemo(() => {
    const badges: Array<{ tone: 'positive' | 'caution' | 'critical' | 'neutral'; title: string; detail: string }> = []

    if (completenessPercent >= 95) {
      badges.push({
        tone: 'positive',
        title: 'Excellent completeness',
        detail: `${completenessPercent.toFixed(1)}% fields populated`,
      })
    } else if (completenessPercent >= 85) {
      badges.push({
        tone: 'neutral',
        title: 'Solid coverage',
        detail: `${completenessPercent.toFixed(1)}% completeness`,
      })
    } else {
      badges.push({
        tone: 'caution',
        title: 'Incomplete dataset',
        detail: `${completenessPercent.toFixed(1)}% completeness`,
      })
    }

    if (errorRatePercent <= 2) {
      badges.push({
        tone: 'positive',
        title: 'Clean validation',
        detail: `${errorRatePercent.toFixed(1)}% error rate`,
      })
    } else if (errorRatePercent <= 5) {
      badges.push({
        tone: 'neutral',
        title: 'Minor corrections needed',
        detail: `${errorRatePercent.toFixed(1)}% error rate`,
      })
    } else {
      badges.push({
        tone: 'critical',
        title: 'Requires review',
        detail: `${errorRatePercent.toFixed(1)}% validation errors`,
      })
    }

    if (stats) {
      if (stats.duplicateIds > 0) {
        badges.push({
          tone: 'caution',
          title: 'Duplicate members detected',
          detail: `${stats.duplicateIds} potential duplicates`,
        })
      }

      const missingRequiredTotal = Object.values(stats.missingRequired ?? {}).reduce((sum, value) => sum + (value || 0), 0)
      if (missingRequiredTotal > 0) {
        badges.push({
          tone: 'critical',
          title: 'Missing required fields',
          detail: `${missingRequiredTotal} fields need mapping`,
        })
      }
    }

    return badges
  }, [completenessPercent, errorRatePercent, stats])

  const badgeClasses: Record<'positive' | 'caution' | 'critical' | 'neutral', string> = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/40',
    caution: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/40',
    critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/40',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700/60',
  }

  // Memoized filtered and sorted data
  const processedClaims = useMemo(() => {
    let filtered = claims

    // Apply search filter across key fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(claim =>
        claim.claimantId.toLowerCase().includes(term) ||
        claim.serviceType.toLowerCase().includes(term) ||
        (claim.provider && claim.provider.toLowerCase().includes(term)) ||
        (claim.icdCode && claim.icdCode.toLowerCase().includes(term))
      )
    }

    const startDate = filters.startDate ? new Date(filters.startDate) : null
    const endDate = filters.endDate ? new Date(filters.endDate) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    if (endDate) endDate.setHours(23, 59, 59, 999)
    const providerSet = new Set(filters.providers)
    const serviceTypeSet = new Set(filters.serviceTypes)

    const parseAmount = (value: string) => {
      if (!value) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    const minAmount = parseAmount(filters.minAmount)
    const maxAmount = parseAmount(filters.maxAmount)

    const shouldFilterByAmount = minAmount !== null || maxAmount !== null
    const shouldFilterByDate = Boolean(startDate || endDate)
    const shouldFilterByProvider = providerSet.size > 0
    const shouldFilterByService = serviceTypeSet.size > 0

    if (shouldFilterByDate || shouldFilterByProvider || shouldFilterByService || shouldFilterByAmount) {
      filtered = filtered.filter((claim) => {
        const claimDate = new Date(claim.claimDate)
        if (startDate && claimDate < startDate) {
          return false
        }
        if (endDate && claimDate > endDate) {
          return false
        }

        if (shouldFilterByProvider) {
          const providerName = claim.provider && claim.provider.trim().length > 0 ? claim.provider.trim() : 'Unknown Provider'
          if (!providerSet.has(providerName)) {
            return false
          }
        }

        if (shouldFilterByService && !serviceTypeSet.has(claim.serviceType)) {
          return false
        }

        if (shouldFilterByAmount) {
          const totalAmount = typeof claim.totalAmount === 'number' && !Number.isNaN(claim.totalAmount)
            ? claim.totalAmount
            : (claim.medicalAmount || 0) + (claim.pharmacyAmount || 0)

          if (minAmount !== null && totalAmount < minAmount) {
            return false
          }
          if (maxAmount !== null && totalAmount > maxAmount) {
            return false
          }
        }

        return true
      })
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof ClaimRecord]
        const bValue = b[sortConfig.key as keyof ClaimRecord]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue
        }
        
        return 0
      })
    }

    return filtered
  }, [claims, searchTerm, filters, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const dataColumns = [
    {
      key: 'claimantId',
      header: 'Claimant ID',
      width: 120,
      sortable: true,
    },
    {
      key: 'claimDate',
      header: 'Claim Date',
      width: 100,
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'serviceType',
      header: 'Service Type',
      width: 120,
      sortable: true,
    },
    {
      key: 'medicalAmount',
      header: 'Medical',
      width: 100,
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'pharmacyAmount',
      header: 'Pharmacy',
      width: 100,
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'totalAmount',
      header: 'Total',
      width: 100,
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'icdCode',
      header: 'ICD Code',
      width: 80,
      sortable: true,
    },
    {
      key: 'provider',
      header: 'Provider',
      width: 150,
      sortable: true,
    },
    {
      key: 'location',
      header: 'Location',
      width: 100,
      sortable: true,
    }
  ]

  const errorColumns = [
    {
      key: 'row',
      header: 'Row',
      width: 80,
    },
    {
      key: 'field',
      header: 'Field',
      width: 120,
    },
    {
      key: 'value',
      header: 'Value',
      width: 150,
      render: (value: any) => String(value || '')
    },
    {
      key: 'message',
      header: 'Error Message',
      width: 300,
    },
    {
      key: 'severity',
      header: 'Severity',
      width: 100,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'error' 
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
          {value}
        </span>
      )
    }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Data Review
        </h2>
        <div className="flex items-center space-x-3">
          {onExport && (
            <>
              <button
                onClick={() => onExport('csv')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Export CSV
              </button>
              <button
                onClick={() => onExport('json')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Claims</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {claims.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Errors</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {errors.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {claims.length > 0 ? ((errors.length / claims.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(claims.reduce((sum, claim) => sum + claim.totalAmount, 0))}
          </div>
        </div>
      </div>

      {dataQualityBadges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {dataQualityBadges.map((badge, index) => (
            <span
              key={`${badge.title}-${index}`}
              className={`inline-flex flex-col rounded-2xl border px-4 py-3 text-sm font-semibold leading-tight shadow-sm ${badgeClasses[badge.tone]}`}
            >
              {badge.title}
              <span className="text-xs font-normal text-inherit/80">{badge.detail}</span>
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'data' as const, label: 'Claims Data', count: processedClaims.length },
            { key: 'errors' as const, label: 'Validation Errors', count: errors.length },
            { key: 'mapping' as const, label: 'Field Mapping', count: null }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentView(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs">
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      {(currentView === 'data' || currentView === 'errors') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] max-w-md">
              <input
                type="text"
                placeholder={`Search ${currentView}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-500 transition focus:border-blue-500 focus:ring focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              />
            </div>

            {currentView === 'data' && (
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  showFilters
                    ? 'border-blue-500 bg-blue-50 text-blue-600 focus:ring-blue-200 dark:border-blue-500/60 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 focus:ring-blue-200 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-200'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
                </svg>
                Advanced filters
                {filtersApplied && (
                  <span className="flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              Showing {currentView === 'data' ? processedClaims.length : errors.length} items
            </div>
          </div>

          {currentView === 'data' && showFilters && (
            <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date range</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Start</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        max={filters.endDate || undefined}
                        onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">End</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        min={filters.startDate || undefined}
                        onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Service types</p>
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    {serviceTypeOptions.length > 0 ? (
                      <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {serviceTypeOptions.map((serviceType) => {
                          const checked = filters.serviceTypes.includes(serviceType)
                          return (
                            <label
                              key={serviceType}
                              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs sm:text-sm ${checked ? 'bg-blue-50/70 dark:bg-blue-900/30' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleServiceType(serviceType)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate text-gray-700 dark:text-gray-200" title={serviceType}>
                                {serviceType}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">No service types detected</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Providers</p>
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    {providerOptions.length > 0 ? (
                      <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {providerOptions.map((provider) => {
                          const checked = filters.providers.includes(provider)
                          return (
                            <label
                              key={provider}
                              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs sm:text-sm ${checked ? 'bg-blue-50/70 dark:bg-blue-900/30' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProvider(provider)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate text-gray-700 dark:text-gray-200" title={provider}>
                                {provider}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">No provider values detected</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total amount</p>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Minimum</label>
                      <input
                        type="number"
                        min={0}
                        max={amountBounds.max || undefined}
                        value={filters.minAmount}
                        onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                        placeholder={amountBounds.min ? amountBounds.min.toLocaleString() : '0'}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Maximum</label>
                      <input
                        type="number"
                        min={0}
                        max={amountBounds.max ? amountBounds.max * 2 : undefined}
                        value={filters.maxAmount}
                        onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                        placeholder={amountBounds.max ? amountBounds.max.toLocaleString() : '250000'}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                    Observed range: ${amountBounds.min.toLocaleString()} – ${amountBounds.max.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Filters apply instantly</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300"
                  >
                    Reset filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="rounded-full border border-blue-500 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Hide panel
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'data' && filtersApplied && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/40 dark:text-blue-200"
                >
                  {chip.label}
                  {chip.onRemove && (
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      className="rounded-full p-1 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700 dark:text-blue-200 dark:hover:bg-blue-800/60"
                    >
                      <span className="sr-only">Remove filter</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </span>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/40"
              >
                Clear all
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {currentView === 'data' && (
          <VirtualizedTable
            data={processedClaims}
            columns={dataColumns}
            height={600}
            rowHeight={40}
            onSort={handleSort}
            sortConfig={sortConfig}
          />
        )}

        {currentView === 'errors' && (
          <VirtualizedTable
            data={errors}
            columns={errorColumns}
            height={600}
            rowHeight={40}
          />
        )}

        {currentView === 'mapping' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Field Mapping Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(mapping).map(([field, mappedColumn]) => (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    value={mappedColumn || ''}
                    onChange={(e) => {
                      if (onMappingChange) {
                        onMappingChange({
                          ...mapping,
                          [field]: e.target.value
                        })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Column name for ${field}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
