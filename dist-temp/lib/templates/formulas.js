"use strict";
/**
 * Excel formula builders for template generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CELL_STYLES = exports.NUMBER_FORMATS = exports.HighCostClaimsFormulas = exports.HealthcareCostFormulas = void 0;
const schemas_1 = require("./schemas");
/**
 * Helper to convert row index to Excel row number (1-based)
 */
function toExcelRow(index) {
    return index + 1;
}
/**
 * Helper to convert column index to Excel column letter
 */
function toExcelColumn(index) {
    let result = '';
    while (index >= 0) {
        result = String.fromCharCode(65 + (index % 26)) + result;
        index = Math.floor(index / 26) - 1;
    }
    return result;
}
/**
 * Generate cell reference (e.g., "B5")
 */
function cellRef(row, col) {
    return `${toExcelColumn(col)}${toExcelRow(row)}`;
}
/**
 * Generate range reference (e.g., "B5:F5")
 */
function rangeRef(startRow, startCol, endRow, endCol) {
    return `${cellRef(startRow, startCol)}:${cellRef(endRow, endCol)}`;
}
/**
 * Healthcare Cost Template Formula Builders
 */
class HealthcareCostFormulas {
    constructor() {
        this.monthColumns = 12; // Jan-2024 through Dec-2024
    }
    /**
     * Total Hospital Medical Claims = Domestic + Non-Domestic
     */
    getTotalHospitalMedical(monthCol) {
        const domesticCell = cellRef(schemas_1.FORMULA_ROW_INDICES.DOMESTIC_MEDICAL, monthCol);
        const nonDomesticCell = cellRef(schemas_1.FORMULA_ROW_INDICES.NON_DOMESTIC_MEDICAL, monthCol);
        return `=${domesticCell}+${nonDomesticCell}`;
    }
    /**
     * Total All Medical Claims = Hospital + Non-Hospital
     */
    getTotalAllMedical(monthCol) {
        const hospitalCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_HOSPITAL_MEDICAL, monthCol);
        const nonHospitalCell = cellRef(schemas_1.FORMULA_ROW_INDICES.NON_HOSPITAL_MEDICAL, monthCol);
        return `=${hospitalCell}+${nonHospitalCell}`;
    }
    /**
     * Total Adjusted Medical Claims = All Medical + Adjustments
     */
    getTotalAdjustedMedical(monthCol) {
        const allMedicalCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_ALL_MEDICAL, monthCol);
        const adjustmentsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.ADJUSTMENTS, monthCol);
        return `=${allMedicalCell}+${adjustmentsCell}`;
    }
    /**
     * Net Pharmacy Claims = Total Pharmacy + Rebates (rebates are negative)
     */
    getNetPharmacy(monthCol) {
        const totalPharmacyCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_PHARMACY, monthCol);
        const rebatesCell = cellRef(schemas_1.FORMULA_ROW_INDICES.PHARMACY_REBATES, monthCol);
        return `=${totalPharmacyCell}+${rebatesCell}`;
    }
    /**
     * Net Stop Loss = Fees + Reimbursements
     */
    getNetStopLoss(monthCol) {
        const feesCell = cellRef(schemas_1.FORMULA_ROW_INDICES.STOP_LOSS_FEES, monthCol);
        const reimbursementsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.STOP_LOSS_REIMBURSEMENTS, monthCol);
        return `=${feesCell}+${reimbursementsCell}`;
    }
    /**
     * Total Fixed Costs = Sum of TPA + Anthem + Keenan Coalition + Keenan Management + Express Scripts
     */
    getTotalFixedCosts(monthCol) {
        const tpaCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TPA_COBRA_ADMIN, monthCol);
        const anthemCell = cellRef(schemas_1.FORMULA_ROW_INDICES.ANTHEM_NETWORK, monthCol);
        const keenCoalitionCell = cellRef(schemas_1.FORMULA_ROW_INDICES.KEENAN_PHARMACY_COALITION, monthCol);
        const keenManagementCell = cellRef(schemas_1.FORMULA_ROW_INDICES.KEENAN_PHARMACY_MANAGEMENT, monthCol);
        const expressScriptsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.OTHER_EXPRESS_SCRIPTS, monthCol);
        return `=${tpaCell}+${anthemCell}+${keenCoalitionCell}+${keenManagementCell}+${expressScriptsCell}`;
    }
    /**
     * Total Admin Fees = Consulting + Total Fixed Costs
     */
    getTotalAdminFees(monthCol) {
        const consultingCell = cellRef(schemas_1.FORMULA_ROW_INDICES.CONSULTING_FEES, monthCol);
        const fixedCostsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_FIXED_COSTS, monthCol);
        return `=${consultingCell}+${fixedCostsCell}`;
    }
    /**
     * Total Monthly Claims = Medical + Pharmacy + Stop Loss + Admin
     */
    getTotalMonthlyClaims(monthCol) {
        const medicalCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_ADJUSTED_MEDICAL, monthCol);
        const pharmacyCell = cellRef(schemas_1.FORMULA_ROW_INDICES.NET_PHARMACY, monthCol);
        const stopLossCell = cellRef(schemas_1.FORMULA_ROW_INDICES.NET_STOP_LOSS, monthCol);
        const adminCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_ADMIN_FEES, monthCol);
        return `=${medicalCell}+${pharmacyCell}+${stopLossCell}+${adminCell}`;
    }
    /**
     * Cumulative Claims = Running sum of Total Monthly Claims
     */
    getCumulativeClaims(monthCol) {
        if (monthCol === 1) { // First month (Jan-2024 is column 1)
            return `=${cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, monthCol)}`;
        }
        else {
            const currentCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, monthCol);
            const previousCumulativeCell = cellRef(schemas_1.FORMULA_ROW_INDICES.CUMULATIVE_CLAIMS, monthCol - 1);
            return `=${currentCell}+${previousCumulativeCell}`;
        }
    }
    /**
     * PEPM Actual = Total Monthly Claims ÷ Employee Count
     */
    getPEPMActual(monthCol) {
        const totalClaimsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, monthCol);
        const employeeCountCell = cellRef(schemas_1.FORMULA_ROW_INDICES.EMPLOYEE_COUNT, monthCol);
        return `=${totalClaimsCell}/${employeeCountCell}`;
    }
    /**
     * PEPM Cumulative = Cumulative Claims ÷ Sum of Employee Counts from Jan to current month
     */
    getPEPMCumulative(monthCol) {
        const cumulativeClaimsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.CUMULATIVE_CLAIMS, monthCol);
        const employeeCountRange = rangeRef(schemas_1.FORMULA_ROW_INDICES.EMPLOYEE_COUNT, 1, schemas_1.FORMULA_ROW_INDICES.EMPLOYEE_COUNT, monthCol);
        return `=${cumulativeClaimsCell}/SUM(${employeeCountRange})`;
    }
    /**
     * PEPM Budget × Enrollment = PEPM Budget × Employee Count
     */
    getPEPMBudgetEnrollment(monthCol) {
        const budgetCell = cellRef(schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET, monthCol);
        const employeeCountCell = cellRef(schemas_1.FORMULA_ROW_INDICES.EMPLOYEE_COUNT, monthCol);
        return `=${budgetCell}*${employeeCountCell}`;
    }
    /**
     * Annual Cumulative Budget = Running sum of PEPM Budget × Enrollment
     */
    getAnnualCumulativeBudget(monthCol) {
        if (monthCol === 1) { // First month
            return `=${cellRef(schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET_ENROLLMENT, monthCol)}`;
        }
        else {
            const currentCell = cellRef(schemas_1.FORMULA_ROW_INDICES.PEMP_BUDGET_ENROLLMENT, monthCol);
            const previousCumulativeCell = cellRef(schemas_1.FORMULA_ROW_INDICES.ANNUAL_CUMULATIVE_BUDGET, monthCol - 1);
            return `=${currentCell}+${previousCumulativeCell}`;
        }
    }
    /**
     * Actual Monthly Difference = PEPM Budget × Enrollment - Total Monthly Claims
     */
    getActualMonthlyDifference(monthCol) {
        const budgetEnrollmentCell = cellRef(schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET_ENROLLMENT, monthCol);
        const totalClaimsCell = cellRef(schemas_1.FORMULA_ROW_INDICES.TOTAL_MONTHLY_CLAIMS, monthCol);
        return `=${budgetEnrollmentCell}-${totalClaimsCell}`;
    }
    /**
     * Percentage Difference Monthly = Monthly Difference ÷ Budget × Enrollment
     */
    getPercentageDifferenceMonthly(monthCol) {
        const monthlyDiffCell = cellRef(schemas_1.FORMULA_ROW_INDICES.ACTUAL_MONTHLY_DIFFERENCE, monthCol);
        const budgetEnrollmentCell = cellRef(schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET_ENROLLMENT, monthCol);
        return `=${monthlyDiffCell}/${budgetEnrollmentCell}`;
    }
    /**
     * Cumulative Difference = Annual Cumulative Budget - Cumulative Claims
     */
    getCumulativeDifference(monthCol) {
        const budgetCumulativeCell = cellRef(schemas_1.FORMULA_ROW_INDICES.ANNUAL_CUMULATIVE_BUDGET, monthCol);
        const claimsCumulativeCell = cellRef(schemas_1.FORMULA_ROW_INDICES.CUMULATIVE_CLAIMS, monthCol);
        return `=${budgetCumulativeCell}-${claimsCumulativeCell}`;
    }
    /**
     * Percentage Difference Cumulative = Cumulative Difference ÷ Annual Cumulative Budget
     */
    getPercentageDifferenceCumulative(monthCol) {
        const cumulativeDiffCell = cellRef(schemas_1.FORMULA_ROW_INDICES.CUMULATIVE_DIFFERENCE, monthCol);
        const budgetCumulativeCell = cellRef(schemas_1.FORMULA_ROW_INDICES.ANNUAL_CUMULATIVE_BUDGET, monthCol);
        return `=${cumulativeDiffCell}/${budgetCumulativeCell}`;
    }
}
exports.HealthcareCostFormulas = HealthcareCostFormulas;
/**
 * High Cost Claims Template Formula Builders
 */
