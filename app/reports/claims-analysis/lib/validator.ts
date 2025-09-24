/**
 * Schema validator with strict row filtering and user-facing messages
 */

import { ParseResult, ProcessedData, RowLabel, REQUIRED_ROWS } from './schema';

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  messages: ValidationMessage[];
  canProceed: boolean;
}

/**
 * Validate parsed CSV data
 */
export function validateParsedData(result: ParseResult): ValidationResult {
  const messages: ValidationMessage[] = [];
  let isValid = true;
  let canProceed = true;

  // Check for critical errors
  if (result.errors.length > 0) {
    result.errors.forEach(error => {
      messages.push({
        type: 'error',
        message: error
      });
    });
    isValid = false;
    canProceed = false;
  }

  // Check if we have any data at all
  if (result.data.availableMonths.length === 0) {
    messages.push({
      type: 'error',
      message: 'No valid month columns found',
      details: [
        'Please ensure your CSV has month columns in one of these formats:',
        '• MMM-YY (e.g., Jan-24)',
        '• MMMM YYYY (e.g., January 2024)', 
        '• YYYY-MM (e.g., 2024-01)'
      ]
    });
    isValid = false;
    canProceed = false;
  }

  // Check if we have any valid rows
  if (result.data.data.size === 0) {
    messages.push({
      type: 'error',
      message: 'No valid data rows found',
      details: [
        'Please ensure your CSV has a "Category" column with recognized row labels.',
        'Check the documentation for the complete list of required row labels.'
      ]
    });
    isValid = false;
    canProceed = false;
  }

  // Add warnings
  result.warnings.forEach(warning => {
    messages.push({
      type: 'warning',
      message: warning
    });
  });

  // Info about missing rows
  if (result.data.missingRows.length > 0) {
    messages.push({
      type: 'info',
      message: `${result.data.missingRows.length} required rows are missing`,
      details: [
        'These rows will be displayed with "–" for all values:',
        ...result.data.missingRows.map(row => `• ${row}`)
      ]
    });
  }

  // Info about ignored rows
  if (result.data.ignoredRows.length > 0) {
    messages.push({
      type: 'info', 
      message: `${result.data.ignoredRows.length} unknown rows were ignored`,
      details: [
        'The following rows were not recognized and were skipped:',
        ...result.data.ignoredRows.map(row => `• ${row}`)
      ]
    });
  }

  // Success message if everything looks good
  if (isValid && messages.length === 0) {
    messages.push({
      type: 'info',
      message: `Successfully loaded ${result.data.availableMonths.length} months of data`,
      details: [
        `${result.data.data.size} rows processed`,
        `Date range: ${result.data.availableMonths[0]} to ${result.data.availableMonths[result.data.availableMonths.length - 1]}`
      ]
    });
  }

  return {
    isValid,
    messages,
    canProceed
  };
}

/**
 * Get user-friendly error messages for common issues
 */
export function getCommonErrorSolutions(error: string): string[] {
  const solutions: { [key: string]: string[] } = {
    'header': [
      'Ensure the first row contains column headers',
      'Check that there is a "Category" column',
      'Verify month columns use supported formats (MMM-YY, MMMM YYYY, or YYYY-MM)'
    ],
    'format': [
      'Save your file as CSV format (.csv)',
      'Use comma-separated values',
      'Ensure proper text encoding (UTF-8 recommended)'
    ],
    'empty': [
      'Check that your file contains data rows',
      'Verify the Category column is not empty',
      'Make sure numeric values are properly formatted'
    ],
    'month': [
      'Use recognized month formats:',
      '  • MMM-YY: Jan-24, Feb-24, etc.',
      '  • MMMM YYYY: January 2024, February 2024, etc.',
      '  • YYYY-MM: 2024-01, 2024-02, etc.'
    ]
  };

  // Match error patterns to solutions
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('header') || errorLower.includes('column')) {
    return solutions.header;
  }
  
  if (errorLower.includes('format') || errorLower.includes('parse')) {
    return solutions.format;
  }
  
  if (errorLower.includes('empty') || errorLower.includes('no data')) {
    return solutions.empty;
  }
  
  if (errorLower.includes('month') || errorLower.includes('date')) {
    return solutions.month;
  }

  return [
    'Check your CSV file format and structure',
    'Ensure all required columns are present',
    'Verify data is properly formatted'
  ];
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): ValidationResult {
  const messages: ValidationMessage[] = [];
  let isValid = true;
  let canProceed = true;

  // Check file type
  if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
    messages.push({
      type: 'warning',
      message: 'File does not appear to be a CSV file',
      details: ['Please ensure you are uploading a comma-separated values (.csv) file']
    });
  }

  // Check file size (reasonable limit: 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    messages.push({
      type: 'error',
      message: 'File is too large',
      details: [
        `File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        `Maximum allowed: ${maxSize / 1024 / 1024}MB`,
        'Please reduce the file size or contact support for assistance'
      ]
    });
    isValid = false;
    canProceed = false;
  }

  // Check if file is empty
  if (file.size === 0) {
    messages.push({
      type: 'error',
      message: 'File is empty',
      details: ['Please select a valid CSV file with data']
    });
    isValid = false;
    canProceed = false;
  }

  return {
    isValid,
    messages,
    canProceed
  };
}

/**
 * Generate sample CSV content for testing
 */
export function generateSampleCSVContent(type: 'valid' | 'missing-rows' | 'extra-rows'): string {
  const months = ['2023-07', '2023-08', '2023-09', '2023-10', '2023-11', '2023-12'];
  const header = ['Category', ...months].join(',');
  
  const validRows = [
    'Domestic Medical Facility Claims (Inpatient/Outpatient)',
    'Non-Domestic Medical Claims (Inpatient/Outpatient)',
    'Total Hospital Medical Claims',
    'Total Pharmacy Claims',
    'Total Admin Fees',
    'Total Monthly Claims and Expenses',
    'Employee Count (Active + COBRA)',
    'PEPM Budget'
  ];

  let rows: string[];

  switch (type) {
    case 'valid':
      rows = validRows;
      break;
      
    case 'missing-rows':
      // Remove some required rows
      rows = validRows.slice(0, 5);
      break;
      
    case 'extra-rows':
      // Add some unknown rows
      rows = [
        ...validRows,
        'Unknown Row 1',
        'Invalid Category',
        'Extra Data Row'
      ];
      break;
      
    default:
      rows = validRows;
  }

  const csvRows = [header];
  
  rows.forEach(row => {
    const values = months.map(() => (Math.random() * 100000).toFixed(2));
    csvRows.push([row, ...values].join(','));
  });

  return csvRows.join('\n');
}

/**
 * Validate month window selection
 */
export function validateMonthWindow(availableMonths: string[], startMonth: string, windowSize: number = 12): ValidationResult {
  const messages: ValidationMessage[] = [];
  let isValid = true;
  let canProceed = true;

  if (!availableMonths.includes(startMonth)) {
    messages.push({
      type: 'error',
      message: 'Selected start month is not available in the data'
    });
    isValid = false;
    canProceed = false;
  }

  const startIndex = availableMonths.indexOf(startMonth);
  const availableWindowSize = availableMonths.length - startIndex;
  
  if (availableWindowSize < windowSize) {
    messages.push({
      type: 'warning',
      message: `Only ${availableWindowSize} months available from selected start month`,
      details: [`Requested window size: ${windowSize} months`]
    });
  }

  return {
    isValid,
    messages,
    canProceed
  };
}