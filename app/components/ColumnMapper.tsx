'use client'

import { useState, useEffect } from 'react'
import { ColumnMapping, CSVSchemaType } from '@/app/lib/csv/schemas'
import { ColumnMapper as MapperService } from '@/app/lib/csv/column-mapper'
import { ChevronDown, CheckCircle, AlertCircle, Info } from '@/app/components/icons'

interface ColumnMapperProps {
  sourceColumns: string[]
  schemaType: CSVSchemaType
  onMappingChange: (mappings: ColumnMapping[]) => void
  initialMappings?: ColumnMapping[]
}

export default function ColumnMapper({
  sourceColumns,
  schemaType,
  onMappingChange,
  initialMappings
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingMapping, setEditingMapping] = useState<number | null>(null)

  useEffect(() => {
    if (initialMappings) {
      setMappings(initialMappings)
    } else {
      // Try to load saved preferences first
      const savedMappings = MapperService.loadMappingPreferences(schemaType)
      if (savedMappings) {
        // Filter saved mappings to only include columns present in current data
        const relevantMappings = savedMappings.filter(saved =>
          sourceColumns.includes(saved.source)
        )
        if (relevantMappings.length > 0) {
          setMappings(relevantMappings)
          onMappingChange(relevantMappings)
          return
        }
      }

      // Generate automatic mappings
      const result = MapperService.generateMappings(sourceColumns, schemaType)
      setMappings(result.mappings)
      onMappingChange(result.mappings)
    }
  }, [sourceColumns, schemaType, initialMappings, onMappingChange])

  const handleMappingChange = (index: number, newTarget: string) => {
    const updatedMappings = [...mappings]
    
    // Check if this target is already used
    const existingIndex = mappings.findIndex((m, i) => 
      i !== index && m.target === newTarget
    )
    
    if (existingIndex !== -1) {
      // Swap the mappings
      updatedMappings[existingIndex] = { 
        ...updatedMappings[existingIndex], 
        target: updatedMappings[index].target 
      }
    }
    
    updatedMappings[index] = { 
      ...updatedMappings[index], 
      target: newTarget,
      isPerfectMatch: false,
      confidence: newTarget === updatedMappings[index].source ? 1.0 : 0.8
    }
    
    setMappings(updatedMappings)
    onMappingChange(updatedMappings)
    setEditingMapping(null)
  }

  const removeMapping = (index: number) => {
    const updatedMappings = mappings.filter((_, i) => i !== index)
    setMappings(updatedMappings)
    onMappingChange(updatedMappings)
  }

  const addMapping = (sourceColumn: string) => {
    const newMapping: ColumnMapping = {
      source: sourceColumn,
      target: '',
      confidence: 0,
      isRequired: false,
      isPerfectMatch: false
    }
    
    const updatedMappings = [...mappings, newMapping]
    setMappings(updatedMappings)
    setEditingMapping(updatedMappings.length - 1)
  }

  const saveMappings = () => {
    MapperService.saveMappingPreferences(schemaType, mappings)
  }

  const resetMappings = () => {
    const result = MapperService.generateMappings(sourceColumns, schemaType)
    setMappings(result.mappings)
    onMappingChange(result.mappings)
  }

  const expectedColumns = MapperService['getExpectedColumns'](schemaType)
  const mappedSources = new Set(mappings.map(m => m.source))
  const unmappedSources = sourceColumns.filter(col => !mappedSources.has(col))
  
  const validation = MapperService.validateMappings(mappings, schemaType)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceIcon = (mapping: ColumnMapping) => {
    if (mapping.isPerfectMatch) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    }
    if (mapping.confidence >= 0.7) {
      return <Info className="w-4 h-4 text-blue-600" />
    }
    return <AlertCircle className="w-4 h-4 text-yellow-600" />
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <ChevronDown 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} 
          />
          <h3 className="font-medium text-gray-900">Column Mapping</h3>
          <span className="text-sm text-gray-500">
            {mappings.length} mapped, {unmappedSources.length} unmapped
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!validation.isValid && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm text-gray-500">
            {Math.round((mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length || 0) * 100)}% confidence
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Map your CSV columns to the expected schema fields. Required fields are marked with *.
            </p>
            <div className="flex gap-2">
              <button
                onClick={resetMappings}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Reset
              </button>
              <button
                onClick={saveMappings}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Save Preferences
              </button>
            </div>
          </div>

          {/* Mapped columns */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Mapped Columns</h4>
            {mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getConfidenceIcon(mapping)}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {mapping.source}
                  </span>
                  <span className="text-gray-400">→</span>
                  
                  {editingMapping === index ? (
                    <select
                      value={mapping.target}
                      onChange={(e) => handleMappingChange(index, e.target.value)}
                      onBlur={() => setEditingMapping(null)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 min-w-0 flex-1"
                      autoFocus
                    >
                      <option value="">Select target column...</option>
                      {expectedColumns.map(col => (
                        <option key={col} value={col}>
                          {col} {MapperService['getRequiredColumns'](schemaType).includes(col) && '*'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingMapping(index)}
                      className="text-sm text-blue-600 hover:text-blue-800 truncate min-w-0 flex-1 text-left"
                    >
                      {mapping.target || 'Click to map...'}
                      {mapping.isRequired && ' *'}
                    </button>
                  )}
                </div>
                
                <span className={`text-xs ${getConfidenceColor(mapping.confidence)}`}>
                  {Math.round(mapping.confidence * 100)}%
                </span>
                
                <button
                  onClick={() => removeMapping(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Unmapped columns */}
          {unmappedSources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Unmapped Columns</h4>
              <div className="flex flex-wrap gap-2">
                {unmappedSources.map(column => (
                  <button
                    key={column}
                    onClick={() => addMapping(column)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  >
                    {column}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Validation errors */}
          {!validation.isValid && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Missing Required Fields</span>
              </div>
              <div className="text-sm text-red-700">
                The following required fields are not mapped: {validation.missingRequired.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
