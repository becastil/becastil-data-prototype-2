import { 
  ClaimsTrendData, 
  CostBreakdownData, 
  KPIData, 
  ChartConfig,
  ChartTheme
} from '@/app/types/charts'
import {
  HEALTHCARE_THEMES,
  CLAIMS_TREND_CONFIG,
  COST_BREAKDOWN_CONFIG,
  KPI_SPARKLINE_CONFIG,
  COMPARISON_BAR_CONFIG,
  createChartConfig,
  formatCurrency,
  formatNumber
} from './chart-config'

export class HealthcareChartBuilder {
  private theme: ChartTheme

  constructor(themeName: keyof typeof HEALTHCARE_THEMES = 'professional') {
    this.theme = HEALTHCARE_THEMES[themeName]
  }

  // Build claims trend line chart
  buildClaimsTrendChart(data: ClaimsTrendData): { config: ChartConfig; data: any } {
    const chartConfig = createChartConfig(CLAIMS_TREND_CONFIG, this.theme)
    
    const chartData = {
      labels: data.monthly.map(item => {
        const date = new Date(item.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }),
      datasets: [
        {
          label: 'Total Amount',
          data: data.monthly.map(item => item.totalAmount),
          borderColor: this.theme.colors.primary[0],
          backgroundColor: this.theme.colors.primary[0] + '20',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Claim Count',
          data: data.monthly.map(item => item.claimCount),
          borderColor: this.theme.colors.primary[1],
          backgroundColor: this.theme.colors.primary[1] + '20',
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    }

    // Configure y-axis for currency formatting
    if (chartConfig.scales?.y) {
      chartConfig.scales.y = {
        ...chartConfig.scales.y,
        display: true,
        ticks: {
          ...chartConfig.scales.y.ticks,
          callback: (value: any) => formatCurrency(value)
        }
      }
    }

    return { config: chartConfig, data: chartData }
  }

  // Build service type breakdown chart
  buildServiceTypeChart(data: CostBreakdownData): { config: ChartConfig; data: any } {
    const chartConfig = createChartConfig(COST_BREAKDOWN_CONFIG, this.theme)
    
    const chartData = {
      labels: data.serviceTypes.map(item => item.label),
      datasets: [{
        data: data.serviceTypes.map(item => item.value),
        backgroundColor: data.serviceTypes.map((_, index) => 
          this.theme.colors.primary[index % this.theme.colors.primary.length]
        ),
        borderColor: this.theme.colors.background,
        borderWidth: 2,
        hoverOffset: 4
      }]
    }

    return { config: chartConfig, data: chartData }
  }

  // Build top claimants bar chart
  buildTopClaimantsChart(data: CostBreakdownData): { config: ChartConfig; data: any } {
    const chartConfig = createChartConfig(COMPARISON_BAR_CONFIG, this.theme)
    
    const sortedClaimants = data.topClaimants
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    const chartData = {
      labels: sortedClaimants.map(item => item.claimantId),
      datasets: [{
        label: 'Total Amount',
        data: sortedClaimants.map(item => item.totalAmount),
        backgroundColor: this.theme.colors.primary[0],
        borderColor: this.theme.colors.primary[0],
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }]
    }

    return { config: chartConfig, data: chartData }
  }

  // Build KPI sparkline charts
  buildKPISparkline(trendData: number[]): { config: ChartConfig; data: any } {
    const chartConfig = createChartConfig(KPI_SPARKLINE_CONFIG, this.theme)
    
    const chartData = {
      labels: trendData.map((_, index) => index.toString()),
      datasets: [{
        data: trendData,
        borderColor: this.theme.colors.primary[0],
        backgroundColor: this.theme.colors.primary[0] + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0
      }]
    }

    return { config: chartConfig, data: chartData }
  }

  // Build monthly comparison chart
  buildMonthlyComparisonChart(monthlyData: Array<{month: string; amount: number}>): { config: ChartConfig; data: any } {
    const chartConfig = createChartConfig(COMPARISON_BAR_CONFIG, this.theme)
    
    const chartData = {
      labels: monthlyData.map(item => {
        const date = new Date(item.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short' })
      }),
      datasets: [{
        label: 'Monthly Claims',
        data: monthlyData.map(item => item.amount),
        backgroundColor: monthlyData.map((_, index) => 
          this.theme.colors.primary[index % this.theme.colors.primary.length] + '80'
        ),
        borderColor: monthlyData.map((_, index) => 
          this.theme.colors.primary[index % this.theme.colors.primary.length]
        ),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }]
    }

    return { config: chartConfig, data: chartData }
  }

  // Build service type trend over time
  buildServiceTypeTrendChart(data: ClaimsTrendData): { config: ChartConfig; data: any } {
    const chartConfig = createChartConfig(CLAIMS_TREND_CONFIG, this.theme)
    
    if (!data.serviceTypes || data.serviceTypes.length === 0) {
      throw new Error('Service type trend data is required')
    }

    const chartData = {
      labels: data.serviceTypes.map(item => item.period),
      datasets: [
        {
          label: 'Inpatient',
          data: data.serviceTypes.map(item => item.inpatient),
          borderColor: this.theme.colors.primary[0],
          backgroundColor: this.theme.colors.primary[0] + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Outpatient',
          data: data.serviceTypes.map(item => item.outpatient),
          borderColor: this.theme.colors.primary[1],
          backgroundColor: this.theme.colors.primary[1] + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Pharmacy',
          data: data.serviceTypes.map(item => item.pharmacy),
          borderColor: this.theme.colors.primary[2],
          backgroundColor: this.theme.colors.primary[2] + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Emergency',
          data: data.serviceTypes.map(item => item.emergency),
          borderColor: this.theme.colors.primary[3],
          backgroundColor: this.theme.colors.primary[3] + '20',
          fill: false,
          tension: 0.4
        }
      ]
    }

    return { config: chartConfig, data: chartData }
  }

  // Set theme
  setTheme(themeName: keyof typeof HEALTHCARE_THEMES): void {
    this.theme = HEALTHCARE_THEMES[themeName]
  }

  // Get current theme
  getCurrentTheme(): ChartTheme {
    return this.theme
  }
}

// Factory function to create chart builder with specific theme
export function createChartBuilder(theme: keyof typeof HEALTHCARE_THEMES = 'professional'): HealthcareChartBuilder {
  return new HealthcareChartBuilder(theme)
}

// Utility function to transform dashboard stats to chart data
export function transformStatsToChartData(stats: any): {
  claimsTrend: ClaimsTrendData;
  costBreakdown: CostBreakdownData;
  kpiData: KPIData;
} {
  // Transform monthly totals to trends
  const claimsTrend: ClaimsTrendData = {
    monthly: stats.monthlyTotals?.map((item: any) => ({
      month: item.month_key,
      totalAmount: item.sum || 0,
      claimCount: item.count || 0,
      avgAmount: item.count > 0 ? (item.sum / item.count) : 0
    })) || [],
    serviceTypes: [] // Would need additional data from API
  }

  // Transform service types to cost breakdown
  const costBreakdown: CostBreakdownData = {
    serviceTypes: stats.serviceTypes?.map((item: any) => ({
      label: item.service_type,
      value: item.sum || 0,
      count: item.count || 0
    })) || [],
    topClaimants: stats.topClaimants?.map((item: any) => ({
      claimantId: item.claimant_id,
      totalAmount: item.sum || 0,
      claimCount: item.count || 0
    })) || []
  }

  // Generate mock trend data for KPIs (would come from time-series data in real app)
  const kpiData: KPIData = {
    totalClaims: {
      value: stats.summary?.totalClaims || 0,
      change: 5.2, // Mock percentage change
      trend: [85, 89, 92, 88, 95, 91, 100] // Mock trend data
    },
    totalAmount: {
      value: stats.summary?.totalAmount || 0,
      change: 3.8,
      trend: [88, 85, 90, 87, 92, 89, 100]
    },
    avgClaimAmount: {
      value: stats.summary?.avgClaimAmount || 0,
      change: -1.2,
      trend: [92, 88, 85, 89, 87, 90, 100]
    },
    processingSuccessRate: {
      value: 98.5, // Mock success rate
      change: 0.3,
      trend: [95, 96, 97, 96, 98, 97, 100]
    }
  }

  return {
    claimsTrend,
    costBreakdown,
    kpiData
  }
}