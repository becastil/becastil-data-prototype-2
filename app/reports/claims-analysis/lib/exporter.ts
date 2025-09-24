/**
 * Export utilities for CSV and XLSX formats
 * Exports only the visible 12-month window data
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  ExportData, 
  TableRow, 
  MonthKey, 
  SECTION_GROUPS,
  MISSING_VALUE_DISPLAY 
} from '../schema';

/**
 * Format value for export
 */
function formatExportValue(value: number | null): string | number {
  if (value === null || value === undefined) {
    return MISSING_VALUE_DISPLAY;
  }
  return value;
}

/**
 * Generate export data structure
 */
export function prepareExportData(
  rows: TableRow[], 
  visibleMonths: MonthKey[],
  windowStart: MonthKey,
  windowEnd: MonthKey
): ExportData {
  return {
    rows: rows.filter(row => row.isVisible),
    months: visibleMonths,
    windowStart,
    windowEnd
  };
}

/**
 * Export data as CSV
 */
export async function exportToCSV(exportData: ExportData, filename?: string): Promise<void> {
  const { rows, months } = exportData;
  
  // Create CSV data structure
  const csvData: Record<string, string | number>[] = [];
  
  // Add section headers and data rows
  Object.entries(SECTION_GROUPS).forEach(([sectionName, sectionRowLabels]) => {
    // Add section header row
    const sectionHeader: Record<string, string | number> = {
      'Category': sectionName,
    };
    months.forEach(month => {
      sectionHeader[month] = '';
    });
    csvData.push(sectionHeader);
    
    // Add data rows for this section
    sectionRowLabels.forEach(rowLabel => {
      const row = rows.find(r => r.rowLabel === rowLabel);
      if (row) {
        const dataRow: Record<string, string | number> = {
          'Category': rowLabel,
        };
        
        months.forEach(month => {
          const value = row.values.get(month);
          dataRow[month] = formatExportValue(value);
        });
        
        csvData.push(dataRow);
      }
    });
  });

  // Generate CSV string
  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ',',
  });

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const defaultFilename = `claims-analysis-${exportData.windowStart}-to-${exportData.windowEnd}.csv`;
  saveAs(blob, filename || defaultFilename);
}

/**
 * Export data as XLSX
 */
export async function exportToXLSX(exportData: ExportData, filename?: string): Promise<void> {
  const { rows, months } = exportData;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare worksheet data
  const wsData: (string | number)[][] = [];
  
  // Add header row
  const headerRow = ['Category', ...months];
  wsData.push(headerRow);
  
  // Add section headers and data rows
  Object.entries(SECTION_GROUPS).forEach(([sectionName, sectionRowLabels]) => {
    // Add section header row
    const sectionHeaderRow = [sectionName, ...months.map(() => '')];
    wsData.push(sectionHeaderRow);
    
    // Add data rows for this section
    sectionRowLabels.forEach(rowLabel => {
      const row = rows.find(r => r.rowLabel === rowLabel);
      if (row) {
        const dataRow = [
          rowLabel,
          ...months.map(month => formatExportValue(row.values.get(month)))
        ];
        wsData.push(dataRow);
      }
    });
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = [
    { wch: 50 }, // Category column - wider
    ...months.map(() => ({ wch: 15 })) // Month columns
  ];
  worksheet['!cols'] = colWidths;
  
  // Style the header row
  const headerRowIndex = 0;
  for (let col = 0; col < headerRow.length; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  }
  
  // Style section header rows
  let currentRow = 1; // Start after main header
  Object.entries(SECTION_GROUPS).forEach(([sectionName, sectionRowLabels]) => {
    // Style section header row
    for (let col = 0; col < headerRow.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'F3F4F6' } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }
    currentRow++; // Move past section header
    
    // Move past data rows
    currentRow += sectionRowLabels.length;
  });
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Claims Analysis');
  
  // Add metadata sheet
  const metaData = [
    ['Export Information'],
    ['Generated', new Date().toLocaleString()],
    ['Date Range', `${exportData.windowStart} to ${exportData.windowEnd}`],
    ['Total Months', months.length],
    ['Total Rows', rows.length],
    [''],
    ['Month Columns'],
    ...months.map(month => [month, formatMonthForDisplay(month)])
  ];
  
  const metaWorksheet = XLSX.utils.aoa_to_sheet(metaData);
  metaWorksheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'Export Info');
  
  // Generate and save file
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true
  });
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const defaultFilename = `claims-analysis-${exportData.windowStart}-to-${exportData.windowEnd}.xlsx`;
  saveAs(blob, filename || defaultFilename);
}

/**
 * Format month key for display
 */
function formatMonthForDisplay(monthKey: MonthKey): string {
  try {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  } catch {
    return monthKey;
  }
}

/**
 * Export both CSV and XLSX formats
 */
export async function exportBothFormats(
  exportData: ExportData, 
  baseFilename?: string
): Promise<void> {
  const base = baseFilename || `claims-analysis-${exportData.windowStart}-to-${exportData.windowEnd}`;
  
  await Promise.all([
    exportToCSV(exportData, `${base}.csv`),
    exportToXLSX(exportData, `${base}.xlsx`)
  ]);
}

/**
 * Generate sample export data for testing
 */
export function generateSampleExportData(): ExportData {
  const months: MonthKey[] = ['2023-07', '2023-08', '2023-09', '2023-10', '2023-11', '2023-12'];
  const sampleRows: TableRow[] = [];
  
  // Generate sample data for a few key rows
  const keyRows = [
    'Total All Medical Claims',
    'Net Pharmacy Claims', 
    'Total Admin Fees',
    'Total Monthly Claims and Expenses',
    'Employee Count (Active + COBRA)'
  ];
  
  keyRows.forEach((rowLabel, index) => {
    const values = new Map<MonthKey, number>();
    months.forEach(month => {
      // Generate realistic sample data
      const baseValue = (index + 1) * 50000 + Math.random() * 20000;
      values.set(month, Math.round(baseValue));
    });
    
    sampleRows.push({
      id: `sample-${index}`,
      rowLabel: rowLabel as any,
      section: 'MEDICAL CLAIMS',
      values,
      isVisible: true
    });
  });
  
  return {
    rows: sampleRows,
    months,
    windowStart: months[0],
    windowEnd: months[months.length - 1]
  };
}