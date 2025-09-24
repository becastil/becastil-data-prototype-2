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

1. Navigate to `/dashboard/upload`
2. Upload your experience data CSV file (max 10MB)
3. Confirm field mappings if needed
4. Data is automatically validated and stored

**Required CSV Format for Experience Data:**
```csv
month,category,amount,premium,claims
2024-01,Medical Claims,125000,150000,125000
2024-01,Pharmacy,35000,45000,35000
```

**Optional Member-Level Claims Data:**
```csv
memberId,month,paidAmount,diagnosisCode,serviceType
M001,2024-01,15000,I21.9,Inpatient
M002,2024-01,2500,Z51.11,Outpatient
```

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

Sample CSV templates are available in `/public/templates/`:
- `experience-data.csv` - Monthly aggregated claims data
- `member-claims.csv` - Individual member claims for high-cost analysis

Download these templates from the upload page for proper formatting examples.

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