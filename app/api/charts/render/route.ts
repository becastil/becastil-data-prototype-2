import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-client'
import { createChartBuilder, transformStatsToChartData } from '@/app/lib/charts/chart-builder'
import { ChartRenderOptions } from '@/app/types/charts'

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
    const { chartType, theme = 'professional', options = {} } = body

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

    // Fetch dashboard stats (reusing existing logic)
    const organizationId = profile.organization.id

    // Get claims data for charts
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

    // Transform data for charts
    const chartData = transformStatsToChartData(stats)
    const chartBuilder = createChartBuilder(theme)

    let chartConfig: any
    let chartDataset: any

    // Build the requested chart
    switch (chartType) {
      case 'claims-trend':
        const trendChart = chartBuilder.buildClaimsTrendChart(chartData.claimsTrend)
        chartConfig = trendChart.config
        chartDataset = trendChart.data
        break

      case 'service-breakdown':
        const breakdownChart = chartBuilder.buildServiceTypeChart(chartData.costBreakdown)
        chartConfig = breakdownChart.config
        chartDataset = breakdownChart.data
        break

      case 'top-claimants':
        const claimantsChart = chartBuilder.buildTopClaimantsChart(chartData.costBreakdown)
        chartConfig = claimantsChart.config
        chartDataset = claimantsChart.data
        break

      case 'monthly-comparison':
        const monthlyChart = chartBuilder.buildMonthlyComparisonChart(
          stats.monthlyTotals.map((item: any) => ({
            month: item.month_key,
            amount: item.sum
          }))
        )
        chartConfig = monthlyChart.config
        chartDataset = monthlyChart.data
        break

      case 'kpi-sparkline':
        const { metric = 'totalClaims' } = body
        const kpiChart = chartBuilder.buildKPISparkline(chartData.kpiData[metric]?.trend || [])
        chartConfig = kpiChart.config
        chartDataset = kpiChart.data
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid chart type' },
          { status: 400 }
        )
    }

    // For now, return the chart configuration and data
    // Will implement actual image rendering once Chart.js dependencies are installed
    return NextResponse.json({
      success: true,
      chartType,
      config: chartConfig,
      data: chartDataset,
      theme: chartBuilder.getCurrentTheme(),
      message: 'Chart configuration generated. Image rendering pending Chart.js installation.'
    })

  } catch (error) {
    console.error('Chart render API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for chart configuration only (no auth required for demo)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const chartType = searchParams.get('type')
    const theme = searchParams.get('theme') || 'professional'

    if (!chartType) {
      return NextResponse.json(
        { success: false, message: 'Chart type required' },
        { status: 400 }
      )
    }

    // Use demo data for unauthenticated requests
    const DEMO_STATS = {
      summary: {
        totalClaims: 4821,
        totalAmount: 1284500,
        avgClaimAmount: 266.51,
      },
      monthlyTotals: [
        { month_key: '2025-05', sum: 218340, count: 920 },
        { month_key: '2025-04', sum: 205120, count: 850 },
        { month_key: '2025-03', sum: 198560, count: 780 },
        { month_key: '2025-02', sum: 187430, count: 710 },
        { month_key: '2025-01', sum: 176890, count: 680 },
        { month_key: '2024-12', sum: 171250, count: 650 },
      ],
      serviceTypes: [
        { service_type: 'Inpatient', sum: 425600, count: 312 },
        { service_type: 'Outpatient', sum: 318900, count: 1275 },
        { service_type: 'Pharmacy', sum: 218750, count: 1720 },
        { service_type: 'Emergency', sum: 164300, count: 284 },
        { service_type: 'Specialty', sum: 112950, count: 196 },
      ],
      topClaimants: [
        { claimant_id: 'CLA-2041', sum: 38500, count: 9 },
        { claimant_id: 'CLA-1789', sum: 32450, count: 7 },
        { claimant_id: 'CLA-1522', sum: 28740, count: 5 },
        { claimant_id: 'CLA-0987', sum: 25410, count: 6 },
        { claimant_id: 'CLA-0654', sum: 21980, count: 4 },
      ],
    }

    const chartData = transformStatsToChartData(DEMO_STATS)
    const chartBuilder = createChartBuilder(theme as any)

    let chartConfig: any
    let chartDataset: any

    switch (chartType) {
      case 'claims-trend':
        const trendChart = chartBuilder.buildClaimsTrendChart(chartData.claimsTrend)
        chartConfig = trendChart.config
        chartDataset = trendChart.data
        break

      case 'service-breakdown':
        const breakdownChart = chartBuilder.buildServiceTypeChart(chartData.costBreakdown)
        chartConfig = breakdownChart.config
        chartDataset = breakdownChart.data
        break

      case 'top-claimants':
        const claimantsChart = chartBuilder.buildTopClaimantsChart(chartData.costBreakdown)
        chartConfig = claimantsChart.config
        chartDataset = claimantsChart.data
        break

      case 'monthly-comparison':
        const monthlyChart = chartBuilder.buildMonthlyComparisonChart(
          DEMO_STATS.monthlyTotals.map(item => ({
            month: item.month_key,
            amount: item.sum
          }))
        )
        chartConfig = monthlyChart.config
        chartDataset = monthlyChart.data
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid chart type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      chartType,
      config: chartConfig,
      data: chartDataset,
      theme: chartBuilder.getCurrentTheme(),
      demo: true
    })

  } catch (error) {
    console.error('Chart config API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}