// Accessibility utilities for healthcare charts following WCAG 2.2 AA guidelines

import { ChartConfig } from '@/types/charts'

// Color contrast ratios for WCAG 2.2 AA compliance
export const WCAG_CONTRAST_RATIOS = {
  normal: 4.5,     // For normal text
  large: 3.0,      // For large text (18pt+ or 14pt+ bold)
  graphical: 3.0   // For graphical objects and UI components
}

// WCAG 2.2 AA compliant color palettes
export const ACCESSIBLE_COLORS = {
  // High contrast colors for different chart elements
  primary: [
    '#1f2937', // Gray 800 - Very dark gray
    '#dc2626', // Red 600 - Strong red
    '#059669', // Emerald 600 - Strong green
    '#d97706', // Amber 600 - Strong orange
    '#7c3aed', // Violet 600 - Strong purple
    '#0891b2', // Cyan 600 - Strong cyan
  ],
  
  // Background colors with sufficient contrast
  backgrounds: {
    light: '#ffffff', // White
    dark: '#111827',  // Gray 900
    muted: '#f9fafb'  // Gray 50
  },
  
  // Text colors for different backgrounds
  text: {
    onLight: '#111827',  // Gray 900 on light backgrounds
    onDark: '#f9fafb',   // Gray 50 on dark backgrounds
    muted: '#6b7280'     // Gray 500 for secondary text
  },
  
  // Status colors with high contrast
  status: {
    success: '#059669',  // Emerald 600
    warning: '#d97706',  // Amber 600
    error: '#dc2626',    // Red 600
    info: '#2563eb'      // Blue 600
  }
}

// Chart accessibility configuration following healthcare requirements
export function createAccessibleChartConfig(
  baseConfig: ChartConfig,
  options: {
    title: string
    description: string
    dataDescription?: string
    chartType: string
    highContrast?: boolean
  }
): ChartConfig {
  const { title, description, dataDescription, chartType, highContrast = false } = options

  // Enhanced accessibility configuration
  const accessibleConfig: ChartConfig = {
    ...baseConfig,
    plugins: {
      ...baseConfig.plugins,
      accessibility: {
        description: `${title}. ${description}. ${dataDescription || ''}`,
        announceNewData: {
          enabled: true
        }
      },
      legend: {
        ...baseConfig.plugins?.legend,
        display: true,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: highContrast ? 16 : 14,
            weight: 'bold'
          },
          color: highContrast ? ACCESSIBLE_COLORS.text.onLight : undefined
        }
      },
      tooltip: {
        ...baseConfig.plugins?.tooltip,
        enabled: true,
        backgroundColor: highContrast ? '#000000' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: highContrast ? ACCESSIBLE_COLORS.primary[0] : undefined,
        borderWidth: highContrast ? 2 : 1,
        titleFont: {
          size: highContrast ? 16 : 14,
          weight: 'bold'
        },
        bodyFont: {
          size: highContrast ? 14 : 12
        },
        padding: highContrast ? 12 : 8
      }
    }
  }

  // Enhanced scale configuration for accessibility
  if (accessibleConfig.scales) {
    if (accessibleConfig.scales.x) {
      accessibleConfig.scales.x = {
        ...accessibleConfig.scales.x,
        title: {
          display: true,
          text: getAxisTitle(chartType, 'x'),
          color: highContrast ? ACCESSIBLE_COLORS.text.onLight : ACCESSIBLE_COLORS.text.muted,
          font: {
            size: highContrast ? 16 : 14,
            weight: 'bold'
          }
        },
        ticks: {
          ...accessibleConfig.scales.x.ticks,
          color: highContrast ? ACCESSIBLE_COLORS.text.onLight : ACCESSIBLE_COLORS.text.muted,
          font: {
            size: highContrast ? 14 : 12
          }
        },
        grid: {
          ...accessibleConfig.scales.x.grid,
          color: highContrast ? ACCESSIBLE_COLORS.text.muted : '#e5e7eb',
          lineWidth: highContrast ? 2 : 1
        }
      }
    }

    if (accessibleConfig.scales.y) {
      accessibleConfig.scales.y = {
        ...accessibleConfig.scales.y,
        title: {
          display: true,
          text: getAxisTitle(chartType, 'y'),
          color: highContrast ? ACCESSIBLE_COLORS.text.onLight : ACCESSIBLE_COLORS.text.muted,
          font: {
            size: highContrast ? 16 : 14,
            weight: 'bold'
          }
        },
        ticks: {
          ...accessibleConfig.scales.y.ticks,
          color: highContrast ? ACCESSIBLE_COLORS.text.onLight : ACCESSIBLE_COLORS.text.muted,
          font: {
            size: highContrast ? 14 : 12
          }
        },
        grid: {
          ...accessibleConfig.scales.y.grid,
          color: highContrast ? ACCESSIBLE_COLORS.text.muted : '#e5e7eb',
          lineWidth: highContrast ? 2 : 1
        }
      }
    }
  }

  return accessibleConfig
}

