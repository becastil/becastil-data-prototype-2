import {
  CSVSchemaType,
  ColumnMapping,
  HEALTHCARE_COST_EXPECTED_COLUMNS,
  HIGH_COST_CLAIMANT_EXPECTED_COLUMNS,
  HEALTHCARE_COST_REQUIRED_COLUMNS,
  HIGH_COST_CLAIMANT_REQUIRED_COLUMNS,
  COLUMN_ALIASES
} from './schemas'

const normalize = (value: string) => value.toLowerCase().trim()

const levenshteinDistance = (a: string, b: string) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

const similarity = (a: string, b: string) => {
  const normalizedA = normalize(a)
  const normalizedB = normalize(b)
  if (!normalizedA.length && !normalizedB.length) return 1
  const distance = levenshteinDistance(normalizedA, normalizedB)
  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  return maxLength === 0 ? 1 : 1 - distance / maxLength
}

export interface ColumnMapperOptions {
  threshold: number // 0-1, lower = more strict matching
  includeAliases: boolean
  requireExactMatch: boolean
}

export interface MappingResult {
  mappings: ColumnMapping[]
  missingRequired: string[]
  extraColumns: string[]
  confidence: number // Overall confidence score
}

export class ColumnMapper {
  private static defaultOptions: ColumnMapperOptions = {
    threshold: 0.6,
    includeAliases: true,
    requireExactMatch: false
  }

  static detectSchemaType(columns: string[]): CSVSchemaType {
    const healthcareCostMatches = this.countMatches(columns, HEALTHCARE_COST_EXPECTED_COLUMNS)
    const claimantMatches = this.countMatches(columns, HIGH_COST_CLAIMANT_EXPECTED_COLUMNS)

    // Simple heuristic: which schema has more matching columns
    if (healthcareCostMatches.matches > claimantMatches.matches) {
      return CSVSchemaType.HEALTHCARE_COSTS
    } else if (claimantMatches.matches > healthcareCostMatches.matches) {
      return CSVSchemaType.HIGH_COST_CLAIMANTS
    }

    // Check for specific indicator columns
    const hasCategory = columns.some(col => 
      col.toLowerCase().includes('category')
    )
    const hasClaimantId = columns.some(col => 
      col.toLowerCase().includes('claimant') || 
      col.toLowerCase().includes('member') && col.toLowerCase().includes('id')
    )

    if (hasCategory) return CSVSchemaType.HEALTHCARE_COSTS
    if (hasClaimantId) return CSVSchemaType.HIGH_COST_CLAIMANTS

    return CSVSchemaType.UNKNOWN
  }

  private static countMatches(
    sourceColumns: string[], 
    targetColumns: string[]
  ): { matches: number; total: number } {
    const normalizedSource = sourceColumns.map(col => col.toLowerCase().trim())
    const normalizedTarget = targetColumns.map(col => col.toLowerCase().trim())
    
    const matches = normalizedTarget.filter(target => 
      normalizedSource.includes(target)
    ).length

    return { matches, total: targetColumns.length }
  }

  static generateMappings(
    sourceColumns: string[],
    schemaType: CSVSchemaType,
    options: Partial<ColumnMapperOptions> = {}
  ): MappingResult {
    const opts = { ...this.defaultOptions, ...options }
    
    const targetColumns = this.getExpectedColumns(schemaType)
    const requiredColumns = this.getRequiredColumns(schemaType)
    
    if (targetColumns.length === 0) {
      return {
        mappings: [],
        missingRequired: requiredColumns,
        extraColumns: [...sourceColumns],
        confidence: 0
      }
    }

    // Create search corpus including aliases
    const searchCorpus = this.buildSearchCorpus(targetColumns, opts.includeAliases)
    const minConfidence = Math.max(0, Math.min(1, 1 - opts.threshold))

    const mappings: ColumnMapping[] = []
    const mappedTargets = new Set<string>()

    // First pass: exact matches
    for (const sourceCol of sourceColumns) {
      const exactMatch = targetColumns.find(target => 
        target.toLowerCase() === sourceCol.toLowerCase()
      )
      
      if (exactMatch && !mappedTargets.has(exactMatch)) {
        mappings.push({
          source: sourceCol,
          target: exactMatch,
          confidence: 1.0,
          isRequired: requiredColumns.includes(exactMatch),
          isPerfectMatch: true
        })
        mappedTargets.add(exactMatch)
      }
    }

    // Second pass: fuzzy matching for remaining columns
    const unmappedSources = sourceColumns.filter(source => 
      !mappings.some(m => m.source === source)
    )

    for (const sourceCol of unmappedSources) {
      const bestMatch = this.findBestMatch(sourceCol, searchCorpus, minConfidence)

      if (bestMatch && !mappedTargets.has(bestMatch.column)) {
        mappings.push({
          source: sourceCol,
          target: bestMatch.column,
          confidence: bestMatch.confidence,
          isRequired: requiredColumns.includes(bestMatch.column),
          isPerfectMatch: false
        })
        mappedTargets.add(bestMatch.column)
      }
    }

    // Identify missing required columns
    const missingRequired = requiredColumns.filter(req => 
      !mappedTargets.has(req)
    )

    // Identify extra columns (those that couldn't be mapped)
    const mappedSources = new Set(mappings.map(m => m.source))
    const extraColumns = sourceColumns.filter(source => 
      !mappedSources.has(source)
    )

    // Calculate overall confidence
    const totalConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0)
    const overallConfidence = mappings.length > 0 ? totalConfidence / mappings.length : 0

