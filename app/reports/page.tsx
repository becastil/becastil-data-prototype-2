'use client'

import { useState } from 'react'
import MinimalTable from '@/app/components/reports/MinimalTable'
import MinimalCharts from '@/app/components/reports/MinimalCharts'

export default function HealthcareReport() {
  const [currentView, setCurrentView] = useState<'table' | 'charts'>('table')

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="text-lg font-normal mb-6">Healthcare Report</h1>
          <nav className="flex justify-center gap-8 text-sm text-gray-600">
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
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Table or Charts */}
        {currentView === 'table' ? <MinimalTable /> : <MinimalCharts />}
      </main>
    </div>
  )
}