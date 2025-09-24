/**
 * CSV Parser with Web Worker support and month normalization
 * Handles parsing claims data from CSV files with various month formats
 */

import Papa from 'papaparse';
import { 
  RawCSVRow, 
  ParseResult, 
  ProcessedData, 
  ClaimsData, 
  RowLabel,
  MonthKey,
  MONTH_PATTERNS,
  MAX_MONTHS,
  isRequiredRow
} from './schema';

/**
 * Normalizes various month formats to YYYY-MM
 */
export function normalizeMonthKey(monthStr: string): MonthKey | null {
  if (!monthStr || typeof monthStr !== 'string') return null;
  
  const trimmed = monthStr.trim();
  
  // Already in YYYY-MM format
  if (MONTH_PATTERNS['YYYY-MM'].test(trimmed)) {
    return trimmed;
  }
  
  // MMM-YY format (Jan-24)
  if (MONTH_PATTERNS['MMM-YY'].test(trimmed)) {
    const [monthAbbr, yearShort] = trimmed.split('-');
    const year = parseInt(yearShort) + (parseInt(yearShort) > 50 ? 1900 : 2000);
    const monthNum = getMonthNumber(monthAbbr);
    if (monthNum !== null) {
      return `${year}-${monthNum.toString().padStart(2, '0')}`;
    }
  }
  
  // MMMM YYYY format (January 2024)
  if (MONTH_PATTERNS['MMMM YYYY'].test(trimmed)) {
    const parts = trimmed.split(' ');
    const monthName = parts[0];
    const year = parts[1];
    const monthNum = getMonthNumber(monthName);
    if (monthNum !== null) {
      return `${year}-${monthNum.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
}

/**
 * Convert month name/abbreviation to number (1-12)
 */
function getMonthNumber(monthStr: string): number | null {
  const months = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5, 'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
  };
  
  return months[monthStr.toLowerCase() as keyof typeof months] || null;
}

/**
 * Parse CSV file with worker support
 */
export function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const result: ParseResult = {
      data: {
        data: new Map(),
        availableMonths: [],
        missingRows: [],
        ignoredRows: [],
        totalRowsProcessed: 0,
      },
      errors: [],
      warnings: [],
    };

    Papa.parse<RawCSVRow>(file, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for better control
      
      step: (row, parser) => {
        try {
          processRow(row.data, result);
        } catch (error) {
          result.errors.push(`Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
      
      complete: (results) => {
        // Finalize processing
        finalizeParseResult(result);
        
        // Add any Papa Parse errors
        if (results.errors?.length) {
          result.errors.push(...results.errors.map(e => e.message));
        }
        
        resolve(result);
      },
      
      error: (error) => {
        result.errors.push(`CSV parsing failed: ${error.message}`);
        resolve(result);
      }
    });
  });
}

/**
 * Process a single CSV row
 */
function processRow(row: RawCSVRow, result: ParseResult): void {
  const category = row.Category?.toString().trim();
  
  if (!category) {
    return; // Skip empty category rows
  }
  
  result.data.totalRowsProcessed++;
  
  // Check if this is a required row
  if (!isRequiredRow(category)) {
    // Track ignored rows for info banner
    if (!result.data.ignoredRows.includes(category)) {
      result.data.ignoredRows.push(category);
    }
    return;
  }
  
  // Initialize row data if not exists
  if (!result.data.data.has(category)) {
    result.data.data.set(category, new Map());
  }
  
  const rowData = result.data.data.get(category)!;
  
  // Process each column that looks like a month
  Object.keys(row).forEach(key => {
    if (key === 'Category') return;
    
    const normalizedMonth = normalizeMonthKey(key);
    if (normalizedMonth) {
      // Track available months
      if (!result.data.availableMonths.includes(normalizedMonth)) {
        result.data.availableMonths.push(normalizedMonth);
      }
      
      // Parse value
      const rawValue = row[key];
      let numericValue: number | null = null;
      
      if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
        const cleaned = rawValue.toString().replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          numericValue = parsed;
        }
      }
      
      rowData.set(normalizedMonth, numericValue);
    }
  });
}

