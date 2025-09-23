'use client'

import { useState, useEffect } from 'react'
import { Download, ArrowLeft, TrendingUp, DollarSign, Calendar, AlertCircle } from '@/app/components/icons'
import BudgetVsClaimsChart from '@/app/components/reports/BudgetVsClaimsChart'

// Sample healthcare cost data - in production this would come from your CSV processing
const sampleHealthcareCostData = [
  { category: 'Total Adjusted Medical Claims', month: 'Jan', amount: 1730000, year: 2024, monthNum: 1 },
  { category: 'Total Adjusted Medical Claims', month: 'Feb', amount: 1645000, year: 2024, monthNum: 2 },
  { category: 'Total Adjusted Medical Claims', month: 'Mar', amount: 1815000, year: 2024, monthNum: 3 },
  { category: 'Total Adjusted Medical Claims', month: 'Apr', amount: 1779000, year: 2024, monthNum: 4 },
  { category: 'Total Adjusted Medical Claims', month: 'May', amount: 1940000, year: 2024, monthNum: 5 },
  { category: 'Total Adjusted Medical Claims', month: 'Jun', amount: 1846000, year: 2024, monthNum: 6 },
  { category: 'Net Pharmacy Claims', month: 'Jan', amount: 435000, year: 2024, monthNum: 1 },
  { category: 'Net Pharmacy Claims', month: 'Feb', amount: 420000, year: 2024, monthNum: 2 },
  { category: 'Net Pharmacy Claims', month: 'Mar', amount: 446250, year: 2024, monthNum: 3 },
  { category: 'Net Pharmacy Claims', month: 'Apr', amount: 457500, year: 2024, monthNum: 4 },
  { category: 'Net Pharmacy Claims', month: 'May', amount: 468750, year: 2024, monthNum: 5 },
  { category: 'Net Pharmacy Claims', month: 'Jun', amount: 461250, year: 2024, monthNum: 6 },
  { category: 'Total Admin Fees', month: 'Jan', amount: 75000, year: 2024, monthNum: 1 },
  { category: 'Total Admin Fees', month: 'Feb', amount: 75000, year: 2024, monthNum: 2 },
  { category: 'Total Admin Fees', month: 'Mar', amount: 75000, year: 2024, monthNum: 3 },
  { category: 'Total Admin Fees', month: 'Apr', amount: 75000, year: 2024, monthNum: 4 },
  { category: 'Total Admin Fees', month: 'May', amount: 75000, year: 2024, monthNum: 5 },
  { category: 'Total Admin Fees', month: 'Jun', amount: 75000, year: 2024, monthNum: 6 },
]

interface StatTileProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}

function StatTile({ title, value, change, changeType = 'neutral', icon }: StatTileProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
  onExport?: () => void
}

function ChartCard({ title, children, onExport }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

export default function HealthcareCostsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'ytd'>('6m')
  
  // Calculate KPIs from sample data
  const calculateKPIs = () => {
    const totalCosts = sampleHealthcareCostData.reduce((sum, item) => sum + item.amount, 0)
    const medicalClaims = sampleHealthcareCostData
      .filter(item => item.category === 'Total Adjusted Medical Claims')
      .reduce((sum, item) => sum + item.amount, 0)
    const pharmacyClaims = sampleHealthcareCostData
      .filter(item => item.category === 'Net Pharmacy Claims')
      .reduce((sum, item) => sum + item.amount, 0)
    
    const latestMonth = Math.max(...sampleHealthcareCostData.map(item => item.monthNum))
    const latestMonthTotal = sampleHealthcareCostData
      .filter(item => item.monthNum === latestMonth)
      .reduce((sum, item) => sum + item.amount, 0)
    
    // Calculate 3-month rolling average
    const last3Months = sampleHealthcareCostData
      .filter(item => item.monthNum >= latestMonth - 2)
      .reduce((sum, item) => sum + item.amount, 0) / 3
    
    return {
      totalCosts,
      medicalClaims,
      pharmacyClaims,
      latestMonthTotal,
      rollingAverage: last3Months
    }
  }

  const kpis = calculateKPIs()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportChart = (chartName: string) => {
    // In production, this would use html2canvas to export the chart
    console.log(`Exporting ${chartName}`)
  }

  const exportDashboard = () => {
    // In production, this would export the entire dashboard as PDF
    console.log('Exporting dashboard as PDF')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/upload"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </a>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Healthcare Costs Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive analysis of medical claims, pharmacy costs, and administrative expenses
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '6m' | '12m' | 'ytd')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="6m">Last 6 Months</option>
                <option value="12m">Last 12 Months</option>
                <option value="ytd">Year to Date</option>
              </select>
              
              <button
                onClick={exportDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Export Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatTile
            title="YTD Total Costs"
            value={formatCurrency(kpis.totalCosts)}
            change="+5.2% vs last period"
            changeType="negative"
            icon={<DollarSign className="w-6 h-6" />}
          />
          
          <StatTile
            title="Latest Month"
            value={formatCurrency(kpis.latestMonthTotal)}
            change="-2.1% from previous"
            changeType="positive"
            icon={<Calendar className="w-6 h-6" />}
          />
          
          <StatTile
            title="3-Month Rolling Avg"
            value={formatCurrency(kpis.rollingAverage)}
            change="Trending stable"
            changeType="neutral"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          
          <StatTile
            title="Medical vs Pharmacy"
            value={`${Math.round((kpis.medicalClaims / (kpis.medicalClaims + kpis.pharmacyClaims)) * 100)}% : ${Math.round((kpis.pharmacyClaims / (kpis.medicalClaims + kpis.pharmacyClaims)) * 100)}%`}
            change="Ratio stable"
            changeType="neutral"
            icon={<AlertCircle className="w-6 h-6" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Budget vs Claims Chart */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Budget vs Claims and Expenses"
              onExport={() => exportChart('Budget vs Claims')}
            >
              <BudgetVsClaimsChart />
            </ChartCard>
          </div>

          {/* Monthly Trend Chart */}
          <ChartCard
            title="Monthly Total Costs"
            onExport={() => exportChart('Monthly Trend')}
          >
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Line chart showing monthly cost trends</p>
                <p className="text-sm mt-2">Will be implemented with Chart.js</p>
              </div>
            </div>
          </ChartCard>

          {/* Category Breakdown */}
          <ChartCard
            title="Cost Category Breakdown"
            onExport={() => exportChart('Category Breakdown')}
          >
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Stacked bar chart by category</p>
                <p className="text-sm mt-2">Medical, Pharmacy, Admin breakdown</p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Data Table */}
        <ChartCard title="Detailed Cost Data">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {sampleHealthcareCostData
                  .sort((a, b) => b.monthNum - a.monthNum || b.amount - a.amount)
                  .slice(0, 10)
                  .map((row, index) => {
                    const monthTotal = sampleHealthcareCostData
                      .filter(item => item.monthNum === row.monthNum)
                      .reduce((sum, item) => sum + item.amount, 0)
                    const percentage = (row.amount / monthTotal) * 100

                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{row.category}</td>
                        <td className="py-3 px-4 text-gray-600">{row.month} {row.year}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing 10 of {sampleHealthcareCostData.length} records
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Download Full Dataset (CSV)
            </button>
          </div>
        </ChartCard>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Dashboard generated from healthcare_cost_dummy_data.csv</p>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
