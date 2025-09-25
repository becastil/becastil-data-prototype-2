'use client'

import { useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import CsvUploadForm from '@/components/upload/CsvUploadForm'
import Link from 'next/link'

export default function UploadPage() {
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()

  const hasExperience = experience.length > 0
  const hasHighCost = highCostClaimants.length > 0
  const hasAllData = hasExperience && hasHighCost

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-black">
            Step 1: Upload Experience & High-Cost Data
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-black/80">
            Download the templates, validate your data, and upload up to five CSV files at once. Valid files feed directly into
            the summary tables and charts throughout the dashboard.
          </p>
        </div>

        {/* Upload Form */}
        <div className="mb-10 rounded-lg border border-black/10 bg-white p-8 shadow-sm">
          <CsvUploadForm />
        </div>

        {/* Data Status */}
        {(hasExperience || hasHighCost) && (
          <div className="mb-10 grid gap-6 md:grid-cols-2">
            <DataStatusCard
              title="Experience Data"
              success={hasExperience}
              description={
                hasExperience
                  ? `${experience.length} records loaded across ${getUniqueMonths(experience).length} months.`
                  : 'Upload the experience template to power the summary table and trend charts.'
              }
              stats={hasExperience ? [
                { label: 'Months', value: String(getUniqueMonths(experience).length) },
                { label: 'Categories', value: String(getUniqueCategories(experience).length) },
                { label: 'Date Range', value: getDateRange(experience) },
                { label: 'Total Amount', value: formatCurrency(getTotalAmount(experience)) },
              ] : undefined}
            />
            <DataStatusCard
              title="High-Cost Claimants"
              success={hasHighCost}
              description={
                hasHighCost
                  ? `${highCostClaimants.length} claimant profiles ready for breakdown tables and high-cost charts.`
                  : 'Upload the high-cost claimants template to unlock claimant breakdown tables and diagnosis insights.'
              }
              stats={hasHighCost ? [
                { label: 'Top Diagnosis', value: topPrimaryDiagnosis(highCostClaimants) },
                { label: 'Total Cost', value: formatCurrency(totalHighCost(highCostClaimants)) },
                { label: 'Hit Stop Loss', value: `${countStopLossHits(highCostClaimants)} members` },
                { label: 'Avg % Plan Paid', value: `${averagePercentPaid(highCostClaimants).toFixed(1)}%` },
              ] : undefined}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="mb-10 rounded-lg border border-black/10 bg-white p-6">
          <h2 className="mb-3 text-lg font-medium text-black">CSV Format Requirements</h2>
          <div className="space-y-4 text-sm text-black">
            <div>
              <h3 className="font-semibold">Experience Data Template</h3>
              <p>Exact header order is required: <code>Category, Jan-2024, Feb-2024, …, Dec-2024</code>. Each month must contain numeric values only.</p>
            </div>
            <div>
              <h3 className="font-semibold">High-Cost Claimants Template</h3>
              <p>All columns are mandatory and case-sensitive. Percentages may include <code>%</code>; currency fields may include <code>$</code> and commas. Enrollment and stop-loss flags must be <code>Y</code> or <code>N</code> (any case).</p>
            </div>
            <div>
              <h3 className="font-semibold">Upload Checklist</h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>Upload up to five CSVs at one time.</li>
                <li>No extra, missing, or out-of-order columns.</li>
                <li>UTF-8 encoded CSV, maximum file size 10MB.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Step */}
        {hasAllData && (
          <div className="text-center">
            <Link
              href="/dashboard/fees"
              className="inline-flex items-center gap-2 rounded-lg border border-black px-6 py-3 font-medium text-black transition-colors hover:bg-black/5"
            >
              Continue to Fees Form
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
function getUniqueMonths(data: any[]): string[] {
  return [...new Set(data.map((row: any) => row.month))].sort()
}

function getUniqueCategories(data: any[]): string[] {
  return [...new Set(data.map((row: any) => row.category))]
}

function getDateRange(data: any[]): string {
  const months = getUniqueMonths(data)
  if (months.length === 0) return 'N/A'
  if (months.length === 1) return months[0]
  return `${months[0]} to ${months[months.length - 1]}`
}

function getTotalAmount(data: any[]): number {
  return data.reduce((sum, row) => sum + (row.amount || 0), 0)
}

function totalHighCost(data: any[]): number {
  return data.reduce((sum, row) => sum + (row.total || 0), 0)
}

function topPrimaryDiagnosis(data: any[]): string {
  const categoryTotals = data.reduce((acc: Record<string, number>, row: any) => {
    const key = row.primaryDiagnosisCategory || 'Unspecified'
    acc[key] = (acc[key] || 0) + (row.total || 0)
    return acc
  }, {})

  const [topCategory, amount] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || []
  return topCategory ? `${topCategory} (${formatCurrency(amount)})` : 'N/A'
}

function countStopLossHits(data: any[]): number {
  return data.filter((row: any) => row.hitStopLoss === 'Y').length
}

function averagePercentPaid(data: any[]): number {
  if (data.length === 0) return 0
  const total = data.reduce((sum: number, row: any) => sum + (row.percentPlanPaid || 0), 0)
  return total / data.length
}

function formatCurrency(amount = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface DataStatusCardProps {
  title: string
  description: string
  success: boolean
  stats?: Array<{ label: string; value: string }>
}

function DataStatusCard({ title, description, success, stats }: DataStatusCardProps) {
  return (
    <div className={`rounded-lg border p-6 ${success ? 'border-black/20 bg-white' : 'border-dashed border-black/20 bg-white/60'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${success ? 'bg-green-100 text-green-700' : 'bg-black/5 text-black/60'}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {success ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 6h.01" />
            )}
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-medium text-black">{title}</h3>
            <p className="text-sm text-black/70">{description}</p>
          </div>
          {stats && (
            <div className="grid grid-cols-2 gap-4 text-sm text-black">
              {stats.map(stat => (
                <div key={stat.label}>
                  <div className="text-black/60">{stat.label}</div>
                  <div className="font-semibold text-black">{stat.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
