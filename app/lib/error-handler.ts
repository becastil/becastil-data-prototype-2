export interface AppError extends Error {
  code?: string
  statusCode?: number
  context?: Record<string, any>
  retryable?: boolean
  userMessage?: string
}

export class ProcessingError extends Error implements AppError {
  public code: string
  public statusCode: number
  public context?: Record<string, any>
  public retryable: boolean
  public userMessage: string

  constructor(
    message: string,
    code: string = 'PROCESSING_ERROR',
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'ProcessingError'
    this.code = code
    this.statusCode = statusCode
    this.retryable = retryable
    this.context = context
    this.userMessage = this.getUserFriendlyMessage(code)
  }

  private getUserFriendlyMessage(code: string): string {
    const messages: Record<string, string> = {
      FILE_TOO_LARGE: 'The file you uploaded is too large. Please ensure your file is under 100MB.',
      INVALID_FILE_FORMAT: 'The file format is not supported. Please upload a CSV file.',
      PARSING_ERROR: 'There was an error reading your CSV file. Please check the file format and try again.',
      VALIDATION_ERROR: 'The data in your file contains errors. Please review and correct the issues.',
      FORMAT_DETECTION_FAILED: 'We couldn\'t automatically detect the format of your file. Please try manual mapping.',
      NETWORK_ERROR: 'Network connection error. Please check your connection and try again.',
      SERVER_ERROR: 'A server error occurred. Please try again in a few moments.',
      TIMEOUT_ERROR: 'The operation timed out. Please try again with a smaller file or check your connection.'
    }
    
    return messages[code] || 'An unexpected error occurred. Please try again or contact support.'
  }
}

export class ValidationError extends ProcessingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, false, context)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends ProcessingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 0, true, context)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends ProcessingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'TIMEOUT_ERROR', 408, true, context)
    this.name = 'TimeoutError'
  }
}

export class FileError extends ProcessingError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    const retryable = code !== 'FILE_TOO_LARGE' && code !== 'INVALID_FILE_FORMAT'
    super(message, code, 400, retryable, context)
    this.name = 'FileError'
  }
}

export function createErrorFromResponse(response: Response, defaultMessage: string = 'Request failed'): ProcessingError {
  if (!response.ok) {
    if (response.status === 413) {
      return new FileError('File too large', 'FILE_TOO_LARGE')
    }
    if (response.status === 415) {
      return new FileError('Unsupported file type', 'INVALID_FILE_FORMAT')
    }
    if (response.status === 408 || response.status === 504) {
      return new TimeoutError('Request timed out')
    }
    if (response.status >= 500) {
      return new ProcessingError(defaultMessage, 'SERVER_ERROR', response.status, true)
    }
    
    return new ProcessingError(defaultMessage, 'CLIENT_ERROR', response.status, false)
  }
  
  return new ProcessingError(defaultMessage)
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  errorContext?: Record<string, any>
): Promise<[T | null, AppError | null]> {
  return promise
    .then((data: T) => [data, null] as [T, null])
    .catch((error: any) => {
      let appError: AppError

      if (error instanceof ProcessingError) {
        appError = error
      } else if (error.name === 'AbortError') {
        appError = new ProcessingError('Operation was cancelled', 'OPERATION_CANCELLED', 0, true)
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        appError = new NetworkError('Network connection failed')
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        appError = new TimeoutError('Operation timed out')
      } else {
        appError = new ProcessingError(
          error.message || 'An unexpected error occurred',
          'UNKNOWN_ERROR',
          500,
          false,
          errorContext
        )
      }

      if (errorContext) {
        appError.context = { ...appError.context, ...errorContext }
      }

      return [null, appError] as [null, AppError]
    })
}

export class RetryManager {
  private maxRetries: number
  private baseDelay: number
  private maxDelay: number

  constructor(maxRetries: number = 3, baseDelay: number = 1000, maxDelay: number = 10000) {
    this.maxRetries = maxRetries
    this.baseDelay = baseDelay
    this.maxDelay = maxDelay
  }

  async execute<T>(
    operation: () => Promise<T>,
    isRetryable: (error: any) => boolean = (error) => error.retryable !== false
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === this.maxRetries || !isRetryable(error)) {
          throw error
        }

        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          this.maxDelay
        )
        
        console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

export function logError(error: AppError, context?: Record<string, any>) {
  const logData = {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    context: { ...error.context, ...context },
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  }

  if (error.statusCode && error.statusCode >= 500) {
    console.error('Server Error:', logData)
  } else if (error.statusCode && error.statusCode >= 400) {
    console.warn('Client Error:', logData)
  } else {
    console.error('Application Error:', logData)
  }

  // In production, you might want to send this to an error reporting service
  // like Sentry, LogRocket, or your own logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: logData })
  }
}

export function createAbortController(timeoutMs?: number): AbortController {
  const controller = new AbortController()
  
  if (timeoutMs) {
    setTimeout(() => {
      controller.abort()
    }, timeoutMs)
  }
  
  return controller
}