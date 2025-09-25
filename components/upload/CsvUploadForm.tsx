'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseCSVFile } from '@/lib/csv/parser'
import {
  EXPERIENCE_TEMPLATE_FILENAME,
  EXPERIENCE_TEMPLATE_HEADERS,
  EXPERIENCE_TEMPLATE_SAMPLE_ROW,
  HIGH_COST_TEMPLATE_FILENAME,
  HIGH_COST_TEMPLATE_HEADERS,
  HIGH_COST_TEMPLATE_SAMPLE_ROW,
  coerceCurrency,
  coercePercent,
  coerceYesNo,
  downloadCsvTemplate,
  experienceLabelToMonth,
  validateCsvHeaders,
  validateExperienceHeaders,
  type HeaderValidationResult,
} from '@/lib/csv/templates'
import { ExperienceRowSchema, type ExperienceRow } from '@/lib/schemas/experience'
import { HighCostClaimantSchema, type HighCostClaimant } from '@/lib/schemas/highCost'
import { useAppStore } from '@/lib/store/useAppStore'

type UploadType = 'experience' | 'highCost'

interface UploadItem {
  id: string
  fileName: string
  status: 'processing' | 'success' | 'error'
  type?: UploadType
  message?: string
  issues?: HeaderValidationResult
  preview?: Record<string, unknown>[]
}

const MAX_FILES = 5
const DOMESTIC_HOSPITAL_CATEGORY = 'Domestic Hospital Claims'
const TOTAL_HOSPITAL_CATEGORY = 'Total Hospital Medical Claims'
const NON_DOMESTIC_HOSPITAL_CATEGORY = 'Non Domestic Hospital Claims'

