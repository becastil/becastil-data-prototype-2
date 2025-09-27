'use client'

import { useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import CsvUploadForm from '@/components/upload/CsvUploadForm'
import InfoTooltip from '@/components/ui/InfoTooltip'
import FocusWrapper from '@/components/focus/FocusWrapper'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'
import PremiumCard from '@/components/ui/PremiumCard'
import AnimatedCard from '@/components/ui/AnimatedCard'
import AnimatedButton from '@/components/ui/AnimatedButton'
import StaggerContainer from '@/components/ui/StaggerContainer'
import { useFocusMode } from '@/components/focus/FocusProvider'
import Link from 'next/link'

export default function UploadPage() {
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()
  const { isFocusMode } = useFocusMode()

  const hasExperience = experience.length > 0
  const hasHighCost = highCostClaimants.length > 0
  const hasAllData = hasExperience && hasHighCost

  const csvFormatSections = [
    {
      title: 'Experience Data Template',
      content: (
        <>
          <p>
            Keep <code>Category</code> in the first column, then use month columns formatted as <code>M/D/YYYY</code> (for example <code>1/1/2025</code>).
          </p>
          <p>
            Dates must be the first day of each month with numeric values only.
          </p>
          <p>
            Provide rows for <em>Domestic Hospital Claims</em> and <em>Total Hospital Medical Claims</em>; the system derives <em>Non Domestic Hospital Claims</em> automatically.
          </p>
        </>
      ),
    },
    {
      title: 'High-Cost Claimants Template',
      content: (
        <>
          <p>All columns are mandatory and case-sensitive.</p>
          <p>Percentages may include <code>%</code>; currency fields may include <code>$</code> and commas.</p>
          <p>Enrollment and stop-loss flags must be <code>Y</code> or <code>N</code>.</p>
        </>
      ),
    },
    {
      title: 'Upload Checklist',
      content: (
        <ul className="list-disc space-y-1 pl-4">
          <li>Upload up to five CSVs at one time.</li>
          <li>Keep columns in the template order with no extras.</li>
          <li>Use UTF-8 encoding and keep files under 10MB.</li>
        </ul>
      ),
    },
  ]

  // Create right panel content for validation and insights
  const rightPanelContent = (
    <div className="space-y-6">
      <AnimatedCard variant="slideIn" delay={0.1}>
        <h3 className="text-lg font-semibold text-black mb-4">
          Validation & Insights
        </h3>
        <div className="text-sm text-gray-600 mb-6">
          Real-time file status and data metrics
        </div>
      </AnimatedCard>

      {/* Experience Data Stats */}
      {hasExperience && (
        <AnimatedCard variant="slideUp" delay={0.2}>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Experience Data
            </h4>
            <StaggerContainer staggerDelay={0.1}>
              <StatCard
                label="Months"
                value={getUniqueMonths(experience).length}
                variant="glow"
                size="default"
              />
              <StatCard
                label="Categories"
                value={getUniqueCategories(experience).length}
                variant="default"
                size="default"
              />
              <StatCard
                label="Total Amount"
                value={formatCurrency(getTotalAmount(experience))}
                variant="glow"
                size="default"
              />
            </StaggerContainer>
            <AnimatedCard variant="scale" delay={0.4}>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-700 font-medium">Date Range</div>
                <div className="text-sm text-black">{getDateRange(experience)}</div>
              </div>
            </AnimatedCard>
          </div>
        </AnimatedCard>
      )}

      {/* High-Cost Claimants Stats */}
      {hasHighCost && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            High-Cost Claimants
          </h4>
          <div className="grid gap-3">
            <StatCard
              label="Total Claimants"
              value={highCostClaimants.length}
              variant="glow"
              size="default"
            />
            <StatCard
              label="Stop Loss Hits"
              value={`${countStopLossHits(highCostClaimants)} members`}
              variant="default"
              size="default"
            />
            <StatCard
              label="Total Cost"
              value={formatCurrency(totalHighCost(highCostClaimants))}
              variant="glow"
              size="default"
            />
          </div>
          <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
            <div className="text-xs text-cyan-700 font-medium">Top Diagnosis</div>
            <div className="text-sm text-black">{topPrimaryDiagnosis(highCostClaimants)}</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-xs text-amber-700 font-medium">Avg % Plan Paid</div>
            <div className="text-sm text-black">{averagePercentPaid(highCostClaimants).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {!hasExperience && !hasHighCost && (
        <div className="text-center text-gray-500 mt-20">
          <div className="w-16 h-16 mx-auto mb-4 opacity-30">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm">Upload files to see validation results</p>
        </div>
      )}
    </div>
  )

  return (
    <FocusWrapper step={1} title="Upload CSV">
      <AppShell currentStep={1} rightPanel={rightPanelContent}>
        <StaggerContainer className="space-y-8" staggerDelay={0.15}>
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <AnimatedCard variant="slideIn">
              <h1 className="text-3xl font-bold text-black">Upload CSV</h1>
              <p className="text-gray-600 mt-2">
                Start with templates to avoid header errors. Both include required columns and sample rows.
              </p>
            </AnimatedCard>
            <AnimatedCard variant="slideIn" delay={0.1}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                  CSV Format
                </span>
                <InfoTooltip label="CSV format requirements" sections={csvFormatSections} />
              </div>
            </AnimatedCard>
          </div>

          {/* Upload Form */}
          <AnimatedCard variant="scale" whileHover={false}>
            <PremiumCard variant="glass" className="p-8">
              <CsvUploadForm />
            </PremiumCard>
          </AnimatedCard>

          {/* Continue Button */}
          {hasAllData && (
            <AnimatedCard variant="slideUp" delay={0.3} className="sticky bottom-0 bg-[var(--background)]/80 backdrop-blur-lg border-t border-white/6 p-6 -mx-8">
              <Link
                href="/dashboard/fees"
                className="btn-premium btn-premium--primary w-full justify-center"
              >
                Continue to Fees Form
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </AnimatedCard>
          )}
        </div>
      </AppShell>
    </FocusWrapper>
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

