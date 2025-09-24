# Claims Analysis Table

A comprehensive, production-ready React component for analyzing claims and budget data across rolling 12-month windows.

## 🚀 Features

### Core Functionality
- **CSV Upload**: Drag-and-drop or click-to-upload with real-time parsing
- **12-Month Windows**: Configurable rolling windows with full 48-month data support  
- **Strict Schema**: Only loads required rows, ignores extras with user feedback
- **Data Validation**: Comprehensive validation with user-friendly error messages
- **Export**: CSV and XLSX export of visible window data

### Table Features  
- **TanStack Table**: Headless, TypeScript-first table with full control
- **Sticky Elements**: Sticky header + first column for easy navigation
- **Section Management**: Expand/collapse by data sections
- **Sorting & Filtering**: Sort by any month, filter by row labels
- **Virtualization**: Auto-enables for 1000+ rows with performance indicator
- **Responsive Design**: Horizontal scroll with maintained accessibility

### Performance & Accessibility
- **Web Worker Parsing**: Non-blocking CSV processing with progress feedback
- **Streaming Support**: Handle large files (up to 48 months) efficiently
- **Full A11y**: Semantic HTML, ARIA labels, keyboard navigation
- **Mobile-Ready**: Responsive design matching your minimal theme

## 📁 File Structure

```
app/reports/claims-analysis/
├── page.tsx                    # Main page component
├── components/
│   ├── ClaimsTable.tsx        # Main table with TanStack integration
│   ├── FileUploader.tsx       # Drag-and-drop CSV uploader
│   ├── MonthSelector.tsx      # 12-month window selector
│   └── ValidationBanner.tsx   # Error/warning/info messages
├── lib/
│   ├── schema.ts              # Type definitions & required rows
│   ├── parser.ts              # CSV parsing with Web Worker
│   ├── validator.ts           # Schema validation & error handling
│   └── exporter.ts            # CSV/XLSX export utilities
└── utils/
    └── sample-data.ts          # Sample CSV generators
```

## 🔧 Required Dependencies

All dependencies are installed and configured:

```json
{
  "@tanstack/react-table": "^8.21.3",
  "@tanstack/react-virtual": "^3.13.12", 
  "xlsx": "^0.18.5",
  "file-saver": "^2.0.5",
  "papaparse": "^5.5.3",
  "@types/file-saver": "^2.0.7"
}
```

## 📊 Data Schema

### Required Row Labels (35 total, in exact order):

#### MEDICAL CLAIMS
- Domestic Medical Facility Claims (Inpatient/Outpatient)
- Non-Domestic Medical Claims (Inpatient/Outpatient)
- Total Hospital Medical Claims
- Non-Hospital Medical Claims
- Total All Medical Claims
- Adjustments
- Total Adjusted Medical Claims

#### PHARMACY CLAIMS  
- Total Pharmacy Claims
- Total Pharmacy Rebates
- Net Pharmacy Claims

#### STOP LOSS
- Total Stop Loss Fees
- Stop Loss Reimbursements  
- Net Stop Loss

#### ADMINISTRATIVE COSTS
- Consulting Fees
- TPA/COBRA Admin Fee
- Anthem Network Fee
- Keenan Pharmacy Coalition Fee
- Keenan Pharmacy Management Fee
- Other Optional Express Scripts Fees
- Total Fixed Costs
- Total Admin Fees

#### SUMMARY TOTALS
- Total Monthly Claims and Expenses
- Cumulative Claims and Expenses

#### ENROLLMENT METRICS
- Employee Count (Active + COBRA)
- Member Count

#### PER EMPLOYEE PER MONTH (PEPM) METRICS
- Per Employee Per Month Non-Lag Actual
- Per Employee Per Month Non-Lag Cumulative
- Incurred Target PEPM
- PEPM Budget
- PEPM Budget × Enrollment Counts

#### BUDGET ANALYSIS
- Annual Cumulative Budget
- Actual Monthly Difference
- Percentage Difference (Monthly)
- Cumulative Difference
- Percentage Difference (Cumulative)

### CSV Format Requirements

**Column Structure:**
- First column: `Category` (exact row labels above)
- Month columns: Any of these formats:
  - `MMM-YY` (Jan-24, Feb-24, etc.)
  - `MMMM YYYY` (January 2024, February 2024, etc.) 
  - `YYYY-MM` (2024-01, 2024-02, etc.)

**Data Handling:**
- Unknown rows ignored (with notification)
- Missing required rows show "–" (em dash)
- Empty cells show "–"
- Currency symbols and commas auto-stripped
- Max 48 months supported (latest kept if exceeded)

## 🎯 Usage

### Basic Usage

Navigate to `/reports/claims-analysis` and:

1. **Upload CSV**: Drag-and-drop or click to select your claims data file
2. **Review Validation**: Check any warnings/errors in the validation banner
3. **Select Window**: Choose your 12-month analysis window
4. **Analyze Data**: Use expand/collapse, sorting, and filtering
5. **Export Results**: Download CSV or Excel of current view

### Month Window Logic

- **Default**: Latest continuous 12 months from uploaded data
- **Selector**: Dropdown showing all valid 12-month start options
- **Quick Options**: "Latest" and "Earliest" buttons for fast selection
- **State Preservation**: Filters and expansion state maintained across window changes

