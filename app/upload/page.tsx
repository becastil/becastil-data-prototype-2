'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import FileUpload from '@/app/components/FileUpload'
import ProgressTracker from '@/app/components/ProgressTracker'
import DataReview from '@/app/components/DataReview'
import ColumnMapper from '@/app/components/ColumnMapper'
import ValidationPanel from '@/app/components/ValidationPanel'
import { useNotifications } from '@/components/NotificationProvider'
import { UploadFile } from '@/app/types/upload'
import { ProcessingResult } from '@/app/types/claims'
import { CSVParser } from '@/app/lib/csv-parser'
import { ColumnMapper as MapperService } from '@/app/lib/csv/column-mapper'
import { 
  CSVSchemaType, 
  ColumnMapping, 
  SchemaValidationResult,
  HEALTHCARE_COST_EXPECTED_COLUMNS,
  HIGH_COST_CLAIMANT_EXPECTED_COLUMNS
} from '@/app/lib/csv/schemas'
import { FileText, Download, ArrowRight, Shield, LineChart, BarChart3, Upload as UploadIcon } from '@/app/components/icons'

interface ParsedCSV {
  file: File
  data: any[]
  headers: string[]
  schemaType: CSVSchemaType
  preview: any[]
}

const uploadOptions = [
  {
    id: 'claims-analysis',
    title: 'Healthcare Claims Analysis',
    description: 'Upload claims data for comprehensive analysis with interactive tables and export capabilities',
    href: '/reports/claims-analysis',
    icon: FileText,
    color: 'blue',
    features: ['Interactive data tables', 'Monthly trend analysis', 'CSV/XLSX export', 'Validation checks'],
    sampleFile: 'claims-sample.csv'
  },
  {
    id: 'hcc-analysis',
    title: 'HCC Risk Analysis',
    description: 'Analyze Hierarchical Condition Category data for risk assessment and compliance',
    href: '/hcc',
    icon: Shield,
    color: 'green',
    features: ['Risk score calculation', 'Compliance validation', 'Member analytics', 'Detailed reporting'],
    sampleFile: 'hcc-sample.csv'
  },
  {
    id: 'csv-visualizer',
    title: 'CSV Data Visualizer',
    description: 'Upload any CSV file and generate automated insights with AI-powered analysis',
    href: '/tools/csv-visualizer',
    icon: LineChart,
    color: 'purple',
    features: ['AI-generated insights', 'Dynamic charts', 'Statistical analysis', 'Custom visualizations'],
    sampleFile: 'general-data.csv'
  },
  {
    id: 'healthcare-costs',
    title: 'Healthcare Cost Analysis',
    description: 'Analyze healthcare cost trends and patterns with detailed breakdowns',
    href: '/dashboards/healthcare-costs',
    icon: BarChart3,
    color: 'orange',
    features: ['Cost trend analysis', 'Budget comparisons', 'Predictive modeling', 'ROI calculations'],
    sampleFile: 'costs-sample.csv'
  }
]

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedCSVs, setParsedCSVs] = useState<ParsedCSV[]>([])
  const [currentMappings, setCurrentMappings] = useState<Record<string, ColumnMapping[]>>({})
  const [validationResults, setValidationResults] = useState<Record<string, SchemaValidationResult>>({})
  const [currentStep, setCurrentStep] = useState<'upload' | 'map' | 'process' | 'review'>('upload')
  const [showUploadCenter, setShowUploadCenter] = useState(true)
  const { addNotification, removeNotification } = useNotifications()

  const parseCSVFile = useCallback(async (uploadFile: UploadFile) => {
    try {
      const fileName = uploadFile.file.name
      addNotification({
        title: 'Parsing CSV',
        message: `Analyzing ${fileName}`,
        variant: 'info',
        autoDismissMs: 4000,
      })

      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 25 }
          : f
      ))

      // Parse CSV file
      const result = await CSVParser.parseFile(uploadFile.file)
      
      // Detect schema type
      const schemaType = MapperService.detectSchemaType(result.headers)
      
      // Get preview data
      const preview = result.data.slice(0, 5)
      
      // Create parsed CSV object
      const parsedCSV: ParsedCSV = {
        file: uploadFile.file,
        data: result.data,
        headers: result.headers,
        schemaType,
        preview
      }

      setParsedCSVs(prev => [...prev, parsedCSV])

      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              recordCount: result.data.length,
              previewData: preview
            }
          : f
      ))

      addNotification({
        title: 'CSV parsed successfully',
        message: `${fileName} • ${result.data.length.toLocaleString()} rows • Schema: ${schemaType}`,
        variant: 'success',
      })

      // Auto-advance to mapping step if this is the first file
      if (parsedCSVs.length === 0) {
        setCurrentStep('map')
      }

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Parse failed' 
            }
          : f
      ))
      addNotification({
        title: 'Parse error',
        message: error instanceof Error ? error.message : 'Failed to parse CSV',
        variant: 'error',
        autoDismissMs: 8000,
      })
    }
  }, [addNotification, parsedCSVs.length])

  const handleFilesSelected = useCallback(async (newFiles: UploadFile[]) => {
    setFiles(prev => [...prev, ...newFiles])

    for (const file of newFiles) {
      await parseCSVFile(file)
    }
  }, [parseCSVFile])

  const handleMappingChange = useCallback((fileName: string, mappings: ColumnMapping[]) => {
    setCurrentMappings(prev => ({
      ...prev,
      [fileName]: mappings
    }))
  }, [])

  const validateMappings = useCallback(() => {
    const results: Record<string, SchemaValidationResult> = {}
    
    parsedCSVs.forEach(csv => {
      const mappings = currentMappings[csv.file.name] || []
      const validation = MapperService.validateMappings(mappings, csv.schemaType)
      
      results[csv.file.name] = {
        schemaType: csv.schemaType,
        isValid: validation.isValid,
        validRows: csv.data.length,
        totalRows: csv.data.length,
        errors: validation.missingRequired.map(field => ({
          row: 0,
          field,
          message: 'Required field not mapped',
          value: null
        })),
        warnings: [],
        missingColumns: validation.missingRequired,
        extraColumns: csv.headers.filter(h => 
          !mappings.some(m => m.source === h)
        ),
        suggestions: MapperService.getSuggestions(csv.headers, csv.schemaType)
      }
    })
    
    setValidationResults(results)
    setCurrentStep('process')
  }, [parsedCSVs, currentMappings])

  const handleFileUpdate = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ))
  }, [])

  const processFiles = async () => {
    const completedFiles = files.filter(f => f.status === 'completed')
    if (completedFiles.length === 0) return

    const processingNoticeId = addNotification({
      title: 'Processing queued',
      message: `Normalizing ${completedFiles[0].name} and generating insights`,
      variant: 'info',
      persistent: true,
      autoDismissMs: 0,
    })

    setIsProcessing(true)
    
    try {
      // For now, process the first completed file
      const file = completedFiles[0]
      
      // Convert file to base64 for API
      const fileBuffer = await file.file.arrayBuffer()
      const fileData = Buffer.from(fileBuffer).toString('base64')

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: file.id,
          fileData,
          // Use auto-detected mapping or provide custom mapping
          mapping: null, // Let the API auto-detect
          options: {
            strictMode: false,
            skipInvalidRows: true,
            maxErrors: 1000
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setProcessingResult(result.result)
        removeNotification(processingNoticeId)
        addNotification({
          title: 'Processing complete',
          message: `${file.name} • ${result.result.claims.length.toLocaleString()} claims ready for review`,
          variant: 'success',
        })
      } else {
        console.error('Processing failed:', result.message)
        // Handle error - show notification
        removeNotification(processingNoticeId)
        addNotification({
          title: 'Processing failed',
          message: result.message || `Unable to process ${file.name}`,
          variant: 'error',
          autoDismissMs: 8000,
        })
      }
    } catch (error) {
      console.error('Processing error:', error)
      // Handle error - show notification
      removeNotification(processingNoticeId)
      addNotification({
        title: 'Processing error',
        message: error instanceof Error ? error.message : 'Unexpected processing error',
        variant: 'error',
        autoDismissMs: 8000,
      })
    } finally {
      setIsProcessing(false)
      removeNotification(processingNoticeId)
    }
  }

  const handleExport = useCallback((format: 'csv' | 'json') => {
    if (!processingResult) return

    const data = processingResult.claims
    let content: string
    let filename: string
    let mimeType: string

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Claimant ID', 'Claim Date', 'Service Type', 'Medical Amount', 
        'Pharmacy Amount', 'Total Amount', 'ICD Code', 'Provider', 'Location'
      ]
      
      const csvRows = [
        headers.join(','),
        ...data.map(claim => [
          `"${claim.claimantId}"`,
          `"${new Date(claim.claimDate).toLocaleDateString()}"`,
          `"${claim.serviceType}"`,
          claim.medicalAmount,
          claim.pharmacyAmount,
          claim.totalAmount,
          `"${claim.icdCode || ''}"`,
          `"${claim.provider || ''}"`,
          `"${claim.location || ''}"`
        ].join(','))
      ]
      
      content = csvRows.join('\n')
      filename = `processed-claims-${new Date().toISOString().split('T')[0]}.csv`
      mimeType = 'text/csv'
    } else {
      // Generate JSON
      content = JSON.stringify(data, null, 2)
      filename = `processed-claims-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addNotification({
      title: `Exported ${format.toUpperCase()}`,
      message: `Downloaded ${filename}`,
      variant: 'success',
      autoDismissMs: 5000,
    })
  }, [processingResult, addNotification])

  const completedFilesCount = files.filter(f => f.status === 'completed').length
  const hasProcessedData = processingResult !== null

  const getSchemaTypeLabel = (type: CSVSchemaType) => {
    switch (type) {
      case CSVSchemaType.HEALTHCARE_COSTS:
        return 'Healthcare Costs'
      case CSVSchemaType.HIGH_COST_CLAIMANTS:
        return 'High Cost Claimants'
      default:
        return 'Unknown'
    }
  }

  const getExpectedColumns = (type: CSVSchemaType) => {
    switch (type) {
      case CSVSchemaType.HEALTHCARE_COSTS:
        return HEALTHCARE_COST_EXPECTED_COLUMNS
      case CSVSchemaType.HIGH_COST_CLAIMANTS:
        return HIGH_COST_CLAIMANT_EXPECTED_COLUMNS
      default:
        return []
    }
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
      case 'green':
        return 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
      case 'purple':
        return 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700'
      case 'orange':
        return 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700'
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
    }
  }

  if (showUploadCenter) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Data Upload Center
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the type of analysis you'd like to perform. Each option provides specialized tools 
              and insights tailored to your data type.
            </p>
          </div>

          {/* Upload Options Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {uploadOptions.map((option) => {
              const Icon = option.icon
              const colorClasses = getColorClasses(option.color)
              
              return (
                <div
                  key={option.id}
                  className={`rounded-xl border-2 p-8 transition-all duration-200 hover:shadow-lg ${colorClasses}`}
                >
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`flex-shrink-0 rounded-lg p-3 ${option.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                      option.color === 'green' ? 'bg-green-100 text-green-600' :
                      option.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'}`}>
                      <Icon className="h-8 w-8" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {option.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2 mb-6">
                        {option.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      <div className="flex items-center gap-4">
                        <Link
                          href={option.href}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            option.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                            option.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            option.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                            'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          <UploadIcon className="h-4 w-4" />
                          Start Analysis
                        </Link>
                        
                        <button className="text-sm text-gray-500 hover:text-gray-700">
                          Download Sample ({option.sampleFile})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* General Upload Section */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <UploadIcon className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                General CSV Processing
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Need to process a different type of CSV? Use our general upload tool with column mapping 
                and custom schema validation.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowUploadCenter(false)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <UploadIcon className="h-5 w-5" />
                Use General Upload Tool
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Upload Center */}
        <div className="mb-8">
          <button
            onClick={() => setShowUploadCenter(true)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Upload Center
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            General CSV Processing
          </h1>
          <p className="mt-2 text-gray-600">
            Upload CSVs, map columns, and generate instant analytics dashboards
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${files.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                files.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Upload & Parse</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentStep !== 'upload' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep !== 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep !== 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Map Columns</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentStep === 'process' || currentStep === 'review' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep === 'process' || currentStep === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'process' || currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Generate Dashboards</span>
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="space-y-8">
            {/* Upload Limits Info */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Requirements</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800"><strong>Max 3 files</strong> at once</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800"><strong>Max 100MB</strong> per file</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800"><strong>CSV format</strong> only</span>
                </div>
              </div>
            </div>

            {/* Template Downloads */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Download CSV Templates</h3>
              <p className="text-gray-600 mb-6">
                Use these templates to ensure your data has the correct format and column headers.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Healthcare Costs Template</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Monthly cost data by category (medical claims, pharmacy, stop loss, etc.)
                  </p>
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <div><strong>Required columns:</strong> Category + 12 monthly columns</div>
                    <div><strong>Format:</strong> Category, Jan-2024, Feb-2024, Mar-2024...</div>
                  </div>
                  <a
                    href="/templates/healthcare-costs-template.csv"
                    download="healthcare-costs-template.csv"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </a>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">High Cost Claimants Template</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Individual claimant data with demographics, costs, and monthly trends
                  </p>
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <div><strong>Required columns:</strong> Claimant_ID, Total_Paid_YTD, Jan_2024...</div>
                    <div><strong>Format:</strong> Mix of text, numbers, and monthly data columns</div>
                  </div>
                  <a
                    href="/templates/high-cost-claimants-template.csv"
                    download="high-cost-claimants-template.csv"
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </a>
                </div>
              </div>
            </div>

            <FileUpload 
              onFilesSelected={handleFilesSelected}
              maxFiles={3}
              maxSize={100 * 1024 * 1024} // 100MB
              disabled={isProcessing}
            />

            {files.length > 0 && (
              <ProgressTracker 
                files={files}
                onFileUpdate={handleFileUpdate}
              />
            )}

            {parsedCSVs.length > 0 && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentStep('map')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Continue to Column Mapping
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mapping Step */}
        {currentStep === 'map' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Column Mapping</h2>
              <p className="text-gray-600">
                Review and adjust how your CSV columns map to our expected schema
              </p>
            </div>

            {parsedCSVs.map((csv, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{csv.file.name}</h3>
                    <p className="text-sm text-gray-600">
                      {csv.data.length.toLocaleString()} rows • Schema: {getSchemaTypeLabel(csv.schemaType)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Expected columns: {getExpectedColumns(csv.schemaType).length}</div>
                    <div className="text-sm text-gray-600">Your columns: {csv.headers.length}</div>
                  </div>
                </div>

                <ColumnMapper
                  sourceColumns={csv.headers}
                  schemaType={csv.schemaType}
                  onMappingChange={(mappings) => handleMappingChange(csv.file.name, mappings)}
                />

                {/* Data Preview */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Data Preview</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {csv.headers.map((header, i) => (
                            <th key={i} className="text-left py-2 px-3 font-medium text-gray-700 bg-gray-50">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csv.preview.map((row, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            {csv.headers.map((header, j) => (
                              <td key={j} className="py-2 px-3 text-gray-600">
                                {String(row[header] || '').slice(0, 50)}
                                {String(row[header] || '').length > 50 && '...'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={validateMappings}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Validate & Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Process Step */}
        {currentStep === 'process' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Validation Results</h2>
              <p className="text-gray-600">
                Review validation results and generate your analytics dashboards
              </p>
            </div>

            {Object.entries(validationResults).map(([fileName, result]) => (
              <ValidationPanel
                key={fileName}
                validationResult={result}
                onRetry={() => setCurrentStep('map')}
              />
            ))}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('map')}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Back to Mapping
              </button>
              
              <div className="space-x-4">
                {parsedCSVs.some(csv => csv.schemaType === CSVSchemaType.HEALTHCARE_COSTS) && (
                  <a
                    href="/dashboards/healthcare-costs"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    Healthcare Costs Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
                
                {parsedCSVs.some(csv => csv.schemaType === CSVSchemaType.HIGH_COST_CLAIMANTS) && (
                  <a
                    href="/dashboards/high-cost-claimants"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                  >
                    High Cost Claimants Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
