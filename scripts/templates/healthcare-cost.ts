/**
 * Healthcare Cost Template Builder
 * Generates XLSX template with formulas, formatting, and validation
 */

import * as XLSX from 'xlsx'
import { 
  HEALTHCARE_COST_ROW_ORDER, 
  FORMULA_ROW_INDICES 
} from '../../lib/templates/schemas'
import { 
  HealthcareCostFormulas, 
  NUMBER_FORMATS, 
  CELL_STYLES 
} from '../../lib/templates/formulas'
import { 
  COLUMN_WIDTHS, 
  setFreezePane 
} from '../../lib/templates/validators'

export class HealthcareCostTemplateBuilder {
  private formulas = new HealthcareCostFormulas()
  private workbook: XLSX.WorkBook
  private worksheet: XLSX.WorkSheet

  constructor() {
    this.workbook = XLSX.utils.book_new()
    this.worksheet = XLSX.utils.aoa_to_sheet([])
  }

  /**
   * Build the complete Healthcare Cost template
   */
  build(): XLSX.WorkBook {
    this.createHeaders()
    this.createRows()
    this.applyFormulas()
    this.applyFormatting()
    this.applyValidation()
    this.finalizeWorksheet()
    return this.workbook
  }

  /**
   * Create header row with month columns
   */
  private createHeaders() {
    const headers = [
      'Category',
      'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024',
      'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
    ]
    
    // Set header row
    XLSX.utils.sheet_add_aoa(this.worksheet, [headers], { origin: 'A1' })
  }

