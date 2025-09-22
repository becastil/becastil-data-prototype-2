'use client'

import { useState, useCallback } from 'react'
import FileUpload from '@/app/components/FileUpload'
import ProgressTracker from '@/app/components/ProgressTracker'
import DataReview from '@/app/components/DataReview'
import { UploadFile } from '@/app/types/upload'
import { ClaimRecord, ValidationError, FieldMapping, ProcessingResult } from '@/app/types/claims'

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFilesSelected = useCallback(async (newFiles: UploadFile[]) => {
    setFiles(prev => [...prev, ...newFiles])
    
    // Auto-upload files
    for (const file of newFiles) {
      await uploadFile(file)
    }
  }, [])

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      const formData = new FormData()
      formData.append('file', uploadFile.file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                carrier: result.carrier,
                recordCount: result.recordCount,
                previewData: result.previewData
              }
            : f
        ))
      } else {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'failed', error: result.message }
            : f
        ))
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ))
    }
  }

  const handleFileUpdate = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ))
  }, [])

  const processFiles = async () => {
    const completedFiles = files.filter(f => f.status === 'completed')
    if (completedFiles.length === 0) return

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
      } else {
        console.error('Processing failed:', result.message)
        // Handle error - show notification
      }
    } catch (error) {
      console.error('Processing error:', error)
      // Handle error - show notification
    } finally {
      setIsProcessing(false)
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
  }, [processingResult])

  const completedFilesCount = files.filter(f => f.status === 'completed').length
  const hasProcessedData = processingResult !== null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Healthcare Claims Data Processing
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload CSV files for automatic format detection, validation, and normalization
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
              <span className="ml-2 text-sm font-medium">Upload Files</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${completedFilesCount > 0 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${completedFilesCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                completedFilesCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Process Data</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${hasProcessedData ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${hasProcessedData ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                hasProcessedData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Review & Export</span>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            maxSize={100 * 1024 * 1024} // 100MB
            disabled={isProcessing}
          />
        </div>

        {/* Progress Tracking */}
        {files.length > 0 && (
          <ProgressTracker 
            files={files}
            onFileUpdate={handleFileUpdate}
          />
        )}

        {/* Process Button */}
        {completedFilesCount > 0 && !hasProcessedData && (
          <div className="mt-8 text-center">
            <button
              onClick={processFiles}
              disabled={isProcessing}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Process ${completedFilesCount} File${completedFilesCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Data Review */}
        {hasProcessedData && processingResult && (
          <div className="mt-8">
            <DataReview
              claims={processingResult.claims}
              errors={processingResult.errors}
              mapping={processingResult.mapping}
              onExport={handleExport}
            />
          </div>
        )}

        {/* Processing Summary */}
        {hasProcessedData && processingResult && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Processing Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Detected Carrier:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {processingResult.carrier || 'Unknown'} 
                  {processingResult.confidence && (
                    <span className="text-green-600 dark:text-green-400">
                      ({processingResult.confidence}% confidence)
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Data Quality:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {processingResult.stats.dataCompleteness}% complete
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Processing Time:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}