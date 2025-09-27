'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseCSVFile } from '@/lib/csv/parser'
import {
  HIGH_COST_TEMPLATE_FILENAME,
  HIGH_COST_TEMPLATE_HEADERS,
  HIGH_COST_TEMPLATE_SAMPLE_ROW,
  coerceCurrency,
  coercePercent,
  coerceYesNo,
  downloadCsvTemplate,
  validateCsvHeaders,
  type HeaderValidationResult,
} from '@/lib/csv/templates'
import { HighCostClaimantSchema, type HighCostClaimant } from '@/lib/schemas/highCost'
import { useAppStore } from '@/lib/store/useAppStore'
import PremiumCard from '@/components/ui/PremiumCard'
import InfoTooltip from '@/components/ui/InfoTooltip'

interface UploadItem {
  id: string
  fileName: string
  status: 'processing' | 'success' | 'error'
  message?: string
  issues?: HeaderValidationResult
  preview?: Record<string, unknown>[]
}

export default function HighCostUpload() {
  const { setHighCostClaimants } = useAppStore()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(
      HIGH_COST_TEMPLATE_FILENAME,
      HIGH_COST_TEMPLATE_HEADERS,
      HIGH_COST_TEMPLATE_SAMPLE_ROW,
    )
  }

  const updateUploadItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploadItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item)),
    )
  }, [])

  const parseHighCostTemplate = (data: Record<string, unknown>[]): HighCostClaimant[] => {
    return data.map(row => {
      const parsed = {
        ...row,
        percentPlanPaid: coercePercent(row['Percent Plan Paid']),
        enrolledAtTimeOfClaim: coerceYesNo(row['Enrolled at Time of Claim']),
        hitStopLoss: coerceYesNo(row['Hit Stop Loss']),
        total: coerceCurrency(row['Total']),
      }
      return HighCostClaimantSchema.parse(parsed)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsProcessing(true)

    const file = acceptedFiles[0] // Only process first file
    const itemId = crypto.randomUUID()

    const initialItem: UploadItem = {
      id: itemId,
      fileName: file.name,
      status: 'processing',
    }

    setUploadItems([initialItem])

    try {
      const { data, headers } = await parseCSVFile(file)
      const validation = validateCsvHeaders(headers, HIGH_COST_TEMPLATE_HEADERS)

      if (validation.ok) {
        const parsed = parseHighCostTemplate(data)
        setHighCostClaimants(parsed)
        updateUploadItem(itemId, {
          status: 'success',
          message: `Loaded ${parsed.length} high cost claimant records`,
          preview: data.slice(0, 5),
        })
      } else {
        updateUploadItem(itemId, {
          status: 'error',
          message: 'Header validation failed. Please verify the template and try again.',
          issues: validation,
        })
      }
    } catch (error) {
      console.error('High cost upload processing error:', error)
      updateUploadItem(itemId, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to process file',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [setHighCostClaimants, updateUploadItem])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  })

  const csvFormatSections = [
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
  ]

  return (
    <div className="space-y-8">
      {/* Template Download */}
      <PremiumCard variant="default" className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black mb-2">
              High Cost Claimants Template
            </h3>
            <p className="text-gray-600 text-sm">
              Download the template for high cost claimant data formatting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <InfoTooltip label="CSV format requirements" sections={csvFormatSections} />
            <button
              onClick={handleDownloadTemplate}
              className="btn-premium btn-premium--secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Download Template
            </button>
          </div>
        </div>
      </PremiumCard>

      {/* Upload Area */}
      <PremiumCard variant="glass" className="p-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragActive
              ? 'border-black bg-black/5'
              : 'border-black/20 hover:border-black/40 hover:bg-black/2'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 text-black/40">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">
            {isProcessing ? 'Processing...' : 'Upload High Cost Claimants'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isDragActive
              ? 'Drop your CSV file here'
              : 'Drag and drop your high cost claimants CSV file here, or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            Supports CSV files up to 10MB
          </p>
        </div>
      </PremiumCard>

      {/* Upload Results */}
      {uploadItems.length > 0 && (
        <div className="space-y-4">
          {uploadItems.map(item => (
            <PremiumCard
              key={item.id}
              variant={item.status === 'success' ? 'glow' : 'default'}
              className="p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {item.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  )}
                  {item.status === 'success' && (
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-black">{item.fileName}</h4>
                  {item.message && (
                    <p className={`text-sm mt-1 ${
                      item.status === 'error' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {item.message}
                    </p>
                  )}
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  )
}