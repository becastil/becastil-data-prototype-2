import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useHotkeys } from 'react-hotkeys-hook'

import type { 
  TableRow, 
  DataRow, 
  ValidationResult, 
  MonthKey,
  TableData 
} from './schema'
import { TableDataSchema, DEFAULT_TEMPLATE_ROWS } from './schema'
import { validateTableData, createValidationDebouncer } from './validation'
import { getAllComputedValues } from './math'
import { DraftManager, useAutoSave } from './persistence'
import { updateComputedTargets } from './grouping'

// Form schema for react-hook-form
const CostsFormSchema = z.object({
  rows: z.array(z.any()) // We'll validate individually
})

type CostsFormData = z.infer<typeof CostsFormSchema>

/**
 * Main hook for healthcare costs data entry
 */
export function useCostsDataEntry(initialData?: TableRow[]) {
  const [isLoading, setIsLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    canExport: true,
    issues: [],
    errorCount: 0,
    warningCount: 0
  })
  
  // Initialize form with react-hook-form
  const form = useForm<CostsFormData>({
    resolver: zodResolver(CostsFormSchema),
    defaultValues: {
      rows: initialData || DEFAULT_TEMPLATE_ROWS
    }
  })
  
  const { fields, append, remove, update, move } = useFieldArray({
    control: form.control,
    name: 'rows'
  })
  
  const rows = form.watch('rows') as TableRow[]
  
  // Auto-save functionality
  const { saving, lastSaved } = useAutoSave(rows, true, 2000)
  
  // Computed values
  const computedValues = useMemo(() => getAllComputedValues(rows), [rows])
  
  // Debounced validation
  const debouncedValidation = useMemo(
    () => createValidationDebouncer(setValidationResult, 300),
    []
  )
  
  // Validate on data changes
  useEffect(() => {
    debouncedValidation(rows)
  }, [rows, debouncedValidation])
  
  // Actions
  const addRow = useCallback((type: 'data' | 'header' | 'computed' = 'data') => {
    const newOrder = Math.max(...rows.map(r => r.order)) + 1
    const newId = `row-${Date.now()}`
    
    let newRow: TableRow
    
    if (type === 'header') {
      newRow = {
        id: newId,
        Category: 'New Header',
        kind: 'header',
        order: newOrder
      }
    } else if (type === 'computed') {
      newRow = {
        id: newId,
        Category: 'New Total',
        kind: 'computed',
        order: newOrder,
        formula: 'subtotal',
        targetRows: []
      }
    } else {
      newRow = {
        id: newId,
        Category: 'New Category',
        kind: 'data',
        order: newOrder,
        months: {
          'Jan-2024': null, 'Feb-2024': null, 'Mar-2024': null, 'Apr-2024': null,
          'May-2024': null, 'Jun-2024': null, 'Jul-2024': null, 'Aug-2024': null,
          'Sep-2024': null, 'Oct-2024': null, 'Nov-2024': null, 'Dec-2024': null,
        }
      }
    }
    
    append(newRow)
  }, [rows, append])
  
  const removeRow = useCallback((index: number) => {
    remove(index)
  }, [remove])
  
  const duplicateRow = useCallback((index: number) => {
    const rowToDuplicate = rows[index]
    if (!rowToDuplicate) return
    
    const newRow = {
      ...rowToDuplicate,
      id: `row-${Date.now()}`,
      Category: `${rowToDuplicate.Category} (Copy)`,
      order: Math.max(...rows.map(r => r.order)) + 1
    }
    
    append(newRow)
  }, [rows, append])
  
  const moveRow = useCallback((fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex)
    
    // Update order values
    const updatedRows = [...rows]
    updatedRows.forEach((row, index) => {
      row.order = index + 1
    })
    
    form.setValue('rows', updatedRows)
  }, [rows, move, form])
  
  const updateRow = useCallback((index: number, updates: Partial<TableRow>) => {
    const currentRow = rows[index]
    if (!currentRow) return
    
    const updatedRow = { ...currentRow, ...updates }
    update(index, updatedRow)
  }, [rows, update])
  
  const resetToTemplate = useCallback(() => {
    form.setValue('rows', DEFAULT_TEMPLATE_ROWS)
  }, [form])
  
  const updateComputedRows = useCallback(() => {
    const updatedRows = updateComputedTargets(rows)
    form.setValue('rows', updatedRows)
  }, [rows, form])
  
  return {
    // Form state
    form,
    rows,
    fields,
    isLoading,
    
    // Validation
    validationResult,
    computedValues,
    
    // Persistence
    saving,
    lastSaved,
    
    // Actions
    addRow,
    removeRow,
    duplicateRow,
    moveRow,
    updateRow,
    resetToTemplate,
    updateComputedRows,
    
    // Utilities
    canExport: validationResult.canExport,
    hasErrors: validationResult.errorCount > 0,
    hasWarnings: validationResult.warningCount > 0
  }
}

