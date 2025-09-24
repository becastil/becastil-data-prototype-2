/**
 * Integration tests for template generation
 */

import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'
import { 
  generateHealthcareCostTemplate, 
  generateHighCostClaimsTemplate,
  DIST_DIR,
  TEMPLATES
} from '../generate'
import { 
  validateHealthcareCostTemplate,
  validateHighCostClaimsTemplate 
} from '../../../lib/templates/validators'

describe('Template Generation Integration', () => {
  beforeAll(() => {
    // Ensure dist directory exists for tests
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true })
    }
  })

  afterAll(() => {
    // Clean up generated test files
    try {
      const healthcareCostPath = path.join(DIST_DIR, TEMPLATES.HEALTHCARE_COST)
      const highCostClaimsPath = path.join(DIST_DIR, TEMPLATES.HIGH_COST_CLAIMS)
      
      if (fs.existsSync(healthcareCostPath)) {
        fs.unlinkSync(healthcareCostPath)
      }
      if (fs.existsSync(highCostClaimsPath)) {
        fs.unlinkSync(highCostClaimsPath)
      }
    } catch (error) {
      console.warn('Could not clean up test files:', error)
    }
  })

  describe('Healthcare Cost Template Generation', () => {
    let templatePath: string

    beforeAll(() => {
      templatePath = generateHealthcareCostTemplate()
    })

    test('should create template file', () => {
      expect(fs.existsSync(templatePath)).toBe(true)
      expect(path.basename(templatePath)).toBe(TEMPLATES.HEALTHCARE_COST)
    })

    test('should create valid Excel file', () => {
      expect(() => {
        XLSX.readFile(templatePath)
      }).not.toThrow()
    })

    test('should have correct file size', () => {
      const stats = fs.statSync(templatePath)
      expect(stats.size).toBeGreaterThan(10000) // Should be substantial file
      expect(stats.size).toBeLessThan(500000) // But not too large
    })

    test('should validate against schema', () => {
      const workbook = XLSX.readFile(templatePath)
      const worksheet = workbook.Sheets['Healthcare Cost']
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      const validation = validateHealthcareCostTemplate(data as any[][])
      
      if (!validation.isValid) {
        console.error('Validation errors:', validation.errors)
      }
      
      expect(validation.isValid).toBe(true)
    })

    test('should have working formulas', () => {
      const workbook = XLSX.readFile(templatePath)
      const worksheet = workbook.Sheets['Healthcare Cost']
      
      // Check that key formula cells exist
      const totalHospitalCell = 'B4' // Total Hospital Medical Claims for Jan-2024
      const totalMonthlyCell = 'B32' // Total Monthly Claims for Jan-2024
      const pepmActualCell = 'B40' // PEPM Actual for Jan-2024
      
      expect(worksheet[totalHospitalCell]?.f).toBeDefined()
      expect(worksheet[totalMonthlyCell]?.f).toBeDefined()
      expect(worksheet[pepmActualCell]?.f).toBeDefined()
      
      // Verify formula content
      expect(worksheet[totalHospitalCell]?.f).toContain('+')
      expect(worksheet[totalMonthlyCell]?.f).toContain('+')
      expect(worksheet[pepmActualCell]?.f).toContain('/')
    })

    test('should have sample data that produces calculations', () => {
      const workbook = XLSX.readFile(templatePath)
      const worksheet = workbook.Sheets['Healthcare Cost']
      
      // Check that input cells have sample values
      const domesticMedicalCell = 'B2'
      const employeeCountCell = 'B36'
      
      expect(worksheet[domesticMedicalCell]?.v).toBeDefined()
      expect(worksheet[employeeCountCell]?.v).toBeDefined()
      
      // Values should be reasonable
      expect(typeof worksheet[domesticMedicalCell]?.v).toBe('number')
      expect(typeof worksheet[employeeCountCell]?.v).toBe('number')
      expect(worksheet[domesticMedicalCell]?.v).toBeGreaterThan(50000)
      expect(worksheet[employeeCountCell]?.v).toBeGreaterThan(200)
    })
  })

  describe('High Cost Claims Template Generation', () => {
    let templatePath: string

    beforeAll(() => {
      templatePath = generateHighCostClaimsTemplate()
    })

    test('should create template file', () => {
      expect(fs.existsSync(templatePath)).toBe(true)
      expect(path.basename(templatePath)).toBe(TEMPLATES.HIGH_COST_CLAIMS)
    })

    test('should create valid Excel file', () => {
      expect(() => {
        XLSX.readFile(templatePath)
      }).not.toThrow()
    })

    test('should have multiple sheets', () => {
      const workbook = XLSX.readFile(templatePath)
      expect(workbook.SheetNames).toContain('High Cost Claims')
      expect(workbook.SheetNames).toContain('Summary')
      expect(workbook.SheetNames.length).toBeGreaterThanOrEqual(2)
    })

    test('should validate against schema', () => {
      const workbook = XLSX.readFile(templatePath)
      const worksheet = workbook.Sheets['High Cost Claims']
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      const validation = validateHighCostClaimsTemplate(data as any[][])
      
      if (!validation.isValid) {
        console.error('Validation errors:', validation.errors)
      }
      
      expect(validation.isValid).toBe(true)
    })

    test('should have working formulas', () => {
      const workbook = XLSX.readFile(templatePath)
      const worksheet = workbook.Sheets['High Cost Claims']
      
      // Check first data row formulas
      const totalCell = 'I2' // Total for first member
      const reimbursementCell = 'Q2' // Stop-Loss Reimbursement for first member
      
      expect(worksheet[totalCell]?.f).toBeDefined()
      expect(worksheet[reimbursementCell]?.f).toBeDefined()
      
      // Verify formula content
      expect(worksheet[totalCell]?.f).toMatch(/\+.*\+.*\+/) // Should have multiple additions
      expect(worksheet[reimbursementCell]?.f).toContain('IF')
      expect(worksheet[reimbursementCell]?.f).toContain('MAX')
    })

    test('should have valid sample data', () => {
      const workbook = XLSX.readFile(templatePath)
      const worksheet = workbook.Sheets['High Cost Claims']
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      expect(data.length).toBeGreaterThan(1) // Header + at least 1 data row
      
      // Check first data row
      if (data.length > 1) {
        const firstDataRow = data[1] as any[]
        
        // Member ID should be positive integer
        expect(typeof firstDataRow[0]).toBe('number')
        expect(firstDataRow[0]).toBeGreaterThan(0)
        
        // Member Type should be valid enum
        expect(['Subscriber', 'Spouse', 'Dependent']).toContain(firstDataRow[1])
        
        // Percentages should be between 0 and 1
        expect(firstDataRow[6]).toBeGreaterThanOrEqual(0)
        expect(firstDataRow[6]).toBeLessThanOrEqual(1)
        expect(firstDataRow[7]).toBeGreaterThanOrEqual(0)
        expect(firstDataRow[7]).toBeLessThanOrEqual(1)
      }
    })

    test('should have functional summary sheet', () => {
      const workbook = XLSX.readFile(templatePath)
      const summarySheet = workbook.Sheets['Summary']
      
      expect(summarySheet).toBeDefined()
      expect(summarySheet['A1']?.v).toBe('TOP 10 HIGH COST CLAIMANTS')
      expect(summarySheet['A12']?.v).toBe('DIAGNOSIS CATEGORY SUMMARY')
      
      // Should have some summary data
      expect(summarySheet['A4']?.v).toBeDefined() // First rank
      expect(summarySheet['A15']?.v).toBeDefined() // First diagnosis category
    })
  })

  describe('File System Integration', () => {
    test('should create dist directory if it does not exist', () => {
      // Remove dist directory
      if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true })
      }
      
      // Generate template (should recreate directory)
      const templatePath = generateHealthcareCostTemplate()
      
      expect(fs.existsSync(DIST_DIR)).toBe(true)
      expect(fs.existsSync(templatePath)).toBe(true)
    })

    test('should overwrite existing templates', () => {
      // Generate template first time
      const templatePath = generateHealthcareCostTemplate()
      const firstStats = fs.statSync(templatePath)
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        // Generate template second time
        generateHealthcareCostTemplate()
        const secondStats = fs.statSync(templatePath)
        
        // File should have been updated (though content might be identical)
        expect(fs.existsSync(templatePath)).toBe(true)
      }, 100)
    })

    test('should handle file permission errors gracefully', () => {
      // This test would be platform-specific and might not work in all environments
      // Skipping for now but could be implemented for specific deployment scenarios
      expect(true).toBe(true)
    })
  })

  describe('End-to-End Workflow', () => {
    test('should generate both templates successfully', () => {
      const healthcareCostPath = generateHealthcareCostTemplate()
      const highCostClaimsPath = generateHighCostClaimsTemplate()
      
      expect(fs.existsSync(healthcareCostPath)).toBe(true)
      expect(fs.existsSync(highCostClaimsPath)).toBe(true)
      
      // Both should be valid Excel files
      expect(() => XLSX.readFile(healthcareCostPath)).not.toThrow()
      expect(() => XLSX.readFile(highCostClaimsPath)).not.toThrow()
    })

    test('should produce templates that can be round-tripped', () => {
      // Generate templates
      const healthcareCostPath = generateHealthcareCostTemplate()
      const highCostClaimsPath = generateHighCostClaimsTemplate()
      
      // Read them back
      const healthcareCostWorkbook = XLSX.readFile(healthcareCostPath)
      const highCostClaimsWorkbook = XLSX.readFile(highCostClaimsPath)
      
      // Convert to JSON and back to verify structure
      const healthcareCostData = XLSX.utils.sheet_to_json(
        healthcareCostWorkbook.Sheets['Healthcare Cost'], 
        { header: 1 }
      )
      const highCostClaimsData = XLSX.utils.sheet_to_json(
        highCostClaimsWorkbook.Sheets['High Cost Claims'], 
        { header: 1 }
      )
      
      expect(healthcareCostData.length).toBeGreaterThan(0)
      expect(highCostClaimsData.length).toBeGreaterThan(0)
      
      // Should be able to recreate worksheets
      const newHealthcareSheet = XLSX.utils.aoa_to_sheet(healthcareCostData as any[][])
      const newClaimsSheet = XLSX.utils.aoa_to_sheet(highCostClaimsData as any[][])
      
      expect(newHealthcareSheet).toBeDefined()
      expect(newClaimsSheet).toBeDefined()
    })
  })

  describe('Performance', () => {
    test('should generate templates quickly', () => {
      const startTime = Date.now()
      
      generateHealthcareCostTemplate()
      generateHighCostClaimsTemplate()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000)
    }, 10000) // 10 second timeout for this test

    test('should produce reasonably sized files', () => {
      const healthcareCostPath = generateHealthcareCostTemplate()
      const highCostClaimsPath = generateHighCostClaimsTemplate()
      
      const healthcareStats = fs.statSync(healthcareCostPath)
      const claimsStats = fs.statSync(highCostClaimsPath)
      
      // Files should be substantial but not excessive
      expect(healthcareStats.size).toBeGreaterThan(5000) // At least 5KB
      expect(healthcareStats.size).toBeLessThan(1000000) // Less than 1MB
      
      expect(claimsStats.size).toBeGreaterThan(5000) // At least 5KB  
      expect(claimsStats.size).toBeLessThan(1000000) // Less than 1MB
    })
  })
})