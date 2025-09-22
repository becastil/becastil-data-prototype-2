'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartExportOptions } from '@/types/charts'

interface ChartContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  loading?: boolean
  error?: string
  height?: number
  exportable?: boolean
  chartType?: string
  theme?: string
  className?: string
}

export default function ChartContainer({
  title,
  description,
  children,
  loading = false,
  error,
  height = 400,
  exportable = true,
  chartType,
  theme = 'professional',
  className = ''
}: ChartContainerProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = async () => {
    if (!chartType) return

    setIsExporting(true)
    setExportError(null)

    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartTypes: [chartType],
          theme,
          pdfOptions: {
            format: 'A4',
            orientation: 'landscape',
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.pdfReady) {
          // Once Puppeteer is installed, this will download the actual PDF
          const blob = new Blob([result.pdfBuffer], { type: 'application/pdf' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${chartType}-report.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          // For now, show preview in new tab
          const newWindow = window.open()
          if (newWindow) {
            newWindow.document.write(result.htmlContent)
            newWindow.document.title = `${title} - PDF Preview`
          }
        }
      } else {
        setExportError(result.message || 'Export failed')
      }
    } catch (err) {
      setExportError('Failed to export chart')
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportImage = async () => {
    if (!chartType) return

    setIsExporting(true)
    setExportError(null)

    try {
      const response = await fetch('/api/charts/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartType,
          theme,
          options: {
            width: 800,
            height: 600,
            devicePixelRatio: 2,
            backgroundColor: '#ffffff',
            quality: 'high'
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        // For now, show configuration in console (will implement actual image rendering)
        console.log('Chart configuration:', result)
        setExportError('Image export pending Chart.js installation')
      } else {
        setExportError(result.message || 'Export failed')
      }
    } catch (err) {
      setExportError('Failed to export chart')
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
      role="img"
      aria-label={`${title}. ${description || ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {exportable && (
          <div className="flex items-center gap-2 ml-4">
            <div className="relative">
              <button
                onClick={handleExportImage}
                disabled={isExporting || !!error}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export as PNG"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'PNG'}
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isExporting || !!error}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export as PDF"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Generating...' : 'PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-center">
              <div className="text-red-400 mb-2">
                <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
            </div>
          </div>
        ) : (
          <div style={{ height: `${height}px` }} className="relative">
            {children}
          </div>
        )}

        {exportError && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-xs text-amber-700 dark:text-amber-300">{exportError}</p>
          </div>
        )}
      </div>
    </div>
  )
}