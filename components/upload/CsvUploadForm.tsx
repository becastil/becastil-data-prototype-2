'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '@/lib/store/useAppStore'
import { ExperienceRowSchema, MemberClaimSchema, CSV_HEADER_MAPPINGS } from '@/lib/schemas/experience'
import { parseCSVFile, detectDataType, mapHeaders } from '@/lib/csv/parser'

interface UploadState {
  status: 'idle' | 'uploading' | 'mapping' | 'processing' | 'success' | 'error'
  progress: number
  message: string
  error?: string
}

interface HeaderMapping {
  csvHeader: string
  mappedField: string
}

export default function CsvUploadForm() {
  const { setExperience, setMemberClaims } = useAppStore()
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  })
  const [csvData, setCsvData] = useState<any[] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [dataType, setDataType] = useState<'experience' | 'member' | null>(null)
  const [headerMappings, setHeaderMappings] = useState<HeaderMapping[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadState({ status: 'uploading', progress: 10, message: 'Reading CSV file...' })

    try {
      // Parse CSV file
      const { data, headers } = await parseCSVFile(file)
      setCsvData(data)
      setHeaders(headers)

      setUploadState({ status: 'uploading', progress: 30, message: 'Analyzing data structure...' })

      // Detect data type
      const detectedType = detectDataType(data, headers)
      setDataType(detectedType)

      setUploadState({ status: 'uploading', progress: 50, message: 'Mapping headers...' })

      // Auto-map headers
      const mappings = mapHeaders(headers, detectedType)
      const needsMapping = mappings.some(m => !m.mappedField)

      if (needsMapping) {
        setHeaderMappings(mappings)
        setUploadState({ status: 'mapping', progress: 60, message: 'Please confirm field mappings' })
      } else {
        await processData(data, mappings, detectedType)
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({
        status: 'error',
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Failed to process CSV file'
      })
    }
  }, [])

  const processData = async (data: any[], mappings: HeaderMapping[], type: 'experience' | 'member') => {
    setUploadState({ status: 'processing', progress: 70, message: 'Validating data...' })

    try {
      const mappedData = data.map(row => {
        const mapped: any = {}
        mappings.forEach(mapping => {
          if (mapping.mappedField && mapping.csvHeader) {
            mapped[mapping.mappedField] = row[mapping.csvHeader]
          }
        })
        return mapped
      })

      setUploadState({ status: 'processing', progress: 85, message: 'Saving data...' })

      if (type === 'experience') {
        const validated = mappedData.map(row => ExperienceRowSchema.parse(row))
        setExperience(validated)
      } else {
        const validated = mappedData.map(row => MemberClaimSchema.parse(row))
        setMemberClaims(validated)
      }

      setUploadState({
        status: 'success',
        progress: 100,
        message: `Successfully imported ${data.length} rows of ${type} data`
      })

    } catch (error) {
      console.error('Validation error:', error)
      setUploadState({
        status: 'error',
        progress: 0,
        message: '',
        error: `Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const confirmMapping = () => {
    if (csvData && headerMappings && dataType) {
      processData(csvData, headerMappings, dataType)
    }
  }

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0, message: '' })
    setCsvData(null)
    setHeaders([])
    setDataType(null)
    setHeaderMappings([])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing',
  })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Area */}
      {uploadState.status === 'idle' && (
        <div>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Drop your CSV file here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to select a file
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Maximum file size: 10MB
            </p>
          </div>

          {/* Sample Data Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Need a template? Download sample data:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href="/templates/experience-data.csv"
                download
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Experience Data Template
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </a>
              <a
                href="/templates/member-claims.csv"
                download
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Member Claims Template
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {uploadState.message}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Header Mapping */}
      {uploadState.status === 'mapping' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Confirm Field Mappings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We detected this as <strong>{dataType}</strong> data. Please confirm the field mappings:
          </p>
          
          <div className="space-y-4 mb-6">
            {headerMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CSV Column: {mapping.csvHeader}
                  </label>
                </div>
                <div className="flex-1">
                  <select
                    value={mapping.mappedField}
                    onChange={(e) => {
                      const newMappings = [...headerMappings]
                      newMappings[index].mappedField = e.target.value
                      setHeaderMappings(newMappings)
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">-- Select Field --</option>
                    {dataType === 'experience' 
                      ? Object.keys(CSV_HEADER_MAPPINGS.experience).map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))
                      : Object.keys(CSV_HEADER_MAPPINGS.member).map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))
                    }
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={confirmMapping}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Confirm & Import
            </button>
            <button
              onClick={resetUpload}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {uploadState.status === 'success' && (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Upload Complete!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {uploadState.message}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetUpload}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {uploadState.status === 'error' && (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Upload Failed
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {uploadState.error}
          </p>
          <button
            onClick={resetUpload}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}