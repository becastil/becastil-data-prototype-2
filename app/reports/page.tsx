'use client'

import { useState } from 'react'
import MinimalTable from '@/app/components/reports/MinimalTable'
import MinimalCharts from '@/app/components/reports/MinimalCharts'

export default function HealthcareReport() {
  const [currentView, setCurrentView] = useState<'table' | 'charts'>('table')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <nav className="flex justify-center gap-12 mb-16">
          <button 
            onClick={() => setCurrentView('table')}
            className={currentView === 'table' ? 'text-black' : 'text-gray-400'}
          >
            Table
          </button>
          <button 
            onClick={() => setCurrentView('charts')}
            className={currentView === 'charts' ? 'text-black' : 'text-gray-400'}
          >
            Charts
          </button>
        </nav>

        {currentView === 'table' ? <MinimalTable /> : <MinimalCharts />}
      </div>
    </div>
  )
}