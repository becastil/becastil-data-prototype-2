import Papa from 'papaparse'
import { ParseOptions } from '@/app/types/upload'

export interface CSVParseResult {
  data: any[]
  headers: string[]
  meta: {
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor: number
  }
  errors: Array<{
    type: string
    code: string
    message: string
    row?: number
  }>
}

export interface StreamingParseOptions extends ParseOptions {
  chunkSize?: number
  onChunk?: (chunk: any[], info: { processed: number; total: number }) => void
  onProgress?: (progress: number) => void
  onError?: (error: any) => void
}

export class CSVParser {
  private static detectDelimiter(sample: string): string {
    const delimiters = [',', ';', '\t', '|']
    const sampleLines = sample.split('\n').slice(0, 5)
    
    let bestDelimiter = ','
    let maxConsistency = 0
    
    for (const delimiter of delimiters) {
      const counts = sampleLines.map(line => 
        (line.match(new RegExp(delimiter, 'g')) || []).length
      )
      
      if (counts.length === 0) continue
      
      const average = counts.reduce((a, b) => a + b, 0) / counts.length
      const variance = counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / counts.length
      const consistency = average > 0 ? average / (1 + variance) : 0
      
      if (consistency > maxConsistency) {
        maxConsistency = consistency
        bestDelimiter = delimiter
      }
    }
    
    return bestDelimiter
  }

  private static detectEncoding(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer.slice(0, 1024))
    
    // Check for BOM
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return 'utf-8'
    }
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return 'utf-16le'
    }
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return 'utf-16be'
    }
    
    // Simple heuristic for encoding detection
    let hasHighBytes = false
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] > 127) {
        hasHighBytes = true
        break
      }
    }
    
    return hasHighBytes ? 'windows-1252' : 'utf-8'
  }

  private static async readFileAsText(file: File, encoding: string = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        resolve(reader.result as string)
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file, encoding)
    })
  }

  static async parseFile(file: File, options: ParseOptions = {}): Promise<CSVParseResult> {
    try {
      // Detect encoding
      const encoding = options.encoding || this.detectEncoding(await file.arrayBuffer())
      
      // Read file as text
      const content = await this.readFileAsText(file, encoding)
      
      // Detect delimiter if not provided
      const delimiter = options.delimiter || this.detectDelimiter(content.substring(0, 2048))
      
      // Parse with Papa Parse
      const result = Papa.parse(content, {
        delimiter,
        header: options.hasHeader !== false,
        skipEmptyLines: options.skipEmptyLines !== false,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        dynamicTyping: false, // Keep as strings for validation
        complete: () => {},
        error: () => {}
      })

      return {
        data: result.data,
        headers: result.meta.fields || [],
        meta: {
          delimiter: result.meta.delimiter,
          linebreak: result.meta.linebreak,
          aborted: result.meta.aborted,
          truncated: result.meta.truncated,
          cursor: result.meta.cursor
        },
        errors: result.errors
      }
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async parseFileStreaming(
    file: File, 
    options: StreamingParseOptions = {}
  ): Promise<CSVParseResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const encoding = options.encoding || this.detectEncoding(await file.arrayBuffer())
        const chunkSize = options.chunkSize || 1024 * 1024 // 1MB chunks
        
        let processedData: any[] = []
        let headers: string[] = []
        let allErrors: any[] = []
        let totalSize = file.size
        let processedSize = 0
        
        const reader = new FileReader()
        let offset = 0
        let remainder = ''
        let headersParsed = false
        let delimiter = options.delimiter
        
        const processChunk = (chunk: string, isLast: boolean = false) => {
          // Detect delimiter from first chunk if not provided
          if (!delimiter && !headersParsed) {
            delimiter = this.detectDelimiter(chunk)
          }
          
          const lines = (remainder + chunk).split('\n')
          remainder = isLast ? '' : lines.pop() || ''
          
          if (lines.length === 0) return
          
          // Parse headers from first chunk
          if (!headersParsed) {
            const headerResult = Papa.parse(lines[0], {
              delimiter,
              header: false
            })
            
            if (headerResult.data && headerResult.data.length > 0) {
              headers = (headerResult.data[0] as string[]).map(h => h.trim())
              headersParsed = true
              lines.shift() // Remove header line
            }
          }
          
          // Parse data lines
          if (lines.length > 0) {
            const chunkResult = Papa.parse(lines.join('\n'), {
              delimiter,
              header: false,
              skipEmptyLines: true,
              transform: (value: string) => value.trim()
            })
            
            if (chunkResult.errors) {
              allErrors.push(...chunkResult.errors)
            }
            
            if (chunkResult.data) {
              const mappedData = chunkResult.data.map((row: any[]) => {
                const obj: any = {}
                headers.forEach((header, index) => {
                  obj[header] = row[index] || ''
                })
                return obj
              })
              
              processedData.push(...mappedData)
              
              if (options.onChunk) {
                options.onChunk(mappedData, {
                  processed: processedData.length,
                  total: Math.floor(totalSize / 100) // Rough estimate
                })
              }
            }
          }
        }
        
        const readNextChunk = () => {
          if (offset >= file.size) {
            // Process any remaining data
            if (remainder) {
              processChunk(remainder, true)
            }
            
            // Return final result
            resolve({
              data: processedData,
              headers,
              meta: {
                delimiter: delimiter || ',',
                linebreak: '\n',
                aborted: false,
                truncated: false,
                cursor: file.size
              },
              errors: allErrors
            })
            return
          }
          
          const blob = file.slice(offset, offset + chunkSize)
          reader.readAsText(blob, encoding)
        }
        
        reader.onload = (e) => {
          const chunk = e.target?.result as string
          processedSize += chunk.length
          
          if (options.onProgress) {
            options.onProgress(Math.min((processedSize / totalSize) * 100, 100))
          }
          
          processChunk(chunk)
          offset += chunkSize
          
          // Continue reading
          setTimeout(readNextChunk, 0) // Allow UI to update
        }
        
        reader.onerror = () => {
          reject(new Error('Failed to read file chunk'))
        }
        
        // Start reading
        readNextChunk()
        
      } catch (error) {
        reject(error)
      }
    })
  }

  static async getPreviewData(file: File, maxRows: number = 10): Promise<{
    data: any[]
    headers: string[]
    delimiter: string
    totalRows: number
  }> {
    try {
      // Read a sample of the file for preview
      const sampleSize = Math.min(file.size, 50 * 1024) // 50KB sample
      const blob = file.slice(0, sampleSize)
      const sampleText = await this.readFileAsText(new File([blob], file.name))
      
      const delimiter = this.detectDelimiter(sampleText)
      
      const result = Papa.parse(sampleText, {
        delimiter,
        header: true,
        skipEmptyLines: true,
        preview: maxRows,
        transform: (value: string) => value.trim()
      })
      
      // Estimate total rows (rough calculation)
      const avgRowLength = sampleText.length / (result.data.length || 1)
      const estimatedTotalRows = Math.floor(file.size / avgRowLength)
      
      return {
        data: result.data,
        headers: result.meta.fields || [],
        delimiter,
        totalRows: estimatedTotalRows
      }
    } catch (error) {
      throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}