#!/usr/bin/env tsx

/**
 * Main template generation script
 * Generates both Healthcare Cost and High Cost Claims templates
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { HealthcareCostTemplateBuilder } from './healthcare-cost'
import { HighCostClaimsTemplateBuilder } from './high-cost-claims'

const DIST_DIR = path.join(process.cwd(), 'dist')
const TEMPLATES = {
  HEALTHCARE_COST: 'default_healthcare_cost_template.xlsx',
  HIGH_COST_CLAIMS: 'default_high_cost_claims_template.xlsx'
}

/**
 * Ensure dist directory exists
 */
function ensureDistDirectory() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true })
    console.log(`📁 Created directory: ${DIST_DIR}`)
  }
}

/**
 * Generate Healthcare Cost template
 */
function generateHealthcareCostTemplate(): string {
  console.log('🏥 Generating Healthcare Cost template...')
  
  const builder = new HealthcareCostTemplateBuilder()
  const workbook = builder.build()
  
  // Add sample data to demonstrate formulas
  const sampleData = HealthcareCostTemplateBuilder.generateSampleData()
  const worksheet = workbook.Sheets['Healthcare Cost']
  
  // Add sample values to input cells (non-formula cells)
  const inputRows = [
    { row: 1, data: sampleData.domesticMedical }, // Domestic Medical
    { row: 2, data: sampleData.nonDomesticMedical }, // Non-Domestic Medical  
    { row: 4, data: sampleData.nonHospitalMedical }, // Non-Hospital Medical
    { row: 6, data: sampleData.adjustments }, // Adjustments
    { row: 10, data: sampleData.totalPharmacy }, // Total Pharmacy
    { row: 11, data: sampleData.pharmacyRebates }, // Pharmacy Rebates
    { row: 15, data: sampleData.stopLossFees }, // Stop Loss Fees
    { row: 16, data: sampleData.stopLossReimbursements }, // Stop Loss Reimbursements
    { row: 20, data: sampleData.consultingFees }, // Consulting Fees
    { row: 22, data: sampleData.tpaCobraAdmin }, // TPA/COBRA Admin
    { row: 23, data: sampleData.anthemNetwork }, // Anthem Network
    { row: 24, data: sampleData.keenanPharmacyCoalition }, // Keenan Pharmacy Coalition
    { row: 25, data: sampleData.keenanPharmacyManagement }, // Keenan Pharmacy Management
    { row: 26, data: sampleData.otherExpressScripts }, // Other Express Scripts
    { row: 35, data: sampleData.employeeCount }, // Employee Count
    { row: 36, data: sampleData.memberCount }, // Member Count
    { row: 41, data: sampleData.incurredTargetPEPM }, // Incurred Target PEPM
    { row: 42, data: sampleData.pepmBudget } // PEPM Budget
  ]
  
  inputRows.forEach(({ row, data }) => {
    data.forEach((value, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex + 1 })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].v = Math.round(value * 100) / 100 // Round to 2 decimals
      }
    })
  })
  
  const filePath = path.join(DIST_DIR, TEMPLATES.HEALTHCARE_COST)
  XLSX.writeFile(workbook, filePath)
  
  console.log(`✅ Healthcare Cost template saved to: ${filePath}`)
  return filePath
}

/**
 * Generate High Cost Claims template
 */
function generateHighCostClaimsTemplate(): string {
  console.log('👥 Generating High Cost Claims template...')
  
  const builder = new HighCostClaimsTemplateBuilder()
  const workbook = builder.build()
  
  // Add optional summary sheet
  const summarySheet = builder.createSummarySheet()
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  
  const filePath = path.join(DIST_DIR, TEMPLATES.HIGH_COST_CLAIMS)
  XLSX.writeFile(workbook, filePath)
  
  console.log(`✅ High Cost Claims template saved to: ${filePath}`)
  return filePath
}

/**
 * Validate generated templates
 */
function validateGeneratedTemplates(templatePaths: string[]) {
  console.log('🔍 Validating generated templates...')
  
  templatePaths.forEach(templatePath => {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }
    
    const stats = fs.statSync(templatePath)
    if (stats.size === 0) {
      throw new Error(`Template file is empty: ${templatePath}`)
    }
    
    // Verify file can be read as Excel
    try {
      const workbook = XLSX.readFile(templatePath)
      const sheetNames = workbook.SheetNames
      
      if (sheetNames.length === 0) {
        throw new Error(`Template has no worksheets: ${templatePath}`)
      }
      
      console.log(`✅ Valid template: ${path.basename(templatePath)} (${sheetNames.length} sheet${sheetNames.length > 1 ? 's' : ''})`)
    } catch (error) {
      throw new Error(`Invalid Excel file: ${templatePath} - ${error}`)
    }
  })
}

/**
 * Display summary information
 */
function displaySummary(templatePaths: string[]) {
  console.log('\\n📊 Template Generation Summary')
  console.log('================================')
  
  templatePaths.forEach(templatePath => {
    const stats = fs.statSync(templatePath)
    const sizeKB = Math.round(stats.size / 1024)
    console.log(`📄 ${path.basename(templatePath)} (${sizeKB} KB)`)
  })
  
  console.log(`\\n📁 Templates saved to: ${DIST_DIR}`)
  console.log('\\n🎉 Template generation completed successfully!')
  console.log('\\nUsage:')
  console.log('  - Open templates in Excel or compatible spreadsheet software')
  console.log('  - Edit input cells (non-formula cells) to see calculations update')
  console.log('  - Use dropdowns for validated enum fields')
  console.log('  - Refer to README.md for detailed field descriptions')
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting template generation...')
    console.log(`📅 ${new Date().toISOString()}\\n`)
    
    // Ensure output directory exists
    ensureDistDirectory()
    
    // Generate both templates
    const templatePaths = [
      generateHealthcareCostTemplate(),
      generateHighCostClaimsTemplate()
    ]
    
    // Validate generated files
    validateGeneratedTemplates(templatePaths)
    
    // Display summary
    displaySummary(templatePaths)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Template generation failed:')
    console.error(error instanceof Error ? error.message : String(error))
    
    if (error instanceof Error && error.stack) {
      console.error('\\nStack trace:')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

/**
 * Command-line interface
 */
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Healthcare Template Generator')
    console.log('============================')
    console.log('')
    console.log('Usage: yarn templates [options]')
    console.log('')
    console.log('Options:')
    console.log('  --help, -h    Show this help message')
    console.log('  --version, -v Show version information')
    console.log('')
    console.log('Generated Templates:')
    console.log(`  ${TEMPLATES.HEALTHCARE_COST}`)
    console.log(`  ${TEMPLATES.HIGH_COST_CLAIMS}`)
    console.log('')
    console.log('Templates are saved to the ./dist directory')
    process.exit(0)
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    const packageJson = require('../../package.json')
    console.log(`Healthcare Template Generator v${packageJson.version}`)
    process.exit(0)
  }
  
  // Run main generation
  main().catch(error => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })
}

export { 
  generateHealthcareCostTemplate, 
  generateHighCostClaimsTemplate, 
  DIST_DIR, 
  TEMPLATES 
}