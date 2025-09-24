"use strict";
/**
 * Zod schemas for template validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMULA_ROW_INDICES = exports.HIGH_COST_CLAIMS_COLUMN_ORDER = exports.HEALTHCARE_COST_ROW_ORDER = exports.HighCostClaimsTemplateSchema = exports.HealthcareCostTemplateSchema = exports.HighCostClaimsDataSchema = exports.HitStopLossSchema = exports.EnrolledSchema = exports.AgeBandSchema = exports.MemberTypeSchema = exports.HealthcareCostDataSchema = exports.MonthColumnSchema = exports.HealthcareCostRowSchema = void 0;
const zod_1 = require("zod");
// Healthcare Cost Template Schema
exports.HealthcareCostRowSchema = zod_1.z.enum([
    // Section Headers (for reference)
    'MEDICAL CLAIMS',
    'PHARMACY CLAIMS',
    'STOP LOSS',
    'ADMINISTRATIVE COSTS',
    'SUMMARY TOTALS',
    'ENROLLMENT METRICS',
    'PER EMPLOYEE PER MONTH (PEPM) METRICS',
    'BUDGET ANALYSIS',
    // Data Rows - MEDICAL CLAIMS
    'Domestic Medical Facility Claims (Inpatient/Outpatient)',
    'Non-Domestic Medical Claims (Inpatient/Outpatient)',
    'Total Hospital Medical Claims',
    'Non-Hospital Medical Claims',
    'Total All Medical Claims',
    'Adjustments',
    'Total Adjusted Medical Claims',
    // Data Rows - PHARMACY CLAIMS
    'Total Pharmacy Claims',
    'Total Pharmacy Rebates',
    'Net Pharmacy Claims',
    // Data Rows - STOP LOSS
    'Total Stop Loss Fees',
    'Stop Loss Reimbursements',
    'Net Stop Loss',
    // Data Rows - ADMINISTRATIVE COSTS
    'Consulting Fees',
    'Fixed Costs:',
    'TPA/COBRA Admin Fee',
    'Anthem Network Fee',
    'Keenan Pharmacy Coalition Fee',
    'Keenan Pharmacy Management Fee',
    'Other Optional Express Scripts Fees',
    'Total Fixed Costs',
    'Total Admin Fees',
    // Data Rows - SUMMARY TOTALS
    'Total Monthly Claims and Expenses',
    'Cumulative Claims and Expenses',
    // Data Rows - ENROLLMENT METRICS
    'Employee Count (Active + COBRA)',
    'Member Count',
    // Data Rows - PEPM METRICS
    'Per Employee Per Month Non-Lag Actual',
    'Per Employee Per Month Non-Lag Cumulative',
    'Incurred Target PEPM',
    'PEPM Budget',
    'PEPM Budget × Enrollment Counts',
    // Data Rows - BUDGET ANALYSIS
    'Annual Cumulative Budget',
    'Actual Monthly Difference',
    'Percentage Difference (Monthly)',
    'Cumulative Difference',
    'Percentage Difference (Cumulative)'
]);
exports.MonthColumnSchema = zod_1.z.enum([
    'Jan-2024', 'Feb-2024', 'Mar-2024', 'Apr-2024', 'May-2024', 'Jun-2024',
    'Jul-2024', 'Aug-2024', 'Sep-2024', 'Oct-2024', 'Nov-2024', 'Dec-2024'
]);
exports.HealthcareCostDataSchema = zod_1.z.object({
    Category: exports.HealthcareCostRowSchema,
    'Jan-2024': zod_1.z.number().nullable(),
    'Feb-2024': zod_1.z.number().nullable(),
    'Mar-2024': zod_1.z.number().nullable(),
    'Apr-2024': zod_1.z.number().nullable(),
    'May-2024': zod_1.z.number().nullable(),
    'Jun-2024': zod_1.z.number().nullable(),
    'Jul-2024': zod_1.z.number().nullable(),
    'Aug-2024': zod_1.z.number().nullable(),
    'Sep-2024': zod_1.z.number().nullable(),
    'Oct-2024': zod_1.z.number().nullable(),
    'Nov-2024': zod_1.z.number().nullable(),
    'Dec-2024': zod_1.z.number().nullable()
});
// High Cost Claims Template Schema
exports.MemberTypeSchema = zod_1.z.enum(['Subscriber', 'Spouse', 'Dependent']);
exports.AgeBandSchema = zod_1.z.enum(['<1 - 19', '20 - 29', '30 - 39', '40 - 49', '50 - 59', '60 - 64', '65+']);
exports.EnrolledSchema = zod_1.z.enum(['Yes', 'No']);
exports.HitStopLossSchema = zod_1.z.enum(['Yes', 'No']);
exports.HighCostClaimsDataSchema = zod_1.z.object({
    'Member ID': zod_1.z.number().int().positive(),
    'Member Type': exports.MemberTypeSchema,
    'Age Band': exports.AgeBandSchema,
    'Primary Diagnosis Category': zod_1.z.string().min(1),
    'Specific Diagnosis Details Short': zod_1.z.string().min(1),
    'Specific Diagnosis Details': zod_1.z.string().min(1),
    '% of Plan Paid': zod_1.z.number().min(0).max(1),
    '% of large claims': zod_1.z.number().min(0).max(1),
    'Total': zod_1.z.number().min(0), // This will be calculated
    'Facility Inpatient': zod_1.z.number().min(0),
    'Facility Outpatient': zod_1.z.number().min(0),
    'Professional': zod_1.z.number().min(0),
    'Pharmacy': zod_1.z.number().min(0),
    'Top Provider': zod_1.z.string().min(1),
    'Enrolled': exports.EnrolledSchema,
    'Stop-Loss Deductible': zod_1.z.number().min(0),
    'Estimated Stop-Loss Reimbursement': zod_1.z.number().min(0), // This will be calculated
    'Hit Stop Loss?': exports.HitStopLossSchema
});
// Template validation schemas
exports.HealthcareCostTemplateSchema = zod_1.z.array(exports.HealthcareCostDataSchema);
exports.HighCostClaimsTemplateSchema = zod_1.z.array(exports.HighCostClaimsDataSchema);
// Expected row order for Healthcare Cost template
exports.HEALTHCARE_COST_ROW_ORDER = [
    'MEDICAL CLAIMS',
    'Domestic Medical Facility Claims (Inpatient/Outpatient)',
    'Non-Domestic Medical Claims (Inpatient/Outpatient)',
    'Total Hospital Medical Claims',
    'Non-Hospital Medical Claims',
    'Total All Medical Claims',
    'Adjustments',
    'Total Adjusted Medical Claims',
    '', // blank row
    'PHARMACY CLAIMS',
    'Total Pharmacy Claims',
    'Total Pharmacy Rebates',
    'Net Pharmacy Claims',
    '', // blank row
    'STOP LOSS',
    'Total Stop Loss Fees',
    'Stop Loss Reimbursements',
    'Net Stop Loss',
    '', // blank row
    'ADMINISTRATIVE COSTS',
    'Consulting Fees',
    'Fixed Costs:',
    'TPA/COBRA Admin Fee',
    'Anthem Network Fee',
    'Keenan Pharmacy Coalition Fee',
    'Keenan Pharmacy Management Fee',
    'Other Optional Express Scripts Fees',
    'Total Fixed Costs',
    'Total Admin Fees',
    '', // blank row
    'SUMMARY TOTALS',
    'Total Monthly Claims and Expenses',
    'Cumulative Claims and Expenses',
    '', // blank row
    'ENROLLMENT METRICS',
    'Employee Count (Active + COBRA)',
    'Member Count',
    '', // blank row
    'PER EMPLOYEE PER MONTH (PEPM) METRICS',
    'Per Employee Per Month Non-Lag Actual',
    'Per Employee Per Month Non-Lag Cumulative',
    'Incurred Target PEPM',
    'PEPM Budget',
    'PEPM Budget × Enrollment Counts',
    '', // blank row
    'BUDGET ANALYSIS',
    'Annual Cumulative Budget',
    'Actual Monthly Difference',
    'Percentage Difference (Monthly)',
    'Cumulative Difference',
    'Percentage Difference (Cumulative)'
];
exports.HIGH_COST_CLAIMS_COLUMN_ORDER = [
    'Member ID',
    'Member Type',
    'Age Band',
    'Primary Diagnosis Category',
    'Specific Diagnosis Details Short',
    'Specific Diagnosis Details',
    '% of Plan Paid',
    '% of large claims',
    'Total',
    'Facility Inpatient',
    'Facility Outpatient',
    'Professional',
    'Pharmacy',
    'Top Provider',
    'Enrolled',
    'Stop-Loss Deductible',
    'Estimated Stop-Loss Reimbursement',
    'Hit Stop Loss?'
];
// Row indices for formula calculations (0-based, accounting for header)
exports.FORMULA_ROW_INDICES = {
    // Medical Claims section (rows 2-8)
    DOMESTIC_MEDICAL: 1,
    NON_DOMESTIC_MEDICAL: 2,
    TOTAL_HOSPITAL_MEDICAL: 3, // = row 1 + row 2
    NON_HOSPITAL_MEDICAL: 4,
    TOTAL_ALL_MEDICAL: 5, // = row 3 + row 4
    ADJUSTMENTS: 6,
    TOTAL_ADJUSTED_MEDICAL: 7, // = row 5 + row 6
    // Pharmacy Claims section (rows 10-12)
    TOTAL_PHARMACY: 10,
    PHARMACY_REBATES: 11,
    NET_PHARMACY: 12, // = row 10 + row 11 (rebates are negative)
    // Stop Loss section (rows 15-17)
    STOP_LOSS_FEES: 15,
    STOP_LOSS_REIMBURSEMENTS: 16,
    NET_STOP_LOSS: 17, // = row 15 + row 16
    // Administrative Costs section (rows 20-28)
    CONSULTING_FEES: 20,
    TPA_COBRA_ADMIN: 22,
    ANTHEM_NETWORK: 23,
    KEENAN_PHARMACY_COALITION: 24,
    KEENAN_PHARMACY_MANAGEMENT: 25,
    OTHER_EXPRESS_SCRIPTS: 26,
    TOTAL_FIXED_COSTS: 27, // = sum of rows 22-26
    TOTAL_ADMIN_FEES: 28, // = row 20 + row 27
    // Summary Totals section (rows 31-32)
    TOTAL_MONTHLY_CLAIMS: 31, // = row 7 + row 12 + row 17 + row 28
    CUMULATIVE_CLAIMS: 32, // running sum of row 31
    // Enrollment Metrics section (rows 35-36)
    EMPLOYEE_COUNT: 35,
    MEMBER_COUNT: 36,
    // PEPM Metrics section (rows 39-43)
    PEPM_ACTUAL: 39, // = row 31 ÷ row 35
    PEPM_CUMULATIVE: 40, // = row 32 ÷ SUM(row 35 from Jan to current month)
    INCURRED_TARGET_PEPM: 41,
    PEPM_BUDGET: 42,
    PEPM_BUDGET_ENROLLMENT: 43, // = row 42 × row 35
    // Budget Analysis section (rows 46-50)
    ANNUAL_CUMULATIVE_BUDGET: 46, // running sum of row 43
    ACTUAL_MONTHLY_DIFFERENCE: 47, // = row 43 - row 31
    PERCENTAGE_DIFFERENCE_MONTHLY: 48, // = row 47 ÷ row 43
    CUMULATIVE_DIFFERENCE: 49, // = row 46 - row 32
    PERCENTAGE_DIFFERENCE_CUMULATIVE: 50 // = row 49 ÷ row 46
};
