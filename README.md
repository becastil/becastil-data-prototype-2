# Healthcare Analytics Dashboard

A comprehensive healthcare claims analysis platform built with Next.js, TypeScript, and modern data visualization tools. This application provides a guided 4-step workflow for analyzing healthcare cost data, calculating loss ratios, and generating professional reports.

## ✨ Key Features

### 🔄 Guided 4-Step Workflow
1. **CSV Upload** - Smart data detection and field mapping
2. **Monthly Fees** - Interactive grid with Excel paste support  
3. **Summary Table** - Calculated loss ratios and rolling-12 metrics
4. **Charts & Analytics** - 6-tile dashboard with interactive visualizations

### 📊 Analytics & Reporting
- **Loss Ratio Calculations** - Monthly and rolling-12 month metrics
- **Interactive Charts** - Stacked bar charts with trend overlays
- **High-Cost Analysis** - Member-level claims and top claimant identification
- **PDF Export** - Professional 2-page reports with summary table and charts

### 🛠️ Technical Features
- **Smart CSV Processing** - Server-side parsing with auto field detection
- **Data Validation** - Zod schemas with comprehensive error handling
- **Local State Persistence** - Browser storage with data boundary for API migration
- **Responsive Design** - Mobile-friendly interface with accessible navigation
- **Print Optimization** - Dedicated print views with proper page breaks

## 🚀 Quick Start

### Prerequisites

Before running the application, install these missing dependencies:

```bash
yarn add zustand react-to-print
```

### Development Server

```bash
yarn dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to access the new 4-step workflow.

### Build for Production

```bash
yarn build
yarn start
```

## 📋 Usage Guide

### Step 1: Upload CSV Data

1. Navigate to `/dashboard/upload`.
2. Download both templates directly from the page:
   - `experience_data_template.csv`
   - `high_cost_claimants_template.csv`
3. Populate the templates and upload up to **five** CSV files at once.
4. Files are validated immediately; only perfect header matches are accepted.
5. Valid experience data feeds the summary table and trend charts, while valid high-cost files drive the claimant table and diagnosis charts.

**Experience Template (Category + date columns):**
```
Category,1/1/2024,2/1/2024,3/1/2024,4/1/2024,5/1/2024,6/1/2024,7/1/2024,8/1/2024,9/1/2024,10/1/2024,11/1/2024,12/1/2024
MEDICAL CLAIMS,100000,98000,102500,99500,110200,108300,101750,99000,104250,107000,103500,109800
```

> Use date format `M/D/YYYY` where the date is the first day of each month (for example `1/1/2025`, `2/1/2025`, `3/1/2025`). Keep `Category` in column one and the dates in chronological order.

**High-Cost Claimants Template:**
```
Member ID,Member Type (Employee/Spouse/Dependent),Age Band,Primary Diagnosis Category,Specific Diagnosis Details Short,Specific Diagnosis Details,% of Plan Paid,% of large claims,Total,Facility Inpatient,Facility Outpatient,Professional,Pharmacy,Top Provider,Enrolled (Y/N),Stop-Loss Deductible,Estimated Stop-Loss Reimbursement,Hit Stop Loss?
123456,Employee,50-54,Oncology,Lymphoma,B-Cell non-Hodgkin lymphoma,85,12,275000,120000,60000,50000,45000,Regional Medical Center,Y,250000,25000,N
```

> **Strict validation:** headers are case-sensitive and order-sensitive. Percent values may include `%`, currency values may include `$` and commas, and Y/N flags are normalized automatically.
> When the upload includes `Domestic Hospital Claims` and `Total Hospital Medical Claims`, the dashboard auto-calculates `Non Domestic Hospital Claims` as the difference so you never have to maintain that column manually.

### Step 2: Enter Monthly Fees

1. Navigate to `/dashboard/fees` (unlocked after Step 1)
2. Enter fees for each month in the interactive grid:
   - TPA Fee
   - Network Fee  
   - Stop Loss Premium
   - Other Fees
3. Support for Excel paste (Ctrl+V) for bulk data entry
4. Running totals calculated automatically

### Step 3: Review Summary Table

1. Navigate to `/dashboard/table` (unlocked after Step 2)
2. View calculated monthly summaries including:
   - Claims amounts
   - Fee totals
   - Total costs
   - Loss ratios (monthly and rolling-12)
3. Color-coded loss ratio indicators
4. Export to PDF available

### Step 4: View Charts & Analytics

1. Navigate to `/dashboard/charts` (unlocked after Step 2)
2. Interactive dashboard with:
   - 4 KPI cards (Total Claims, Total Cost, Avg Loss Ratio, Avg Claim)
   - Stacked bar chart with loss ratio trend line
   - Top categories breakdown
   - High-cost claimants analysis (if member data available)
3. Date range filtering options
4. PDF export functionality

### PDF Export

- Access via `/dashboard/print` or export buttons
- **Page 1:** Summary table with executive summary and monthly data
- **Page 2:** Analytics dashboard with KPIs and top categories/claimants
- Optimized for A4/Letter size printing
- Browser-native print dialog (Ctrl+P / Cmd+P)

## 🏗️ Architecture

### Data Flow

```
CSV Upload → Field Mapping → Validation (Zod) → Store (Context + localStorage)
                                                      ↓
