'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Download, Check } from 'lucide-react'

interface DropzoneUploadProps {
  onFileUpload: (file: File) => void
  isUploading: boolean
  disabled?: boolean
  maxSize?: number // in bytes
}

export function DropzoneUpload({ 
  onFileUpload, 
  isUploading, 
  disabled = false,
  maxSize = 10 * 1024 * 1024 // 10MB default
}: DropzoneUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null)
    setIsDragActive(false)
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setUploadError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`)
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setUploadError('Invalid file type. Only CSV files are allowed.')
      } else {
        setUploadError('File upload failed. Please try again.')
      }
      return
    }
    
    // Process accepted file
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      onFileUpload(file)
    }
  }, [onFileUpload, maxSize])

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    maxSize,
    maxFiles: 1,
    disabled: disabled || isUploading,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  })

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/hcc/template')
      if (!response.ok) throw new Error('Failed to download template')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'hcc-template.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Template download error:', error)
      setUploadError('Failed to download template. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Download Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">
              Download Template First
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Use our CSV template to ensure your data has the correct format and column headers.
              The template includes sample data and all 18 required columns.
            </p>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              Download HCC Template
            </button>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive || isDragAccept 
            ? 'border-blue-400 bg-blue-50' 
            : isDragReject 
              ? 'border-red-400 bg-red-50'
              : disabled || isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">Processing file...</p>
              <p className="text-sm text-gray-600">Please wait while we validate your data</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              isDragActive || isDragAccept
                ? 'bg-blue-100'
                : isDragReject
                  ? 'bg-red-100'
                  : 'bg-gray-100'
            }`}>
              <Upload className={`w-6 h-6 ${
                isDragActive || isDragAccept
                  ? 'text-blue-600'
                  : isDragReject
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`} />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">
                {isDragActive
                  ? 'Drop your CSV file here'
                  : 'Drop CSV file here, or click to browse'
                }
              </p>
              <p className="text-sm text-gray-600">
                Maximum file size: {maxSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        )}

        {disabled && !isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-60 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 font-medium">Upload disabled</p>
          </div>
        )}
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Upload Error</h4>
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Requirements */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">File Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>CSV format only</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Maximum {maxSize / (1024 * 1024)}MB file size</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>18 required columns</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Server-side validation</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper for react-dropzone compatibility
export default DropzoneUpload