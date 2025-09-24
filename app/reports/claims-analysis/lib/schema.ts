/**
 * Core schema definitions for Claims/Budget Analysis Table
 * Defines all required rows in exact order and data structures
 */

// All required rows in exact order as specified
export const REQUIRED_ROWS = [
  // MEDICAL CLAIMS
  'Domestic Medical Facility Claims (Inpatient/Outpatient)',
  'Non-Domestic Medical Claims (Inpatient/Outpatient)', 
  'Total Hospital Medical Claims',
  'Non-Hospital Medical Claims',
  'Total All Medical Claims',
  'Adjustments',
  'Total Adjusted Medical Claims',
  
  // PHARMACY CLAIMS
  'Total Pharmacy Claims',
  'Total Pharmacy Rebates',
  'Net Pharmacy Claims',
  
  // STOP LOSS
  'Total Stop Loss Fees',
  'Stop Loss Reimbursements',
  'Net Stop Loss',
  
  // ADMINISTRATIVE COSTS
  'Consulting Fees',
  'TPA/COBRA Admin Fee',
  'Anthem Network Fee',
  'Keenan Pharmacy Coalition Fee',
  'Keenan Pharmacy Management Fee',
  'Other Optional Express Scripts Fees',
  'Total Fixed Costs',
  'Total Admin Fees',
  
  // SUMMARY TOTALS
  'Total Monthly Claims and Expenses',
  'Cumulative Claims and Expenses',
  
  // ENROLLMENT METRICS
  'Employee Count (Active + COBRA)',
  'Member Count',
  
  // PER EMPLOYEE PER MONTH (PEPM) METRICS
  'Per Employee Per Month Non-Lag Actual',
  'Per Employee Per Month Non-Lag Cumulative',
  'Incurred Target PEPM',
  'PEPM Budget',
  'PEPM Budget × Enrollment Counts',
  
  // BUDGET ANALYSIS
  'Annual Cumulative Budget',
  'Actual Monthly Difference',
  'Percentage Difference (Monthly)',
  'Cumulative Difference',
  'Percentage Difference (Cumulative)',
] as const;

// Section groupings for expand/collapse functionality
export const SECTION_GROUPS = {
  'MEDICAL CLAIMS': [
    'Domestic Medical Facility Claims (Inpatient/Outpatient)',
    'Non-Domestic Medical Claims (Inpatient/Outpatient)', 
    'Total Hospital Medical Claims',
    'Non-Hospital Medical Claims',
    'Total All Medical Claims',
    'Adjustments',
    'Total Adjusted Medical Claims',
  ],
  'PHARMACY CLAIMS': [
    'Total Pharmacy Claims',
    'Total Pharmacy Rebates',
    'Net Pharmacy Claims',
  ],
  'STOP LOSS': [
    'Total Stop Loss Fees',
    'Stop Loss Reimbursements',
    'Net Stop Loss',
  ],
  'ADMINISTRATIVE COSTS': [
    'Consulting Fees',
    'TPA/COBRA Admin Fee',
    'Anthem Network Fee',
    'Keenan Pharmacy Coalition Fee',
    'Keenan Pharmacy Management Fee',
    'Other Optional Express Scripts Fees',
    'Total Fixed Costs',
    'Total Admin Fees',
  ],
  'SUMMARY TOTALS': [
    'Total Monthly Claims and Expenses',
    'Cumulative Claims and Expenses',
  ],
  'ENROLLMENT METRICS': [
    'Employee Count (Active + COBRA)',
    'Member Count',
  ],
  'PER EMPLOYEE PER MONTH (PEPM) METRICS': [
    'Per Employee Per Month Non-Lag Actual',
    'Per Employee Per Month Non-Lag Cumulative',
    'Incurred Target PEPM',
    'PEPM Budget',
    'PEPM Budget × Enrollment Counts',
  ],
  'BUDGET ANALYSIS': [
    'Annual Cumulative Budget',
    'Actual Monthly Difference',
    'Percentage Difference (Monthly)',
    'Cumulative Difference',
    'Percentage Difference (Cumulative)',
  ],
} as const;

// Core types
export type RowLabel = typeof REQUIRED_ROWS[number];
export type SectionName = keyof typeof SECTION_GROUPS;
export type MonthKey = string; // YYYY-MM format

// Data structures
export type ClaimsData = Map<RowLabel, Map<MonthKey, number | null>>;

export interface ProcessedData {
  data: ClaimsData;
  availableMonths: MonthKey[];
  missingRows: RowLabel[];
  ignoredRows: string[];
  totalRowsProcessed: number;
}

export interface MonthWindow {
  startMonth: MonthKey;
  endMonth: MonthKey;
  months: MonthKey[];
}

// Table row interface for TanStack Table
export interface TableRow {
  id: string;
  rowLabel: RowLabel;
  section: SectionName;
  values: Map<MonthKey, number | null>;
  isVisible: boolean;
}

// CSV parsing types
export interface RawCSVRow {
  Category: string;
  [key: string]: string | number;
}

export interface ParseResult {
  data: ProcessedData;
  errors: string[];
  warnings: string[];
}

// Export types
export interface ExportData {
  rows: TableRow[];
  months: MonthKey[];
  windowStart: MonthKey;
  windowEnd: MonthKey;
}

// Month format validation patterns
export const MONTH_PATTERNS = {
  'MMM-YY': /^[A-Za-z]{3}-\d{2}$/,      // Jan-24
  'MMMM YYYY': /^[A-Za-z]{3,9} \d{4}$/,  // January 2024
  'YYYY-MM': /^\d{4}-\d{2}$/,            // 2024-01
} as const;

// Constants
export const MAX_MONTHS = 48;
export const DEFAULT_WINDOW_SIZE = 12;
export const VIRTUALIZATION_THRESHOLD = 1000;
export const MISSING_VALUE_DISPLAY = '–'; // Em dash for missing values

// Helper function to get section for a row
export function getSectionForRow(rowLabel: RowLabel): SectionName {
  for (const [section, rows] of Object.entries(SECTION_GROUPS)) {
    if (rows.includes(rowLabel as any)) {
      return section as SectionName;
    }
  }
  throw new Error(`Row "${rowLabel}" not found in any section`);
}

// Helper function to check if a row is required
export function isRequiredRow(rowLabel: string): rowLabel is RowLabel {
  return REQUIRED_ROWS.includes(rowLabel as RowLabel);
}

// Validation schemas using Zod (if needed for runtime validation)
import { z } from 'zod';

export const MonthKeySchema = z.string().regex(/^\d{4}-\d{2}$/);
export const RowLabelSchema = z.enum(REQUIRED_ROWS);