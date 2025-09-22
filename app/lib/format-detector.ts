import { KNOWN_CARRIERS, CarrierPattern, CarrierDetectionResult } from '@/app/types/carriers'
import { FieldMapping } from '@/app/types/claims'

export class FormatDetector {
  private static normalizeString(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  private static calculateStringScore(text: string, patterns: string[]): number {
    const normalized = this.normalizeString(text)
    let score = 0
    
    for (const pattern of patterns) {
      const normalizedPattern = this.normalizeString(pattern)
      if (normalized.includes(normalizedPattern)) {
        score += normalizedPattern.length
      }
    }
    
    return score
  }

  private static detectCarrierFromHeaders(headers: string[]): Array<{ carrier: string; score: number; indicators: string[] }> {
    const results: Array<{ carrier: string; score: number; indicators: string[] }> = []
    
    for (const carrier of KNOWN_CARRIERS) {
      let score = 0
      const indicators: string[] = []
      
      // Check header patterns
      for (const header of headers) {
        const headerScore = this.calculateStringScore(header, carrier.headerPatterns)
        if (headerScore > 0) {
          score += headerScore * 2 // Weight header matches higher
          indicators.push(`Header match: ${header}`)
        }
        
        // Check alias patterns
        const aliasScore = this.calculateStringScore(header, carrier.aliases)
        if (aliasScore > 0) {
          score += aliasScore * 3 // Weight alias matches highest
          indicators.push(`Alias match: ${header}`)
        }
      }
      
      // Check for field pattern matches
      Object.entries(carrier.fieldPatterns).forEach(([field, patterns]) => {
        for (const header of headers) {
          const fieldScore = this.calculateStringScore(header, patterns)
          if (fieldScore > 0) {
            score += fieldScore
            indicators.push(`Field pattern match: ${header} -> ${field}`)
          }
        }
      })
      
      if (score > 0) {
        results.push({
          carrier: carrier.name,
          score,
          indicators
        })
      }
    }
    
    return results.sort((a, b) => b.score - a.score)
  }

  private static detectCarrierFromData(
    sampleData: any[], 
    headers: string[]
  ): Array<{ carrier: string; score: number; indicators: string[] }> {
    const results: Array<{ carrier: string; score: number; indicators: string[] }> = []
    
    if (!sampleData || sampleData.length === 0) {
      return results
    }
    
    for (const carrier of KNOWN_CARRIERS) {
      let score = 0
      const indicators: string[] = []
      
      // Check for required columns presence
      const presentColumns = carrier.requiredColumns.filter(required => 
        headers.some(header => this.normalizeString(header).includes(this.normalizeString(required)))
      )
      
      if (presentColumns.length > 0) {
        score += presentColumns.length * 10
        indicators.push(`Required columns present: ${presentColumns.join(', ')}`)
      }
      
      // Check data format patterns
      const firstRow = sampleData[0]
      if (firstRow) {
        // Check date formats
        for (const header of headers) {
          const value = firstRow[header]
          if (value && typeof value === 'string') {
            for (const dateFormat of carrier.dateFormats) {
              if (this.matchesDateFormat(value, dateFormat)) {
                score += 5
                indicators.push(`Date format match: ${value} matches ${dateFormat}`)
                break
              }
            }
            
            // Check amount formats
            for (const amountFormat of carrier.amountFormats) {
              if (this.matchesAmountFormat(value, amountFormat)) {
                score += 3
                indicators.push(`Amount format match: ${value} matches ${amountFormat}`)
                break
              }
            }
          }
        }
      }
      
      if (score > 0) {
        results.push({
          carrier: carrier.name,
          score,
          indicators
        })
      }
    }
    
    return results.sort((a, b) => b.score - a.score)
  }

  private static matchesDateFormat(value: string, format: string): boolean {
    // Simple date format matching
    const patterns: Record<string, RegExp> = {
      'MM/DD/YYYY': /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      'YYYY-MM-DD': /^\d{4}-\d{1,2}-\d{1,2}$/,
      'YYYYMMDD': /^\d{8}$/,
      'DD/MM/YYYY': /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      'MM-DD-YYYY': /^\d{1,2}-\d{1,2}-\d{4}$/
    }
    
    const pattern = patterns[format]
    return pattern ? pattern.test(value.trim()) : false
  }

  private static matchesAmountFormat(value: string, format: string): boolean {
    const trimmed = value.trim()
    
    switch (format) {
      case '$0.00':
        return /^\$?\d+\.?\d{0,2}$/.test(trimmed)
      case '0.00':
        return /^\d+\.?\d{0,2}$/.test(trimmed)
      default:
        return /^\$?\d+\.?\d{0,2}$/.test(trimmed)
    }
  }

  private static generateMapping(carrier: CarrierPattern, headers: string[]): FieldMapping {
    const mapping: FieldMapping = { ...carrier.defaultMapping }
    
    // Try to improve mapping based on header analysis
    Object.entries(carrier.fieldPatterns).forEach(([field, patterns]) => {
      for (const header of headers) {
        const score = this.calculateStringScore(header, patterns)
        if (score > 0) {
          // Only override if we don't have a mapping or this is a better match
          if (!mapping[field as keyof FieldMapping] || 
              score > this.calculateStringScore(mapping[field as keyof FieldMapping] || '', patterns)) {
            (mapping as any)[field] = header
          }
        }
      }
    })
    
    return mapping
  }

  static async detectFormat(
    headers: string[], 
    sampleData: any[] = [],
    options: {
      minConfidence?: number
      maxCandidates?: number
    } = {}
  ): Promise<CarrierDetectionResult[]> {
    const { minConfidence = 10, maxCandidates = 3 } = options
    
    // Detect from headers
    const headerResults = this.detectCarrierFromHeaders(headers)
    
    // Detect from data patterns
    const dataResults = this.detectCarrierFromData(sampleData, headers)
    
    // Combine and score results
    const combinedResults = new Map<string, { score: number; indicators: string[] }>()
    
    // Add header scores
    headerResults.forEach(result => {
      combinedResults.set(result.carrier, {
        score: result.score,
        indicators: result.indicators
      })
    })
    
    // Add data scores
    dataResults.forEach(result => {
      const existing = combinedResults.get(result.carrier)
      if (existing) {
        existing.score += result.score
        existing.indicators.push(...result.indicators)
      } else {
        combinedResults.set(result.carrier, {
          score: result.score,
          indicators: result.indicators
        })
      }
    })
    
    // Convert to final results with confidence calculation
    const finalResults: CarrierDetectionResult[] = []
    const maxScore = Math.max(...Array.from(combinedResults.values()).map(r => r.score))
    
    for (const [carrierName, result] of combinedResults.entries()) {
      if (result.score >= minConfidence) {
        const carrier = KNOWN_CARRIERS.find(c => c.name === carrierName)
        if (carrier) {
          const confidence = maxScore > 0 ? (result.score / maxScore) * 100 : 0
          
          finalResults.push({
            carrier: carrierName,
            confidence: Math.round(confidence),
            indicators: result.indicators,
            suggestedMapping: this.generateMapping(carrier, headers),
            dateFormat: carrier.dateFormats[0],
            amountFormat: carrier.amountFormats[0]
          })
        }
      }
    }
    
    // Sort by confidence and limit results
    return finalResults
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxCandidates)
  }