// Generate accessible data labels for screen readers
export function generateDataDescription(data: any, chartType: string): string {
  if (!data || !data.datasets || data.datasets.length === 0) {
    return 'No data available for this chart.'
  }

  const dataset = data.datasets[0]
  const labels = data.labels || []
  const values = dataset.data || []

  switch (chartType) {
    case 'claims-trend':
      const trendDirection = getTrendDirection(values)
      const totalClaims = values.reduce((sum: number, val: number) => sum + val, 0)
      return `Claims trend chart showing ${labels.length} time periods. Total claims amount: $${totalClaims.toLocaleString()}. Overall trend: ${trendDirection}.`

    case 'service-breakdown':
      const total = values.reduce((sum: number, val: number) => sum + val, 0)
      const topCategory = labels[values.indexOf(Math.max(...values))]
      return `Service breakdown pie chart with ${labels.length} categories. Total amount: $${total.toLocaleString()}. Largest category: ${topCategory} at ${((Math.max(...values) / total) * 100).toFixed(1)}%.`

    case 'top-claimants':
      const topClaimant = labels[0]
      const topAmount = values[0]
      return `Top claimants bar chart showing ${labels.length} claimants. Highest cost claimant: ${topClaimant} with $${topAmount.toLocaleString()}.`

    default:
      return `Chart displaying ${labels.length} data points across ${data.datasets.length} data series.`
  }
}

// Get appropriate axis titles based on chart type
function getAxisTitle(chartType: string, axis: 'x' | 'y'): string {
  const titles = {
    'claims-trend': {
      x: 'Time Period',
      y: 'Claims Amount ($)'
    },
    'service-breakdown': {
      x: 'Service Type',
      y: 'Amount ($)'
    },
    'top-claimants': {
      x: 'Claimant ID',
      y: 'Total Cost ($)'
    },
    'monthly-comparison': {
      x: 'Month',
      y: 'Claims Amount ($)'
    }
  }

  return titles[chartType as keyof typeof titles]?.[axis] || (axis === 'x' ? 'Category' : 'Value')
}

// Determine trend direction for accessibility description
function getTrendDirection(values: number[]): string {
  if (values.length < 2) return 'insufficient data'
  
  const first = values[0]
  const last = values[values.length - 1]
  const change = ((last - first) / first) * 100

  if (Math.abs(change) < 5) return 'stable'
  return change > 0 ? 'increasing' : 'decreasing'
}

// Generate keyboard navigation instructions
export function generateKeyboardInstructions(chartType: string): string {
  const baseInstructions = 'Use Tab to navigate between chart elements. Press Enter to activate interactive elements.'
  
  const specificInstructions = {
    'claims-trend': 'Use arrow keys to navigate between data points. Press Space to hear data values.',
    'service-breakdown': 'Use arrow keys to navigate between segments. Press Space to hear percentage values.',
    'top-claimants': 'Use arrow keys to navigate between bars. Press Space to hear claimant details.',
    'monthly-comparison': 'Use arrow keys to navigate between months. Press Space to hear monthly totals.'
  }

  return `${baseInstructions} ${specificInstructions[chartType as keyof typeof specificInstructions] || ''}`
}