export default function CsvUploadForm() {
  const { setExperience, setHighCostClaimants } = useAppStore()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDownloadExperienceTemplate = () => {
    downloadCsvTemplate(
      EXPERIENCE_TEMPLATE_FILENAME,
      EXPERIENCE_TEMPLATE_HEADERS,
      EXPERIENCE_TEMPLATE_SAMPLE_ROW,
    )
  }

  const handleDownloadHighCostTemplate = () => {
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    if (acceptedFiles.length + uploadItems.length > MAX_FILES) {
      const remaining = Math.max(MAX_FILES - uploadItems.length, 0)
      setUploadItems(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          fileName: 'Upload limit reached',
          status: 'error',
          message: `Only ${MAX_FILES} files can be processed at one time. Remove a file before adding more (remaining slots: ${remaining}).`,
        },
      ])
      return
    }

    setIsProcessing(true)

    const initialItems = acceptedFiles.map<UploadItem>(file => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      status: 'processing',
    }))

    setUploadItems(prev => [...prev, ...initialItems])

    const experienceRows: ExperienceRow[] = []
    const highCostRows: HighCostClaimant[] = []

    for (let index = 0; index < acceptedFiles.length; index++) {
      const file = acceptedFiles[index]
      const itemId = initialItems[index].id

      try {
        const { data, headers } = await parseCSVFile(file)

        const experienceValidation = validateExperienceHeaders(headers)
        const highCostValidation = validateCsvHeaders(headers, HIGH_COST_TEMPLATE_HEADERS)

        if (experienceValidation.ok) {
          const parsed = parseExperienceTemplate(data, experienceValidation.monthHeaders)
          parsed.forEach(row => experienceRows.push(row))
          updateUploadItem(itemId, {
            status: 'success',
            type: 'experience',
            message: `Loaded ${parsed.length} records`,
            preview: data.slice(0, 5),
          })
          continue
        }

        if (highCostValidation.ok) {
          const parsed = parseHighCostTemplate(data)
          parsed.forEach(row => highCostRows.push(row))
          updateUploadItem(itemId, {
            status: 'success',
            type: 'highCost',
            message: `Loaded ${parsed.length} records`,
            preview: data.slice(0, 5),
          })
          continue
        }

        const experienceHasIssues =
          experienceValidation.missing.length > 0 ||
          experienceValidation.unexpected.length > 0 ||
          experienceValidation.outOfOrder.length > 0

        const primaryIssues = experienceHasIssues ? experienceValidation : highCostValidation

        updateUploadItem(itemId, {
          status: 'error',
          message: 'Header validation failed. Verify the template and try again.',
          issues: primaryIssues,
        })
      } catch (error) {
        console.error('Upload processing error:', error)
        updateUploadItem(itemId, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to process file',
        })
      }
    }

    if (experienceRows.length > 0) {
      setExperience(experienceRows)
    }

    if (highCostRows.length > 0) {
      setHighCostClaimants(highCostRows)
    }
    setIsProcessing(false)
  }, [setExperience, setHighCostClaimants, updateUploadItem, uploadItems.length])

  const resetUploads = () => {
    setUploadItems([])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    maxFiles: MAX_FILES,
    disabled: isProcessing,
  })

  const hasUploads = uploadItems.length > 0

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-black/10 bg-white p-6">
        <h3 className="text-lg font-medium text-black mb-3">Download Templates</h3>
        <p className="text-sm text-black/70 mb-4">
          Start with the exact templates to avoid header validation errors. Both templates include
          the required columns and a sample row for reference.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownloadExperienceTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-black bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/5"
          >
            Download Experience Data CSV
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDownloadHighCostTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-black bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/5"
          >
            Download High-Cost Claimants CSV
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </section>

      <section
        {...getRootProps()}
        className={`
          cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors
          ${isDragActive ? 'border-black bg-black/5' : 'border-black/20 hover:border-black/40'}
          ${isProcessing ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-black/10">
          <svg className="h-6 w-6 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-black">Drop up to {MAX_FILES} CSV files</h3>
        <p className="mt-1 text-sm text-black/70">
          Include both the experience data and high-cost claimant templates. Files are validated instantly.
        </p>
        <p className="mt-2 text-xs text-black/50">Accepted format: .csv • Max size per file: 10MB</p>
      </section>

      {hasUploads && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-black">Upload Results</h3>
            <button
              type="button"
              onClick={resetUploads}
              className="text-sm font-medium text-black/70 hover:text-black"
            >
              Clear list
            </button>
          </div>

          <div className="space-y-4">
            {uploadItems.map(item => (
              <UploadResultCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )

  function parseExperienceTemplate(rows: any[], monthHeaders: string[]): ExperienceRow[] {
    const monthlyValues: Record<string, Record<string, number>> = {}

    rows.forEach(row => {
      const category = row['Category']
      if (!category) return

      monthHeaders.forEach(header => {
        const amount = coerceCurrency(row[header])
        const month = experienceLabelToMonth(header)
        monthlyValues[month] ??= {}
        monthlyValues[month][category] = (monthlyValues[month][category] ?? 0) + amount
      })
    })

    Object.entries(monthlyValues).forEach(([month, categories]) => {
      const domesticHospital = categories[DOMESTIC_HOSPITAL_CATEGORY]
      const totalHospital = categories[TOTAL_HOSPITAL_CATEGORY]
      let nonDomestic = categories[NON_DOMESTIC_HOSPITAL_CATEGORY]

      if (typeof totalHospital === 'number' && typeof domesticHospital === 'number' && typeof nonDomestic !== 'number') {
        nonDomestic = totalHospital - domesticHospital
        categories[NON_DOMESTIC_HOSPITAL_CATEGORY] = nonDomestic
      }

      if (typeof domesticHospital === 'number' && typeof nonDomestic === 'number' && typeof totalHospital !== 'number') {
        categories[TOTAL_HOSPITAL_CATEGORY] = domesticHospital + nonDomestic
      }
    })

    const experienceRows: ExperienceRow[] = []

    Object.entries(monthlyValues).forEach(([month, categories]) => {
      Object.entries(categories).forEach(([category, amount]) => {
        experienceRows.push(
          ExperienceRowSchema.parse({
            month,
            category,
            amount,
          }),
        )
      })
    })

    return experienceRows
  }

  function parseHighCostTemplate(rows: any[]): HighCostClaimant[] {
    return rows.map(row => HighCostClaimantSchema.parse({
      memberId: row['Member ID'],
      memberType: row['Member Type (Employee/Spouse/Dependent)'],
      ageBand: row['Age Band'],
      primaryDiagnosisCategory: row['Primary Diagnosis Category'],
      specificDiagnosisShort: row['Specific Diagnosis Details Short'],
      specificDiagnosis: row['Specific Diagnosis Details'],
      percentPlanPaid: coercePercent(row['% of Plan Paid']),
      percentLargeClaims: coercePercent(row['% of large claims']),
      total: coerceCurrency(row['Total']),
      facilityInpatient: coerceCurrency(row['Facility Inpatient']),
      facilityOutpatient: coerceCurrency(row['Facility Outpatient']),
      professional: coerceCurrency(row['Professional']),
      pharmacy: coerceCurrency(row['Pharmacy']),
      topProvider: row['Top Provider'],
      enrolled: coerceYesNo(row['Enrolled (Y/N)']),
      stopLossDeductible: coerceCurrency(row['Stop-Loss Deductible']),
      estimatedStopLossReimbursement: coerceCurrency(row['Estimated Stop-Loss Reimbursement']),
      hitStopLoss: coerceYesNo(row['Hit Stop Loss?']),
    }))
  }
}

function UploadResultCard({ item }: { item: UploadItem }) {
  const statusStyles = useMemo(() => {
    switch (item.status) {
      case 'success':
        return 'border-green-500/40 bg-green-50'
      case 'error':
        return 'border-red-500/40 bg-red-50'
      default:
        return 'border-black/20 bg-white'
    }
  }, [item.status])

  return (
    <article className={`rounded-lg border px-4 py-3 ${statusStyles}`}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-black">
              {item.fileName}
            </h4>
            {item.type && (
              <p className="text-xs uppercase tracking-wide text-black/60">
                {item.type === 'experience' ? 'Experience data' : 'High-cost claimants'}
              </p>
            )}
          </div>
          <StatusPill status={item.status} />
        </div>

        {item.message && (
          <p className="text-sm text-black/80">{item.message}</p>
        )}

        {item.issues && (
          <div className="rounded bg-white/60 p-3 text-xs text-black">
            {item.issues.missing.length > 0 && (
              <p className="mb-1"><strong>Missing:</strong> {item.issues.missing.join(', ')}</p>
            )}
            {item.issues.unexpected.length > 0 && (
              <p className="mb-1"><strong>Unexpected:</strong> {item.issues.unexpected.join(', ')}</p>
            )}
            {item.issues.outOfOrder.length > 0 && (
              <p><strong>Out of order:</strong> {item.issues.outOfOrder.join(', ')}</p>
            )}
          </div>
        )}

        {item.preview && item.preview.length > 0 && (
          <div className="overflow-x-auto rounded border border-black/10 bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-black/5">
                <tr>
                  {Object.keys(item.preview[0]).map(key => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-black">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {item.preview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-black/80">
                        {`${value ?? ''}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </article>
  )
}

function StatusPill({ status }: { status: UploadItem['status'] }) {
  const config = {
    success: { label: 'Success', className: 'bg-green-600/10 text-green-700 border border-green-600/30' },
    error: { label: 'Error', className: 'bg-red-600/10 text-red-700 border border-red-600/30' },
    processing: { label: 'Processing', className: 'bg-black/5 text-black border border-black/10' },
  } as const

  const { label, className } = config[status]

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