class HighCostClaimsFormulas {
    /**
     * Total = Facility Inpatient + Facility Outpatient + Professional + Pharmacy
     */
    getTotal(row) {
        const inpatientCell = cellRef(row, 9); // Column J (Facility Inpatient)
        const outpatientCell = cellRef(row, 10); // Column K (Facility Outpatient)
        const professionalCell = cellRef(row, 11); // Column L (Professional)
        const pharmacyCell = cellRef(row, 12); // Column M (Pharmacy)
        return `=${inpatientCell}+${outpatientCell}+${professionalCell}+${pharmacyCell}`;
    }
    /**
     * Estimated Stop-Loss Reimbursement = IF(Hit Stop Loss = "Yes", MAX(Total - Deductible, 0), 0)
     */
    getStopLossReimbursement(row) {
        const hitStopLossCell = cellRef(row, 17); // Column R (Hit Stop Loss?)
        const totalCell = cellRef(row, 8); // Column I (Total)
        const deductibleCell = cellRef(row, 15); // Column P (Stop-Loss Deductible)
        return `=IF(${hitStopLossCell}="Yes",MAX(${totalCell}-${deductibleCell},0),0)`;
    }
}
exports.HighCostClaimsFormulas = HighCostClaimsFormulas;
/**
 * Excel number format constants
 */
