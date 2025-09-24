/**
 * Sample CSV data generators for testing and documentation
 */

import { REQUIRED_ROWS } from '../lib/schema';

export type SampleDataType = 'valid' | 'missing-rows' | 'extra-rows';

/**
 * Generate sample CSV content
 */
export function generateSampleCSV(type: SampleDataType, monthCount: number = 24): string {
  // Generate months (last N months from current date)
  const months: string[] = [];
  const currentDate = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  
  const headers = ['Category', ...months];
  const csvLines = [headers.join(',')];
  
  let rowsToInclude: string[];
  
  switch (type) {
    case 'valid':
      rowsToInclude = [...REQUIRED_ROWS];
      break;
      
    case 'missing-rows':
      // Remove some required rows to test missing data handling
      rowsToInclude = REQUIRED_ROWS.slice(0, Math.floor(REQUIRED_ROWS.length * 0.7));
      break;
      
    case 'extra-rows':
      // Add some unknown rows to test filtering
      rowsToInclude = [
        ...REQUIRED_ROWS,
        'Unknown Medical Category',
        'Deprecated Admin Fee',
        'Test Row 1',
        'Invalid Category Name',
        'Extra Pharmacy Data'
      ];
      break;
  }
  
  // Generate data for each row
  rowsToInclude.forEach(rowLabel => {
    const values = months.map(() => generateRealisticValue(rowLabel));
    const csvRow = [
      `"${rowLabel}"`, // Quote the category name to handle commas
      ...values.map(v => v.toString())
    ].join(',');
    csvLines.push(csvRow);
  });
  
  return csvLines.join('\n');
}

/**
 * Generate realistic values based on row type
 */
function generateRealisticValue(rowLabel: string): number {
  const label = rowLabel.toLowerCase();
  
  // Medical claims - larger amounts
  if (label.includes('medical') || label.includes('hospital')) {
    if (label.includes('total') || label.includes('all')) {
      return Math.round(800000 + Math.random() * 400000); // $800K - $1.2M
    } else {
      return Math.round(200000 + Math.random() * 600000); // $200K - $800K
    }
  }
  
  // Pharmacy claims
  if (label.includes('pharmacy')) {
    if (label.includes('rebate')) {
      return Math.round(-50000 - Math.random() * 100000); // Negative rebates
    } else {
      return Math.round(100000 + Math.random() * 200000); // $100K - $300K
    }
  }
  
  // Stop Loss
  if (label.includes('stop loss')) {
    if (label.includes('reimbursement')) {
      return Math.round(Math.random() * 200000); // $0 - $200K
    } else {
      return Math.round(10000 + Math.random() * 30000); // $10K - $40K
    }
  }
  
  // Administrative costs
  if (label.includes('admin') || label.includes('fee') || label.includes('consulting')) {
    return Math.round(5000 + Math.random() * 25000); // $5K - $30K
  }
  
  // Totals - largest amounts
  if (label.includes('total') && (label.includes('monthly') || label.includes('cumulative'))) {
    if (label.includes('cumulative')) {
      return Math.round(8000000 + Math.random() * 4000000); // $8M - $12M
    } else {
      return Math.round(1000000 + Math.random() * 500000); // $1M - $1.5M
    }
  }
  
  // Enrollment counts
  if (label.includes('employee') || label.includes('member')) {
    if (label.includes('employee')) {
      return Math.round(800 + Math.random() * 400); // 800 - 1200 employees
    } else {
      return Math.round(1800 + Math.random() * 800); // 1800 - 2600 members
    }
  }
  
  // PEPM metrics
  if (label.includes('pepm') || label.includes('per employee')) {
    return Math.round(400 + Math.random() * 600); // $400 - $1000 PEPM
  }
  
  // Budget analysis
  if (label.includes('budget')) {
    if (label.includes('annual') || label.includes('cumulative')) {
      return Math.round(12000000 + Math.random() * 6000000); // $12M - $18M annual
    } else {
      return Math.round(800000 + Math.random() * 400000); // $800K - $1.2M monthly
    }
  }
  
  // Differences (can be positive or negative)
  if (label.includes('difference')) {
    const baseValue = Math.random() * 200000; // Up to $200K difference
    return Math.round((Math.random() > 0.5 ? 1 : -1) * baseValue);
  }
  
  // Percentages
  if (label.includes('percentage')) {
    const basePercent = Math.random() * 20; // Up to 20%
    return Math.round((Math.random() > 0.5 ? 1 : -1) * basePercent * 100) / 100;
  }
  
  // Adjustments (usually smaller amounts, can be negative)
  if (label.includes('adjustment')) {
    const baseValue = Math.random() * 50000; // Up to $50K
    return Math.round((Math.random() > 0.7 ? 1 : -1) * baseValue);
  }
  
  // Default fallback
  return Math.round(Math.random() * 100000);
}

/**
 * Generate sample files for download
 */
export interface SampleFile {
  name: string;
  content: string;
  description: string;
}

export function generateSampleFiles(): SampleFile[] {
  return [
    {
      name: 'valid-claims-data.csv',
      content: generateSampleCSV('valid', 24),
      description: 'Complete sample with all required rows and 24 months of data'
    },
    {
      name: 'missing-rows-data.csv', 
      content: generateSampleCSV('missing-rows', 18),
      description: 'Sample missing some required rows (shows how missing data is handled)'
    },
    {
      name: 'extra-rows-data.csv',
      content: generateSampleCSV('extra-rows', 12),
      description: 'Sample with additional unknown rows (shows how extra data is filtered)'
    }
  ];
}

/**
 * Download a sample file
 */
export function downloadSampleFile(file: SampleFile): void {
  const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', file.name);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Get CSV format documentation
 */
export function getCSVFormatDocs(): {
  title: string;
  sections: Array<{
    heading: string;
    content: string[];
  }>;
} {
  return {
    title: 'CSV Format Requirements',
    sections: [
      {
        heading: 'Required Columns',
        content: [
          'First column must be named "Category"',
          'Contains the exact row labels as specified in the schema',
          'Additional columns represent months of data'
        ]
      },
      {
        heading: 'Month Column Formats',
        content: [
          'MMM-YY: Jan-24, Feb-24, etc.',
          'MMMM YYYY: January 2024, February 2024, etc.',
          'YYYY-MM: 2024-01, 2024-02, etc.'
        ]
      },
      {
        heading: 'Data Requirements',
        content: [
          'Numeric values for financial data',
          'Currency symbols ($) and commas are automatically stripped',
          'Empty cells or missing data will show as "–"',
          'Maximum 48 months of historical data'
        ]
      },
      {
        heading: 'Row Labels',
        content: [
          `${REQUIRED_ROWS.length} specific row labels are required`,
          'Unknown/extra rows will be ignored (with notification)',
          'Missing required rows will be shown with "–" values',
          'Row labels are case-sensitive and must match exactly'
        ]
      }
    ]
  };
}