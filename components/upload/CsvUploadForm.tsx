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
      <section className="surface-card surface-card--glass p-6">
        <h3 className="text-lg font-semibold text-black mb-3">Download Templates</h3>
        <p className="text-sm text-gray-600 mb-6">
          Start with the exact templates to avoid header validation errors. Both templates include
          the required columns and a sample row for reference.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownloadExperienceTemplate}
            className="btn-premium btn-premium--secondary"
          >
            Experience Data CSV
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDownloadHighCostTemplate}
            className="btn-premium btn-premium--secondary"
          >
            High-Cost Claimants CSV
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </section>

      <section
        {...getRootProps()}
        className={`
          relative overflow-hidden cursor-pointer p-12 text-center
          border-2 border-dashed rounded-2xl transition-all duration-300 ease-out
          ${isDragActive 
            ? 'border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.02] shadow-lg' 
            : 'border-gray-300 bg-[var(--background-elevated)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent-soft)]/30'
          }
          ${isProcessing ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Animated Background Pattern */}
        <div className={`absolute inset-0 opacity-5 transition-opacity duration-500 ${
          isDragActive ? 'opacity-10' : ''
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-transparent"></div>
        </div>
        
        {/* Upload Icon */}
        <div className={`relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
          isDragActive 
            ? 'bg-[var(--accent)]/20 border-2 border-[var(--accent)] scale-110' 
            : 'bg-gray-100 border border-gray-200 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30'
        }`}>
          <svg className={`h-10 w-10 transition-all duration-300 ${
            isDragActive ? 'text-[var(--accent)] scale-110' : 'text-gray-500'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          {/* Pulse animation on drag */}
          {isDragActive && (
            <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] animate-ping"></div>
          )}
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className={`text-2xl font-semibold mb-3 transition-colors duration-300 ${
            isDragActive ? 'text-[var(--accent)]' : 'text-black'
          }`}>
            {isDragActive ? 'Drop files here!' : `Drop up to ${MAX_FILES} CSV files`}
          </h3>
          
          {!isDragActive && (
            <>
              <p className="text-gray-600 mb-2 text-lg">
                Include both the experience data and high-cost claimant templates
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Files are validated instantly • Accepted format: .csv • Max size per file: 10MB
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                or click to browse files
              </div>
            </>
          )}
          
          {isDragActive && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-[var(--accent)] font-medium text-lg mb-2">
                <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Release to upload
                <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-[var(--accent)]/70">
                Files will be processed automatically
              </p>
            </div>
          )}
        </div>
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-[var(--accent)]">Processing files...</p>
            </div>
          </div>
        )}
      </section>

      {hasUploads && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Upload Results</h3>
            <button
              type="button"
              onClick={resetUploads}
              className="btn-premium btn-premium--ghost text-sm"
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
        return 'surface-card--glow border-emerald-200'
      case 'error':
        return 'border-red-200'
      default:
        return 'border-black/10'
    }
  }, [item.status])

  return (
    <article className={`surface-card ${statusStyles} px-6 py-4`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-black">
              {item.fileName}
            </h4>
            {item.type && (
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.type === 'experience' ? 'Experience data' : 'High-cost claimants'}
              </p>
            )}
          </div>
          <StatusPill status={item.status} />
        </div>

        {item.message && (
          <p className="text-sm text-gray-600">{item.message}</p>
        )}

        {item.issues && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
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
          <div className="overflow-x-auto rounded-lg border border-black/10 bg-gray-50">
            <table className="min-w-full text-xs">
              <thead className="bg-black/5">
                <tr>
                  {Object.keys(item.preview[0]).map(key => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {item.preview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-gray-600">
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
    success: { 
      label: 'Success', 
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    error: { 
      label: 'Error', 
      className: 'bg-red-50 text-red-700 border border-red-200',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    processing: { 
      label: 'Processing', 
      className: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      icon: (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    },
  } as const

  const { label, className, icon } = config[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {icon}
      {label}
    </span>
  )
}
