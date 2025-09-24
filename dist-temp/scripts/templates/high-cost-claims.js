"use strict";
/**
 * High Cost Claims Template Builder
 * Generates XLSX template with formulas, data validation, and formatting
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
exports.HighCostClaimsTemplateBuilder = void 0;
const XLSX = __importStar(require("xlsx"));
const schemas_1 = require("../../lib/templates/schemas");
const formulas_1 = require("../../lib/templates/formulas");
const validators_1 = require("../../lib/templates/validators");
class HighCostClaimsTemplateBuilder {
    constructor() {
        this.formulas = new formulas_1.HighCostClaimsFormulas();
        this.workbook = XLSX.utils.book_new();
        this.worksheet = XLSX.utils.aoa_to_sheet([]);
    }
    /**
     * Build the complete High Cost Claims template
     */
    build() {
        this.createHeaders();
        this.createSampleRows();
        this.applyFormulas();
        this.applyFormatting();
        this.applyValidation();
        this.finalizeWorksheet();
        return this.workbook;
    }
    /**
     * Create header row
     */
    createHeaders() {
        XLSX.utils.sheet_add_aoa(this.worksheet, [schemas_1.HIGH_COST_CLAIMS_COLUMN_ORDER], { origin: 'A1' });
    }
    /**
     * Create sample data rows
     */
    createSampleRows() {
        const sampleData = this.generateSampleData();
        XLSX.utils.sheet_add_aoa(this.worksheet, sampleData, { origin: 'A2' });
    }
    /**
     * Apply Excel formulas to calculated columns
     */
    applyFormulas() {
        const range = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1');
        // Apply formulas to each data row (skip header row)
        for (let row = 1; row <= range.e.r; row++) {
            // Total = Facility Inpatient + Facility Outpatient + Professional + Pharmacy
            this.setCellFormula(row, 8, this.formulas.getTotal(row)); // Column I (Total)
            // Estimated Stop-Loss Reimbursement formula
            this.setCellFormula(row, 16, this.formulas.getStopLossReimbursement(row)); // Column Q (Reimbursement)
        }
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
        for (let col = 0; col < schemas_1.HIGH_COST_CLAIMS_COLUMN_ORDER.length; col++) {
            this.setCellStyle(0, col, {
                ...formulas_1.CELL_STYLES.HEADER,
                numFmt: formulas_1.NUMBER_FORMATS.WHOLE_NUMBER
            });
        }
        // Apply data row formatting
        for (let row = 1; row <= range.e.r; row++) {
            for (let col = 0; col < schemas_1.HIGH_COST_CLAIMS_COLUMN_ORDER.length; col++) {
                const baseStyle = {
                    ...formulas_1.CELL_STYLES.DATA_CELL,
                    ...(row % 2 === 0 ? formulas_1.CELL_STYLES.ZEBRA_EVEN : formulas_1.CELL_STYLES.ZEBRA_ODD)
                };
                // Apply column-specific formatting
                const style = { ...baseStyle, ...this.getColumnFormatting(col) };
                this.setCellStyle(row, col, style);
            }
        }
    }
    /**
     * Get formatting for specific column
     */
    getColumnFormatting(col) {
        const columnName = schemas_1.HIGH_COST_CLAIMS_COLUMN_ORDER[col];
        switch (columnName) {
            case 'Member ID':
                return {
                    numFmt: formulas_1.NUMBER_FORMATS.WHOLE_NUMBER,
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            case '% of Plan Paid':
            case '% of large claims':
                return {
                    numFmt: formulas_1.NUMBER_FORMATS.PERCENTAGE,
                    alignment: { horizontal: 'right', vertical: 'center' }
                };
            case 'Total':
            case 'Facility Inpatient':
            case 'Facility Outpatient':
            case 'Professional':
            case 'Pharmacy':
            case 'Stop-Loss Deductible':
            case 'Estimated Stop-Loss Reimbursement':
                return {
                    numFmt: formulas_1.NUMBER_FORMATS.CURRENCY,
                    alignment: { horizontal: 'right', vertical: 'center' }
                };
            default:
                return {
                    alignment: { horizontal: 'left', vertical: 'center' }
                };
        }
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
     * Apply data validation for dropdown lists and constraints
     */
    applyValidation() {
        const range = XLSX.utils.decode_range(this.worksheet['!ref'] || 'A1');
        const dataRows = range.e.r - 1; // Exclude header row
        if (dataRows > 0) {
            // Member Type validation (Column B)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 1, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.MEMBER_TYPE);
            // Age Band validation (Column C)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 2, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.AGE_BAND);
            // % of Plan Paid validation (Column G)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 6, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.PERCENTAGE);
            // % of large claims validation (Column H)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 7, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.PERCENTAGE);
            // Currency columns validation (Columns I-M, P-Q)
            const currencyColumns = [8, 9, 10, 11, 12, 15, 16];
            currencyColumns.forEach(col => {
                (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, col, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.POSITIVE_NUMBER);
            });
            // Member ID validation (Column A)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 0, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.POSITIVE_INTEGER);
            // Enrolled validation (Column O)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 14, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.ENROLLED);
            // Hit Stop Loss validation (Column R)
            (0, validators_1.applyDataValidation)(this.worksheet, 1, range.e.r, 17, validators_1.HIGH_COST_CLAIMS_VALIDATIONS.HIT_STOP_LOSS);
        }
    }
    /**
     * Finalize worksheet with column widths and freeze panes
     */
    finalizeWorksheet() {
        // Set column widths
        this.worksheet['!cols'] = validators_1.COLUMN_WIDTHS.HIGH_COST_CLAIMS;
        // Freeze header row
        (0, validators_1.setFreezePane)(this.worksheet, 1, 0);
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(this.workbook, this.worksheet, 'High Cost Claims');
    }
    /**
     * Generate sample data rows
     */
    generateSampleData() {
        const sampleData = [
            [
                12001, // Member ID
                'Subscriber', // Member Type
                '50 - 59', // Age Band
                'Cardiovascular', // Primary Diagnosis Category
                'Other Medical', // Specific Diagnosis Details Short
                'Coronary artery disease, multiple vessel', // Specific Diagnosis Details
                0.85, // % of Plan Paid
                0.75, // % of large claims
                0, // Total (will be calculated)
                45000, // Facility Inpatient
                8500, // Facility Outpatient
                12000, // Professional
                3200, // Pharmacy
                'Memorial Hospital System', // Top Provider
                'Yes', // Enrolled
                50000, // Stop-Loss Deductible
                0, // Estimated Stop-Loss Reimbursement (will be calculated)
                'Yes' // Hit Stop Loss?
            ],
            [
                12002,
                'Spouse',
                '40 - 49',
                'Oncology',
                'Other Medical',
                'Malignant neoplasm of breast',
                0.90,
                0.85,
                0, // Will be calculated
                38000,
                15000,
                18000,
                8500,
                'Cancer Treatment Center',
                'Yes',
                50000,
                0, // Will be calculated
                'Yes'
            ],
            [
                12003,
                'Dependent',
                '<1 - 19',
                'Neonatal',
                'Complex Newborn',
                'Premature birth complications',
                0.95,
                0.80,
                0, // Will be calculated
                65000,
                5000,
                22000,
                2500,
                'Children\'s Hospital',
                'Yes',
                50000,
                0, // Will be calculated
                'Yes'
            ],
            [
                12004,
                'Subscriber',
                '60 - 64',
                'Renal',
                'Hemodialysis',
                'End-stage renal disease',
                0.88,
                0.70,
                0, // Will be calculated
                12000,
                28000,
                8000,
                4500,
                'Dialysis Clinic Network',
                'Yes',
                50000,
                0, // Will be calculated
                'Yes'
            ],
            [
                12005,
                'Spouse',
                '30 - 39',
                'Neurological',
                'Nervous System',
                'Multiple sclerosis',
                0.82,
                0.65,
                0, // Will be calculated
                18000,
                12000,
                15000,
                25000, // High pharmacy costs
                'MS Specialty Center',
                'Yes',
                50000,
                0, // Will be calculated
                'Yes'
            ]
        ];
        return sampleData;
    }
    /**
     * Create a Summary sheet with top claimants and diagnosis breakdown
     */
    createSummarySheet() {
        const summarySheet = XLSX.utils.aoa_to_sheet([]);
        // Top 10 Claimants section
        const top10Headers = ['Rank', 'Member ID', 'Member Type', 'Total Cost', 'Primary Diagnosis'];
        XLSX.utils.sheet_add_aoa(summarySheet, [['TOP 10 HIGH COST CLAIMANTS']], { origin: 'A1' });
        XLSX.utils.sheet_add_aoa(summarySheet, [top10Headers], { origin: 'A3' });
        // Sample top 10 data
        const top10Data = [
            [1, 12003, 'Dependent', 94500, 'Neonatal'],
            [2, 12002, 'Spouse', 79500, 'Oncology'],
            [3, 12001, 'Subscriber', 68700, 'Cardiovascular'],
            [4, 12005, 'Spouse', 70000, 'Neurological'],
            [5, 12004, 'Subscriber', 52500, 'Renal']
        ];
        XLSX.utils.sheet_add_aoa(summarySheet, top10Data, { origin: 'A4' });
        // Diagnosis Category Summary
        XLSX.utils.sheet_add_aoa(summarySheet, [['DIAGNOSIS CATEGORY SUMMARY']], { origin: 'A12' });
        const diagnosisHeaders = ['Primary Diagnosis Category', 'Member Count', 'Total Cost', 'Average Cost per Member'];
        XLSX.utils.sheet_add_aoa(summarySheet, [diagnosisHeaders], { origin: 'A14' });
        const diagnosisData = [
            ['Cardiovascular', 1, 68700, 68700],
            ['Oncology', 1, 79500, 79500],
            ['Neonatal', 1, 94500, 94500],
            ['Renal', 1, 52500, 52500],
            ['Neurological', 1, 70000, 70000]
        ];
        XLSX.utils.sheet_add_aoa(summarySheet, diagnosisData, { origin: 'A15' });
        // Apply formatting to summary sheet
        this.applySummaryFormatting(summarySheet);
        return summarySheet;
    }
    /**
     * Apply formatting to summary sheet
     */
    applySummaryFormatting(sheet) {
        // Set column widths for summary sheet
        sheet['!cols'] = [
            { wch: 8 }, // Rank
            { wch: 12 }, // Member ID
            { wch: 15 }, // Member Type
            { wch: 15 }, // Total Cost
            { wch: 20 }, // Primary Diagnosis
        ];
        // Apply header formatting for both sections
        const headerStyle = {
            ...formulas_1.CELL_STYLES.HEADER,
            font: { bold: true, size: 12 }
        };
        // Format section titles
        this.setCellStyleInSheet(sheet, 0, 0, headerStyle); // TOP 10 title
        this.setCellStyleInSheet(sheet, 11, 0, headerStyle); // DIAGNOSIS title
        // Format table headers
        for (let col = 0; col < 5; col++) {
            this.setCellStyleInSheet(sheet, 2, col, formulas_1.CELL_STYLES.HEADER); // Top 10 headers
            this.setCellStyleInSheet(sheet, 13, col, formulas_1.CELL_STYLES.HEADER); // Diagnosis headers
        }
        // Format currency columns
        for (let row = 3; row < 9; row++) { // Top 10 data rows
            this.setCellStyleInSheet(sheet, row, 3, {
                ...formulas_1.CELL_STYLES.DATA_CELL,
                numFmt: formulas_1.NUMBER_FORMATS.CURRENCY
            });
        }
        for (let row = 14; row < 20; row++) { // Diagnosis data rows  
            this.setCellStyleInSheet(sheet, row, 2, {
                ...formulas_1.CELL_STYLES.DATA_CELL,
                numFmt: formulas_1.NUMBER_FORMATS.CURRENCY
            });
            this.setCellStyleInSheet(sheet, row, 3, {
                ...formulas_1.CELL_STYLES.DATA_CELL,
                numFmt: formulas_1.NUMBER_FORMATS.CURRENCY
            });
        }
    }
    /**
     * Helper to set cell style in any sheet
     */
    setCellStyleInSheet(sheet, row, col, style) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!sheet[cellAddress]) {
            sheet[cellAddress] = { t: 's', v: '' };
        }
        sheet[cellAddress].s = style;
    }
}
exports.HighCostClaimsTemplateBuilder = HighCostClaimsTemplateBuilder;