Monthly Fees Entry → Validation → Store Update → Calculations (Loss Ratios)
                                                      ↓
Summary Table ← Charts Dashboard ← Print View ← Computed Summaries
```

### State Management

- **React Context + localStorage** for data persistence
- **Zod schemas** for type-safe validation
- **Pure calculation functions** for loss ratios and aggregations
- **Derived state** for computed summaries and metrics

### Key Components

- `AppStoreProvider` - Global state management with persistence
- `StepNav` - 4-step navigation with completion tracking
- `CsvUploadForm` - Smart CSV processing with field mapping
- `FeesGrid` - Interactive grid with Excel paste support
- `SummaryTable` - Calculated results with export functionality
- `ChartsGrid` - 6-tile analytics dashboard
- `PrintContainer` - 2-page PDF-optimized layout

## 📁 Project Structure

```
app/
├── (dashboard)/           # New 4-step workflow
│   ├── layout.tsx        # Dashboard layout with navigation
│   ├── upload/           # Step 1: CSV Upload
│   ├── fees/             # Step 2: Monthly Fees
│   ├── table/            # Step 3: Summary Table
│   ├── charts/           # Step 4: Charts & Analytics
│   └── print/            # PDF Export View
├── components/
│   ├── nav/StepNav.tsx   # 4-step navigation
│   ├── upload/           # CSV upload components
│   ├── fees/             # Fees form components
│   ├── table/            # Summary table components
│   ├── charts/           # Chart components (6 tiles)
│   └── print/            # Print-optimized components
├── lib/
│   ├── schemas/          # Zod validation schemas
│   ├── calc/             # Calculation helpers
│   ├── csv/              # CSV parsing utilities
│   └── store/            # State management
└── public/
    └── templates/        # Sample CSV files
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run template generation tests
yarn test:templates

# Watch mode
yarn test:watch
```

## 📊 Sample Data

Sample CSV templates are available to download directly from the upload page and stored in `/public/templates/`:
- `experience_data_template.csv` – Category rows with monthly columns from Jan-2024 through Dec-2024
- `high_cost_claimants_template.csv` – High-cost claimant roster with diagnosis and cost breakdowns

Both templates include a sample row that illustrates the required formatting.

## 🔧 Configuration

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Data Persistence

Data is stored in browser localStorage by default. To migrate to API-based storage:

1. Replace `AppStoreProvider` with API calls
2. Update state management hooks
3. Implement server-side persistence layer

## 🚀 Deployment

The application is optimized for deployment on Vercel, Netlify, or similar platforms:

```bash
yarn build
# Deploy dist/ folder to your hosting provider
```

For Render deployment:
```bash
yarn startyarn  # Uses render-start.js script
```

## 🤝 Contributing

1. Follow the established patterns for components and state management
2. Use Zod schemas for all data validation
3. Include unit tests for calculation functions
4. Follow the existing file structure and naming conventions
5. Ensure all steps in the workflow remain functional

## 📄 License

This project is part of a healthcare analytics platform. Please ensure compliance with HIPAA and other healthcare data regulations when deploying in production environments.

## 🔍 Troubleshooting

### Common Issues

1. **CSV Upload Fails**: Check file format and size (max 10MB)
2. **Missing Dependencies**: Run `yarn add zustand react-to-print`
3. **Charts Not Loading**: Ensure recharts is properly installed
4. **PDF Export Issues**: Use browser print function (Ctrl+P)
5. **Data Not Persisting**: Check browser localStorage is enabled

### Support

For questions about the 4-step workflow or analytics features, refer to the inline help text and tooltips within each step of the application.
