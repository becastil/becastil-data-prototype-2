"use strict";
/**
 * Healthcare Cost Template Builder
 * Generates XLSX template with formulas, formatting, and validation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareCostTemplateBuilder = void 0;
const XLSX = __importStar(require("xlsx"));
const schemas_1 = require("../../lib/templates/schemas");
const formulas_1 = require("../../lib/templates/formulas");
const validators_1 = require("../../lib/templates/validators");
class HealthcareCostTemplateBuilder {
    constructor() {
        this.formulas = new formulas_1.HealthcareCostFormulas();
        this.workbook = XLSX.utils.book_new();
        this.worksheet = XLSX.utils.aoa_to_sheet([]);
    }
    /**
     * Build the complete Healthcare Cost template
     */
    build() {
        this.createHeaders();
        this.createRows();
        this.applyFormulas();
        this.applyFormatting();
        this.applyValidation();
        this.finalizeWorksheet();
        return this.workbook;
    }
    /**
     * Create header row with month columns
     */
    createHeaders() {
        const headers = [
            'Category',
            'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024',
            'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
        ];
        // Set header row
        XLSX.utils.sheet_add_aoa(this.worksheet, [headers], { origin: 'A1' });
    }
    /**
     * Create all data rows with proper structure
     */
    createRows() {
        const rows = [];
        schemas_1.HEALTHCARE_COST_ROW_ORDER.forEach((rowLabel) => {
            if (rowLabel === '') {
                // Blank row
                rows.push(['', null, null, null, null, null, null, null, null, null, null, null, null]);
            }
            else if (this.isSectionHeader(rowLabel)) {
                // Section header - no data columns
                rows.push([rowLabel, null, null, null, null, null, null, null, null, null, null, null, null]);
            }
            else {
                // Data row - will be filled with sample data or formulas
                rows.push([rowLabel, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            }
        });
        // Add rows starting from row 2 (after headers)
        XLSX.utils.sheet_add_aoa(this.worksheet, rows, { origin: 'A2' });
    }
    /**
     * Check if a row label is a section header
     */
    isSectionHeader(rowLabel) {
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
        ].includes(rowLabel);
    }
    /**
     * Apply all Excel formulas
     */
    applyFormulas() {
        // Apply formulas for each month column (1-12)
        for (let month = 1; month <= 12; month++) {
            this.applyMonthFormulas(month);
        }
    }
    /**
     * Apply formulas for a specific month column
     */
    applyMonthFormulas(monthCol) {
        const colLetter = this.getColumnLetter(monthCol);
        // Medical Claims formulas
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.TOTAL_HOSPITAL_MEDICAL, monthCol, this.formulas.getTotalHospitalMedical(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.TOTAL_ALL_MEDICAL, monthCol, this.formulas.getTotalAllMedical(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.TOTAL_ADJUSTED_MEDICAL, monthCol, this.formulas.getTotalAdjustedMedical(monthCol));
        // Pharmacy formulas
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.NET_PHARMACY, monthCol, this.formulas.getNetPharmacy(monthCol));
        // Stop Loss formulas  
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.NET_STOP_LOSS, monthCol, this.formulas.getNetStopLoss(monthCol));
        // Administrative formulas
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.TOTAL_FIXED_COSTS, monthCol, this.formulas.getTotalFixedCosts(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.TOTAL_ADMIN_FEES, monthCol, this.formulas.getTotalAdminFees(monthCol));
        // Summary formulas
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, monthCol, this.formulas.getTotalMonthlyClaims(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.CUMULATIVE_CLAIMS, monthCol, this.formulas.getCumulativeClaims(monthCol));
        // PEMP formulas
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.PEPM_ACTUAL, monthCol, this.formulas.getPEPMActual(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.PEPM_CUMULATIVE, monthCol, this.formulas.getPEPMCumulative(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET_ENROLLMENT, monthCol, this.formulas.getPEPMBudgetEnrollment(monthCol));
        // Budget Analysis formulas
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.ANNUAL_CUMULATIVE_BUDGET, monthCol, this.formulas.getAnnualCumulativeBudget(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.ACTUAL_MONTHLY_DIFFERENCE, monthCol, this.formulas.getActualMonthlyDifference(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_MONTHLY, monthCol, this.formulas.getPercentageDifferenceMonthly(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.CUMULATIVE_DIFFERENCE, monthCol, this.formulas.getCumulativeDifference(monthCol));
        this.setCellFormula(schemas_1.FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_CUMULATIVE, monthCol, this.formulas.getPercentageDifferenceCumulative(monthCol));
    }
    /**
     * Set formula for a specific cell
     */
    setCellFormula(row, col, formula) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!this.worksheet[cellAddress]) {
            this.worksheet[cellAddress] = { t: 'n', v: 0 };
        }
        this.worksheet[cellAddress].f = formula.replace('=', ''); // Remove leading =
    }
    /**
     * Apply number formatting and cell styles
     */
    applyFormatting() {
        const range = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1');
        // Apply header formatting
        for (let col = range.s.c; col <= range.e.c; col++) {
            this.setCellStyle(0, col, {
                ...formulas_1.CELL_STYLES.HEADER,
                numFmt: formulas_1.NUMBER_FORMATS.WHOLE_NUMBER
            });
        }
        // Apply data formatting row by row
        for (let row = 1; row <= range.e.r; row++) {
            const categoryCell = this.worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
            const category = categoryCell?.v || '';
            if (this.isSectionHeader(category)) {
                // Section header formatting
                this.setCellStyle(row, 0, formulas_1.CELL_STYLES.SECTION_HEADER);
            }
            else if (category === '') {
                // Blank row - no special formatting
                continue;
            }
            else {
                // Data row formatting
                this.setCellStyle(row, 0, {
                    ...formulas_1.CELL_STYLES.DATA_CELL,
                    alignment: { horizontal: 'left', vertical: 'center' }
                });
                // Apply number formatting to data columns
                for (let col = 1; col <= 12; col++) {
                    const style = {
                        ...formulas_1.CELL_STYLES.DATA_CELL,
                        ...(row % 2 === 0 ? formulas_1.CELL_STYLES.ZEBRA_EVEN : formulas_1.CELL_STYLES.ZEBRA_ODD)
                    };
                    // Apply appropriate number format
                    if (this.isEmployeeCountRow(row)) {
                        style.numFmt = formulas_1.NUMBER_FORMATS.WHOLE_NUMBER;
                    }
                    else if (this.isPercentageRow(row)) {
                        style.numFmt = formulas_1.NUMBER_FORMATS.PERCENTAGE;
                    }
                    else if (this.isPEPMRow(row)) {
                        style.numFmt = formulas_1.NUMBER_FORMATS.NUMBER_2_DECIMALS;
                    }
                    else {
                        style.numFmt = formulas_1.NUMBER_FORMATS.CURRENCY;
                    }
                    this.setCellStyle(row, col, style);
                }
            }
        }
    }
    /**
     * Check if row should use whole numbers (employee/member counts)
     */
    isEmployeeCountRow(row) {
        return row === schemas_1.FORMULA_ROW_INDICES.EMPLOYEE_COUNT ||
            row === schemas_1.FORMULA_ROW_INDICES.MEMBER_COUNT;
    }
    /**
     * Check if row should use percentage formatting
     */
    isPercentageRow(row) {
        return row === schemas_1.FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_MONTHLY ||
            row === schemas_1.FORMULA_ROW_INDICES.PERCENTAGE_DIFFERENCE_CUMULATIVE;
    }
    /**
     * Check if row should use PEPM decimal formatting
     */
    isPEPMRow(row) {
        return row === schemas_1.FORMULA_ROW_INDICES.PEPM_ACTUAL ||
            row === schemas_1.FORMULA_ROW_INDICES.PEPM_CUMULATIVE ||
            row === schemas_1.FORMULA_ROW_INDICES.INCURRED_TARGET_PEPM ||
            row === schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET;
    }
    /**
     * Set cell style
     */
    setCellStyle(row, col, style) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!this.worksheet[cellAddress]) {
            this.worksheet[cellAddress] = { t: 's', v: '' };
        }
        this.worksheet[cellAddress].s = style;
    }
    /**
     * Apply data validation (minimal for healthcare cost template)
     */
    applyValidation() {
        // Healthcare cost template primarily uses formulas
        // Could add validation for enrollment counts to be positive integers
        // For now, keeping it simple
    }
    /**
     * Finalize worksheet with column widths and freeze panes
     */
    finalizeWorksheet() {
        // Set column widths
        this.worksheet['!cols'] = validators_1.COLUMN_WIDTHS.HEALTHCARE_COST;
        // Freeze header row and category column
        (0, validators_1.setFreezePane)(this.worksheet, 1, 1);
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'Healthcare Cost');
    }
    /**
     * Get column letter from column index (0-based)
     */
    getColumnLetter(col) {
        let result = '';
        while (col >= 0) {
            result = String.fromCharCode(65 + (col % 26)) + result;
            col = Math.floor(col / 26) - 1;
        }
        return result;
    }
    /**
     * Generate sample data for demonstration
     */
    static generateSampleData() {
        const months = 12;
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
        };
    }
}
exports.HealthcareCostTemplateBuilder = HealthcareCostTemplateBuilder;