/**
 * Hook for CSV import/export functionality
 */
export function useCSVOperations() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const importCSV = useCallback(async (file: File) => {
    setImporting(true)
    try {
      const { importCSV } = await import('./csv')
      return await importCSV(file)
    } finally {
      setImporting(false)
    }
  }, [])
  
  const exportCSV = useCallback(async (rows: TableRow[], filename?: string) => {
    setExporting(true)
    try {
      const { exportCSV, downloadCSV } = await import('./csv')
      const csvContent = exportCSV(rows)
      downloadCSV(csvContent, filename)
    } finally {
      setExporting(false)
    }
  }, [])
  
  const downloadTemplate = useCallback(async () => {
    const { generateTemplateCSV, downloadCSV } = await import('./csv')
    const templateContent = generateTemplateCSV()
    downloadCSV(templateContent, 'healthcare-costs-template.csv')
  }, [])
  
  return {
    importing,
    exporting,
    importCSV,
    exportCSV,
    downloadTemplate
  }
}

/**
 * Hook for draft management
 */
export function useDraftManagement() {
  const [drafts, setDrafts] = useState<Array<{
    id: number
    name: string
    description?: string
    updatedAt: Date
    rowCount: number
  }>>([])
  const [loading, setLoading] = useState(false)
  
  const loadDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const draftList = await DraftManager.listDrafts()
      setDrafts(draftList)
    } finally {
      setLoading(false)
    }
  }, [])
  
  const saveDraft = useCallback(async (name: string, rows: TableRow[], description?: string) => {
    await DraftManager.saveNamedDraft(name, rows, description)
    await loadDrafts()
  }, [loadDrafts])
  
  const loadDraft = useCallback(async (name: string) => {
    return await DraftManager.loadNamedDraft(name)
  }, [])
  
  const deleteDraft = useCallback(async (name: string) => {
    await DraftManager.deleteDraft(name)
    await loadDrafts()
  }, [loadDrafts])
  
  const hasAutoDraft = useCallback(async () => {
    return await DraftManager.hasAutoDraft()
  }, [])
  
  const loadAutoDraft = useCallback(async () => {
    return await DraftManager.loadAutoDraft()
  }, [])
  
  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])
  
  return {
    drafts,
    loading,
    saveDraft,
    loadDraft,
    deleteDraft,
    hasAutoDraft,
    loadAutoDraft,
    refreshDrafts: loadDrafts
  }
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(callbacks: {
  onSave?: () => void
  onExport?: () => void
  onImport?: () => void
  onAddRow?: () => void
  onUndo?: () => void
  onRedo?: () => void
}) {
  const {
    onSave,
    onExport,
    onImport,
    onAddRow,
    onUndo,
    onRedo
  } = callbacks
  
  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault()
    onSave?.()
  }, { enableOnContentEditable: true })
  
  useHotkeys('ctrl+e, cmd+e', (e) => {
    e.preventDefault()
    onExport?.()
  }, { enableOnContentEditable: true })
  
  useHotkeys('ctrl+i, cmd+i', (e) => {
    e.preventDefault()
    onImport?.()
  }, { enableOnContentEditable: true })
  
  useHotkeys('ctrl+shift+n, cmd+shift+n', (e) => {
    e.preventDefault()
    onAddRow?.()
  }, { enableOnContentEditable: true })
  
  useHotkeys('ctrl+z, cmd+z', (e) => {
    e.preventDefault()
    onUndo?.()
  }, { enableOnContentEditable: true })
  
  useHotkeys('ctrl+y, cmd+y', (e) => {
    e.preventDefault()
    onRedo?.()
  }, { enableOnContentEditable: true })
}

/**
 * Hook for grid cell navigation
 */
