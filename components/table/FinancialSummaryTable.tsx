'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useExperienceData, useFinancialMetrics } from '@/lib/store/useAppStore'

interface TableRow {
  category: string
  dec2025: number | null
  jan2026: number | null
  feb2026: number | null
}

interface GroupConfig {
  name: string
  start: number
  end: number
}

interface ColumnFilter {
  [key: string]: string
}

interface SortState {
  column: string | null
  direction: 'asc' | 'desc' | null
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
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

const groups: GroupConfig[] = [
  { name: "Medical Claims", start: 0, end: 9 },
  { name: "Rx Claims", start: 10, end: 13 },
  { name: "Stop Loss", start: 14, end: 15 },
  { name: "Admin Fees", start: 16, end: 22 },
  { name: "Monthly Totals", start: 23, end: 24 },
  { name: "Counts & PEPM", start: 25, end: 32 },
  { name: "Variance Analysis", start: 33, end: 36 }
]

export default function FinancialSummaryTable() {
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  
  // Sample data - in production this would come from your data stores
  const sampleData: TableRow[] = [
    {"category": "Domestic Medical Facility Claims (IP/OP)", "dec2025": 2456789.45, "jan2026": 2589456.78, "feb2026": 2678934.56},
    {"category": "Non-Domestic Medical Claims (IP/OP)", "dec2025": 145678.90, "jan2026": 156789.45, "feb2026": null},
    {"category": "Total Hospital Medical Claims (IP/OP)", "dec2025": 2602468.35, "jan2026": 2746246.23, "feb2026": 2678934.56},
    {"category": "Non-Hospital Medical Claims", "dec2025": 987654.32, "jan2026": 1023456.78, "feb2026": 1056789.90},
    {"category": "Total All Medical Claims", "dec2025": 3590122.67, "jan2026": 3769703.01, "feb2026": 3735724.46},
    {"category": "UC Claims Settlement Adjustment", "dec2025": -45678.90, "jan2026": -38456.78, "feb2026": -41234.56},
    {"category": "Total Adjusted Medical Claims", "dec2025": 3544443.77, "jan2026": 3731246.23, "feb2026": 3694489.90},
    {"category": "Run Out Claims", "dec2025": 234567.89, "jan2026": null, "feb2026": 198765.43},
    {"category": "Medical Claims Paid via EBA", "dec2025": 89456.78, "jan2026": 92345.67, "feb2026": 94567.89},
    {"category": "Total Medical Claims", "dec2025": 3868468.44, "jan2026": 3823591.90, "feb2026": 3987823.22},
    {"category": "High Cost Claims paid via HMNH", "dec2025": 567890.12, "jan2026": 589456.78, "feb2026": 612345.67},
    {"category": "ESI Pharmacy Claims", "dec2025": 789456.23, "jan2026": 812345.67, "feb2026": 834567.89},
    {"category": "Total Rx Claims", "dec2025": 789456.23, "jan2026": 812345.67, "feb2026": 834567.89},
    {"category": "Rx Rebates", "dec2025": -123456.78, "jan2026": -134567.89, "feb2026": -145678.90},
    {"category": "Total Stop Loss Fees", "dec2025": 45678.90, "jan2026": 46789.12, "feb2026": 47890.23},
    {"category": "Stop Loss Reimbursement", "dec2025": -234567.89, "jan2026": -245678.90, "feb2026": -256789.12},
    {"category": "Consulting", "dec2025": 34567.89, "jan2026": 34567.89, "feb2026": 34567.89},
    {"category": "TPA Claims/COBRA Administration Fee (PEPM)", "dec2025": 23456.78, "jan2026": 24567.89, "feb2026": 25678.90},
    {"category": "Anthem JAA", "dec2025": 12345.67, "jan2026": 12456.78, "feb2026": 12567.89},
    {"category": "KPPC Fees", "dec2025": 8901.23, "jan2026": 9012.34, "feb2026": 9123.45},
    {"category": "KPCM Fees", "dec2025": 6789.12, "jan2026": 6890.23, "feb2026": 6991.34},
    {"category": "Optional ESI Programs", "dec2025": 4567.89, "jan2026": 4678.90, "feb2026": 4789.12},
    {"category": "Total Admin Fees", "dec2025": 90358.58, "jan2026": 92214.03, "feb2026": 94187.59},
    {"category": "MONTHLY CLAIMS AND EXPENSES", "dec2025": 4421036.37, "jan2026": 4362774.69, "feb2026": 4565134.01},
    {"category": "CUMULATIVE CLAIMS AND EXPENSES", "dec2025": 4421036.37, "jan2026": 8783811.06, "feb2026": 13348945.07},
    {"category": "EE COUNT (Active & COBRA)", "dec2025": 1250, "jan2026": 1248, "feb2026": 1252},
    {"category": "MEMBER COUNT", "dec2025": 3125, "jan2026": 3120, "feb2026": 3130},
    {"category": "PEPM NON-LAGGED ACTUAL", "dec2025": 3536.83, "jan2026": 3496.77, "feb2026": 3646.25},
    {"category": "PEPM NON-LAGGED CUMULATIVE", "dec2025": 3536.83, "jan2026": 3516.80, "feb2026": 3559.95},
    {"category": "INCURRED TARGET PEPM", "dec2025": 3450.00, "jan2026": 3450.00, "feb2026": 3450.00},
    {"category": "2025-2026 PEPM BUDGET (with 0% Margin)", "dec2025": 3500.00, "jan2026": 3500.00, "feb2026": 3500.00},
    {"category": "2025-2026 PEPM BUDGET x EE COUNTS", "dec2025": 4375000.00, "jan2026": 4368000.00, "feb2026": 4382000.00},
    {"category": "ANNUAL CUMULATIVE BUDGET", "dec2025": 4375000.00, "jan2026": 8743000.00, "feb2026": 13125000.00},
    {"category": "ACTUAL MONTHLY DIFFERENCE", "dec2025": 46036.37, "jan2026": -5225.31, "feb2026": 183134.01},
    {"category": "% DIFFERENCE (MONTHLY)", "dec2025": 1.05, "jan2026": -0.12, "feb2026": 4.18},
    {"category": "CUMULATIVE DIFFERENCE", "dec2025": 46036.37, "jan2026": 40811.06, "feb2026": 223945.07},
    {"category": "% DIFFERENCE (CUMULATIVE)", "dec2025": 1.05, "jan2026": 0.47, "feb2026": 1.71}
  ]

  const [originalData] = useState<TableRow[]>(sampleData)
  const [filteredData, setFilteredData] = useState<TableRow[]>(sampleData)
  const [currentSort, setCurrentSort] = useState<SortState>({ column: null, direction: null })
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({})
  const [globalSearch, setGlobalSearch] = useState('')
  const [showDerivedMetrics, setShowDerivedMetrics] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())
  const [tooltip, setTooltip] = useState<{ show: boolean; text: string; x: number; y: number }>({ 
    show: false, text: '', x: 0, y: 0 
  })

