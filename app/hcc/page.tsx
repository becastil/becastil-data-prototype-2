'use client'

import { useState } from 'react'
import DropzoneUpload from './components/DropzoneUpload'
import { ValidationResults } from './components/ValidationResults'
import { FileText, BarChart3, ArrowRight } from 'lucide-react'
import type { HCCValidationResult, HCCAnalytics } from './lib/schema'

interface UploadState {
  isUploading: boolean
  validation: HCCValidationResult | null
  analytics: HCCAnalytics | null
  fileName: string | null
}

export default function HCCPage() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    validation: null,
    analytics: null,
    fileName: null
  })

  const handleFileUpload = async (file: File) => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      fileName: file.name,
      validation: null,
      analytics: null
    }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/hcc/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          validation: result.validation,
          analytics: result.analytics
        }))
      } else {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          validation: result.validation || {
            isValid: false,
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            errors: [{ row: 0, field: 'general', message: result.error || 'Upload failed', value: null }],
            warnings: [],
            summary: { member_count: 0, total_costs: 0, data_completeness: 0, provider_coverage: 0 }
          }
        }))
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        validation: {
          isValid: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          errors: [{ 
            row: 0, 
            field: 'general', 
            message: error instanceof Error ? error.message : 'Upload failed', 
            value: null 
          }],
          warnings: [],
          summary: { member_count: 0, total_costs: 0, data_completeness: 0, provider_coverage: 0 }
        }
      }))
    }
  }

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      validation: null,
      analytics: null,
      fileName: null
    })
  }

  const { isUploading, validation, analytics, fileName } = uploadState

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            HCC Cost Containment Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Upload your healthcare cost data to generate comprehensive analytics and insights.
            Secure server-side processing with real-time validation.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {/* Step 1: Upload */}
            <div className={`flex items-center ${
              fileName ? 'text-green-600' : 'text-blue-600'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                fileName 
                  ? 'bg-green-600 text-white' 
                  : isUploading
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-600'
              }`}>
                {fileName ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Upload & Validate</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${
              validation ? 'bg-green-500' : isUploading ? 'bg-blue-500' : 'bg-gray-200'
            }`}></div>
            
            {/* Step 2: Analytics */}
            <div className={`flex items-center ${
              analytics ? 'text-green-600' : validation ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                analytics 
                  ? 'bg-green-600 text-white'
                  : validation
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {analytics ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Analytics Dashboard</span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!validation && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">
                Upload HCC Data
              </h2>
            </div>
            
            <DropzoneUpload 
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>
        )}

        {/* Validation Results */}
        {validation && (
          <div className="mb-6">
            <ValidationResults 
              validation={validation}
              onRetry={resetUpload}
            />
          </div>
        )}

        {/* Success State - Analytics Dashboard */}
        {validation?.isValid && analytics && (
          <div className="space-y-6">
            {/* Analytics Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-medium text-gray-900">
                    Analytics Ready
                  </h2>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {analytics.total_members} members
                </span>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${analytics.total_costs_ytd.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Total Costs YTD</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${Math.round(analytics.average_cost_per_member).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700">Avg Cost/Member</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.high_cost_members}
                  </div>
                  <div className="text-sm text-orange-700">High Cost Members</div>
                </div>
              </div>

              {/* Dashboard Access */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/hcc/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Full Analytics Dashboard
                  <ArrowRight className="w-4 h-4" />
                </a>
                
                <button
                  onClick={resetUpload}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Upload New File
                </button>
              </div>
            </div>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-2">Cost Analysis</h3>
                <p className="text-sm text-gray-600">
                  Age band distribution, provider costs, medical vs pharmacy breakdown
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-2">Risk Management</h3>
                <p className="text-sm text-gray-600">
                  Risk tier analysis, case management insights, stop-loss tracking
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-2">Trend Analysis</h3>
                <p className="text-sm text-gray-600">
                  Monthly trends, projected costs, savings opportunities
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Info */}
        {fileName && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Processing: <span className="font-mono">{fileName}</span>
          </div>
        )}
      </div>
    </div>
  )
}