// Create ARIA-compliant data table for complex charts
export function createAccessibleDataTable(data: any, chartType: string): string {
  if (!data || !data.datasets || data.datasets.length === 0) {
    return '<p>No data available for table representation.</p>'
  }

  const labels = data.labels || []
  const datasets = data.datasets

  // Generate table header
  const headers = ['Category', ...datasets.map((ds: any) => ds.label || 'Value')]
  const headerRow = `<tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr>`

  // Generate table rows
  const dataRows = labels.map((label: string, index: number) => {
    const cells = [
      `<th scope="row">${label}</th>`,
      ...datasets.map((ds: any) => {
        const value = ds.data[index]
        const formattedValue = typeof value === 'number' 
          ? chartType.includes('trend') || chartType.includes('claimants') 
            ? `$${value.toLocaleString()}`
            : value.toLocaleString()
          : value
        return `<td>${formattedValue}</td>`
      })
    ]
    return `<tr>${cells.join('')}</tr>`
  }).join('')

  return `
    <table role="table" aria-label="Data table for ${chartType} chart">
      <caption>Accessible data representation of the chart above</caption>
      <thead>${headerRow}</thead>
      <tbody>${dataRows}</tbody>
    </table>
  `
}

// Color blind friendly palette validator
export function validateColorBlindAccessibility(colors: string[]): {
  isAccessible: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []

  // Check for problematic color combinations
  const problematicCombinations = [
    { colors: ['red', 'green'], issue: 'Red-green color blindness' },
    { colors: ['blue', 'purple'], issue: 'Blue-purple confusion' },
    { colors: ['green', 'brown'], issue: 'Green-brown confusion' }
  ]

  // Simple color analysis (in real implementation, would use more sophisticated color analysis)
  const hasRedGreen = colors.some(c => c.includes('red') || c.includes('#dc') || c.includes('#ef')) &&
                     colors.some(c => c.includes('green') || c.includes('#059') || c.includes('#10'))

  if (hasRedGreen) {
    issues.push('Potential red-green color blindness accessibility issue')
    recommendations.push('Add patterns or shapes to differentiate data series')
    recommendations.push('Ensure sufficient brightness contrast between colors')
  }

  // Check color count
  if (colors.length > 6) {
    issues.push('Too many colors may reduce accessibility')
    recommendations.push('Consider grouping data or using a more limited color palette')
  }

  return {
    isAccessible: issues.length === 0,
    issues,
    recommendations
  }
}

// ARIA live region announcer for dynamic chart updates
export class ChartAccessibilityAnnouncer {
  private liveRegion: HTMLElement | null = null

  constructor() {
    this.createLiveRegion()
  }

  private createLiveRegion(): void {
    if (typeof document !== 'undefined') {
      this.liveRegion = document.createElement('div')
      this.liveRegion.setAttribute('aria-live', 'polite')
      this.liveRegion.setAttribute('aria-atomic', 'true')
      this.liveRegion.className = 'sr-only'
      this.liveRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `
      document.body.appendChild(this.liveRegion)
    }
  }

  announceChartUpdate(message: string): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = message
      
      // Clear after announcement to allow repeated announcements
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = ''
        }
      }, 1000)
    }
  }

  announceDataChange(chartType: string, newDataCount: number): void {
    const message = `Chart updated. ${chartType} now displays ${newDataCount} data points.`
    this.announceChartUpdate(message)
  }

  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion)
      this.liveRegion = null
    }
  }
}

// Screen reader optimized chart descriptions
export function generateScreenReaderDescription(
  title: string,
  chartType: string,
  data: any,
  summary?: string
): string {
  const dataDesc = generateDataDescription(data, chartType)
  const keyboardInstr = generateKeyboardInstructions(chartType)
  
  return `
    ${title}. ${chartType} chart. ${dataDesc}
    ${summary ? ` Summary: ${summary}` : ''}
    Navigation: ${keyboardInstr}
  `.trim().replace(/\s+/g, ' ')
}