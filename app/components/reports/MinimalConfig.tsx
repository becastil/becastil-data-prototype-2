'use client'

import { useState } from 'react'

interface MinimalConfigProps {
  onClose: () => void
}

export default function MinimalConfig({ onClose }: MinimalConfigProps) {
  const [exportFormat, setExportFormat] = useState('pdf')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [printLayout, setPrintLayout] = useState('two-page')

  const handleExport = () => {
    // Placeholder for export functionality
    console.log('Exporting...', { exportFormat, includeCharts, printLayout })
    onClose()
  }

  const handlePrint = () => {
    window.print()
    onClose()
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-normal">Configuration</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Export Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Export Options</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-2">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Layout</label>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="two-page">Two Page (Table + Charts)</option>
              <option value="table-only">Table Only</option>
              <option value="charts-only">Charts Only</option>
              <option value="single-page">Single Page (Combined)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeCharts"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeCharts" className="text-sm text-gray-600">
              Include interactive charts
            </label>
          </div>
        </div>
      </div>

      {/* Report Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Report Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-2">Period</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400">
              <option>Current Month</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>Custom Range</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Comparison</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400">
              <option>Prior Period</option>
              <option>Same Period Last Year</option>
              <option>Budget</option>
              <option>No Comparison</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={handlePrint}
          className="flex-1 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Print
        </button>
        <button
          onClick={handleExport}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          Export {exportFormat.toUpperCase()}
        </button>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
          Reset to defaults
        </button>
      </div>
    </div>
  )
}