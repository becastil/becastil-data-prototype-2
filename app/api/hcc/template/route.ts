import { NextResponse } from 'next/server'
import { HCC_EXPECTED_COLUMNS } from '@/app/hcc/lib/schema'

export async function GET() {
  try {
    // Generate sample CSV template data
    const sampleData = [
      {
        'Member ID': 'M001',
        'Member Type': 'Employee',
        'Age Band': '36-45',
        'Primary Diagnosis Category': 'Diabetes Type 2',
        'Secondary Diagnosis Category': 'Hypertension',
        'ICD-10 Primary Code': 'E11.9',
        'ICD-10 Secondary Code': 'I10',
        'Total Paid YTD': '12500.00',
        'Medical Costs YTD': '10000.00',
        'Pharmacy Costs YTD': '2500.00',
        'Total Projected Annual': '18750.00',
        'Primary Provider': 'Kaiser Permanente',
        'Provider Network': 'In-Network',
        'Primary Facility': 'Kaiser Medical Center',
        'Risk Adjustment Factor': '0.85',
        'Stop Loss Applicable': 'No',
        'Case Management Required': 'Yes',
        'Claims Status': 'Active'
      },
      {
        'Member ID': 'M002',
        'Member Type': 'Spouse',
        'Age Band': '26-35',
        'Primary Diagnosis Category': 'Pregnancy',
        'Secondary Diagnosis Category': '',
        'ICD-10 Primary Code': 'Z34.90',
        'ICD-10 Secondary Code': '',
        'Total Paid YTD': '8900.00',
        'Medical Costs YTD': '8400.00',
        'Pharmacy Costs YTD': '500.00',
        'Total Projected Annual': '15000.00',
        'Primary Provider': 'Anthem Blue Cross',
        'Provider Network': 'In-Network',
        'Primary Facility': 'Regional Medical Center',
        'Risk Adjustment Factor': '0.45',
        'Stop Loss Applicable': 'No',
        'Case Management Required': 'No',
        'Claims Status': 'Active'
      },
      {
        'Member ID': 'M003',
        'Member Type': 'Employee',
        'Age Band': '56-64',
        'Primary Diagnosis Category': 'Cardiovascular Disease',
        'Secondary Diagnosis Category': 'Diabetes Type 2',
        'ICD-10 Primary Code': 'I25.9',
        'ICD-10 Secondary Code': 'E11.9',
        'Total Paid YTD': '45200.00',
        'Medical Costs YTD': '42000.00',
        'Pharmacy Costs YTD': '3200.00',
        'Total Projected Annual': '65000.00',
        'Primary Provider': 'UnitedHealthcare',
        'Provider Network': 'In-Network',
        'Primary Facility': 'University Hospital',
        'Risk Adjustment Factor': '1.25',
        'Stop Loss Applicable': 'Yes',
        'Case Management Required': 'Yes',
        'Claims Status': 'Under Review'
      },
      {
        'Member ID': 'M004',
        'Member Type': 'Child',
        'Age Band': '0-17',
        'Primary Diagnosis Category': 'Asthma',
        'Secondary Diagnosis Category': '',
        'ICD-10 Primary Code': 'J45.9',
        'ICD-10 Secondary Code': '',
        'Total Paid YTD': '3250.00',
        'Medical Costs YTD': '2000.00',
        'Pharmacy Costs YTD': '1250.00',
        'Total Projected Annual': '5000.00',
        'Primary Provider': 'Aetna',
        'Provider Network': 'In-Network',
        'Primary Facility': 'Children\'s Medical Group',
        'Risk Adjustment Factor': '0.35',
        'Stop Loss Applicable': 'No',
        'Case Management Required': 'No',
        'Claims Status': 'Active'
      },
      {
        'Member ID': 'M005',
        'Member Type': 'Employee',
        'Age Band': '46-55',
        'Primary Diagnosis Category': 'Cancer Treatment',
        'Secondary Diagnosis Category': '',
        'ICD-10 Primary Code': 'C78.00',
        'ICD-10 Secondary Code': '',
        'Total Paid YTD': '127500.00',
        'Medical Costs YTD': '115000.00',
        'Pharmacy Costs YTD': '12500.00',
        'Total Projected Annual': '180000.00',
        'Primary Provider': 'Kaiser Permanente',
        'Provider Network': 'In-Network',
        'Primary Facility': 'Oncology Center',
        'Risk Adjustment Factor': '2.15',
        'Stop Loss Applicable': 'Yes',
        'Case Management Required': 'Yes',
        'Claims Status': 'Active'
      }
    ]
    
    // Convert to CSV format
    const headers = HCC_EXPECTED_COLUMNS.join(',')
    const rows = sampleData.map(row => 
      HCC_EXPECTED_COLUMNS.map(col => {
        const value = row[col as keyof typeof row] || ''
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    
    const csvContent = [headers, ...rows].join('\n')
    
    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="hcc-template.csv"',
        'Cache-Control': 'no-cache',
      },
    })
    
  } catch (error) {
    console.error('Error generating HCC template:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate template file' },
      { status: 500 }
    )
  }
}