    return {
      mappings: mappings.sort((a, b) => b.confidence - a.confidence),
      missingRequired,
      extraColumns,
      confidence: overallConfidence
    }
  }

  private static getExpectedColumns(schemaType: CSVSchemaType): string[] {
    switch (schemaType) {
      case CSVSchemaType.HEALTHCARE_COSTS:
        return HEALTHCARE_COST_EXPECTED_COLUMNS
      case CSVSchemaType.HIGH_COST_CLAIMANTS:
        return HIGH_COST_CLAIMANT_EXPECTED_COLUMNS
      default:
        return []
    }
  }

  private static findBestMatch(
    sourceColumn: string,
    corpus: Array<{ column: string; aliases: string[] }>,
    minConfidence: number
  ): { column: string; confidence: number } | null {
    let bestMatch: { column: string; confidence: number } | null = null

    for (const entry of corpus) {
      const primaryScore = similarity(sourceColumn, entry.column)
      const aliasScore = entry.aliases.reduce((score, alias) => {
        return Math.max(score, similarity(sourceColumn, alias))
      }, 0)
      const confidence = Math.max(primaryScore, aliasScore)

      if (confidence >= minConfidence && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          column: entry.column,
          confidence
        }
      }
    }

    return bestMatch
  }

  private static getRequiredColumns(schemaType: CSVSchemaType): string[] {
    switch (schemaType) {
      case CSVSchemaType.HEALTHCARE_COSTS:
        return HEALTHCARE_COST_REQUIRED_COLUMNS
      case CSVSchemaType.HIGH_COST_CLAIMANTS:
        return HIGH_COST_CLAIMANT_REQUIRED_COLUMNS
      default:
        return []
    }
  }

  private static buildSearchCorpus(
    targetColumns: string[], 
    includeAliases: boolean
  ): Array<{ column: string; aliases: string[] }> {
    return targetColumns.map(column => ({
      column,
      aliases: includeAliases ? (COLUMN_ALIASES[column as keyof typeof COLUMN_ALIASES] || []) : []
    }))
  }

  // Apply column mappings to transform data
  static applyMappings<T extends Record<string, any>>(
    data: T[],
    mappings: ColumnMapping[]
  ): Array<Record<string, any>> {
    const mappingDict = mappings.reduce((dict, mapping) => {
      dict[mapping.source] = mapping.target
      return dict
    }, {} as Record<string, string>)

    return data.map(row => {
      const transformedRow: Record<string, any> = {}
      
      for (const [sourceKey, value] of Object.entries(row)) {
        const targetKey = mappingDict[sourceKey] || sourceKey
        transformedRow[targetKey] = value
      }
      
      return transformedRow
    })
  }

  // Get mapping suggestions for manual review
  static getSuggestions(
    sourceColumns: string[],
    schemaType: CSVSchemaType,
    threshold: number = 0.3
  ): ColumnMapping[] {
    const result = this.generateMappings(sourceColumns, schemaType, { 
      threshold,
      includeAliases: true,
      requireExactMatch: false 
    })
    
    return result.mappings.filter(mapping => 
      mapping.confidence >= threshold
    )
  }

  // Save/load mappings from localStorage
  static saveMappingPreferences(
    schemaType: CSVSchemaType,
    mappings: ColumnMapping[]
  ): void {
    const key = `column-mappings-${schemaType}`
    const preferences = {
      schemaType,
      mappings,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save mapping preferences:', error)
    }
  }

  static loadMappingPreferences(schemaType: CSVSchemaType): ColumnMapping[] | null {
    const key = `column-mappings-${schemaType}`
    
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null
      
      const preferences = JSON.parse(stored)
      
      // Check if preferences are recent (within 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      if (preferences.timestamp < thirtyDaysAgo) {
        localStorage.removeItem(key)
        return null
      }
      
      return preferences.mappings
    } catch (error) {
      console.warn('Failed to load mapping preferences:', error)
      return null
    }
  }

  static clearMappingPreferences(schemaType: CSVSchemaType): void {
    const key = `column-mappings-${schemaType}`
    localStorage.removeItem(key)
  }

  // Validate that required columns are mapped
  static validateMappings(
    mappings: ColumnMapping[],
    schemaType: CSVSchemaType
  ): { isValid: boolean; missingRequired: string[] } {
    const requiredColumns = this.getRequiredColumns(schemaType)
    const mappedTargets = new Set(mappings.map(m => m.target))
    
    const missingRequired = requiredColumns.filter(req => 
      !mappedTargets.has(req)
    )
    
    return {
      isValid: missingRequired.length === 0,
      missingRequired
    }
  }
}
