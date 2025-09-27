'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseCSVFile } from '@/lib/csv/parser'
import {
  EXPERIENCE_TEMPLATE_FILENAME,
  EXPERIENCE_TEMPLATE_HEADERS,
  EXPERIENCE_TEMPLATE_SAMPLE_ROW,
  downloadCsvTemplate,
  experienceLabelToMonth,
  validateExperienceHeaders,
  type HeaderValidationResult,
} from '@/lib/csv/templates'
import { ExperienceRowSchema, type ExperienceRow } from '@/lib/schemas/experience'
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

const DOMESTIC_HOSPITAL_CATEGORY = 'Domestic Hospital Claims'
const TOTAL_HOSPITAL_CATEGORY = 'Total Hospital Medical Claims'
const NON_DOMESTIC_HOSPITAL_CATEGORY = 'Non Domestic Hospital Claims'

export default function ExperienceUpload() {
  const { setExperience } = useAppStore()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(
      EXPERIENCE_TEMPLATE_FILENAME,
      EXPERIENCE_TEMPLATE_HEADERS,
      EXPERIENCE_TEMPLATE_SAMPLE_ROW,
    )
  }

  const updateUploadItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploadItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item)),
    )
  }, [])

  const parseExperienceTemplate = (
    data: Record<string, unknown>[],
    monthHeaders: string[],
  ): ExperienceRow[] => {
    const experienceData: ExperienceRow[] = []
    const domesticRow = data.find(row => row.Category === DOMESTIC_HOSPITAL_CATEGORY)
    const totalRow = data.find(row => row.Category === TOTAL_HOSPITAL_CATEGORY)

    if (!domesticRow || !totalRow) {
      throw new Error('Missing required categories: Domestic Hospital Claims and Total Hospital Medical Claims')
    }

    monthHeaders.forEach(header => {
      const month = experienceLabelToMonth(header)
      if (!month) return

      const domesticValue = Number(domesticRow[header] || 0)
      const totalValue = Number(totalRow[header] || 0)
      const nonDomesticValue = totalValue - domesticValue

      experienceData.push(
        ExperienceRowSchema.parse({
          month,
          category: DOMESTIC_HOSPITAL_CATEGORY,
          amount: domesticValue,
        }),
      )

      experienceData.push(
        ExperienceRowSchema.parse({
          month,
          category: TOTAL_HOSPITAL_CATEGORY,
          amount: totalValue,
        }),
      )

      if (nonDomesticValue !== 0) {
        experienceData.push(
          ExperienceRowSchema.parse({
            month,
            category: NON_DOMESTIC_HOSPITAL_CATEGORY,
            amount: nonDomesticValue,
          }),
        )
      }
    })

    return experienceData
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
      const validation = validateExperienceHeaders(headers)

      if (validation.ok) {
        const parsed = parseExperienceTemplate(data, validation.monthHeaders)
        setExperience(parsed)
        updateUploadItem(itemId, {
          status: 'success',
          message: `Loaded ${parsed.length} experience records`,
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
      console.error('Experience upload processing error:', error)
      updateUploadItem(itemId, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to process file',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [setExperience, updateUploadItem])

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
  ]

  return (
    <div className="space-y-8">
      {/* Template Download */}
      <PremiumCard variant="default" className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Experience Data Template
            </h3>
            <p className="text-gray-600 text-sm">
              Download the template to ensure your data is formatted correctly
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">
            {isProcessing ? 'Processing...' : 'Upload Experience Data'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isDragActive
              ? 'Drop your CSV file here'
              : 'Drag and drop your experience data CSV file here, or click to browse'}
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