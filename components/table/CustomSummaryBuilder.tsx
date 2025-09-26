'use client'

import { useMemo, useState, useCallback } from 'react'
import type { DragEvent } from 'react'
import type { AvailableField } from './summaryTypes'

interface CustomSummaryBuilderProps {
  availableFields: AvailableField[]
  selectedFieldIds: string[]
  enabled: boolean
  useCustomLayout: boolean
  onToggleEnabled: (enabled: boolean) => void
  onLayoutChange: (fieldIds: string[]) => void
}

const DRAG_DATA_TYPE = 'application/x-summary-field'

type DragSource = 'available' | 'selected'

interface DragPayload {
  id: string
  source: DragSource
}

function groupFields(fields: AvailableField[]) {
  return fields.reduce<Record<string, AvailableField[]>>((acc, field) => {
    const key = field.source
    acc[key] ??= []
    acc[key].push(field)
    return acc
  }, {})
}

function sortFields(fields: AvailableField[]) {
  return [...fields].sort((a, b) => a.label.localeCompare(b.label))
}

export default function CustomSummaryBuilder({
  availableFields,
  selectedFieldIds,
  enabled,
  useCustomLayout,
  onToggleEnabled,
  onLayoutChange,
}: CustomSummaryBuilderProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const availableFieldMap = useMemo(() => {
    return availableFields.reduce<Map<string, AvailableField>>((acc, field) => {
      acc.set(field.id, field)
      return acc
    }, new Map())
  }, [availableFields])

  const filteredAvailable = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return availableFields
    return availableFields.filter(field => field.label.toLowerCase().includes(term))
  }, [availableFields, searchTerm])

  const groupedAvailable = useMemo(() => {
    const grouped = groupFields(filteredAvailable)
    return {
      experience: sortFields(grouped.experience ?? []),
      financial: sortFields(grouped.financial ?? []),
      fee: sortFields(grouped.fee ?? []),
    }
  }, [filteredAvailable])

  const selectedFields = useMemo(() => {
    return selectedFieldIds
      .map(id => availableFieldMap.get(id))
      .filter((field): field is AvailableField => Boolean(field))
  }, [availableFieldMap, selectedFieldIds])

  const parseDragPayload = useCallback((event: DragEvent) => {
    const raw = event.dataTransfer.getData(DRAG_DATA_TYPE)
    if (!raw) return null
    try {
      const payload = JSON.parse(raw) as DragPayload
      if (!payload.id || (payload.source !== 'available' && payload.source !== 'selected')) {
        return null
      }
      return payload
    } catch {
      return null
    }
  }, [])

  const insertFieldAtIndex = useCallback((fieldId: string, index: number) => {
    const withoutField = selectedFieldIds.filter(id => id !== fieldId)
    const clamped = Math.max(0, Math.min(index, withoutField.length))
    const next = [...withoutField.slice(0, clamped), fieldId, ...withoutField.slice(clamped)]
    onLayoutChange(next)
  }, [onLayoutChange, selectedFieldIds])

  const handleDragStart = useCallback((payload: DragPayload) => (event: DragEvent) => {
    setDraggingId(payload.id)
    event.dataTransfer.effectAllowed = payload.source === 'available' ? 'copyMove' : 'move'
    event.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify(payload))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleDropAtIndex = useCallback((index: number) => (event: DragEvent) => {
    event.preventDefault()
    const payload = parseDragPayload(event)
    if (!payload) return

    if (payload.source === 'available') {
      if (!availableFieldMap.has(payload.id)) return
      insertFieldAtIndex(payload.id, index)
    } else if (payload.source === 'selected') {
      const currentIndex = selectedFieldIds.indexOf(payload.id)
      if (currentIndex === -1) return
      if (currentIndex === index || currentIndex + 1 === index) return
      const without = selectedFieldIds.filter(id => id !== payload.id)
      const clamped = Math.max(0, Math.min(index, without.length))
      const next = [...without.slice(0, clamped), payload.id, ...without.slice(clamped)]
      onLayoutChange(next)
    }

    setDraggingId(null)
  }, [availableFieldMap, insertFieldAtIndex, onLayoutChange, parseDragPayload, selectedFieldIds])

  const handleRemoveField = useCallback((fieldId: string) => {
    const next = selectedFieldIds.filter(id => id !== fieldId)
    onLayoutChange(next)
  }, [onLayoutChange, selectedFieldIds])

  const handleAddField = useCallback((fieldId: string) => {
    insertFieldAtIndex(fieldId, selectedFieldIds.length)
  }, [insertFieldAtIndex, selectedFieldIds.length])

  const handleClear = useCallback(() => {
    onLayoutChange([])
  }, [onLayoutChange])

  const dropZoneProps = (index: number) => ({
    onDragOver: (event: DragEvent) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    },
    onDrop: handleDropAtIndex(index),
  })

  return (
    <section className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Custom Summary Layout</h2>
          <p className="text-sm text-gray-600">
            Drag fields into your layout to build a tailored summary table. Only columns sourced from your uploads
            and fee schedule are available.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={enabled}
            onChange={event => onToggleEnabled(event.target.checked)}
          />
          Enable custom table
        </label>
      </header>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-1/2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Available Fields</h3>
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search fields..."
              className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="mt-3 space-y-4">
            {(['experience', 'financial', 'fee'] as const).map(groupKey => {
              const fields = groupedAvailable[groupKey]
              if (!fields || fields.length === 0) return null
              const groupLabel = groupKey === 'experience'
                ? 'Experience Data'
                : groupKey === 'financial'
                ? 'Derived Metrics'
                : 'Monthly Fees'
              return (
                <div key={groupKey}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{groupLabel}</div>
                  <div className="space-y-2">
                    {fields.map(field => {
                      const isSelected = selectedFieldIds.includes(field.id)
                      return (
                        <button
                          key={field.id}
                          type="button"
                          draggable
                          onDragStart={handleDragStart({ id: field.id, source: 'available' })}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleAddField(field.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                            isSelected ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white hover:border-blue-300'
                          } ${draggingId === field.id ? 'opacity-70' : ''}`}
                        >
                          <div className="font-medium">{field.label}</div>
                          {field.description && (
                            <div className="text-xs text-gray-500">{field.description}</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {availableFields.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Upload experience data or define fees to populate available fields.
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Layout</h3>
              <p className="text-xs text-gray-500">
                {useCustomLayout
                  ? 'Custom layout is active. Reorder fields or drag more from the left panel.'
                  : 'Add fields here, then enable the custom table to use your layout.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
            >
              Clear
            </button>
          </div>

          <div
            className={`rounded-lg border border-dashed border-gray-300 bg-white p-3 ${
              draggingId ? 'ring-2 ring-blue-200' : ''
            }`}
          >
            {selectedFields.length === 0 ? (
              <div
                className="flex h-28 items-center justify-center text-sm text-gray-500"
                onDragOver={event => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'copy'
                }}
                onDrop={handleDropAtIndex(0)}
              >
                Drag fields here to start building your table.
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedFields.map((field, index) => (
                  <li key={field.id}>
                    <div
                      className="h-2"
                      {...dropZoneProps(index)}
                    />
                    <div
                      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition ${
                        draggingId === field.id ? 'opacity-60' : ''
                      }`}
                      draggable
                      onDragStart={handleDragStart({ id: field.id, source: 'selected' })}
                      onDragEnd={handleDragEnd}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{field.label}</div>
                        {field.description && (
                          <div className="text-xs text-gray-500">{field.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="rounded-full border border-transparent p-1 text-gray-400 transition hover:border-gray-200 hover:text-gray-700"
                        aria-label={`Remove ${field.label}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
                <li>
                  <div className="h-2" {...dropZoneProps(selectedFields.length)} />
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
