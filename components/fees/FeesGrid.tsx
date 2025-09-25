'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMonths, useFeesByMonth, useAppStore } from '@/lib/store/useAppStore'
import { FeesRowSchema, type FeesRow } from '@/lib/schemas/fees'

const feeFields = ['tpaFee', 'networkFee', 'stopLossPremium', 'otherFees'] as const
type FeeField = (typeof feeFields)[number]

interface FeesGridProps {
  onDataChange?: (isValid: boolean, totalMonths: number) => void
}

export default function FeesGrid({ onDataChange }: FeesGridProps) {
  const months = useMonths()
  const existingFees = useFeesByMonth()
  const { upsertFees, resetFees } = useAppStore()
  
  const [gridData, setGridData] = useState<Record<string, FeesRow>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasUserEdited, setHasUserEdited] = useState(false)

  // Initialize grid data from existing fees
  useEffect(() => {
    setGridData(prev => {
      const initialData: Record<string, FeesRow> = {}

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

      const isSame = months.every(month => {
        const current = prev[month]
        const next = initialData[month]
        if (!current || !next) return false
        return (
          current.month === next.month &&
          current.tpaFee === next.tpaFee &&
          current.networkFee === next.networkFee &&
          current.stopLossPremium === next.stopLossPremium &&
          current.otherFees === next.otherFees
        )
      }) && Object.keys(prev).length === months.length

      return isSame ? prev : initialData
    })

    const hasStoredFees = months.some(month => !!existingFees[month])
    setHasUserEdited(hasStoredFees)
  }, [months, existingFees])

  // Validate data and notify parent
  useEffect(() => {
    if (months.length === 0) {
      setErrors({})
      onDataChange?.(false, 0)
      return
    }

    const newErrors: Record<string, string> = {}
    const validRows: FeesRow[] = []

    months.forEach(month => {
      const fees = gridData[month]
      if (!fees) return

      const result = FeesRowSchema.safeParse(fees)
      if (result.success) {
        validRows.push(result.data)
      } else if (result.error) {
        result.error.issues.forEach(issue => {
          const field = issue.path[0]
          if (typeof field === 'string') {
            newErrors[`${month}-${field}`] = issue.message
          }
        })
      }
    })

    setErrors(newErrors)

    const rowsToUpsert = validRows.filter(row => {
      const existing = existingFees[row.month]
      if (!existing) return true
      return (
        existing.tpaFee !== row.tpaFee ||
        existing.networkFee !== row.networkFee ||
        existing.stopLossPremium !== row.stopLossPremium ||
        existing.otherFees !== row.otherFees
      )
    })

    if (rowsToUpsert.length > 0 && Object.keys(newErrors).length === 0 && hasUserEdited) {
      rowsToUpsert.forEach(row => upsertFees(row))
    }

    const savedCount = months.filter(month => !!existingFees[month]).length
    onDataChange?.(validRows.length === months.length, savedCount)
  }, [gridData, months, existingFees, hasUserEdited, onDataChange, upsertFees])

  const updateCell = useCallback((month: string, field: FeeField, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setGridData(prev => ({
      ...prev,
      [month]: {
        ...(prev[month] ?? {
          month,
          tpaFee: 0,
          networkFee: 0,
          stopLossPremium: 0,
          otherFees: 0,
        }),
        [field]: numValue,
      }
    }))
    setHasUserEdited(true)
  }, [])

  const handleReset = () => {
    resetFees()
    const resetData: Record<string, FeesRow> = {}
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
    setHasUserEdited(true)
  }

  // Handle paste from Excel
  const handlePaste = useCallback((event: React.ClipboardEvent, startMonth: string, startField: FeeField) => {
    event.preventDefault()
    
    const pastedText = event.clipboardData.getData('text')
    const rows = pastedText.split('\n').filter(row => row.trim())
    const startMonthIndex = months.indexOf(startMonth)
    const startFieldIndex = feeFields.indexOf(startField)
    
    if (startMonthIndex === -1 || startFieldIndex === -1) return
    
    rows.forEach((row, rowIndex) => {
      const cells = row.split('\t')
      const monthIndex = startMonthIndex + rowIndex
      
      if (monthIndex >= months.length) return
      
      const month = months[monthIndex]
      const newRowData: FeesRow = {
        month,
        tpaFee: 0,
        networkFee: 0,
        stopLossPremium: 0,
        otherFees: 0,
        ...(gridData[month] ?? {}),
      }
      
      cells.forEach((cell, cellIndex) => {
        const fieldIndex = startFieldIndex + cellIndex
        if (fieldIndex >= feeFields.length) return
        
        const field = feeFields[fieldIndex]
        const value = parseFloat(cell.replace(/[,$]/g, '')) || 0
        newRowData[field] = value
      })
      
      setGridData(prev => ({ ...prev, [month]: newRowData }))
    })
    setHasUserEdited(true)
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
      <div className="py-8 text-center text-black/60">
        No months available. Please upload experience data first.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h3 className="mb-2 font-medium text-black">
          Instructions
        </h3>
        <ul className="space-y-1 text-sm text-black">
          <li>• Enter monthly fees for each category and month</li>
          <li>• You can paste from Excel by selecting a cell and using Ctrl+V</li>
          <li>• All values must be non-negative numbers</li>
          <li>• Totals are calculated automatically</li>
        </ul>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-black/10 bg-white">
              <th className="px-4 py-3 text-left text-sm font-medium text-black">
                Month
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-black">
                TPA Fee
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-black">
                Network Fee
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-black">
                Stop Loss Premium
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-black">
                Other Fees
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-black">
                Monthly Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {months.map((month) => (
              <tr key={month} className="hover:bg-black/5">
                <td className="px-4 py-3 text-sm font-medium text-black">
                  {month}
                </td>
                {feeFields.map((field) => {
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
                          w-full rounded border px-2 py-1 text-right text-sm
                          ${hasError ? 'border-black bg-black/10' : 'border-black/20'}
                          focus:outline-none focus:border-black focus:ring-2 focus:ring-black
                        `}
                        title={hasError ? errors[errorKey] : undefined}
                      />
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-sm text-right font-medium text-black">
                  ${getMonthTotal(month).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-white font-medium">
              <td className="px-4 py-3 text-sm text-black">
                Total
              </td>
              <td className="px-4 py-3 text-sm text-right text-black">
                ${getColumnTotal('tpaFee').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-black">
                ${getColumnTotal('networkFee').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-black">
                ${getColumnTotal('stopLossPremium').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-black">
                ${getColumnTotal('otherFees').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-sm text-right text-black">
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
          className="rounded px-2 py-1 text-sm text-black transition-colors hover:bg-black/5"
        >
          Reset All Fees
        </button>
        <span className="text-sm text-black/70">
          Changes save automatically when all fields are valid.
        </span>
      </div>

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <h4 className="mb-2 font-medium text-black">
            Please fix the following errors:
          </h4>
          <ul className="space-y-1 text-sm text-black">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