### Table Interactions

```typescript
// Expand/collapse sections
- Click section headers to expand/collapse
- State preserved across data operations

// Sorting
- Click any month column header to sort
- Visual indicators show sort direction
- Missing values ("–") sorted to bottom

// Filtering  
- Text search filters by row labels
- Real-time filtering as you type
- Case-insensitive search

// Export
- "Export CSV" - comma-separated values
- "Export Excel" - formatted .xlsx with metadata
- Only exports currently visible window
```

## ⚡ Performance Features

### Virtualization
```typescript
// Auto-enables when row count > 1000
const VIRTUALIZATION_THRESHOLD = 1000;

// Shows performance indicator
<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium">
  Virtualized
</span>

// User can toggle on/off
<button onClick={() => setShowVirtualization(false)}>
  Disable
</button>
```

### Web Worker Parsing
```typescript
// Papa Parse configuration
Papa.parse(file, {
  worker: true,        // Non-blocking parsing
  skipEmptyLines: true,
  dynamicTyping: false, // Keep as strings for better control
  step: processRow,     // Stream processing
})
```

## 🔒 Validation & Error Handling

### File Validation
- File type checking (.csv files)
- Size limits (50MB max)
- Empty file detection

### Data Validation
- Required column presence
- Month format validation  
- Row label verification
- Data completeness checks

### User-Friendly Messages
```typescript
interface ValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string[];
}

// Error: Critical issues preventing analysis
// Warning: Non-critical issues to be aware of  
// Info: Status updates and notifications
```

## 📤 Export Capabilities

### CSV Export
```typescript
// Clean CSV with proper headers
const csv = Papa.unparse(csvData, {
  header: true,
  delimiter: ',',
});
```

### Excel Export  
```typescript
// Formatted XLSX with:
// - Styled headers
// - Column widths optimized  
// - Section formatting
// - Metadata sheet with export info
```

## 🎨 Styling & Theme Integration

Matches your existing minimal Tailwind theme:

```css
/* Respects your global styles */
* {
  box-shadow: none !important;
  transition: none !important;
}

/* Uses your tabular number formatting */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

## 🧪 Testing & Sample Data

### Sample Files Available
- **valid-claims-data.csv**: Complete 24-month sample
- **missing-rows-data.csv**: Tests missing data handling  
- **extra-rows-data.csv**: Tests unknown row filtering

### Generate Sample Data
```typescript
// In browser console or component
import { generateSampleCSV } from './utils/sample-data';

const validSample = generateSampleCSV('valid', 24);
const testSample = generateSampleCSV('missing-rows', 18);
```

## 🔧 Configuration Options

### Virtualization Threshold
```typescript
// In schema.ts
export const VIRTUALIZATION_THRESHOLD = 1000;
// Adjust based on your performance requirements
```

### Window Size
```typescript
// Default 12-month window
export const DEFAULT_WINDOW_SIZE = 12;
// Can be modified for different analysis periods
```

### Max Data History
```typescript
// Maximum months of data to retain
export const MAX_MONTHS = 48;
// Older data automatically trimmed
```

## 🚀 Future Enhancement Notes

### Server/API/Database Migration
```typescript
// Replace file upload with API endpoint
export async function uploadClaimsData(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/claims/upload', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}

// Store in PostgreSQL/Supabase
// Use server components for initial render
// Add caching for frequently accessed windows
```

### Print/PDF Layout
```css
/* Add to globals.css */
@media print {
  .claims-table {
    font-size: 10px;
    page-break-inside: avoid;
  }
  
  .section-header {
    page-break-after: avoid;
  }
}
```

### Performance Tuning
```typescript
// Adjust virtualization threshold
const VIRTUALIZATION_THRESHOLD = 500; // Lower for mobile
const VIRTUALIZATION_THRESHOLD = 2000; // Higher for desktop

// Dynamic threshold based on device
const threshold = window.innerWidth < 768 ? 500 : 1000;
```

## 🔗 Route Information

**Route Path**: `/reports/claims-analysis`

**Justification**: 
- Follows existing `/reports` structure in your app
- "claims-analysis" is descriptive and professional
- Clear information architecture for users
- Semantic URL structure for SEO and bookmarking

## 📋 Accessibility Features

- **Semantic HTML**: Proper `<table>`, `<thead>`, `<tbody>` structure
- **ARIA Labels**: Screen reader support for all interactive elements  
- **Keyboard Navigation**: Full keyboard access to all features
- **Focus Management**: Proper focus indicators and tab order
- **Color Contrast**: Meets WCAG 2.1 AA standards
- **Screen Reader**: Table headers associated with data cells

## 💡 Tips for Optimal Performance

1. **Large Files**: Enable virtualization for files with 1000+ rows
2. **Memory Usage**: Process files in 10MB chunks for very large datasets  
3. **Export Speed**: Use CSV for faster exports, XLSX for formatting
4. **Mobile Usage**: Consider reducing window size to 6 months on small screens
5. **Caching**: Implement service worker caching for repeated file uploads

---

## 🎉 Ready to Use!

Your comprehensive claims analysis table is now ready for production use. Navigate to `/reports/claims-analysis` to start uploading and analyzing your claims data with full TypeScript safety, performance optimization, and accessibility compliance.