/**
 * Finalize parsing result
 */
function finalizeParseResult(result: ParseResult): void {
  // Sort available months chronologically
  result.data.availableMonths.sort();
  
  // Limit to MAX_MONTHS if exceeded
  if (result.data.availableMonths.length > MAX_MONTHS) {
    const excess = result.data.availableMonths.length - MAX_MONTHS;
    result.warnings.push(`Data contains ${result.data.availableMonths.length} months. Only the latest ${MAX_MONTHS} months will be used.`);
    
    // Keep only the latest MAX_MONTHS
    result.data.availableMonths = result.data.availableMonths.slice(-MAX_MONTHS);
    
    // Remove data for older months from all rows
    const keepMonths = new Set(result.data.availableMonths);
    result.data.data.forEach((rowData) => {
      const monthsToDelete: MonthKey[] = [];
      rowData.forEach((_, month) => {
        if (!keepMonths.has(month)) {
          monthsToDelete.push(month);
        }
      });
      monthsToDelete.forEach(month => rowData.delete(month));
    });
  }
  
  // Check for missing required rows
  const processedRows = new Set(result.data.data.keys());
  result.data.missingRows = [];
  
  // Import REQUIRED_ROWS here to avoid circular imports
  const { REQUIRED_ROWS } = require('./schema');
  REQUIRED_ROWS.forEach((requiredRow: RowLabel) => {
    if (!processedRows.has(requiredRow)) {
      result.data.missingRows.push(requiredRow);
      // Create empty row data for missing rows
      result.data.data.set(requiredRow, new Map());
    }
  });
  
  // Add warnings for data issues
  if (result.data.missingRows.length > 0) {
    result.warnings.push(`${result.data.missingRows.length} required rows are missing from the data.`);
  }
  
  if (result.data.ignoredRows.length > 0) {
    result.warnings.push(`${result.data.ignoredRows.length} unknown rows were ignored.`);
  }
  
  if (result.data.availableMonths.length === 0) {
    result.errors.push('No valid month columns found in CSV. Please check column headers.');
  }
}

/**
 * Get the latest continuous months for default window
 */
export function getLatestContinuousMonths(availableMonths: MonthKey[], windowSize: number = 12): MonthKey[] {
  if (availableMonths.length === 0) return [];
  
  const sorted = [...availableMonths].sort();
  
  if (sorted.length <= windowSize) {
    return sorted;
  }
  
  // Find the longest continuous sequence ending at the latest month
  let bestWindow: MonthKey[] = [];
  
  for (let i = sorted.length - windowSize; i >= 0; i--) {
    const window = sorted.slice(i, i + windowSize);
    
    // Check if this window is continuous
    let isContinuous = true;
    for (let j = 1; j < window.length; j++) {
      const currentMonth = new Date(window[j] + '-01');
      const previousMonth = new Date(window[j - 1] + '-01');
      const monthDiff = (currentMonth.getFullYear() - previousMonth.getFullYear()) * 12 + 
                       (currentMonth.getMonth() - previousMonth.getMonth());
      
      if (monthDiff !== 1) {
        isContinuous = false;
        break;
      }
    }
    
    if (isContinuous) {
      bestWindow = window;
      break;
    }
  }
  
  // If no continuous window found, just take the latest months
  if (bestWindow.length === 0) {
    bestWindow = sorted.slice(-windowSize);
  }
  
  return bestWindow;
}

/**
 * Validate that months form a continuous sequence
 */
export function isMonthSequenceContinuous(months: MonthKey[]): boolean {
  if (months.length <= 1) return true;
  
  const sorted = [...months].sort();
  
  for (let i = 1; i < sorted.length; i++) {
    const currentMonth = new Date(sorted[i] + '-01');
    const previousMonth = new Date(sorted[i - 1] + '-01');
    const monthDiff = (currentMonth.getFullYear() - previousMonth.getFullYear()) * 12 + 
                     (currentMonth.getMonth() - previousMonth.getMonth());
    
    if (monthDiff !== 1) {
      return false;
    }
  }
  
  return true;
}