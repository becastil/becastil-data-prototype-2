# Healthcare Analytics Dashboard

A HIPAA-compliant healthcare claims analysis platform built with Next.js, TypeScript, and Excel integration.

## Features

- **Claims Analysis**: Interactive tables for healthcare cost analysis with export capabilities
- **HCC Risk Analysis**: Hierarchical Condition Category data analysis for risk assessment
- **CSV Data Visualization**: AI-powered insights and custom visualizations
- **Template Generation**: Automated Excel template creation with formulas and validation
- **Responsive Design**: Mobile-friendly interface with sidebar navigation
- **Data Security**: HIPAA-compliant data handling and processing

## Getting Started

### Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build for Production

```bash
yarn build
yarn start
```

## Templates

This project includes an automated template generation system for healthcare data analysis.

### Available Templates

1. **Healthcare Cost Template** (`default_healthcare_cost_template.xlsx`)
   - 51 rows including medical claims, pharmacy, stop loss, and administrative costs
   - 13 columns (Category + 12 monthly columns)
   - Built-in formulas for totals, PEPM calculations, and budget analysis
   - Currency and percentage formatting
   - Sample data for demonstration

2. **High Cost Claims Template** (`default_high_cost_claims_template.xlsx`)
   - Member-level data with 18 columns
   - Data validation for enums (Member Type, Age Band, etc.)
   - Automatic cost calculations and stop-loss reimbursement formulas
   - Summary sheet with top claimants and diagnosis breakdown

### Generate Templates

```bash
# Generate both templates
yarn templates

# Run template tests
yarn test:templates

# View help
yarn templates --help
```

### Template Structure

#### Healthcare Cost Template

| Column | Description | Format |
|--------|-------------|---------|
| Category | Row labels and section headers | Text |
| Jan-2024 through Dec-2024 | Monthly values | Currency/Number |

**Key Formulas:**
- Total Hospital Medical Claims = Domestic + Non-Domestic
- Total Monthly Claims = Medical + Pharmacy + Stop Loss + Admin
- PEPM Actual = Total Claims ÷ Employee Count
- Percentage Variance = (Budget - Actual) ÷ Budget

**Sections:**
- Medical Claims
- Pharmacy Claims  
- Stop Loss
- Administrative Costs
- Summary Totals
- Enrollment Metrics
- PEPM Metrics
- Budget Analysis

#### High Cost Claims Template

| Column | Description | Format | Validation |
|--------|-------------|---------|------------|
| Member ID | Unique identifier | Integer | Positive numbers |
| Member Type | Relationship | Text | Subscriber/Spouse/Dependent |
| Age Band | Age range | Text | Predefined ranges |
| Total | Sum of cost components | Currency | Calculated |
| Hit Stop Loss? | Exceeds deductible | Text | Yes/No |

**Key Formulas:**
- Total = Facility Inpatient + Outpatient + Professional + Pharmacy
- Estimated Stop-Loss Reimbursement = IF(Hit Stop Loss="Yes", MAX(Total - Deductible, 0), 0)

### Input Guidelines

#### Healthcare Cost Template
- **Negative Values**: Allowed for rebates, reimbursements, and adjustments
- **Employee Count**: Use whole numbers for enrollment metrics
- **PEPM Budget**: Enter target per-employee-per-month amounts
- **Blank Rows**: Preserved for section organization

#### High Cost Claims Template
- **Percentages**: Enter as decimals (0.85 for 85%)
- **Currency**: All monetary values in dollars
- **Dropdowns**: Use provided lists for validated fields
- **Member ID**: Unique positive integers

### File Locations

Generated templates are saved to:
```
./dist/
├── default_healthcare_cost_template.xlsx
└── default_high_cost_claims_template.xlsx
```

### Testing

The template system includes comprehensive tests:

```bash
# Run all tests
yarn test

# Run only template tests
yarn test:templates

# Watch mode for development
yarn test:watch
```

**Test Coverage:**
- Template structure validation
- Formula correctness
- Data validation rules
- Number formatting
- Sample data integrity
- Integration testing

## Development

### Project Structure

```
├── app/                    # Next.js app directory
├── components/            # Reusable React components
├── lib/                   # Shared utilities
│   └── templates/         # Template generation system
├── scripts/               # Build and utility scripts
│   └── templates/         # Template builders and tests
├── dist/                  # Generated templates
└── public/               # Static assets
```

### Tech Stack

- **Framework**: Next.js 15.5.3 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Excel**: XLSX.js for spreadsheet generation
- **Validation**: Zod schemas
- **Testing**: Jest with TypeScript support
- **Icons**: Lucide React

### Scripts

```bash
# Development
yarn dev                   # Start development server
yarn build                 # Build for production
yarn start                 # Start production server

# Templates
yarn templates            # Generate Excel templates
yarn templates --help    # Show template help

# Testing  
yarn test                 # Run all tests
yarn test:templates      # Run template tests only
yarn test:watch          # Watch mode

# Code Quality
yarn lint                # Run ESLint
```

## Deployment

### Render Deployment

This project is configured for deployment on Render:

```bash
# Build command
yarn install --frozen-lockfile && yarn build

# Start command  
yarn start
```

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contributing

1. Follow existing code style and patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Test template generation before committing

## License

Private healthcare analytics platform.
