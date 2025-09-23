'use client'

import { useState } from 'react'
import MinimalTable from '@/app/components/reports/MinimalTable'
import MinimalCharts from '@/app/components/reports/MinimalCharts'
import MinimalConfig from '@/app/components/reports/MinimalConfig'

export default function HealthcareReport() {
  const [currentView, setCurrentView] = useState<'table' | 'charts'>('table')
  const [showConfig, setShowConfig] = useState(false)

  // Mock healthcare data
  const metrics = {
    totalClaims: { value: 4821, change: 5.2 },
    totalAmount: { value: 1284500, change: 3.8 },
    avgClaim: { value: 266.51, change: -1.2 },
    successRate: { value: 98.5, change: 0.3 }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-normal">Healthcare Report</h1>
          <nav className="flex gap-8 text-sm text-gray-600">
            <button 
              onClick={() => setCurrentView('table')}
              className={`transition-colors ${
                currentView === 'table' ? 'text-black' : 'hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button 
              onClick={() => setCurrentView('charts')}
              className={`transition-colors ${
                currentView === 'charts' ? 'text-black' : 'hover:text-gray-900'
              }`}
            >
              Charts
            </button>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="hover:text-gray-900 transition-colors"
            >
              Configure
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Metrics - ultra minimal, no cards */}
        <div className="grid grid-cols-2 gap-12 mb-16">
          <div>
            <div className="text-4xl font-light tabular-nums mb-1">
              {metrics.totalClaims.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Claims</div>
            <div className={`text-sm ${
              metrics.totalClaims.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.totalClaims.change > 0 ? '+' : ''}{metrics.totalClaims.change}%
            </div>
          </div>

          <div>
            <div className="text-4xl font-light tabular-nums mb-1">
              ${(metrics.totalAmount.value / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className={`text-sm ${
              metrics.totalAmount.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.totalAmount.change > 0 ? '+' : ''}{metrics.totalAmount.change}%
            </div>
          </div>

          <div>
            <div className="text-4xl font-light tabular-nums mb-1">
              ${metrics.avgClaim.value}
            </div>
            <div className="text-sm text-gray-600 mb-1">Average Claim</div>
            <div className={`text-sm ${
              metrics.avgClaim.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.avgClaim.change > 0 ? '+' : ''}{metrics.avgClaim.change}%
            </div>
          </div>

          <div>
            <div className="text-4xl font-light tabular-nums mb-1">
              {metrics.successRate.value}%
            </div>
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className={`text-sm ${
              metrics.successRate.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.successRate.change > 0 ? '+' : ''}{metrics.successRate.change}%
            </div>
          </div>
        </div>

        {/* Table or Charts */}
        {currentView === 'table' ? <MinimalTable /> : <MinimalCharts />}

        {/* Configuration panel */}
        {showConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-lg">
              <MinimalConfig onClose={() => setShowConfig(false)} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}