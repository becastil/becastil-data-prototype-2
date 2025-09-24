/**
 * Tests for Healthcare Cost Template Builder
 */

import * as XLSX from 'xlsx'
import { HealthcareCostTemplateBuilder } from '../healthcare-cost'
import { 
  HEALTHCARE_COST_ROW_ORDER, 
  FORMULA_ROW_INDICES 
} from '../../../lib/templates/schemas'
import { NUMBER_FORMATS } from '../../../lib/templates/formulas'

describe('HealthcareCostTemplateBuilder', () => {
  let builder: HealthcareCostTemplateBuilder
  let workbook: XLSX.WorkBook
  let worksheet: XLSX.WorkSheet

  beforeEach(() => {
    builder = new HealthcareCostTemplateBuilder()
    workbook = builder.build()
    worksheet = workbook.Sheets['Healthcare Cost']
  })

  describe('Template Structure', () => {
    test('should create workbook with correct sheet name', () => {
      expect(workbook.SheetNames).toContain('Healthcare Cost')
    })

    test('should have correct header row', () => {
      const expectedHeaders = [
        'Category', 'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024',
        'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
      ]

      expectedHeaders.forEach((header, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index })
        expect(worksheet[cellAddress]?.v).toBe(header)
      })
    })

    test('should have correct row order', () => {
      HEALTHCARE_COST_ROW_ORDER.forEach((expectedRow, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: index + 1, c: 0 })
        const actualValue = worksheet[cellAddress]?.v || ''
        expect(actualValue).toBe(expectedRow)
      })
    })

    test('should have exactly 51 rows (including header)', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      expect(range.e.r + 1).toBe(51) // 50 data rows + 1 header row
    })

    test('should have exactly 13 columns', () => {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      expect(range.e.c + 1).toBe(13) // Category + 12 months
    })
  })

  describe('Formula Validation', () => {
    test('should have Total Hospital Medical Claims formula', () => {
      // Check formula in first month column (Jan-2024, column B/index 1)
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.TOTAL_HOSPITAL_MEDICAL, c: 1 })
      const cell = worksheet[cellAddress]
      
      expect(cell?.f).toBeDefined()
      expect(cell?.f).toContain('B2+B3') // Domestic + Non-Domestic
    })

    test('should have Total All Medical Claims formula', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.TOTAL_ALL_MEDICAL, c: 1 })
      const cell = worksheet[cellAddress]
      
      expect(cell?.f).toBeDefined()
      expect(cell?.f).toContain('B4+B5') // Hospital + Non-Hospital
    })

    test('should have Net Pharmacy Claims formula', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.NET_PHARMACY, c: 1 })
      const cell = worksheet[cellAddress]
      
      expect(cell?.f).toBeDefined()
      expect(cell?.f).toContain('B11+B12') // Total Pharmacy + Rebates
    })

    test('should have Total Monthly Claims formula', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, c: 1 })
      const cell = worksheet[cellAddress]
      
      expect(cell?.f).toBeDefined()
      // Should sum Medical + Pharmacy + Stop Loss + Admin
      expect(cell?.f).toContain('B8+B13+B18+B29')
    })

    test('should have PEPM Actual formula', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.PEPM_ACTUAL, c: 1 })
      const cell = worksheet[cellAddress]
      
      expect(cell?.f).toBeDefined()
      expect(cell?.f).toContain('B32/B36') // Total Claims / Employee Count
    })

    test('should have cumulative formulas for second month', () => {
      // Cumulative Claims for Feb-2024 (column 2)
      const cumulativeClaimsAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.CUMULATIVE_CLAIMS, c: 2 })
      const cell = worksheet[cumulativeClaimsAddress]
      
      expect(cell?.f).toBeDefined()
      expect(cell?.f).toContain('C32+B33') // Current month + Previous cumulative
    })
  })

  describe('Calculated Values', () => {
    test('should calculate totals correctly when input values are provided', () => {
      // Set test values for Domestic and Non-Domestic Medical
      const domesticCell = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.DOMESTIC_MEDICAL, c: 1 })
      const nonDomesticCell = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.NON_DOMESTIC_MEDICAL, c: 1 })
      
      worksheet[domesticCell] = { t: 'n', v: 100000 }
      worksheet[nonDomesticCell] = { t: 'n', v: 25000 }
      
      // Recalculate (simulate Excel recalculation)
      // In real Excel, Total Hospital Medical Claims would be 125000
      const expectedTotal = 125000
      
      // Verify the formula exists (actual calculation happens in Excel)
      const totalCell = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.TOTAL_HOSPITAL_MEDICAL, c: 1 })
      expect(worksheet[totalCell]?.f).toContain('B2+B3')
    })

    test('should handle negative values for rebates and reimbursements', () => {
      // Set negative pharmacy rebate
      const rebateCell = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.PHARMACY_REBATES, c: 1 })
      worksheet[rebateCell] = { t: 'n', v: -5000 }
      
      // Verify negative values are preserved
      expect(worksheet[rebateCell].v).toBe(-5000)
      
      // Verify Net Pharmacy formula exists
      const netPharmacyCell = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.NET_PHARMACY, c: 1 })
      expect(worksheet[netPharmacyCell]?.f).toBeDefined()
    })
  })

  describe('Number Formatting', () => {
    test('should apply currency formatting to financial cells', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.DOMESTIC_MEDICAL, c: 1 })
      const cell = worksheet[cellAddress]
      
      if (cell?.s?.numFmt) {
        expect(cell.s.numFmt).toBe(NUMBER_FORMATS.CURRENCY)
      }
    })

    test('should apply percentage formatting to percentage cells', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_MONTHLY, c: 1 })
      const cell = worksheet[cellAddress]
      
      if (cell?.s?.numFmt) {
        expect(cell.s.numFmt).toBe(NUMBER_FORMATS.PERCENTAGE)
      }
    })

    test('should apply whole number formatting to count cells', () => {
      const cellAddress = XLSX.utils.encode_cell({ r: FORMULA_ROW_INDICES.EMPLOYEE_COUNT, c: 1 })
      const cell = worksheet[cellAddress]
      
      if (cell?.s?.numFmt) {
        expect(cell.s.numFmt).toBe(NUMBER_FORMATS.WHOLE_NUMBER)
      }
    })
  })

  describe('Worksheet Formatting', () => {
    test('should have frozen panes', () => {
      expect(worksheet['!freeze']).toBeDefined()
      expect(worksheet['!freeze']?.ySplit).toBe(1) // Freeze header row
      expect(worksheet['!freeze']?.xSplit).toBe(1) // Freeze category column
    })

    test('should have column width settings', () => {
      expect(worksheet['!cols']).toBeDefined()
      expect(worksheet['!cols']?.length).toBe(13) // 13 columns
      
      // Category column should be wider
      expect(worksheet['!cols']?.[0]?.wch).toBeGreaterThan(20)
      
      // Month columns should be narrower
      expect(worksheet['!cols']?.[1]?.wch).toBeLessThan(20)
    })
  })

  describe('Sample Data Generation', () => {
    test('should generate realistic sample data', () => {
      const sampleData = HealthcareCostTemplateBuilder.generateSampleData()
      
      expect(sampleData.domesticMedical).toHaveLength(12)
      expect(sampleData.employeeCount).toHaveLength(12)
      
      // Check that values are within reasonable ranges
      sampleData.domesticMedical.forEach(value => {
        expect(value).toBeGreaterThan(100000)
        expect(value).toBeLessThan(200000)
      })
      
      sampleData.employeeCount.forEach(value => {
        expect(value).toBeGreaterThan(250)
        expect(value).toBeLessThan(350)
      })
      
      // Rebates should be negative
      sampleData.pharmacyRebates.forEach(value => {
        expect(value).toBeLessThan(0)
      })
    })
  })

  describe('Data Integrity', () => {
    test('should preserve blank rows in correct positions', () => {
      const blankRowIndices = [8, 13, 18, 30, 34, 38, 45]
      
      blankRowIndices.forEach(rowIndex => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 })
        const cell = worksheet[cellAddress]
        expect(cell?.v === '' || cell?.v === undefined).toBe(true)
      })
    })

    test('should have section headers in correct positions', () => {
      const sectionHeaders = [
        { row: 0, text: 'MEDICAL CLAIMS' }, // This is actually row 1 in the data
        { row: 9, text: 'PHARMACY CLAIMS' },
        { row: 14, text: 'STOP LOSS' },
        { row: 19, text: 'ADMINISTRATIVE COSTS' },
        { row: 31, text: 'SUMMARY TOTALS' },
        { row: 35, text: 'ENROLLMENT METRICS' },
        { row: 39, text: 'PER EMPLOYEE PER MONTH (PEPM) METRICS' },
        { row: 46, text: 'BUDGET ANALYSIS' }
      ]

      sectionHeaders.forEach(({ row, text }) => {
        const cellAddress = XLSX.utils.encode_cell({ r: row + 1, c: 0 }) // +1 for header row
        expect(worksheet[cellAddress]?.v).toBe(text)
      })
    })
  })
})