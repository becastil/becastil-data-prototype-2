import { 
  ProcessingError, 
  NetworkError, 
  TimeoutError,
  FileError,
  createErrorFromResponse,
  RetryManager,
  withTimeout,
  createAbortController
} from './error-handler'
import { UploadResponse, ProcessingResult } from '@/app/types/upload'

interface RequestOptions {
  timeout?: number
  retries?: number
  signal?: AbortSignal
  onProgress?: (loaded: number, total: number) => void
}

class APIClient {
  private baseURL: string
  private retryManager: RetryManager

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
    this.retryManager = new RetryManager(3, 1000, 5000)
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const { timeout = 30000, retries = 3, signal, onProgress, ...fetchOptions } = options

    const controller = createAbortController(timeout)
    const finalSignal = signal || controller.signal

    const operation = async (): Promise<T> => {
      try {
        const response = await fetch(`${this.baseURL}${url}`, {
          ...fetchOptions,
          signal: finalSignal
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw createErrorFromResponse(response, errorText)
        }

        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          return await response.json()
        } else if (contentType?.includes('text/')) {
          return await response.text() as T
        } else {
          return await response.blob() as T
        }
      } catch (error) {
        if (error instanceof ProcessingError) {
          throw error
        }
        
        if (error.name === 'AbortError') {
          throw new TimeoutError('Request was aborted')
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new NetworkError('Network request failed')
        }
        
        throw new ProcessingError(
          error.message || 'Request failed',
          'REQUEST_ERROR',
          0,
          true
        )
      }
    }

    if (retries > 0) {
      return this.retryManager.execute(operation, (error) => {
        return error.retryable && !finalSignal.aborted
      })
    }

    return operation()
  }

  async uploadFile(
    file: File,
    options: RequestOptions = {}
  ): Promise<UploadResponse> {
    if (!file) {
      throw new FileError('No file provided', 'FILE_REQUIRED')
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      throw new FileError('File too large', 'FILE_TOO_LARGE', {
        fileSize: file.size,
        maxSize: 100 * 1024 * 1024
      })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new FileError('Invalid file format', 'INVALID_FILE_FORMAT', {
        fileName: file.name,
        fileType: file.type
      })
    }

    const formData = new FormData()
    formData.append('file', file)

    return this.makeRequest<UploadResponse>('/api/upload', {
      method: 'POST',
      body: formData,
      timeout: 60000, // 1 minute for uploads
      ...options
    })
  }

  async processFile(
    fileId: string,
    fileData: string,
    mapping?: any,
    processingOptions?: any,
    options: RequestOptions = {}
  ): Promise<{ success: boolean; result?: ProcessingResult; message?: string }> {
    const payload = {
      fileId,
      fileData,
      mapping,
      options: processingOptions
    }

    return this.makeRequest<{ success: boolean; result?: ProcessingResult; message?: string }>(
      '/api/process',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: 120000, // 2 minutes for processing
        ...options
      }
    )
  }

  async processFileStreaming(
    fileId: string,
    fileData: string,
    mapping?: any,
    processingOptions?: any,
    onProgress?: (data: any) => void,
    options: RequestOptions = {}
  ): Promise<void> {
    const payload = {
      fileId,
      fileData,
      mapping,
      options: processingOptions
    }

    try {
      const response = await fetch('/api/process', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: options.signal
      })

      if (!response.ok) {
        throw createErrorFromResponse(response, 'Processing request failed')
      }

      if (!response.body) {
        throw new ProcessingError('No response stream available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                onProgress?.(data)
                
                if (data.type === 'error') {
                  throw new ProcessingError(data.message, 'PROCESSING_ERROR')
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (error instanceof ProcessingError) {
        throw error
      }
      
      throw new ProcessingError(
        error.message || 'Streaming processing failed',
        'STREAMING_ERROR',
        500,
        true
      )
    }
  }

  async downloadFile(
    url: string,
    options: RequestOptions = {}
  ): Promise<Blob> {
    return this.makeRequest<Blob>(url, {
      method: 'GET',
      ...options
    })
  }

  // Health check endpoint
  async healthCheck(options: RequestOptions = {}): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/api/health', {
      method: 'GET',
      timeout: 5000,
      retries: 1,
      ...options
    })
  }
}

// Singleton instance
export const apiClient = new APIClient()

// Helper functions with error handling
export async function uploadFileWithRetry(
  file: File,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<UploadResponse> {
  try {
    return await apiClient.uploadFile(file, { onProgress, signal })
  } catch (error) {
    console.error('File upload failed:', error)
    throw error
  }
}

export async function processFileWithRetry(
  fileId: string,
  fileData: string,
  mapping?: any,
  options?: any,
  signal?: AbortSignal
): Promise<ProcessingResult> {
  try {
    const result = await apiClient.processFile(fileId, fileData, mapping, options, { signal })
    
    if (!result.success) {
      throw new ProcessingError(result.message || 'Processing failed')
    }
    
    if (!result.result) {
      throw new ProcessingError('No processing result received')
    }
    
    return result.result
  } catch (error) {
    console.error('File processing failed:', error)
    throw error
  }
}

export async function processFileStreamingWithRetry(
  fileId: string,
  fileData: string,
  mapping?: any,
  options?: any,
  onProgress?: (data: any) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    return await apiClient.processFileStreaming(fileId, fileData, mapping, options, onProgress, { signal })
  } catch (error) {
    console.error('Streaming processing failed:', error)
    throw error
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] // Remove data:mime;base64, prefix
      resolve(base64)
    }
    
    reader.onerror = () => {
      reject(new FileError('Failed to read file', 'FILE_READ_ERROR'))
    }
    
    reader.readAsDataURL(file)
  })
}