  static async detectFormatFromFile(
    file: File,
    previewData: { headers: string[]; data: any[] }
  ): Promise<CarrierDetectionResult[]> {
    try {
      const results = await this.detectFormat(previewData.headers, previewData.data)
      
      // Add file-specific indicators
      const fileName = file.name.toLowerCase()
      for (const result of results) {
        const carrier = KNOWN_CARRIERS.find(c => c.name === result.carrier)
        if (carrier) {
          // Check if filename contains carrier indicators
          for (const alias of carrier.aliases) {
            if (fileName.includes(alias.toLowerCase())) {
              result.confidence = Math.min(100, result.confidence + 10)
              result.indicators.push(`Filename contains: ${alias}`)
            }
          }
        }
      }
      
      return results.sort((a, b) => b.confidence - a.confidence)
    } catch (error) {
      console.error('Format detection failed:', error)
      return []
    }
  }

  static getCarrierInfo(carrierName: string): CarrierPattern | null {
    return KNOWN_CARRIERS.find(c => c.name === carrierName) || null
  }

  static getAllSupportedCarriers(): string[] {
    return KNOWN_CARRIERS.map(c => c.name)
  }

  static validateMapping(mapping: FieldMapping, headers: string[]): {
    isValid: boolean
    missingFields: string[]
    invalidFields: string[]
  } {
    const missingFields: string[] = []
    const invalidFields: string[] = []
    
    // Check required fields
    const requiredFields = ['claimantId', 'claimDate', 'serviceType']
    
    for (const field of requiredFields) {
      const mappedColumn = mapping[field as keyof FieldMapping]
      if (!mappedColumn) {
        missingFields.push(field)
      } else if (!headers.includes(mappedColumn)) {
        invalidFields.push(field)
      }
    }
    
    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields
    }
  }
}