import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse'
import { 
  HCCRowSchema, 
  HCCNormalizedSchema,
  HCCAnalyticsSchema,
  HCCValidationResult,
  HCC_EXPECTED_COLUMNS,
  HCC_REQUIRED_COLUMNS,
  HCC_PARSE_CONFIG 
} from '@/app/hcc/lib/schema'
import { 
  normalizeProviderName, 
  categorizeCost, 
  categorizeRisk, 
  calculateSavingsPotential,
  calculateDataCompleteness 
} from '@/app/hcc/lib/utils'
import type { HCCRow, HCCNormalized, HCCAnalytics } from '@/app/hcc/lib/schema'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type and size
    if (!HCC_PARSE_CONFIG.allowedMimeTypes.includes(file.type) && 
        !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are allowed.' },
        { status: 400 }
      )
    }
    
    if (file.size > HCC_PARSE_CONFIG.maxFileSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${HCC_PARSE_CONFIG.maxFileSize / (1024 * 1024)}MB.` 
        },
        { status: 400 }
      )
    }
    
    // Parse CSV file
    const csvText = await file.text()
    const rawData = await parseCSV(csvText)
    
    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or contains no valid data' },
        { status: 400 }
      )
    }
    
    // Validate and normalize data
    const validationResult = await validateAndNormalizeData(rawData)
    
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        validation: validationResult,
        message: 'Validation failed. Please fix the errors and try again.'
      })
    }
    
    // Generate analytics if data is valid
    const analytics = generateAnalytics(validationResult.normalizedData || [])
    
    return NextResponse.json({
      success: true,
      validation: validationResult,
      analytics,
      message: `Successfully processed ${validationResult.validRows} records`
    })
    
  } catch (error) {
    console.error('HCC upload error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Parse CSV text into raw data objects
 */
async function parseCSV(csvText: string): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, any>[] = []
    
    parse(csvText, {
      columns: true,
      skip_empty_lines: HCC_PARSE_CONFIG.skipEmptyLines,
      trim: HCC_PARSE_CONFIG.trimHeaders,
      delimiter: HCC_PARSE_CONFIG.delimiter,
    })
    .on('data', (row) => {
      results.push(row)
    })
    .on('end', () => {
      resolve(results)
    })
    .on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Validate raw CSV data and normalize it for analytics
 */
async function validateAndNormalizeData(
  rawData: Record<string, any>[]
): Promise<HCCValidationResult & { normalizedData?: HCCNormalized[] }> {
  const errors: HCCValidationResult['errors'] = []
  const warnings: HCCValidationResult['warnings'] = []
  const validatedData: HCCRow[] = []
  const normalizedData: HCCNormalized[] = []
  
  // Check for required columns
  const firstRow = rawData[0] || {}
  const availableColumns = Object.keys(firstRow)
  const missingRequired = HCC_REQUIRED_COLUMNS.filter(
    col => !availableColumns.includes(col)
  )
  
  if (missingRequired.length > 0) {
    missingRequired.forEach(col => {
      errors.push({
        row: 0,
        field: col,
        message: `Required column "${col}" is missing`,
        value: null
      })
    })
  }
  
  // Check for unexpected columns (warn only)
  const unexpectedColumns = availableColumns.filter(
    col => !HCC_EXPECTED_COLUMNS.includes(col as any)
  )
  
  if (unexpectedColumns.length > 0) {
    warnings.push({
      row: 0,
      field: 'columns',
      message: `Unexpected columns found: ${unexpectedColumns.join(', ')}`,
      value: unexpectedColumns
    })
  }
  
  // Validate each row
  rawData.forEach((row, index) => {
    const rowNumber = index + 1
    
    try {
      // Validate against schema
      const validatedRow = HCCRowSchema.parse(row)
      validatedData.push(validatedRow)
      
      // Normalize for analytics
      const normalizedRow: HCCNormalized = {
        member_id: validatedRow['Member ID'],
        member_type: validatedRow['Member Type'],
        age_band: validatedRow['Age Band'],
        primary_diagnosis: validatedRow['Primary Diagnosis Category'],
        secondary_diagnosis: validatedRow['Secondary Diagnosis Category'],
        icd10_primary: validatedRow['ICD-10 Primary Code'],
        icd10_secondary: validatedRow['ICD-10 Secondary Code'],
        total_paid_ytd: validatedRow['Total Paid YTD'],
        medical_costs_ytd: validatedRow['Medical Costs YTD'],
        pharmacy_costs_ytd: validatedRow['Pharmacy Costs YTD'],
        total_projected_annual: validatedRow['Total Projected Annual'],
        primary_provider: validatedRow['Primary Provider'],
        provider_network: validatedRow['Provider Network'],
        primary_facility: validatedRow['Primary Facility'],
        risk_adjustment_factor: validatedRow['Risk Adjustment Factor'],
        stop_loss_applicable: validatedRow['Stop Loss Applicable'] === 'Yes',
        case_management_required: validatedRow['Case Management Required'] === 'Yes',
        claims_status: validatedRow['Claims Status'],
        
        // Analytics fields
        provider_normalized: normalizeProviderName(validatedRow['Primary Provider']),
        cost_category: categorizeCost(validatedRow['Total Paid YTD']),
        risk_tier: categorizeRisk(validatedRow['Risk Adjustment Factor']),
        projected_savings_potential: calculateSavingsPotential(
          validatedRow['Total Paid YTD'],
          validatedRow['Risk Adjustment Factor'],
          validatedRow['Case Management Required'] === 'Yes'
        ),
      }
      
      normalizedData.push(normalizedRow)
      
    } catch (validationError) {
      if (validationError instanceof Error && 'issues' in validationError) {
        const zodError = validationError as any
        zodError.issues.forEach((issue: any) => {
          errors.push({
            row: rowNumber,
            field: issue.path.join('.'),
            message: issue.message,
            value: issue.received
          })
        })
      } else {
        errors.push({
          row: rowNumber,
          field: 'general',
          message: validationError instanceof Error ? validationError.message : 'Unknown validation error',
          value: null
        })
      }
    }
  })
  
  // Calculate summary statistics
  const totalCosts = normalizedData.reduce((sum, row) => sum + row.total_paid_ytd, 0)
  const dataCompleteness = calculateDataCompleteness(normalizedData)
  const providersWithData = new Set(
    normalizedData
      .filter(row => row.primary_provider)
      .map(row => row.provider_normalized)
  ).size
  
  const providerCoverage = normalizedData.length > 0 
    ? providersWithData / normalizedData.length 
    : 0
  
  const result: HCCValidationResult & { normalizedData?: HCCNormalized[] } = {
    isValid: errors.length === 0 && normalizedData.length > 0,
    totalRows: rawData.length,
    validRows: normalizedData.length,
    invalidRows: rawData.length - normalizedData.length,
    errors,
    warnings,
    summary: {
      member_count: normalizedData.length,
      total_costs: totalCosts,
      data_completeness: dataCompleteness,
      provider_coverage: providerCoverage,
    },
    normalizedData: normalizedData.length > 0 ? normalizedData : undefined,
  }
  
  return result
}

/**
 * Generate analytics from normalized HCC data
 */
function generateAnalytics(data: HCCNormalized[]): HCCAnalytics {
  if (data.length === 0) {
    return {
      total_members: 0,
      total_costs_ytd: 0,
      average_cost_per_member: 0,
      projected_annual_costs: 0,
      high_cost_members: 0,
      cost_by_age_band: [],
      cost_by_provider: [],
      medical_vs_pharmacy: {
        medical_total: 0,
        pharmacy_total: 0,
        medical_percentage: 0,
        pharmacy_percentage: 0,
      },
      risk_distribution: [],
      monthly_trend: [],
    }
  }
  
  const totalCosts = data.reduce((sum, row) => sum + row.total_paid_ytd, 0)
  const totalProjected = data.reduce((sum, row) => sum + row.total_projected_annual, 0)
  const highCostMembers = data.filter(row => row.cost_category === 'High' || row.cost_category === 'Critical').length
  
  // Cost by age band
  const ageGroups = data.reduce((acc, row) => {
    if (!acc[row.age_band]) {
      acc[row.age_band] = { total_costs: 0, member_count: 0 }
    }
    acc[row.age_band].total_costs += row.total_paid_ytd
    acc[row.age_band].member_count += 1
    return acc
  }, {} as Record<string, { total_costs: number; member_count: number }>)
  
  const cost_by_age_band = Object.entries(ageGroups).map(([age_band, stats]) => ({
    age_band,
    total_costs: stats.total_costs,
    member_count: stats.member_count,
    avg_cost: stats.total_costs / stats.member_count,
  }))
  
  // Cost by provider
  const providerGroups = data.reduce((acc, row) => {
    const provider = row.provider_normalized || 'unknown'
    if (!acc[provider]) {
      acc[provider] = { total_costs: 0, member_count: 0 }
    }
    acc[provider].total_costs += row.total_paid_ytd
    acc[provider].member_count += 1
    return acc
  }, {} as Record<string, { total_costs: number; member_count: number }>)
  
  const cost_by_provider = Object.entries(providerGroups)
    .map(([provider, stats]) => ({
      provider,
      total_costs: stats.total_costs,
      member_count: stats.member_count,
      percentage_of_total: stats.total_costs / totalCosts,
    }))
    .sort((a, b) => b.total_costs - a.total_costs)
    .slice(0, 10) // Top 10 providers
  
  // Medical vs Pharmacy costs
  const totalMedical = data.reduce((sum, row) => sum + row.medical_costs_ytd, 0)
  const totalPharmacy = data.reduce((sum, row) => sum + row.pharmacy_costs_ytd, 0)
  const totalMedPharma = totalMedical + totalPharmacy
  
  const medical_vs_pharmacy = {
    medical_total: totalMedical,
    pharmacy_total: totalPharmacy,
    medical_percentage: totalMedPharma > 0 ? totalMedical / totalMedPharma : 0,
    pharmacy_percentage: totalMedPharma > 0 ? totalPharmacy / totalMedPharma : 0,
  }
  
  // Risk distribution
  const riskGroups = data.reduce((acc, row) => {
    if (!acc[row.risk_tier]) {
      acc[row.risk_tier] = { member_count: 0, total_cost: 0 }
    }
    acc[row.risk_tier].member_count += 1
    acc[row.risk_tier].total_cost += row.total_paid_ytd
    return acc
  }, {} as Record<string, { member_count: number; total_cost: number }>)
  
  const risk_distribution = Object.entries(riskGroups).map(([risk_tier, stats]) => ({
    risk_tier,
    member_count: stats.member_count,
    average_cost: stats.total_cost / stats.member_count,
  }))
  
  // Monthly trend (simplified - using projected data)
  const monthly_trend = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })
    const monthlyFactor = (i + 1) / 12
    return {
      month,
      cumulative_costs: totalCosts * monthlyFactor,
      projected_costs: totalProjected * monthlyFactor,
    }
  })
  
  return {
    total_members: data.length,
    total_costs_ytd: totalCosts,
    average_cost_per_member: totalCosts / data.length,
    projected_annual_costs: totalProjected,
    high_cost_members: highCostMembers,
    cost_by_age_band,
    cost_by_provider,
    medical_vs_pharmacy,
    risk_distribution,
    monthly_trend,
  }
}