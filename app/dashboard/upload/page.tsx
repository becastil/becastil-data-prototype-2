'use client'

import { useExperienceData } from '@/lib/store/useAppStore'
import CsvUploadForm from '@/components/upload/CsvUploadForm'
import Link from 'next/link'

export default function UploadPage() {
  const experience = useExperienceData()
  const hasData = experience.length > 0
  
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Step 1: Upload Your Data
          </h1>
          <p className="text-lg text-black max-w-2xl mx-auto">
            Upload your healthcare experience data CSV file to begin the analysis process.
            We support both aggregated monthly data and detailed member-level claims.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-sm border border-black/10 p-8 mb-8">
          <CsvUploadForm />
        </div>

        {/* Data Summary */}
        {hasData && (
          <div className="bg-white border border-black/10 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-black mb-1">
                  Data Successfully Loaded
                </h3>
                <p className="text-black mb-4">
                  {experience.length} rows of experience data have been imported and are ready for analysis.
                </p>
                
                {/* Data Preview */}
                <div className="bg-white rounded-md p-4 border border-black/10">
                  <h4 className="font-medium text-black mb-3">
                    Data Preview:
                  </h4>
                  <div className="text-sm text-black">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium">Months:</span> {getUniqueMonths(experience).length}
                      </div>
                      <div>
                        <span className="font-medium">Categories:</span> {getUniqueCategories(experience).length}
                      </div>
                      <div>
                        <span className="font-medium">Date Range:</span> {getDateRange(experience)}
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span> ${getTotalAmount(experience).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-black mb-3">
            CSV Format Requirements
          </h3>
          <div className="text-sm text-black space-y-2">
            <p><strong>For Experience Data:</strong> Include columns for Month (YYYY-MM), Category, Amount, and optionally Premium</p>
            <p><strong>For Member Claims:</strong> Include columns for Member ID, Month, Paid Amount, and optionally Diagnosis/Service Type</p>
            <p><strong>File Requirements:</strong> CSV format, maximum 10MB, UTF-8 encoding recommended</p>
          </div>
        </div>

        {/* Next Step */}
        {hasData && (
          <div className="text-center">
            <Link 
              href="/dashboard/fees"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg border border-black hover:bg-black/5 transition-colors"
            >
              Continue to Fees Form
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  return [...new Set(data.map(row => row.month))].sort()
}

function getUniqueCategories(data: any[]): string[] {
  return [...new Set(data.map(row => row.category))]
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
