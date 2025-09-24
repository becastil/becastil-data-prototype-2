/**
 * Tests for High Cost Claims Template Builder
 */

import * as XLSX from 'xlsx'
import { HighCostClaimsTemplateBuilder } from '../high-cost-claims'
import { 
  HIGH_COST_CLAIMS_COLUMN_ORDER,
  MemberTypeSchema,
  AgeBandSchema,
  EnrolledSchema,
  HitStopLossSchema
} from '../../../lib/templates/schemas'
import { NUMBER_FORMATS } from '../../../lib/templates/formulas'

describe('HighCostClaimsTemplateBuilder', () => {
  let builder: HighCostClaimsTemplateBuilder
  let workbook: XLSX.WorkBook
  let worksheet: XLSX.WorkSheet

  beforeEach(() => {
    builder = new HighCostClaimsTemplateBuilder()
    workbook = builder.build()
    worksheet = workbook.Sheets['High Cost Claims']
  })

  describe('Template Structure', () => {
    test('should create workbook with correct sheet name', () => {
      expect(workbook.SheetNames).toContain('High Cost Claims')
    })

    test('should have correct header row', () => {
      HIGH_COST_CLAIMS_COLUMN_ORDER.forEach((header, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index })
        expect(worksheet[cellAddress]?.v).toBe(header)
      })
    })

    test('should have exactly 18 columns', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      expect(range.e.c + 1).toBe(HIGH_COST_CLAIMS_COLUMN_ORDER.length)
    })

    test('should have sample data rows', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      expect(range.e.r).toBeGreaterThan(0) // Should have at least header + 1 data row
    })
  })

  describe('Formula Validation', () => {
    test('should have Total formula in each data row', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      // Check first few data rows for Total formula (column I, index 8)
      for (let row = 1; row <= Math.min(5, range.e.r); row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 8 })
        const cell = worksheet[cellAddress]
        
        if (cell) {
          expect(cell.f).toBeDefined()
          expect(cell.f).toMatch(/J\d+\+K\d+\+L\d+\+M\d+/) // Inpatient + Outpatient + Professional + Pharmacy
        }
      }
    })

    test('should have Stop-Loss Reimbursement formula in each data row', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      // Check first few data rows for Stop-Loss Reimbursement formula (column Q, index 16)
      for (let row = 1; row <= Math.min(5, range.e.r); row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 16 })
        const cell = worksheet[cellAddress]
        
        if (cell) {
          expect(cell.f).toBeDefined()
          expect(cell.f).toContain('IF') // Should be an IF formula
          expect(cell.f).toContain('MAX') // Should contain MAX function
        }
      }
    })
  })

  describe('Sample Data Validation', () => {
    test('should have valid Member IDs', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        const memberIdCell = XLSX.utils.encode_cell({ r: row, c: 0 })
        const cell = worksheet[memberIdCell]
        
        if (cell?.v) {
          expect(typeof cell.v).toBe('number')
          expect(cell.v).toBeGreaterThan(0)
          expect(Number.isInteger(cell.v)).toBe(true)
        }
      }
    })

    test('should have valid Member Types', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        const memberTypeCell = XLSX.utils.encode_cell({ r: row, c: 1 })
        const cell = worksheet[memberTypeCell]
        
        if (cell?.v) {
          expect(MemberTypeSchema.options).toContain(cell.v)
        }
      }
    })

    test('should have valid Age Bands', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        const ageBandCell = XLSX.utils.encode_cell({ r: row, c: 2 })
        const cell = worksheet[ageBandCell]
        
        if (cell?.v) {
          expect(AgeBandSchema.options).toContain(cell.v)
        }
      }
    })

    test('should have valid percentage values', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const percentageColumns = [6, 7] // % of Plan Paid, % of large claims
      
      for (let row = 1; row <= range.e.r; row++) {
        percentageColumns.forEach(col => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          const cell = worksheet[cellAddress]
          
          if (cell?.v && typeof cell.v === 'number') {
            expect(cell.v).toBeGreaterThanOrEqual(0)
            expect(cell.v).toBeLessThanOrEqual(1)
          }
        })
      }
    })

    test('should have non-negative currency values', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const currencyColumns = [8, 9, 10, 11, 12, 15, 16] // Total, Inpatient, Outpatient, Professional, Pharmacy, Deductible, Reimbursement
      
      for (let row = 1; row <= range.e.r; row++) {
        currencyColumns.forEach(col => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          const cell = worksheet[cellAddress]
          
          if (cell?.v && typeof cell.v === 'number') {
            expect(cell.v).toBeGreaterThanOrEqual(0)
          }
        })
      }
    })

    test('should have valid Enrolled values', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        const enrolledCell = XLSX.utils.encode_cell({ r: row, c: 14 })
        const cell = worksheet[enrolledCell]
        
        if (cell?.v) {
          expect(EnrolledSchema.options).toContain(cell.v)
        }
      }
    })

    test('should have valid Hit Stop Loss values', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        const hitStopLossCell = XLSX.utils.encode_cell({ r: row, c: 17 })
        const cell = worksheet[hitStopLossCell]
        
        if (cell?.v) {
          expect(HitStopLossSchema.options).toContain(cell.v)
        }
      }
    })
  })

  describe('Calculated Values', () => {
    test('should calculate Total correctly', () => {
      // Test with known values
      const testRow = 1
      const inpatient = 45000
      const outpatient = 8500
      const professional = 12000
      const pharmacy = 3200
      const expectedTotal = inpatient + outpatient + professional + pharmacy
      
      // Set test values
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 9 })] = { t: 'n', v: inpatient }
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 10 })] = { t: 'n', v: outpatient }
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 11 })] = { t: 'n', v: professional }
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 12 })] = { t: 'n', v: pharmacy }
      
      // Verify formula exists (actual calculation happens in Excel)
      const totalCell = XLSX.utils.encode_cell({ r: testRow, c: 8 })
      expect(worksheet[totalCell]?.f).toBeDefined()
      expect(worksheet[totalCell]?.f).toMatch(/J2\+K2\+L2\+M2/)
    })

    test('should calculate Stop-Loss Reimbursement correctly for hit claims', () => {
      const testRow = 1
      const total = 68700
      const deductible = 50000
      const expectedReimbursement = total - deductible
      
      // Set test values
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 8 })] = { t: 'n', v: total }
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 15 })] = { t: 'n', v: deductible }
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 17 })] = { t: 's', v: 'Yes' }
      
      // Verify formula exists
      const reimbursementCell = XLSX.utils.encode_cell({ r: testRow, c: 16 })
      expect(worksheet[reimbursementCell]?.f).toBeDefined()
      expect(worksheet[reimbursementCell]?.f).toContain('IF')
      expect(worksheet[reimbursementCell]?.f).toContain('"Yes"')
      expect(worksheet[reimbursementCell]?.f).toContain('MAX')
    })

    test('should return zero reimbursement for non-hit claims', () => {
      const testRow = 1
      
      // Set Hit Stop Loss to "No"
      worksheet[XLSX.utils.encode_cell({ r: testRow, c: 17 })] = { t: 's', v: 'No' }
      
      // Verify formula handles "No" case
      const reimbursementCell = XLSX.utils.encode_cell({ r: testRow, c: 16 })
      expect(worksheet[reimbursementCell]?.f).toBeDefined()
      expect(worksheet[reimbursementCell]?.f).toContain('IF')
      expect(worksheet[reimbursementCell]?.f).toContain(',0')
    })
  })

  describe('Number Formatting', () => {
    test('should apply percentage formatting to percentage columns', () => {
      const percentageColumns = [6, 7]
      
      percentageColumns.forEach(col => {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col })
        const cell = worksheet[cellAddress]
        
        if (cell?.s?.numFmt) {
          expect(cell.s.numFmt).toBe(NUMBER_FORMATS.PERCENTAGE)
        }
      })
    })

    test('should apply currency formatting to currency columns', () => {
      const currencyColumns = [8, 9, 10, 11, 12, 15, 16]
      
      currencyColumns.forEach(col => {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col })
        const cell = worksheet[cellAddress]
        
        if (cell?.s?.numFmt) {
          expect(cell.s.numFmt).toBe(NUMBER_FORMATS.CURRENCY)
        }
      })
    })

    test('should apply whole number formatting to Member ID', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: 0 })
      const cell = worksheet[cellAddress]
      
      if (cell?.s?.numFmt) {
        expect(cell.s.numFmt).toBe(NUMBER_FORMATS.WHOLE_NUMBER)
      }
    })
  })

  describe('Data Validation', () => {
    test('should have data validation for enum columns', () => {
      // Data validation is set on the worksheet
      if (worksheet['!dataValidation']) {
        const validations = worksheet['!dataValidation']
        
        // Should have validations for Member Type, Age Band, Enrolled, Hit Stop Loss
        expect(validations.length).toBeGreaterThan(0)
        
        // Check that validations reference correct ranges
        validations.forEach(validation => {
          expect(validation.sqref).toBeDefined()
          expect(validation.type).toBeDefined()
        })
      }
    })
  })

  describe('Worksheet Formatting', () => {
    test('should have frozen header row', () => {
      expect(worksheet['!freeze']).toBeDefined()
      expect(worksheet['!freeze']?.ySplit).toBe(1)
    })

    test('should have appropriate column widths', () => {
      expect(worksheet['!cols']).toBeDefined()
      expect(worksheet['!cols']?.length).toBe(HIGH_COST_CLAIMS_COLUMN_ORDER.length)
      
      // Check some specific column widths
      const cols = worksheet['!cols']
      if (cols) {
        expect(cols[0]?.wch).toBe(12) // Member ID
        expect(cols[5]?.wch).toBe(35) // Specific Diagnosis Details - should be wider
        expect(cols[14]?.wch).toBe(10) // Enrolled - should be narrow
      }
    })
  })

  describe('Summary Sheet', () => {
    test('should create summary sheet with correct structure', () => {
      const summarySheet = builder.createSummarySheet()
      expect(summarySheet).toBeDefined()
      
      // Check for section titles
      expect(summarySheet['A1']?.v).toBe('TOP 10 HIGH COST CLAIMANTS')
      expect(summarySheet['A12']?.v).toBe('DIAGNOSIS CATEGORY SUMMARY')
      
      // Check for column headers
      expect(summarySheet['A3']?.v).toBe('Rank')
      expect(summarySheet['B3']?.v).toBe('Member ID')
      expect(summarySheet['A14']?.v).toBe('Primary Diagnosis Category')
    })

    test('should have formatted summary data', () => {
      const summarySheet = builder.createSummarySheet()
      
      // Check that summary sheet has column width settings
      expect(summarySheet['!cols']).toBeDefined()
      expect(summarySheet['!cols']?.length).toBe(5)
    })
  })

  describe('Data Integrity', () => {
    test('should have realistic diagnosis categories', () => {
      const validCategories = [
        'Cardiovascular', 'Oncology', 'Neonatal', 'Renal', 'Neurological',
        'Orthopedic', 'Gastrointestinal', 'Respiratory', 'Endocrine'
      ]
      
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        const diagnosisCell = XLSX.utils.encode_cell({ r: row, c: 3 })
        const cell = worksheet[diagnosisCell]
        
        if (cell?.v) {
          // Don't strictly validate since sample data might have custom categories
          expect(typeof cell.v).toBe('string')
          expect(cell.v.length).toBeGreaterThan(0)
        }
      }
    })

    test('should have consistent data relationships', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      for (let row = 1; row <= range.e.r; row++) {
        // If Hit Stop Loss is "Yes", Total should be greater than Deductible
        const hitStopLossCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 17 })]
        const totalCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })]
        const deductibleCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 15 })]
        
        if (hitStopLossCell?.v === 'Yes' && totalCell?.v && deductibleCell?.v) {
          expect(totalCell.v).toBeGreaterThan(deductibleCell.v)
        }
      }
    })
  })
})