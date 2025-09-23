'use client'

import { useState } from 'react'
import { SchemaValidationResult, CSVSchemaType } from '@/app/lib/csv/schemas'
import { ChevronDown, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

interface ValidationPanelProps {
  validationResult: SchemaValidationResult | null
  onRetry?: () => void
  onContinue?: () => void
}

export default function ValidationPanel({
  validationResult,
  onRetry,
  onContinue
}: ValidationPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    errors: true,
    warnings: false,
    missing: false,
    extra: false
  })

  if (!validationResult) {
    return null
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getSchemaTypeLabel = (type: CSVSchemaType) => {
    switch (type) {
      case CSVSchemaType.HEALTHCARE_COSTS:
        return 'Healthcare Costs'
      case CSVSchemaType.HIGH_COST_CLAIMANTS:
        return 'High Cost Claimants'
      default:
        return 'Unknown'
    }
  }

  const getValidationStatus = () => {
    if (validationResult.errors.length === 0 && validationResult.missingColumns.length === 0) {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    }
    if (validationResult.errors.length > 0) {
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    }
    return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
  }

  const status = getValidationStatus()
  const StatusIcon = status.icon

  return (
    <div className={`border ${status.border} rounded-lg ${status.bg}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
            <div>
              <h3 className="font-medium text-gray-900">
                Validation Results - {getSchemaTypeLabel(validationResult.schemaType)}
              </h3>
              <p className="text-sm text-gray-600">
                {validationResult.validRows} of {validationResult.totalRows} rows processed successfully
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              >
                Retry
              </button>
            )}
            {onContinue && validationResult.validRows > 0 && (
              <button
                onClick={onContinue}
                className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                Continue with {validationResult.validRows} rows
              </button>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-lg font-semibold text-gray-900">{validationResult.validRows}</div>
            <div className="text-xs text-gray-600">Valid Rows</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-lg font-semibold text-red-600">{validationResult.errors.length}</div>
            <div className="text-xs text-gray-600">Errors</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-lg font-semibold text-yellow-600">{validationResult.warnings.length}</div>
            <div className="text-xs text-gray-600">Warnings</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-lg font-semibold text-gray-600">{validationResult.extraColumns.length}</div>
            <div className="text-xs text-gray-600">Extra Columns</div>
          </div>
        </div>

        {/* Errors section */}
        {validationResult.errors.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('errors')}
              className="flex items-center gap-2 w-full text-left p-2 hover:bg-white rounded"
            >
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${expandedSections.errors ? 'rotate-0' : '-rotate-90'}`} 
              />
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-900">
                Errors ({validationResult.errors.length})
              </span>
            </button>
            
            {expandedSections.errors && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {validationResult.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm p-2 bg-white rounded border border-red-200">
                    <span className="font-medium">Row {error.row + 1}, {error.field}:</span> {error.message}
                    {error.value && (
                      <span className="text-gray-600"> (value: "{String(error.value)}")</span>
                    )}
                  </div>
                ))}
                {validationResult.errors.length > 10 && (
                  <div className="text-sm text-gray-600 p-2">
                    ... and {validationResult.errors.length - 10} more errors
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Warnings section */}
        {validationResult.warnings.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('warnings')}
              className="flex items-center gap-2 w-full text-left p-2 hover:bg-white rounded"
            >
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${expandedSections.warnings ? 'rotate-0' : '-rotate-90'}`} 
              />
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-900">
                Warnings ({validationResult.warnings.length})
              </span>
            </button>
            
            {expandedSections.warnings && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {validationResult.warnings.slice(0, 10).map((warning, index) => (
                  <div key={index} className="text-sm p-2 bg-white rounded border border-yellow-200">
                    <span className="font-medium">Row {warning.row + 1}, {warning.field}:</span> {warning.message}
                    {warning.value && (
                      <span className="text-gray-600"> (value: "{String(warning.value)}")</span>
                    )}
                  </div>
                ))}
                {validationResult.warnings.length > 10 && (
                  <div className="text-sm text-gray-600 p-2">
                    ... and {validationResult.warnings.length - 10} more warnings
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Missing columns section */}
        {validationResult.missingColumns.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('missing')}
              className="flex items-center gap-2 w-full text-left p-2 hover:bg-white rounded"
            >
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${expandedSections.missing ? 'rotate-0' : '-rotate-90'}`} 
              />
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Missing Expected Columns ({validationResult.missingColumns.length})
              </span>
            </button>
            
            {expandedSections.missing && (
              <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                <div className="text-sm text-blue-800">
                  {validationResult.missingColumns.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extra columns section */}
        {validationResult.extraColumns.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('extra')}
              className="flex items-center gap-2 w-full text-left p-2 hover:bg-white rounded"
            >
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${expandedSections.extra ? 'rotate-0' : '-rotate-90'}`} 
              />
              <Info className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">
                Extra Columns ({validationResult.extraColumns.length})
              </span>
            </button>
            
            {expandedSections.extra && (
              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                <div className="text-sm text-gray-700">
                  {validationResult.extraColumns.join(', ')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  These columns will be ignored during processing
                </div>
              </div>
            )}
          </div>
        )}

        {/* Column mapping suggestions */}
        {validationResult.suggestions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Suggested Column Mappings</h4>
            <div className="space-y-1">
              {validationResult.suggestions.slice(0, 5).map((suggestion, index) => (
                <div key={index} className="text-sm text-blue-800">
                  <span className="font-medium">{suggestion.source}</span> → {suggestion.target}
                  <span className="text-blue-600 ml-2">
                    ({Math.round(suggestion.confidence * 100)}% confidence)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}