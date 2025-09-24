'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMonths, useFeesByMonth, useAppStore } from '@/lib/store/useAppStore'
import { FeesRowSchema } from '@/lib/schemas/fees'

interface FeesGridProps {
  onDataChange?: (isValid: boolean, totalMonths: number) => void
}

export default function FeesGrid({ onDataChange }: FeesGridProps) {
  const months = useMonths()
  const existingFees = useFeesByMonth()
  const { upsertFees, resetFees } = useAppStore()
  
  const [gridData, setGridData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize grid data from existing fees
  useEffect(() => {
    const initialData: Record<string, any> = {}
    months.forEach(month => {
      const existing = existingFees[month]
      initialData[month] = {
        month,
        tpaFee: existing?.tpaFee ?? 0,
        networkFee: existing?.networkFee ?? 0,
        stopLossPremium: existing?.stopLossPremium ?? 0,
        otherFees: existing?.otherFees ?? 0,
      }
    })
    setGridData(initialData)
  }, [months, existingFees])

  // Validate data and notify parent
  useEffect(() => {
    const validCount = months.filter(month => {
      const fees = gridData[month]
      if (!fees) return false
      
      try {
        FeesRowSchema.parse(fees)
        return true
      } catch {
        return false
      }
    }).length
    
    onDataChange?.(validCount === months.length, validCount)
  }, [gridData, months, onDataChange])

  const updateCell = useCallback((month: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setGridData(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: numValue,
      }
    }))
    
    // Clear error for this cell
    const errorKey = `${month}-${field}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
    
    setHasChanges(true)
  }, [errors])

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {}
    let validCount = 0
    
    months.forEach(month => {
      const fees = gridData[month]
      if (!fees) return
      
      try {
        const validated = FeesRowSchema.parse(fees)
        upsertFees(validated)
        validCount++
      } catch (error: any) {
        const issues = error.issues || [{ path: ['unknown'], message: error.message }]
        issues.forEach((issue: any) => {
          const field = issue.path[0]
          newErrors[`${month}-${field}`] = issue.message
        })
      }
    })
    
    setErrors(newErrors)
    setHasChanges(false)
    
    return validCount === months.length
  }

  const handleReset = () => {
    resetFees()
    const resetData: Record<string, any> = {}
    months.forEach(month => {
      resetData[month] = {
        month,
        tpaFee: 0,
        networkFee: 0,
        stopLossPremium: 0,
        otherFees: 0,
      }
    })
    setGridData(resetData)
    setErrors({})
    setHasChanges(false)
  }

  // Handle paste from Excel
  const handlePaste = useCallback((event: React.ClipboardEvent, startMonth: string, startField: string) => {
    event.preventDefault()
    
    const pastedText = event.clipboardData.getData('text')
    const rows = pastedText.split('\n').filter(row => row.trim())
    const fields = ['tpaFee', 'networkFee', 'stopLossPremium', 'otherFees']
    
    const startMonthIndex = months.indexOf(startMonth)
    const startFieldIndex = fields.indexOf(startField)
    
    if (startMonthIndex === -1 || startFieldIndex === -1) return
    
    rows.forEach((row, rowIndex) => {
      const cells = row.split('\t')
      const monthIndex = startMonthIndex + rowIndex
      
      if (monthIndex >= months.length) return
      
      const month = months[monthIndex]
      const newRowData = { ...gridData[month] }
      
      cells.forEach((cell, cellIndex) => {
        const fieldIndex = startFieldIndex + cellIndex
        if (fieldIndex >= fields.length) return
        
        const field = fields[fieldIndex]
        const value = parseFloat(cell.replace(/[,$]/g, '')) || 0
        newRowData[field] = value
      })
      
      setGridData(prev => ({ ...prev, [month]: newRowData }))
    })
    
    setHasChanges(true)
  }, [months, gridData])

  const getMonthTotal = (month: string) => {
    const fees = gridData[month]
    if (!fees) return 0
    return fees.tpaFee + fees.networkFee + fees.stopLossPremium + fees.otherFees
  }

  const getColumnTotal = (field: string) => {
    return months.reduce((sum, month) => {
      const fees = gridData[month]
      return sum + (fees?.[field] || 0)
    }, 0)
  }

  const getGrandTotal = () => {
    return months.reduce((sum, month) => sum + getMonthTotal(month), 0)
  }

  if (months.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No months available. Please upload experience data first.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Instructions
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Enter monthly fees for each category and month</li>
          <li>• You can paste from Excel by selecting a cell and using Ctrl+V</li>
          <li>• All values must be non-negative numbers</li>
          <li>• Totals are calculated automatically</li>
        </ul>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                Month
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                TPA Fee
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                Network Fee
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                Stop Loss Premium
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                Other Fees
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                Monthly Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {months.map((month) => (
              <tr key={month} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {month}
                </td>
                {['tpaFee', 'networkFee', 'stopLossPremium', 'otherFees'].map((field) => {
                  const errorKey = `${month}-${field}`
                  const hasError = !!errors[errorKey]
                  
                  return (
                    <td key={field} className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={gridData[month]?.[field] || 0}
                        onChange={(e) => updateCell(month, field, e.target.value)}
                        onPaste={(e) => handlePaste(e, month, field)}
                        className={`
                          w-full px-2 py-1 text-sm text-right border rounded
                          ${hasError 
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                            : 'border-gray-300 dark:border-gray-600'
                          }
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          dark:bg-gray-700 dark:text-gray-100
                        `}
                        title={hasError ? errors[errorKey] : undefined}
                      />
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                  ${getMonthTotal(month).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                Total
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                ${getColumnTotal('tpaFee').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                ${getColumnTotal('networkFee').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                ${getColumnTotal('stopLossPremium').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                ${getColumnTotal('otherFees').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                ${getGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          Reset All Fees
        </button>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              You have unsaved changes
            </span>
          )}
          <button
            onClick={validateAndSave}
            disabled={!hasChanges}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Save Fees
          </button>
        </div>
      </div>
      
      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}