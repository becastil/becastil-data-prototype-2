import { Metadata } from 'next'
import Link from 'next/link'
import ClaimsTrendChart from '@/app/components/charts/ClaimsTrendChart'
import CostBreakdownChart from '@/app/components/charts/CostBreakdownChart'
import TopClaimantsChart from '@/app/components/charts/TopClaimantsChart'
import KPICard from '@/app/components/charts/KPICard'

export const metadata: Metadata = {
  title: 'Chart System Test - Healthcare Analytics',
  description: 'Testing page for the server-side chart rendering system with healthcare analytics visualizations'
}

export default function ChartsTestPage() {
  // Mock KPI data for testing
  const mockKPIData = {
    totalClaims: {
      value: 4821,
      change: 5.2,
      trend: [85, 89, 92, 88, 95, 91, 100]
    },
    totalAmount: {
      value: 1284500,
      change: 3.8,
      trend: [88, 85, 90, 87, 92, 89, 100]
    },
    avgClaimAmount: {
      value: 266.51,
      change: -1.2,
      trend: [92, 88, 85, 89, 87, 90, 100]
    },
    processingSuccessRate: {
      value: 98.5,
      change: 0.3,
      trend: [95, 96, 97, 96, 98, 97, 100]
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Chart System Test
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/api/reports/pdf"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Preview
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Healthcare Analytics Chart System
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Testing the server-side chart rendering system with healthcare data visualizations
          </p>
          
          {/* Status indicator */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Charts ready for Chart.js integration
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Claims"
            value={mockKPIData.totalClaims.value}
            change={mockKPIData.totalClaims.change}
            trend={mockKPIData.totalClaims.trend}
            format="number"
            theme="professional"
          />
          <KPICard
            title="Total Amount"
            value={mockKPIData.totalAmount.value}
            change={mockKPIData.totalAmount.change}
            trend={mockKPIData.totalAmount.trend}
            format="currency"
            theme="professional"
          />
          <KPICard
            title="Avg Claim Amount"
            value={mockKPIData.avgClaimAmount.value}
            change={mockKPIData.avgClaimAmount.change}
            trend={mockKPIData.avgClaimAmount.trend}
            format="currency"
            theme="professional"
          />
          <KPICard
            title="Success Rate"
            value={mockKPIData.processingSuccessRate.value}
            change={mockKPIData.processingSuccessRate.change}
            trend={mockKPIData.processingSuccessRate.trend}
            format="percentage"
            theme="professional"
          />
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          
          {/* Claims Trend Chart */}
          <ClaimsTrendChart 
            theme="professional" 
            height={400}
            className="xl:col-span-2"
          />

          {/* Cost Breakdown Chart */}
          <CostBreakdownChart 
            theme="professional" 
            height={400}
          />

          {/* Top Claimants Chart */}
          <TopClaimantsChart 
            theme="professional" 
            height={400}
          />
        </div>

        {/* Theme Variations */}
        <div className="space-y-8">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Accessible Theme Variation
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostBreakdownChart 
                theme="accessible" 
                height={300}
              />
              <TopClaimantsChart 
                theme="accessible" 
                height={300}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Dark Theme Variation
            </h3>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClaimsTrendChart 
                  theme="dark" 
                  height={300}
                />
                <CostBreakdownChart 
                  theme="dark" 
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>

        {/* API Testing Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            API Endpoints Testing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Chart Configuration APIs */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Chart Configuration</h4>
              <div className="space-y-2">
                <Link
                  href="/api/charts/render?type=claims-trend&theme=professional"
                  target="_blank"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Claims Trend Config
                </Link>
                <Link
                  href="/api/charts/render?type=service-breakdown&theme=professional"
                  target="_blank"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Service Breakdown Config
                </Link>
                <Link
                  href="/api/charts/render?type=top-claimants&theme=professional"
                  target="_blank"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Top Claimants Config
                </Link>
              </div>
            </div>

            {/* PDF Generation */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">PDF Generation</h4>
              <div className="space-y-2">
                <Link
                  href="/api/reports/pdf"
                  target="_blank"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Default Report Preview
                </Link>
                <Link
                  href="/api/reports/pdf?theme=accessible"
                  target="_blank"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Accessible Theme Report
                </Link>
                <Link
                  href="/api/reports/pdf?theme=dark"
                  target="_blank"
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Dark Theme Report
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">System Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Chart.js</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Puppeteer</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Server APIs</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">PDF Templates</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Implementation Status
          </h3>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">✅ Completed Features</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• TypeScript types and interfaces for healthcare charts</li>
              <li>• WCAG 2.2 AA compliant chart configurations and themes</li>
              <li>• Server-side chart builder factory with healthcare-specific logic</li>
              <li>• API routes for chart rendering and PDF generation</li>
              <li>• Responsive React components with accessibility features</li>
              <li>• PDF template system with professional layouts</li>
              <li>• Performance optimizations and caching infrastructure</li>
              <li>• Accessibility utilities with screen reader support</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mt-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-3">⏳ Next Steps</h4>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• Install Chart.js, canvas, and Puppeteer dependencies</li>
              <li>• Complete server-side chart rendering implementation</li>
              <li>• Enable actual PDF generation with embedded charts</li>
              <li>• Add chart image export functionality</li>
              <li>• Implement real-time chart updates via WebSocket</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}