// Also provide a JSON endpoint for column information
export async function POST() {
  return NextResponse.json({
    columns: HCC_EXPECTED_COLUMNS,
    required_columns: [
      'Member ID',
      'Member Type',
      'Age Band', 
      'Total Paid YTD',
      'Medical Costs YTD',
      'Pharmacy Costs YTD'
    ],
    column_descriptions: {
      'Member ID': 'Unique identifier for each member',
      'Member Type': 'Employee, Spouse, Child, or Dependent',
      'Age Band': 'Age group categories (0-17, 18-25, 26-35, 36-45, 46-55, 56-64, 65+)',
      'Primary Diagnosis Category': 'Main medical condition or diagnosis category',
      'Secondary Diagnosis Category': 'Additional medical condition (optional)',
      'ICD-10 Primary Code': 'Primary ICD-10 diagnostic code',
      'ICD-10 Secondary Code': 'Secondary ICD-10 diagnostic code (optional)',
      'Total Paid YTD': 'Total amount paid year-to-date (numeric, no $ or commas)',
      'Medical Costs YTD': 'Medical costs year-to-date (numeric, no $ or commas)',
      'Pharmacy Costs YTD': 'Pharmacy costs year-to-date (numeric, no $ or commas)',
      'Total Projected Annual': 'Projected total annual costs (numeric, no $ or commas)',
      'Primary Provider': 'Main healthcare provider or insurance carrier',
      'Provider Network': 'In-Network, Out-of-Network, or Mixed',
      'Primary Facility': 'Main healthcare facility or hospital (optional)',
      'Risk Adjustment Factor': 'Risk factor as decimal (e.g., 0.85 for 85% or 1.25 for 125%)',
      'Stop Loss Applicable': 'Yes or No - whether stop loss insurance applies',
      'Case Management Required': 'Yes or No - whether case management is needed',
      'Claims Status': 'Active, Resolved, Under Review, or Projected'
    },
    validation_rules: {
      'Member ID': 'Required. Must be unique for each row.',
      'Member Type': 'Required. Must be one of: Employee, Spouse, Child, Dependent',
      'Age Band': 'Required. Must be one of: 0-17, 18-25, 26-35, 36-45, 46-55, 56-64, 65+',
      'Total Paid YTD': 'Required. Must be numeric (no $ signs or commas)',
      'Medical Costs YTD': 'Required. Must be numeric (no $ signs or commas)',
      'Pharmacy Costs YTD': 'Required. Must be numeric (no $ signs or commas)',
      'Risk Adjustment Factor': 'Must be decimal between 0 and 5 (e.g., 1.25 not 125%)',
      'Provider Network': 'Must be one of: In-Network, Out-of-Network, Mixed (if provided)',
      'Stop Loss Applicable': 'Must be Yes or No (if provided)',
      'Case Management Required': 'Must be Yes or No (if provided)',
      'Claims Status': 'Must be one of: Active, Resolved, Under Review, Projected (if provided)'
    }
  })
}