  /**
   * Create all data rows with proper structure
   */
  private createRows() {
    const rows: (string | number | null)[][] = []

    HEALTHCARE_COST_ROW_ORDER.forEach((rowLabel) => {
      if (rowLabel === '') {
        // Blank row
        rows.push(['', null, null, null, null, null, null, null, null, null, null, null, null])
      } else if (this.isSectionHeader(rowLabel)) {
        // Section header - no data columns
        rows.push([rowLabel, null, null, null, null, null, null, null, null, null, null, null, null])
      } else {
        // Data row - will be filled with sample data or formulas
        rows.push([rowLabel, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
      }
    })

    // Add rows starting from row 2 (after headers)
    XLSX.utils.sheet_add_aoa(this.worksheet, rows, { origin: 'A2' })
  }

  /**
   * Check if a row label is a section header
   */
  private isSectionHeader(rowLabel: string): boolean {
    return [
      'MEDICAL CLAIMS',
      'PHARMACY CLAIMS',
      'STOP LOSS',
      'ADMINISTRATIVE COSTS',
      'SUMMARY TOTALS',
      'ENROLLMENT METRICS',
      'PER EMPLOYEE PER MONTH (PEPM) METRICS',
      'BUDGET ANALYSIS',
      'Fixed Costs:'
    ].includes(rowLabel)
  }

  /**
   * Apply all Excel formulas
   */
  private applyFormulas() {
    // Apply formulas for each month column (1-12)
    for (let month = 1; month <= 12; month++) {
      this.applyMonthFormulas(month)
    }
  }

  /**
   * Apply formulas for a specific month column
   */
  private applyMonthFormulas(monthCol: number) {
    const colLetter = this.getColumnLetter(monthCol)

    // Medical Claims formulas
    this.setCellFormula(FORMULA_ROW_INDICES.TOTAL_HOSPITAL_MEDICAL, monthCol, 
      this.formulas.getTotalHospitalMedical(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.TOTAL_ALL_MEDICAL, monthCol, 
      this.formulas.getTotalAllMedical(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.TOTAL_ADJUSTED_MEDICAL, monthCol, 
      this.formulas.getTotalAdjustedMedical(monthCol))

    // Pharmacy formulas
    this.setCellFormula(FORMULA_ROW_INDICES.NET_PHARMACY, monthCol, 
      this.formulas.getNetPharmacy(monthCol))

    // Stop Loss formulas  
    this.setCellFormula(FORMULA_ROW_INDICES.NET_STOP_LOSS, monthCol, 
      this.formulas.getNetStopLoss(monthCol))

    // Administrative formulas
    this.setCellFormula(FORMULA_ROW_INDICES.TOTAL_FIXED_COSTS, monthCol, 
      this.formulas.getTotalFixedCosts(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.TOTAL_ADMIN_FEES, monthCol, 
      this.formulas.getTotalAdminFees(monthCol))

    // Summary formulas
    this.setCellFormula(FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, monthCol, 
      this.formulas.getTotalMonthlyClaims(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.CUMULATIVE_CLAIMS, monthCol, 
      this.formulas.getCumulativeClaims(monthCol))

    // PEMP formulas
    this.setCellFormula(FORMULA_ROW_INDICES.PEPM_ACTUAL, monthCol, 
      this.formulas.getPEPMActual(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.PEPM_CUMULATIVE, monthCol, 
      this.formulas.getPEPMCumulative(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.PEPM_BUDGET_ENROLLMENT, monthCol, 
      this.formulas.getPEPMBudgetEnrollment(monthCol))

    // Budget Analysis formulas
    this.setCellFormula(FORMULA_ROW_INDICES.ANNUAL_CUMULATIVE_BUDGET, monthCol, 
      this.formulas.getAnnualCumulativeBudget(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.ACTUAL_MONTHLY_DIFFERENCE, monthCol, 
      this.formulas.getActualMonthlyDifference(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_MONTHLY, monthCol, 
      this.formulas.getPercentageDifferenceMonthly(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.CUMULATIVE_DIFFERENCE, monthCol, 
      this.formulas.getCumulativeDifference(monthCol))
    this.setCellFormula(FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_CUMULATIVE, monthCol, 
      this.formulas.getPercentageDifferenceCumulative(monthCol))
  }

  /**
   * Set formula for a specific cell
   */
  private setCellFormula(row: number, col: number, formula: string) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
    if (!this.worksheet[cellAddress]) {
      this.worksheet[cellAddress] = { t: 'n', v: 0 }
    }
    this.worksheet[cellAddress].f = formula.replace('=', '') // Remove leading =
  }

  /**
   * Apply number formatting and cell styles
   */
  private applyFormatting() {
    const range = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1')

    // Apply header formatting
    for (let col = range.s.c; col <= range.e.c; col++) {
      this.setCellStyle(0, col, {
        ...CELL_STYLES.HEADER,
        numFmt: NUMBER_FORMATS.WHOLE_NUMBER
      })
    }

    // Apply data formatting row by row
    for (let row = 1; row <= range.e.r; row++) {
      const categoryCell = this.worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
      const category = categoryCell?.v || ''

      if (this.isSectionHeader(category)) {
        // Section header formatting
        this.setCellStyle(row, 0, CELL_STYLES.SECTION_HEADER)
      } else if (category === '') {
        // Blank row - no special formatting
        continue
      } else {
        // Data row formatting
        this.setCellStyle(row, 0, { // Category column
          ...CELL_STYLES.DATA_CELL,
          alignment: { horizontal: 'left', vertical: 'center' }
        })

        // Apply number formatting to data columns
        for (let col = 1; col <= 12; col++) {
          const style = { 
            ...CELL_STYLES.DATA_CELL,
            ...(row % 2 === 0 ? CELL_STYLES.ZEBRA_EVEN : CELL_STYLES.ZEBRA_ODD)
          }

          // Apply appropriate number format
          const extendedStyle = style as any
          if (this.isEmployeeCountRow(row)) {
            extendedStyle.numFmt = NUMBER_FORMATS.WHOLE_NUMBER
          } else if (this.isPercentageRow(row)) {
            extendedStyle.numFmt = NUMBER_FORMATS.PERCENTAGE
          } else if (this.isPEPMRow(row)) {
            extendedStyle.numFmt = NUMBER_FORMATS.NUMBER_2_DECIMALS
          } else {
            extendedStyle.numFmt = NUMBER_FORMATS.CURRENCY
          }

          this.setCellStyle(row, col, extendedStyle)
        }
      }
    }
  }

  /**
   * Check if row should use whole numbers (employee/member counts)
   */
  private isEmployeeCountRow(row: number): boolean {
    return row === FORMULA_ROW_INDICES.EMPLOYEE_COUNT || 
           row === FORMULA_ROW_INDICES.MEMBER_COUNT
  }

  /**
   * Check if row should use percentage formatting
   */
  private isPercentageRow(row: number): boolean {
    return row === FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_MONTHLY ||
           row === FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_CUMULATIVE
  }

  /**
   * Check if row should use PEPM decimal formatting
   */
  private isPEPMRow(row: number): boolean {
    return row === FORMULA_ROW_INDICES.PEPM_ACTUAL ||
           row === FORMULA_ROW_INDICES.PEPM_CUMULATIVE ||
           row === FORMULA_ROW_INDICES.INCURRED_TARGET_PEPM ||
           row === FORMULA_ROW_INDICES.PEPM_BUDGET
  }

  /**
   * Set cell style
   */
  private setCellStyle(row: number, col: number, style: any) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
    if (!this.worksheet[cellAddress]) {
      this.worksheet[cellAddress] = { t: 's', v: '' }
    }
    this.worksheet[cellAddress].s = style
  }

  /**
   * Apply data validation (minimal for healthcare cost template)
   */
  private applyValidation() {
    // Healthcare cost template primarily uses formulas
    // Could add validation for enrollment counts to be positive integers
    // For now, keeping it simple
  }

  /**
   * Finalize worksheet with column widths and freeze panes
   */
  private finalizeWorksheet() {
    // Set column widths
    this.worksheet['!cols'] = COLUMN_WIDTHS.HEALTHCARE_COST

    // Freeze header row and category column
    setFreezePane(this.worksheet, 1, 1)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'Healthcare Cost')
  }

  /**
   * Get column letter from column index (0-based)
   */
  private getColumnLetter(col: number): string {
    let result = ''
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result
      col = Math.floor(col / 26) - 1
    }
    return result
  }

  /**
   * Generate sample data for demonstration
   */
  static generateSampleData(): Record<string, number[]> {
    const months = 12
    
    return {
      // Sample medical claims data with realistic variation
      domesticMedical: Array.from({ length: months }, (_, i) => 125000 + (Math.random() - 0.5) * 20000),
      nonDomesticMedical: Array.from({ length: months }, (_, i) => 15000 + (Math.random() - 0.5) * 5000),
      nonHospitalMedical: Array.from({ length: months }, (_, i) => 85000 + (Math.random() - 0.5) * 15000),
      adjustments: Array.from({ length: months }, (_, i) => (Math.random() - 0.5) * 8000),
      
      // Pharmacy data
      totalPharmacy: Array.from({ length: months }, (_, i) => 42000 + (Math.random() - 0.5) * 8000),
      pharmacyRebates: Array.from({ length: months }, (_, i) => -3000 - Math.random() * 2000), // Negative
      
      // Stop Loss data
      stopLossFees: Array.from({ length: months }, (_, i) => 8500 + (Math.random() - 0.5) * 1500),
      stopLossReimbursements: Array.from({ length: months }, (_, i) => -5000 - Math.random() * 3000), // Negative
      
      // Administrative costs
      consultingFees: Array.from({ length: months }, () => 2500), // Fixed
      tpaCobraAdmin: Array.from({ length: months }, () => 5200), // Fixed
      anthemNetwork: Array.from({ length: months }, () => 3800), // Fixed
      keenanPharmacyCoalition: Array.from({ length: months }, () => 1200), // Fixed
      keenanPharmacyManagement: Array.from({ length: months }, () => 2800), // Fixed
      otherExpressScripts: Array.from({ length: months }, () => 950), // Fixed
      
      // Enrollment data
      employeeCount: Array.from({ length: months }, (_, i) => 285 + Math.floor((Math.random() - 0.5) * 10)),
      memberCount: Array.from({ length: months }, (_, i) => 420 + Math.floor((Math.random() - 0.5) * 15)),
      
      // Budget data
      incurredTargetPEPM: Array.from({ length: months }, () => 850),
      pepmBudget: Array.from({ length: months }, () => 900)
    }
  }
}