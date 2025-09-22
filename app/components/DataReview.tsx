'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ClaimRecord, ValidationError, FieldMapping } from '@/app/types/claims'

interface DataReviewProps {
  claims: ClaimRecord[]
  errors: ValidationError[]
  mapping: FieldMapping
  onMappingChange?: (mapping: FieldMapping) => void
  onExport?: (format: 'csv' | 'json') => void
}

interface VirtualizedTableProps {
  data: any[]
  columns: Array<{
    key: string
    header: string
    width: number
    render?: (value: any, row: any) => React.ReactNode
  }>
  height: number
  rowHeight: number
}

function VirtualizedTable({ data, columns, height, rowHeight }: VirtualizedTableProps) {
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
          {columns.map((column) => (
            <div
              key={column.key}
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
              style={{ width: column.width, minWidth: column.width }}
            >
              {column.header}
            </div>
          ))}
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
  onMappingChange,
  onExport 
}: DataReviewProps) {
  const [currentView, setCurrentView] = useState<'data' | 'errors' | 'mapping'>('data')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Memoized filtered and sorted data
  const processedClaims = useMemo(() => {
    let filtered = claims

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = claims.filter(claim =>
        claim.claimantId.toLowerCase().includes(term) ||
        claim.serviceType.toLowerCase().includes(term) ||
        (claim.provider && claim.provider.toLowerCase().includes(term)) ||
        (claim.icdCode && claim.icdCode.toLowerCase().includes(term))
      )
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
  }, [claims, searchTerm, sortConfig])

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
    },
    {
      key: 'claimDate',
      header: 'Claim Date',
      width: 100,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'serviceType',
      header: 'Service Type',
      width: 120,
    },
    {
      key: 'medicalAmount',
      header: 'Medical',
      width: 100,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'pharmacyAmount',
      header: 'Pharmacy',
      width: 100,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'totalAmount',
      header: 'Total',
      width: 100,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'icdCode',
      header: 'ICD Code',
      width: 80,
    },
    {
      key: 'provider',
      header: 'Provider',
      width: 150,
    },
    {
      key: 'location',
      header: 'Location',
      width: 100,
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
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder={`Search ${currentView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {currentView === 'data' ? processedClaims.length : errors.length} items
          </div>
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