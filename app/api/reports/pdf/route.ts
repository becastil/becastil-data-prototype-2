import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-client'
import { createChartBuilder, transformStatsToChartData } from '@/lib/charts/chart-builder'
import { PDFOptions } from '@/types/charts'

// PDF template HTML structure
function createPDFTemplate(charts: any[], organizationName: string, generatedDate: string): string {
  const chartsHTML = charts.map((chart, index) => `
    <div class="chart-section">
      <div class="chart-header">
        <h2>${chart.title}</h2>
        <p class="chart-description">${chart.description}</p>
      </div>
      <div class="chart-container" id="chart-${index}">
        <div class="chart-placeholder">
          Chart will be rendered here once Chart.js dependencies are installed
        </div>
        <div class="chart-data-preview">
          <strong>Chart Type:</strong> ${chart.type}<br>
          <strong>Data Points:</strong> ${JSON.stringify(chart.data, null, 2).substring(0, 200)}...
        </div>
      </div>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Healthcare Analytics Report - ${organizationName}</title>
      <style>
        @page {
          margin: 1in;
          @top-center {
            content: "Healthcare Analytics Report";
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            color: #6b7280;
          }
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 10px;
            color: #6b7280;
          }
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #2563eb;
        }
        
        .header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }
        
        .header .subtitle {
          font-size: 1.1rem;
          color: #6b7280;
          margin: 0;
        }
        
        .header .meta {
          font-size: 0.9rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }
        
        .chart-section {
          margin-bottom: 3rem;
          page-break-inside: avoid;
        }
        
        .chart-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }
        
        .chart-description {
          font-size: 1rem;
          color: #6b7280;
          margin: 0 0 1rem 0;
        }
        
        .chart-container {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          min-height: 400px;
          position: relative;
        }
        
        .chart-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 4px;
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }
        
        .chart-data-preview {
          font-size: 0.8rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 4px;
          white-space: pre-wrap;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .summary-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }
        
        .summary-label {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          .chart-section {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Healthcare Analytics Report</h1>
        <p class="subtitle">${organizationName}</p>
        <p class="meta">Generated on ${generatedDate}</p>
      </div>
      
      ${chartsHTML}
      
      <div class="page-break"></div>
      
      <div class="summary-section">
        <h2>Report Summary</h2>
        <p>This healthcare analytics report provides comprehensive insights into claims data, cost trends, and key performance indicators. The visualizations above demonstrate:</p>
        <ul>
          <li><strong>Claims Trend Analysis:</strong> Monthly patterns in healthcare costs and claim volumes</li>
          <li><strong>Service Type Breakdown:</strong> Distribution of costs across different healthcare services</li>
          <li><strong>Top Cost Drivers:</strong> Identification of highest-cost claimants and patterns</li>
          <li><strong>Performance Metrics:</strong> Key indicators for operational efficiency</li>
        </ul>
        <p>Once Chart.js dependencies are installed, this report will include fully rendered, high-quality charts suitable for executive presentations and regulatory reporting.</p>
      </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      chartTypes = ['claims-trend', 'service-breakdown', 'top-claimants'], 
      theme = 'professional',
      pdfOptions = {}
    } = body

    // Get user's organization data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (!profile?.organization) {
      return NextResponse.json(
        { success: false, message: 'Organization setup required' },
        { status: 400 }
      )
    }

    const organizationName = profile.organization.name
    const organizationId = profile.organization.id

    // Fetch dashboard stats
    const [claimsStatsResult, monthlyTotalsResult, serviceTypesResult, topClaimantsResult] = await Promise.all([
      supabase
        .from('claims_data')
        .select('total_amount.sum(), id.count()')
        .eq('organization_id', organizationId)
        .single(),
      
      supabase
        .from('claims_data')
        .select('month_key, total_amount.sum(), id.count()')
        .eq('organization_id', organizationId)
        .gte('claim_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('month_key', { ascending: false })
        .limit(12),
      
      supabase
        .from('claims_data')
        .select('service_type, total_amount.sum(), id.count()')
        .eq('organization_id', organizationId)
        .order('sum', { ascending: false })
        .limit(10),
      
      supabase
        .from('claims_data')
        .select('claimant_id, total_amount.sum(), id.count()')
        .eq('organization_id', organizationId)
        .order('sum', { ascending: false })
        .limit(10)
    ])

    const stats = {
      summary: {
        totalClaims: claimsStatsResult.data?.count || 0,
        totalAmount: claimsStatsResult.data?.sum || 0,
        avgClaimAmount: claimsStatsResult.data?.count > 0 
          ? (claimsStatsResult.data.sum / claimsStatsResult.data.count) 
          : 0
      },
      monthlyTotals: monthlyTotalsResult.data || [],
      serviceTypes: serviceTypesResult.data || [],
      topClaimants: topClaimantsResult.data || []
    }

    // Transform data and build charts
    const chartData = transformStatsToChartData(stats)
    const chartBuilder = createChartBuilder(theme)

    const charts = chartTypes.map((chartType: string) => {
      switch (chartType) {
        case 'claims-trend':
          const trendChart = chartBuilder.buildClaimsTrendChart(chartData.claimsTrend)
          return {
            type: chartType,
            title: 'Claims Trend Analysis',
            description: 'Monthly healthcare costs and claim volumes over time',
            config: trendChart.config,
            data: trendChart.data
          }

        case 'service-breakdown':
          const breakdownChart = chartBuilder.buildServiceTypeChart(chartData.costBreakdown)
          return {
            type: chartType,
            title: 'Cost Breakdown by Service Type',
            description: 'Distribution of healthcare spending across service categories',
            config: breakdownChart.config,
            data: breakdownChart.data
          }

        case 'top-claimants':
          const claimantsChart = chartBuilder.buildTopClaimantsChart(chartData.costBreakdown)
          return {
            type: chartType,
            title: 'Top Cost Drivers',
            description: 'Highest-cost claimants and their impact on total spending',
            config: claimantsChart.config,
            data: claimantsChart.data
          }

        case 'monthly-comparison':
          const monthlyChart = chartBuilder.buildMonthlyComparisonChart(
            stats.monthlyTotals.map((item: any) => ({
              month: item.month_key,
              amount: item.sum
            }))
          )
          return {
            type: chartType,
            title: 'Monthly Cost Comparison',
            description: 'Comparative analysis of monthly healthcare spending',
            config: monthlyChart.config,
            data: monthlyChart.data
          }

        default:
          throw new Error(`Unsupported chart type: ${chartType}`)
      }
    })

    // Generate HTML template
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const htmlContent = createPDFTemplate(charts, organizationName, generatedDate)

    // For now, return the HTML content and chart configurations
    // Will implement actual PDF generation once Puppeteer dependencies are installed
    return NextResponse.json({
      success: true,
      message: 'PDF template generated. PDF rendering pending Puppeteer installation.',
      htmlContent,
      charts,
      organizationName,
      generatedDate,
      pdfReady: false
    })

  } catch (error) {
    console.error('PDF generation API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for PDF preview (returns HTML)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const theme = searchParams.get('theme') || 'professional'

    // Use demo data for preview
    const DEMO_STATS = {
      summary: { totalClaims: 4821, totalAmount: 1284500, avgClaimAmount: 266.51 },
      monthlyTotals: [
        { month_key: '2025-05', sum: 218340, count: 920 },
        { month_key: '2025-04', sum: 205120, count: 850 },
        { month_key: '2025-03', sum: 198560, count: 780 }
      ],
      serviceTypes: [
        { service_type: 'Inpatient', sum: 425600, count: 312 },
        { service_type: 'Outpatient', sum: 318900, count: 1275 },
        { service_type: 'Pharmacy', sum: 218750, count: 1720 }
      ],
      topClaimants: [
        { claimant_id: 'CLA-2041', sum: 38500, count: 9 },
        { claimant_id: 'CLA-1789', sum: 32450, count: 7 },
        { claimant_id: 'CLA-1522', sum: 28740, count: 5 }
      ]
    }

    const chartData = transformStatsToChartData(DEMO_STATS)
    const chartBuilder = createChartBuilder(theme as any)

    const charts = [
      {
        type: 'claims-trend',
        title: 'Claims Trend Analysis',
        description: 'Monthly healthcare costs and claim volumes over time',
        ...chartBuilder.buildClaimsTrendChart(chartData.claimsTrend)
      },
      {
        type: 'service-breakdown', 
        title: 'Cost Breakdown by Service Type',
        description: 'Distribution of healthcare spending across service categories',
        ...chartBuilder.buildServiceTypeChart(chartData.costBreakdown)
      },
      {
        type: 'top-claimants',
        title: 'Top Cost Drivers', 
        description: 'Highest-cost claimants and their impact on total spending',
        ...chartBuilder.buildTopClaimantsChart(chartData.costBreakdown)
      }
    ]

    const htmlContent = createPDFTemplate(
      charts, 
      'Demo Healthcare Organization', 
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    )

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('PDF preview error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}