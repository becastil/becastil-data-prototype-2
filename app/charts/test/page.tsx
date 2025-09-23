import { Metadata } from 'next'
import Link from 'next/link'
import InteractiveClaimsTrendChart from '@/app/components/charts/InteractiveClaimsTrendChart'
import InteractiveCostBreakdownChart from '@/app/components/charts/InteractiveCostBreakdownChart'
import InteractiveTopClaimantsChart from '@/app/components/charts/InteractiveTopClaimantsChart'
import SimpleKPICard from '@/app/components/charts/SimpleKPICard'
import ThemeToggle from '@/app/components/ui/ThemeToggle'
import DeveloperToolsSection from '@/app/components/ui/DeveloperToolsSection'
import ErrorBoundary from '@/app/components/ui/ErrorBoundary'
import ExportDropdown from '@/app/components/ui/ExportDropdown'

export const metadata: Metadata = {
  title: 'Healthcare Dashboard - Analytics & Insights',
  description: 'Healthcare analytics dashboard with interactive charts and key performance indicators'
}

export default function HealthcareDashboard() {
  // Mock KPI data
  const mockKPIData = {
    totalClaims: { value: 4821, change: 5.2 },
    totalAmount: { value: 1284500, change: 3.8 },
    avgClaimAmount: { value: 266.51, change: -1.2 },
    processingSuccessRate: { value: 98.5, change: 0.3 }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Clean Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Healthcare Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ExportDropdown />
              <button className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SimpleKPICard
            title="Total Claims"
            value={mockKPIData.totalClaims.value}
            change={mockKPIData.totalClaims.change}
            format="number"
          />
          <SimpleKPICard
            title="Total Amount"
            value={mockKPIData.totalAmount.value}
            change={mockKPIData.totalAmount.change}
            format="currency"
          />
          <SimpleKPICard
            title="Avg Claim"
            value={mockKPIData.avgClaimAmount.value}
            change={mockKPIData.avgClaimAmount.change}
            format="currency"
          />
          <SimpleKPICard
            title="Success Rate"
            value={mockKPIData.processingSuccessRate.value}
            change={mockKPIData.processingSuccessRate.change}
            format="percentage"
          />
        </div>

        {/* Primary Chart - Full Width */}
        <div className="mb-8">
          <ErrorBoundary>
            <InteractiveClaimsTrendChart height={400} />
          </ErrorBoundary>
        </div>

        {/* Secondary Charts - Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <ErrorBoundary>
            <InteractiveCostBreakdownChart height={400} />
          </ErrorBoundary>
          <ErrorBoundary>
            <InteractiveTopClaimantsChart height={400} />
          </ErrorBoundary>
        </div>

        {/* Developer Tools - Collapsible */}
        <DeveloperToolsSection />
      </div>
    </div>
  )
}