exports.NUMBER_FORMATS = {
    CURRENCY: '$#,##0;($#,##0)',
    PERCENTAGE: '0.00%',
    NUMBER_2_DECIMALS: '0.00',
    WHOLE_NUMBER: '0'
};
/**
 * Cell style constants for formatting
 */
exports.CELL_STYLES = {
    HEADER: {
        font: { bold: true, size: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E5E7EB' } }, // Gray-200
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    },
    SECTION_HEADER: {
        font: { bold: true, size: 10 },
        alignment: { horizontal: 'left', vertical: 'center' },
        fill: { fgColor: { rgb: 'F3F4F6' } }, // Gray-100
    },
    DATA_CELL: {
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
            top: { style: 'thin', color: { rgb: 'E5E7EB' } },
            left: { style: 'thin', color: { rgb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
            right: { style: 'thin', color: { rgb: 'E5E7EB' } }
        }
    },
    ZEBRA_EVEN: {
        fill: { fgColor: { rgb: 'F9FAFB' } } // Very light gray
    },
    ZEBRA_ODD: {
        fill: { fgColor: { rgb: 'FFFFFF' } } // White
    }
};
// Fix typo in PEPM_BUDGET_ENROLLMENT reference
schemas_1.FORMULA_ROW_INDICES.PEMP_BUDGET_ENROLLMENT = schemas_1.FORMULA_ROW_INDICES.PEPM_BUDGET_ENROLLMENT;
