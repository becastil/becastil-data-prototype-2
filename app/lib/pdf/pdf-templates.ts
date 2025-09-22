import { ReportTemplate } from '@/app/types/charts'

// Healthcare report template for executive dashboards
export const EXECUTIVE_REPORT_TEMPLATE: ReportTemplate = {
  id: 'executive-healthcare',
  name: 'Executive Healthcare Analytics Report',
  description: 'Comprehensive healthcare analytics report for executive decision-making',
  charts: [
    {
      type: 'claims-trend',
      title: 'Claims Trend Analysis',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { enabled: false }, // Disabled for PDF
          accessibility: {
            description: 'Monthly claims trends showing cost and volume patterns over the past 12 months'
          }
        }
      },
      layout: { width: 100, height: 300, x: 0, y: 0 }
    },
    {
      type: 'service-breakdown',
      title: 'Cost Distribution by Service Type',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right' },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Pie chart showing healthcare cost distribution across service categories'
          }
        }
      },
      layout: { width: 50, height: 300, x: 0, y: 320 }
    },
    {
      type: 'top-claimants',
      title: 'Top 10 Cost Drivers',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Bar chart ranking the highest-cost claimants by total spending'
          }
        }
      },
      layout: { width: 50, height: 300, x: 50, y: 320 }
    }
  ],
  layout: {
    sections: [
      {
        title: 'Executive Summary',
        charts: ['claims-trend'],
        breakAfter: false
      },
      {
        title: 'Cost Analysis',
        charts: ['service-breakdown', 'top-claimants'],
        breakAfter: true
      }
    ]
  },
  styling: {
    theme: 'professional',
    headerLogo: '/images/logo.png',
    footerText: 'Confidential Healthcare Analytics Report'
  }
}

// Operational report template for day-to-day management
export const OPERATIONAL_REPORT_TEMPLATE: ReportTemplate = {
  id: 'operational-healthcare',
  name: 'Operational Healthcare Analytics Report',
  description: 'Detailed operational metrics for healthcare management teams',
  charts: [
    {
      type: 'monthly-comparison',
      title: 'Monthly Performance Comparison',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Bar chart comparing monthly healthcare costs across recent periods'
          }
        }
      },
      layout: { width: 100, height: 250, x: 0, y: 0 }
    },
    {
      type: 'service-breakdown',
      title: 'Service Type Analysis',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Detailed breakdown of costs by healthcare service category'
          }
        }
      },
      layout: { width: 100, height: 250, x: 0, y: 270 }
    },
    {
      type: 'claims-trend',
      title: 'Claims Volume and Cost Trends',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Line chart showing claims volume and cost trends over time'
          }
        }
      },
      layout: { width: 100, height: 250, x: 0, y: 540 }
    }
  ],
  layout: {
    sections: [
      {
        title: 'Performance Overview',
        charts: ['monthly-comparison'],
        breakAfter: false
      },
      {
        title: 'Service Analysis',
        charts: ['service-breakdown'],
        breakAfter: false
      },
      {
        title: 'Trend Analysis',
        charts: ['claims-trend'],
        breakAfter: false
      }
    ]
  },
  styling: {
    theme: 'professional',
    footerText: 'Internal Operations Report - Healthcare Analytics'
  }
}

// Compliance report template for regulatory requirements
export const COMPLIANCE_REPORT_TEMPLATE: ReportTemplate = {
  id: 'compliance-healthcare',
  name: 'Healthcare Compliance Analytics Report',
  description: 'Regulatory compliance and audit-ready healthcare analytics report',
  charts: [
    {
      type: 'claims-trend',
      title: 'Claims Processing Trends (Regulatory View)',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Regulatory compliant view of claims processing trends with audit trail'
          }
        }
      },
      layout: { width: 100, height: 300, x: 0, y: 0 }
    },
    {
      type: 'service-breakdown',
      title: 'Cost Allocation by Service Category',
      dataSource: 'dashboard-stats',
      config: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right' },
          tooltip: { enabled: false },
          accessibility: {
            description: 'Auditable cost allocation across healthcare service categories'
          }
        }
      },
      layout: { width: 100, height: 300, x: 0, y: 320 }
    }
  ],
  layout: {
    sections: [
      {
        title: 'Regulatory Overview',
        charts: ['claims-trend'],
        breakAfter: false
      },
      {
        title: 'Cost Allocation Compliance',
        charts: ['service-breakdown'],
        breakAfter: false
      }
    ]
  },
  styling: {
    theme: 'accessible', // High contrast for compliance
    footerText: 'Compliance Report - Generated for Regulatory Submission'
  }
}