  const tableRef = useRef<HTMLDivElement>(null)

  const applyFilters = useCallback(() => {
    let filtered = [...originalData]
    
    // Apply global search
    if (globalSearch.trim()) {
      const term = globalSearch.toLowerCase()
      filtered = filtered.filter(row => 
        Object.values(row).some(value => {
          if (value === null || value === undefined) return false
          return value.toString().toLowerCase().includes(term)
        })
      )
    }
    
    // Apply column filters
    Object.keys(columnFilters).forEach(column => {
      const filter = columnFilters[column]
      if (!filter.trim()) return
      
      if (column === 'category') {
        filtered = filtered.filter(row => 
          row.category.toLowerCase().includes(filter.toLowerCase())
        )
      } else {
        filtered = filtered.filter(row => {
          const value = row[column as keyof TableRow]
          if (value === null || value === undefined) return false
          
          if (filter.startsWith('>=')) {
            const threshold = parseFloat(filter.substring(2))
            return !isNaN(threshold) && typeof value === 'number' && value >= threshold
          } else if (filter.startsWith('<=')) {
            const threshold = parseFloat(filter.substring(2))
            return !isNaN(threshold) && typeof value === 'number' && value <= threshold
          } else if (filter.startsWith('=')) {
            const threshold = parseFloat(filter.substring(1))
            return !isNaN(threshold) && typeof value === 'number' && Math.abs(value - threshold) < 0.01
          } else {
            return value.toString().toLowerCase().includes(filter.toLowerCase())
          }
        })
      }
    })
    
    // Apply sorting
    if (currentSort.direction && currentSort.column) {
      filtered.sort((a, b) => {
        const col = currentSort.column as keyof TableRow
        let aVal = a[col]
        let bVal = b[col]
        
        if (aVal === null || aVal === undefined) aVal = col === 'category' ? '' : -Infinity
        if (bVal === null || bVal === undefined) bVal = col === 'category' ? '' : -Infinity
        
        if (col === 'category') {
          aVal = aVal.toString().toLowerCase()
          bVal = bVal.toString().toLowerCase()
        }
        
        let result = 0
        if (aVal < bVal) result = -1
        else if (aVal > bVal) result = 1
        
        return currentSort.direction === 'desc' ? -result : result
      })
    }
    
    setFilteredData(filtered)
  }, [originalData, globalSearch, columnFilters, currentSort])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    
    if (currentSort.column === column) {
      if (currentSort.direction === 'asc') {
        direction = 'desc'
      } else if (currentSort.direction === 'desc') {
        direction = null
      }
    }
    
