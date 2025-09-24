'use client'

import BudgetVsClaimsChart from '@/app/components/reports/BudgetVsClaimsChart'
import EnrollmentTrendChart from '@/app/components/reports/EnrollmentTrendChart'
import HighCostBandsChart from '@/app/components/reports/HighCostBandsChart'
import TopDiagnosesChart from '@/app/components/reports/TopDiagnosesChart'
import DepartmentExpenseChart from '@/app/components/reports/DepartmentExpenseChart'
import OutlierClaimsChart from '@/app/components/reports/OutlierClaimsChart'

export default function HealthcareDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Healthcare Analytics Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Comprehensive claims and expense analysis across all departments
          </p>
        </div>

        {/* 2x3 Grid Layout - 6 Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          
          {/* Row 1, Tile 1: Budget vs Claims/Expenses */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Budget vs Claims & Expenses</h3>
              <p className="text-sm text-gray-600">Monthly actual vs budget comparison</p>
            </div>
            <div className="h-64 sm:h-80">
              <BudgetVsClaimsChart />
            </div>
          </div>

          {/* Row 1, Tile 2: Enrollment Trends */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Enrollment Trends</h3>
              <p className="text-sm text-gray-600">Member enrollment over time by plan type</p>
            </div>
            <div className="h-64 sm:h-80">
              <EnrollmentTrendChart />
            </div>
          </div>

          {/* Row 1, Tile 3: High-Cost Claimant Bands */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">High-Cost Claimant Bands</h3>
              <p className="text-sm text-gray-600">Members and costs by spending tier</p>
            </div>
            <div className="h-64 sm:h-80">
              <HighCostBandsChart />
            </div>
          </div>

          {/* Row 2, Tile 4: Top Diagnoses Pareto */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Top Cost-Driving Diagnoses</h3>
              <p className="text-sm text-gray-600">Pareto analysis of highest expense conditions</p>
            </div>
            <div className="h-64 sm:h-80">
              <TopDiagnosesChart />
            </div>
          </div>

          {/* Row 2, Tile 5: Department Expenses */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Expenses by Department</h3>
              <p className="text-sm text-gray-600">Spending breakdown across departments</p>
            </div>
            <div className="h-64 sm:h-80">
              <DepartmentExpenseChart />
            </div>
          </div>

          {/* Row 2, Tile 6: Outlier Claims */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Outlier Claims Detection</h3>
              <p className="text-sm text-gray-600">Identify potential duplicate or unusual claims</p>
            </div>
            <div className="h-64 sm:h-80">
              <OutlierClaimsChart />
            </div>
          </div>

        </div>

        {/* Dashboard Actions */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs md:text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Export Dashboard
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}