// Function to generate HTML from template
export function generateReportHTML(
  template: ReportTemplate,
  chartData: Record<string, any>,
  organizationName: string,
  generatedDate: string,
  metadata?: {
    reportPeriod?: string
    generatedBy?: string
    confidentialityLevel?: string
  }
): string {
  const { reportPeriod, generatedBy, confidentialityLevel } = metadata || {}

  // Generate chart placeholders with data previews
  const chartSections = template.layout.sections.map(section => {
    const sectionCharts = section.charts.map(chartId => {
      const chartConfig = template.charts.find(c => c.type === chartId)
      if (!chartConfig) return ''

      return `
        <div class="chart-container" id="chart-${chartId}">
          <div class="chart-header">
            <h3>${chartConfig.title}</h3>
          </div>
          <div class="chart-content">
            <div class="chart-placeholder">
              <div class="chart-icon">
                ${getChartIcon(chartConfig.type)}
              </div>
              <p>${chartConfig.title}</p>
              <small>Chart rendering requires Chart.js installation</small>
            </div>
            ${chartData[chartId] ? `
              <div class="chart-data-summary">
                <strong>Data Points:</strong> ${JSON.stringify(chartData[chartId]).substring(0, 100)}...
              </div>
            ` : ''}
          </div>
        </div>
      `
    }).join('')

    return `
      <section class="report-section ${section.breakAfter ? 'page-break-after' : ''}">
        <h2>${section.title}</h2>
        <div class="charts-grid">
          ${sectionCharts}
        </div>
      </section>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.name} - ${organizationName}</title>
      <style>
        ${getReportCSS(template.styling.theme)}
      </style>
    </head>
    <body>
      <!-- Report Header -->
      <header class="report-header">
        <div class="header-content">
          <div class="logo-section">
            ${template.styling.headerLogo ? `<img src="${template.styling.headerLogo}" alt="Organization Logo" class="logo">` : ''}
            <div class="header-text">
              <h1>${template.name}</h1>
              <p class="organization">${organizationName}</p>
            </div>
          </div>
          <div class="metadata">
            <table class="metadata-table">
              <tr><td>Generated:</td><td>${generatedDate}</td></tr>
              ${reportPeriod ? `<tr><td>Period:</td><td>${reportPeriod}</td></tr>` : ''}
              ${generatedBy ? `<tr><td>Generated By:</td><td>${generatedBy}</td></tr>` : ''}
              ${confidentialityLevel ? `<tr><td>Classification:</td><td class="confidential">${confidentialityLevel}</td></tr>` : ''}
            </table>
          </div>
        </div>
      </header>

      <!-- Executive Summary -->
      <section class="executive-summary">
        <h2>Executive Summary</h2>
        <p>${template.description}</p>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Report Scope</h3>
            <p>Healthcare analytics covering ${template.charts.length} key metrics and performance indicators.</p>
          </div>
          <div class="summary-card">
            <h3>Data Period</h3>
            <p>${reportPeriod || 'Last 12 months of available data'}</p>
          </div>
          <div class="summary-card">
            <h3>Compliance</h3>
            <p>Generated in accordance with healthcare data reporting standards and WCAG 2.2 AA accessibility guidelines.</p>
          </div>
        </div>
      </section>

      <!-- Chart Sections -->
      ${chartSections}

      <!-- Report Footer -->
      <footer class="report-footer">
        <div class="footer-content">
          <p>${template.styling.footerText || 'Healthcare Analytics Report'}</p>
          <p class="disclaimer">
            This report contains confidential healthcare information. Distribution should be limited to authorized personnel only.
            Data accuracy is dependent on source system integrity and data validation processes.
          </p>
        </div>
      </footer>
    </body>
    </html>
  `
}

// Get chart icon SVG based on chart type
function getChartIcon(chartType: string): string {
  switch (chartType) {
    case 'claims-trend':
      return `<svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 3v18h18M7 14l4-4 4 4 4-4"/>
      </svg>`
    
    case 'service-breakdown':
      return `<svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`
    
    case 'top-claimants':
      return `<svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h2v8H3zm4-6h2v14H7zm4-6h2v20h-2zm4 4h2v16h-2zm4-2h2v18h-2z"/>
      </svg>`
    
    case 'monthly-comparison':
      return `<svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 13h2v8H5zm4-6h2v14H9zm4-6h2v20h-2zm4 4h2v16h-2z"/>
      </svg>`
    
    default:
      return `<svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 3v18h18"/>
      </svg>`
  }
}

// Get theme-specific CSS
function getReportCSS(theme: string): string {
  const baseCSS = `
    @page {
      margin: 0.75in;
      size: A4;
      @top-center {
        content: "Healthcare Analytics Report";
        font-size: 10px;
        color: #666;
      }
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 10px;
        color: #666;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }

    .report-header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo {
      height: 60px;
      width: auto;
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .organization {
      margin: 0.25rem 0 0 0;
      font-size: 1.1rem;
      opacity: 0.8;
    }

    .metadata-table {
      font-size: 0.9rem;
      border-collapse: collapse;
    }

    .metadata-table td {
      padding: 0.25rem 0.5rem;
      border: none;
    }

    .metadata-table td:first-child {
      font-weight: 600;
      text-align: right;
    }

    .confidential {
      font-weight: 700;
      color: #dc2626;
    }

    .executive-summary {
      margin: 2rem 0;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .summary-card {
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid;
    }

    .summary-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .summary-card p {
      margin: 0;
      font-size: 0.9rem;
    }

    .report-section {
      margin: 2rem 0;
    }

    .report-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .chart-container {
      border: 1px solid;
      border-radius: 8px;
      padding: 1rem;
      break-inside: avoid;
    }

    .chart-header h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .chart-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed;
      border-radius: 6px;
      margin-bottom: 1rem;
    }

    .chart-icon {
      margin-bottom: 0.5rem;
      opacity: 0.6;
    }

    .chart-data-summary {
      font-size: 0.8rem;
      padding: 0.5rem;
      border-radius: 4px;
      font-family: monospace;
    }

    .page-break-after {
      page-break-after: always;
    }

    .report-footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid;
      font-size: 0.8rem;
    }

    .disclaimer {
      margin-top: 0.5rem;
      font-style: italic;
      opacity: 0.8;
    }

    @media print {
      .report-section {
        break-inside: avoid;
      }
      
      .chart-container {
        break-inside: avoid;
      }
    }
  `

  // Theme-specific colors
  const themeColors = {
    professional: {
      primary: '#2563eb',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb',
      cardBg: '#f8fafc'
    },
    accessible: {
      primary: '#1f2937',
      background: '#ffffff',
      text: '#000000',
      border: '#6b7280',
      cardBg: '#f9fafb'
    },
    dark: {
      primary: '#60a5fa',
      background: '#1f2937',
      text: '#f9fafb',
      border: '#374151',
      cardBg: '#111827'
    }
  }

  const colors = themeColors[theme as keyof typeof themeColors] || themeColors.professional

  const themeCSS = `
    body {
      background-color: ${colors.background};
      color: ${colors.text};
    }

    .report-header {
      border-bottom-color: ${colors.primary};
    }

    .header-text h1 {
      color: ${colors.text};
    }

    .organization {
      color: ${colors.text};
    }

    .executive-summary {
      background-color: ${colors.cardBg};
      border: 1px solid ${colors.border};
    }

    .summary-card {
      background-color: ${colors.background};
      border-color: ${colors.border};
    }

    .report-section h2 {
      color: ${colors.text};
      border-bottom-color: ${colors.border};
    }

    .chart-container {
      background-color: ${colors.background};
      border-color: ${colors.border};
    }

    .chart-placeholder {
      background-color: ${colors.cardBg};
      border-color: ${colors.border};
      color: ${colors.text};
    }

    .chart-data-summary {
      background-color: ${colors.cardBg};
      color: ${colors.text};
    }

    .report-footer {
      border-top-color: ${colors.border};
      color: ${colors.text};
    }
  `

  return baseCSS + themeCSS
}

// Export available templates
export const REPORT_TEMPLATES = {
  executive: EXECUTIVE_REPORT_TEMPLATE,
  operational: OPERATIONAL_REPORT_TEMPLATE,
  compliance: COMPLIANCE_REPORT_TEMPLATE
} as const

export type ReportTemplateKey = keyof typeof REPORT_TEMPLATES