export function useGridNavigation(
  rows: TableRow[],
  onCellSelect: (rowIndex: number, columnIndex: number) => void
) {
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number
    columnIndex: number
  } | null>(null)
  
  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return
    
    const { rowIndex, columnIndex } = selectedCell
    let newRowIndex = rowIndex
    let newColumnIndex = columnIndex
    
    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1)
        break
      case 'down':
        newRowIndex = Math.min(rows.length - 1, rowIndex + 1)
        break
      case 'left':
        newColumnIndex = Math.max(0, columnIndex - 1)
        break
      case 'right':
        newColumnIndex = Math.min(12, columnIndex + 1) // 12 months + category column
        break
    }
    
    if (newRowIndex !== rowIndex || newColumnIndex !== columnIndex) {
      setSelectedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex })
      onCellSelect(newRowIndex, newColumnIndex)
    }
  }, [selectedCell, rows.length, onCellSelect])
  
  // Keyboard navigation
  useHotkeys('arrowup', (e) => {
    e.preventDefault()
    navigate('up')
  }, { enableOnContentEditable: true })
  
  useHotkeys('arrowdown', (e) => {
    e.preventDefault()
    navigate('down')
  }, { enableOnContentEditable: true })
  
  useHotkeys('arrowleft', (e) => {
    e.preventDefault()
    navigate('left')
  }, { enableOnContentEditable: true })
  
  useHotkeys('arrowright', (e) => {
    e.preventDefault()
    navigate('right')
  }, { enableOnContentEditable: true })
  
  useHotkeys('tab', (e) => {
    e.preventDefault()
    navigate('right')
  }, { enableOnContentEditable: true })
  
  useHotkeys('shift+tab', (e) => {
    e.preventDefault()
    navigate('left')
  }, { enableOnContentEditable: true })
  
  return {
    selectedCell,
    setSelectedCell,
    navigate
  }
}

/**
 * Hook for bulk paste operations
 */
export function useBulkPaste() {
  const [pasting, setPasting] = useState(false)
  
  const handlePaste = useCallback(async (
    clipboardData: string,
    targetCell: { rowIndex: number, columnIndex: number },
    rows: TableRow[],
    updateRow: (index: number, updates: Partial<TableRow>) => void
  ) => {
    setPasting(true)
    
    try {
      const { parseClipboardData } = await import('./csv')
      const { data } = parseClipboardData(clipboardData)
      
      if (data.length === 0) return
      
      // Apply paste data starting from target cell
      data.forEach((rowData, rowOffset) => {
        const targetRowIndex = targetCell.rowIndex + rowOffset
        if (targetRowIndex >= rows.length) return
        
        const targetRow = rows[targetRowIndex]
        if (targetRow.kind !== 'data') return
        
        const updatedMonths = { ...targetRow.months }
        
        rowData.forEach((cellValue, colOffset) => {
          const targetColIndex = targetCell.columnIndex + colOffset
          
          // Skip category column (index 0)
          if (targetColIndex === 0 || targetColIndex > 12) return
          
          const monthIndex = targetColIndex - 1
          const monthKey = ['Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'][monthIndex] as MonthKey
          
          if (monthKey) {
            const numValue = typeof cellValue === 'number' ? cellValue : 
                             typeof cellValue === 'string' ? parseFloat(cellValue.replace(/[,$]/g, '')) : null
            
            if (!isNaN(numValue) && isFinite(numValue)) {
              updatedMonths[monthKey] = Math.round(numValue)
            }
          }
        })
        
        updateRow(targetRowIndex, { months: updatedMonths })
      })
      
    } finally {
      setPasting(false)
    }
  }, [])
  
  return {
    pasting,
    handlePaste
  }
}

/**
 * Hook for undo/redo functionality
 */
export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1
  
  const push = useCallback((state: T) => {
    setHistory(prev => {
      const newHistory = [...prev.slice(0, currentIndex + 1), state]
      return newHistory.length > 50 ? newHistory.slice(-50) : newHistory // Keep last 50 states
    })
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, history.length)
      return newIndex >= 50 ? 49 : newIndex
    })
  }, [currentIndex, history.length])
  
  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [canUndo])
  
  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [canRedo])
  
  const currentState = history[currentIndex]
  
  return {
    currentState,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear: () => {
      setHistory([initialState])
      setCurrentIndex(0)
    }
  }
}