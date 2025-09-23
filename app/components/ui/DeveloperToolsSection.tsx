'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DeveloperToolsSection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
        aria-expanded={isExpanded}
      >
        <svg 
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-medium">Developer Tools</span>
        <span className="text-xs text-gray-500 dark:text-gray-500">(Technical)</span>
      </button>

      {isExpanded && (
        <div className="space-y-6 pl-7">
          
          {/* API Endpoints */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              API Endpoints
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Configs</h5>
                <div className="space-y-1">
                  <Link
                    href="/api/charts/render?type=claims-trend&theme=professional"
                    target="_blank"
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Claims Trend Config
                  </Link>
                  <Link
                    href="/api/charts/render?type=service-breakdown&theme=professional"
                    target="_blank"
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Service Breakdown Config
                  </Link>
                  <Link
                    href="/api/charts/render?type=top-claimants&theme=professional"
                    target="_blank"
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Top Claimants Config
                  </Link>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">PDF Generation</h5>
                <div className="space-y-1">
                  <Link
                    href="/api/reports/pdf?theme=accessible"
                    target="_blank"
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Accessible Theme Report
                  </Link>
                  <Link
                    href="/api/reports/pdf?theme=dark"
                    target="_blank"
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Dark Theme Report
                  </Link>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">System Status</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Recharts</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Interactive Charts</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Theme Toggle</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">PDF Generation</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Limited</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Notes */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Implementation Status
            </h4>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-3">
              <h5 className="font-medium text-green-900 dark:text-green-100 mb-2 text-sm">✅ Completed</h5>
              <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                <li>• Interactive Recharts with hover tooltips and responsive design</li>
                <li>• Functional theme toggle with localStorage persistence</li>
                <li>• Clean, professional UI without technical clutter</li>
                <li>• Simplified KPI cards with essential metrics only</li>
                <li>• WCAG 2.2 AA compliant chart configurations</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h5 className="font-medium text-amber-900 dark:text-amber-100 mb-2 text-sm">⏳ In Progress</h5>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Complete PDF generation with actual chart images</li>
                <li>• Add loading states and error boundaries</li>
                <li>• Implement data filtering and export options</li>
                <li>• Performance optimizations and caching</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}