    setCurrentSort({ column: direction ? column : null, direction })
  }

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => {
      if (!value.trim()) {
        const newFilters = { ...prev }
        delete newFilters[column]
        return newFilters
      }
      return { ...prev, [column]: value }
    })
  }

  const toggleGroup = (groupIndex: number) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupIndex)) {
        newSet.delete(groupIndex)
      } else {
        newSet.add(groupIndex)
      }
      return newSet
    })
  }

  const calculateDerivedMetrics = (row: TableRow) => {
    const jan = row.jan2026
    const dec = row.dec2025
    
    if (jan !== null && jan !== undefined && dec !== null && dec !== undefined) {
      const delta = jan - dec
      const percent = (delta / Math.abs(dec)) * 100
      return { delta, percent }
    }
    
    return { delta: null, percent: null }
  }

  const showTooltip = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      show: true,
      text,
      x: rect.left,
      y: rect.top - 40
    })
  }

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, show: false }))
  }

  const exportCSV = () => {
    const headers = ['Cost Category', 'Dec 2025', 'Jan 2026', 'Feb 2026']
    if (showDerivedMetrics) {
      headers.push('MoM Δ', '%Δ MoM')
    }
    
    let csv = headers.join(',') + '\n'
    
    filteredData.forEach(row => {
      const values = [
        `"${row.category}"`,
        row.dec2025?.toString() ?? '',
        row.jan2026?.toString() ?? '',
        row.feb2026?.toString() ?? ''
      ]
      
      if (showDerivedMetrics) {
        const { delta, percent } = calculateDerivedMetrics(row)
        values.push(delta?.toString() ?? '', percent ? percent.toFixed(2) : '')
      }
      
      csv += values.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-claims-data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (originalData.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No financial data available. Upload the template to populate this summary.
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Financial Benefits Claims Analysis
        </h1>
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search all data..."
                aria-label="Global search"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowDerivedMetrics(!showDerivedMetrics)}
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
      </div>

      {/* Table Container */}
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
                    onChange={(e) => handleColumnFilter('category', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              
              {['dec2025', 'jan2026', 'feb2026'].map((column) => (
                <th
                  key={column}
                  className="text-right p-4 font-semibold text-gray-900 min-w-32 cursor-pointer hover:bg-gray-50 transition-colors border-r border-gray-200"
                  onClick={() => handleSort(column)}
                  tabIndex={0}
                  role="columnheader"
                  aria-sort={currentSort.column === column ? currentSort.direction || 'none' : 'none'}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{column.replace(/(\d{4})/, ' $1')}</span>
                    <div className="flex flex-col text-xs text-gray-400">
                      <span className={currentSort.column === column && currentSort.direction === 'asc' ? 'text-blue-600' : ''}>▲</span>
                      <span className={currentSort.column === column && currentSort.direction === 'desc' ? 'text-blue-600' : ''}>▼</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=">=, <=, = value"
                      onChange={(e) => handleColumnFilter(column, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
              ))}
              
              {showDerivedMetrics && (
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
              let currentGroupIndex = 0
              const rows: JSX.Element[] = []
              
              filteredData.forEach((row, dataIndex) => {
                const originalIndex = originalData.indexOf(row)
                
                // Add group headers
                while (currentGroupIndex < groups.length && 
                       originalIndex >= groups[currentGroupIndex].start && 
                       originalIndex <= groups[currentGroupIndex].end) {
                  
                  if (originalIndex === groups[currentGroupIndex].start) {
                    const group = groups[currentGroupIndex]
                    const isCollapsed = collapsedGroups.has(currentGroupIndex)
                    const colspan = showDerivedMetrics ? 6 : 4
                    
                    rows.push(
                      <tr key={`group-${currentGroupIndex}`} className="bg-gradient-to-r from-blue-50 to-white border-t-2 border-blue-200">
                        <td colSpan={colspan} className="p-3">
                          <button
                            type="button"
                            onClick={() => toggleGroup(currentGroupIndex)}
                            className="flex items-center gap-2 w-full text-left font-medium text-blue-900 hover:text-blue-700 transition-colors"
                            aria-expanded={!isCollapsed}
                          >
                            <span className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                            <span>{group.name}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  }
                  break
                }
                
                if (currentGroupIndex < groups.length - 1 && 
                    originalIndex > groups[currentGroupIndex].end) {
                  currentGroupIndex++
                  
                  if (originalIndex === groups[currentGroupIndex].start) {
                    const group = groups[currentGroupIndex]
                    const isCollapsed = collapsedGroups.has(currentGroupIndex)
                    const colspan = showDerivedMetrics ? 6 : 4
                    
                    rows.push(
                      <tr key={`group-${currentGroupIndex}`} className="bg-gradient-to-r from-blue-50 to-white border-t-2 border-blue-200">
                        <td colSpan={colspan} className="p-3">
                          <button
                            type="button"
                            onClick={() => toggleGroup(currentGroupIndex)}
                            className="flex items-center gap-2 w-full text-left font-medium text-blue-900 hover:text-blue-700 transition-colors"
                            aria-expanded={!isCollapsed}
                          >
                            <span className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                            <span>{group.name}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  }
                }
                
                // Determine group visibility
                let groupIndex = -1
                for (let i = 0; i < groups.length; i++) {
                  if (originalIndex >= groups[i].start && originalIndex <= groups[i].end) {
                    groupIndex = i
                    break
                  }
                }
                
                const isHidden = groupIndex >= 0 && collapsedGroups.has(groupIndex)
                const { delta, percent } = calculateDerivedMetrics(row)
                
                if (!isHidden) {
                  rows.push(
                    <tr key={`row-${originalIndex}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td 
                        className="p-4 bg-white border-r border-gray-200 sticky left-0 font-medium text-gray-900"
                        onMouseEnter={(e) => {
                          const hasAcronym = Object.keys(acronyms).some(acronym => row.category.includes(acronym))
                          if (hasAcronym) {
                            const tooltip = Object.keys(acronyms).find(acronym => row.category.includes(acronym))
                            if (tooltip) showTooltip(e, acronyms[tooltip])
                          }
                        }}
                        onMouseLeave={hideTooltip}
                      >
                        {row.category}
                      </td>
                      
                      {['dec2025', 'jan2026', 'feb2026'].map((column) => {
                        const value = row[column as keyof TableRow]
                        return (
                          <td key={column} className="p-4 text-right tabular-nums border-r border-gray-200">
                            {value === null || value === undefined ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={typeof value === 'number' && value < 0 ? 'text-red-600' : 'text-gray-900'}>
                                {typeof value === 'number' ? currencyFormatter.format(value) : value}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      
                      {showDerivedMetrics && (
                        <>
                          <td className="p-4 text-right tabular-nums border-r border-gray-200">
                            {delta === null ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={delta < 0 ? 'text-red-600' : 'text-gray-900'}>
                                {currencyFormatter.format(delta)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right tabular-nums border-r border-gray-200">
                            {percent === null ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={percent < 0 ? 'text-red-600' : 'text-gray-900'}>
                                {percent.toFixed(2)}%
                              </span>
                            )}
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

      {/* Footer Totals */}
      <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4">
        <div className="flex gap-8 text-sm">
          {['dec2025', 'jan2026', 'feb2026'].map((column) => {
            const total = filteredData.reduce((sum, row) => {
              const value = row[column as keyof TableRow]
              if (typeof value === 'number') return sum + value
              return sum
            }, 0)
            
            return (
              <div key={column} className="text-center">
                <div className="font-medium text-gray-600 uppercase text-xs">
                  {column.replace(/(\d{4})/, ' $1')}
                </div>
                <div className="font-bold text-gray-900">
                  {currencyFormatter.format(total)}
                </div>
              </div>
            )
          })}
          <div className="text-center">
            <div className="font-medium text-gray-600 uppercase text-xs">Rows</div>
            <div className="font-bold text-gray-900">{filteredData.length}</div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
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