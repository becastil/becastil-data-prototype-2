export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  previewData?: string[][]
  carrier?: string
  recordCount?: number
}

export interface UploadProgress {
  fileId: string
  stage: 'upload' | 'parse' | 'validate' | 'normalize' | 'complete'
  progress: number
  message: string
  recordsProcessed?: number
  totalRecords?: number
  errors?: number
}

export interface ParseOptions {
  delimiter?: string
  encoding?: string
  hasHeader?: boolean
  skipEmptyLines?: boolean
  maxRows?: number
}

export interface UploadResponse {
  success: boolean
  fileId: string
  message: string
  previewData?: string[][]
  carrier?: string
  confidence?: number
  recordCount?: number
  errors?: Array<{
    row: number
    message: string
    severity: 'error' | 'warning'
  }>
}

export interface ProcessingJobStatus {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  stage: string
  recordsProcessed: number
  totalRecords: number
  errors: number
  startTime: string
  endTime?: string
  carrier?: string
}

export interface StreamingResponse {
  chunk: any
  done: boolean
  error?: string
}

export interface ProcessingResult {
  success: boolean
  recordsProcessed: number
  totalRecords: number
  errors: Array<{
    row: number
    message: string
    severity: 'error' | 'warning'
  }>
  carrier?: string
  jobId?: string
}