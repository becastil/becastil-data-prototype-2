export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
}

export interface ClaimsTrendData {
  monthly: Array<{
    month: string
    totalAmount: number
    claimCount: number
    avgAmount: number
  }>
  serviceTypes: Array<{
    period: string
    inpatient: number
    outpatient: number
    pharmacy: number
    emergency: number
    specialty: number
  }>
}

export interface CostBreakdownData {
  serviceTypes: Array<{
    label: string
    value: number
    count: number
    color?: string
  }>
  topClaimants: Array<{
    claimantId: string
    totalAmount: number
    claimCount: number
  }>
}

export interface KPIData {
  totalClaims: {
    value: number
    change: number
    trend: number[]
  }
  totalAmount: {
    value: number
    change: number
    trend: number[]
  }
  avgClaimAmount: {
    value: number
    change: number
    trend: number[]
  }
  processingSuccessRate: {
    value: number
    change: number
    trend: number[]
  }
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'area'
  responsive: boolean
  maintainAspectRatio: boolean
  plugins: {
    legend: {
      display: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    tooltip: {
      enabled: boolean
      backgroundColor?: string
      titleColor?: string
      bodyColor?: string
    }
    accessibility?: {
      description: string
      announceNewData?: {
        enabled: boolean
      }
    }
  }
  scales?: {
    x?: {
      display: boolean
      grid?: {
        display: boolean
      }
      ticks?: {
        color?: string
      }
    }
    y?: {
      display: boolean
      grid?: {
        display: boolean
      }
      ticks?: {
        color?: string
        callback?: (value: any) => string
      }
    }
  }
  elements?: {
    line?: {
      tension: number
    }
    point?: {
      radius: number
      hoverRadius: number
    }
  }
}

export interface ChartTheme {
  name: string
  colors: {
    primary: string[]
    secondary: string[]
    background: string
    text: string
    grid: string
  }
  fonts: {
    default: string
    size: {
      title: number
      label: number
      tick: number
    }
  }
}

export interface PDFOptions {
  format: 'A4' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  margin: {
    top: string
    right: string
    bottom: string
    left: string
  }
  printBackground: boolean
  scale: number
  displayHeaderFooter: boolean
  headerTemplate?: string
  footerTemplate?: string
}

export interface ChartRenderOptions {
  width: number
  height: number
  devicePixelRatio: number
  backgroundColor: string
  theme: 'light' | 'dark'
  quality: 'low' | 'medium' | 'high'
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  charts: Array<{
    type: string
    title: string
    dataSource: string
    config: Partial<ChartConfig>
    layout: {
      width: number
      height: number
      x: number
      y: number
    }
  }>
  layout: {
    sections: Array<{
      title: string
      charts: string[]
      breakAfter?: boolean
    }>
  }
  styling: {
    theme: string
    headerLogo?: string
    footerText?: string
  }
}

export interface ChartExportOptions {
  format: 'png' | 'pdf' | 'svg'
  filename?: string
  quality?: number
  width?: number
  height?: number
}