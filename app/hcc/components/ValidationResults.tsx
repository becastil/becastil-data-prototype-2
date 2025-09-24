'use client'

import { AlertTriangle, CheckCircle2, XCircle, Info, Download } from 'lucide-react'
import { formatCurrency, formatPercentage } from '../lib/utils'
import type { HCCValidationResult } from '../lib/schema'

interface ValidationResultsProps {
  validation: HCCValidationResult
  onRetry?: () => void
}

export function ValidationResults({ validation, onRetry }: ValidationResultsProps) {
  const { isValid, totalRows, validRows, invalidRows, errors, warnings, summary } = validation

  const downloadNormalizedData = async () => {
    try {
      // Request normalized CSV download
      const response = await fetch('/api/hcc/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'normalized' })
      })
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hcc-normalized-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className={`rounded-lg border p-6 ${
        isValid 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {isValid ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${
              isValid ? 'text-green-900' : 'text-red-900'
            }`}>
              {isValid ? 'Validation Successful' : 'Validation Failed'}
            </h3>
            <p className={`text-sm mt-1 ${
              isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              {isValid 
                ? `Successfully validated ${validRows} records. Data is ready for analytics.`
                : `Found ${errors.length} error${errors.length !== 1 ? 's' : ''} in ${invalidRows} row${invalidRows !== 1 ? 's' : ''}. Please fix and try again.`
              }
            </p>
          </div>
          {isValid && (
            <button
              onClick={downloadNormalizedData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              Download Clean Data
            </button>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Total Rows</div>
          <div className="text-2xl font-bold text-gray-900">{totalRows.toLocaleString()}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Valid Records</div>
          <div className="text-2xl font-bold text-green-600">{validRows.toLocaleString()}</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Total Costs YTD</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.total_costs)}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Data Completeness</div>
          <div className="text-2xl font-bold text-indigo-600">
            {formatPercentage(summary.data_completeness)}
          </div>
        </div>
      </div>

      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">
              Validation Errors ({errors.length})
            </h4>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="font-mono text-red-600 bg-red-100 px-2 py-1 rounded text-xs">
                  Row {error.row}
                </span>
                <span className="font-medium text-red-800">{error.field}:</span>
                <span className="text-red-700">{error.message}</span>
                {error.value !== null && error.value !== undefined && (
                  <span className="text-red-600 font-mono text-xs bg-red-100 px-1 rounded">
                    "{String(error.value)}"
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {onRetry && (
            <div className="mt-4 pt-3 border-t border-red-200">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Upload Corrected File
              </button>
            </div>
          )}
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-amber-900">
              Warnings ({warnings.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="font-mono text-amber-600 bg-amber-100 px-2 py-1 rounded text-xs">
                  Row {warning.row}
                </span>
                <span className="font-medium text-amber-800">{warning.field}:</span>
                <span className="text-amber-700">{warning.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality Insights */}
      {isValid && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Data Quality Summary</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Member Count:</span>{' '}
              <span className="text-blue-700">{summary.member_count.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Avg Cost/Member:</span>{' '}
              <span className="text-blue-700">
                {formatCurrency(summary.member_count > 0 ? summary.total_costs / summary.member_count : 0)}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Provider Coverage:</span>{' '}
              <span className="text-blue-700">{formatPercentage(summary.provider_coverage)}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Success Rate:</span>{' '}
              <span className="text-blue-700">
                {formatPercentage(totalRows > 0 ? validRows / totalRows : 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ Ready for Analytics</h4>
          <p className="text-sm text-green-700 mb-3">
            Your data has been successfully validated and normalized. You can now:
          </p>
          <ul className="text-sm text-green-700 space-y-1 ml-4">
            <li>• View interactive analytics dashboards</li>
            <li>• Generate cost and risk analysis reports</li>
            <li>• Export normalized data for further analysis</li>
            <li>• Create visualizations with chart tools</li>
          </ul>
        </div>
      )}
    </div>
  )
}