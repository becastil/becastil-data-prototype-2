'use client'

import { useState, useEffect } from 'react'
import { UploadFile, UploadProgress } from '@/app/types/upload'

interface ProgressTrackerProps {
  files: UploadFile[]
  onFileUpdate?: (fileId: string, updates: Partial<UploadFile>) => void
}

export default function ProgressTracker({ files, onFileUpdate }: ProgressTrackerProps) {
  const [progressUpdates, setProgressUpdates] = useState<Record<string, UploadProgress>>({})

  useEffect(() => {
    const eventSource = new EventSource('/api/upload/progress')
    
    eventSource.onmessage = (event) => {
      try {
        const update: UploadProgress = JSON.parse(event.data)
        setProgressUpdates(prev => ({
          ...prev,
          [update.fileId]: update
        }))
        
        // Update file status based on progress
        if (onFileUpdate) {
          const file = files.find(f => f.id === update.fileId)
          if (file) {
            let status = file.status
            if (update.stage === 'complete') {
              status = 'completed'
            } else if (update.progress > 0) {
              status = 'processing'
            }
            
            onFileUpdate(update.fileId, {
              status,
              progress: update.progress,
              recordCount: update.totalRecords
            })
          }
        }
      } catch (error) {
        console.error('Error parsing progress update:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Progress stream error:', error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [files, onFileUpdate])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
        )
      case 'uploading':
      case 'processing':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        )
      case 'completed':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'failed':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'upload': return 'Uploading file...'
      case 'parse': return 'Parsing CSV data...'
      case 'validate': return 'Validating data...'
      case 'normalize': return 'Normalizing records...'
      case 'complete': return 'Processing complete'
      default: return 'Processing...'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Processing Status
      </h3>
      
      <div className="space-y-3">
        {files.map((file) => {
          const progress = progressUpdates[file.id]
          
          return (
            <div
              key={file.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(file.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                      {file.carrier && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {file.carrier}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {file.progress}%
                  </p>
                  {file.recordCount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.recordCount.toLocaleString()} records
                    </p>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                ></div>
              </div>
              
              {/* Stage and Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {progress ? getStageDescription(progress.stage) : 'Pending...'}
                </span>
                
                {progress && progress.recordsProcessed && progress.totalRecords && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {progress.recordsProcessed.toLocaleString()} / {progress.totalRecords.toLocaleString()}
                    {progress.errors && progress.errors > 0 && (
                      <span className="text-red-600 dark:text-red-400 ml-2">
                        ({progress.errors} errors)
                      </span>
                    )}
                  </span>
                )}
              </div>
              
              {/* Error Display */}
              {file.status === 'failed' && file.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <span className="font-medium">Error:</span> {file.error}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}