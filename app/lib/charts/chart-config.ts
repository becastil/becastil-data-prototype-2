import { ChartConfig, ChartTheme } from '@/app/types/charts'

// Healthcare-specific color palettes (WCAG 2.2 AA compliant)
export const HEALTHCARE_THEMES: Record<string, ChartTheme> = {
  professional: {
    name: 'Professional',
    colors: {
      primary: [
        '#2563eb', // Blue 600
        '#dc2626', // Red 600
        '#059669', // Emerald 600
        '#d97706', // Amber 600
        '#7c3aed', // Violet 600
        '#db2777', // Pink 600
        '#0891b2', // Cyan 600
        '#65a30d'  // Lime 600
      ],
      secondary: [
        '#3b82f6', // Blue 500
        '#ef4444', // Red 500
        '#10b981', // Emerald 500
        '#f59e0b', // Amber 500
        '#8b5cf6', // Violet 500
        '#ec4899', // Pink 500
        '#06b6d4', // Cyan 500
        '#84cc16'  // Lime 500
      ],
      background: '#ffffff',
      text: '#1f2937',
      grid: '#e5e7eb'
    },
    fonts: {
      default: 'Inter, system-ui, sans-serif',
      size: {
        title: 16,
        label: 14,
        tick: 12
      }
    }
  },
  accessible: {
    name: 'High Contrast',
    colors: {
      primary: [
        '#1f2937', // Gray 800
        '#dc2626', // Red 600
        '#059669', // Emerald 600
        '#d97706', // Amber 600
        '#7c3aed', // Violet 600
        '#0891b2', // Cyan 600
      ],
      secondary: [
        '#374151', // Gray 700
        '#ef4444', // Red 500
        '#10b981', // Emerald 500
        '#f59e0b', // Amber 500
        '#8b5cf6', // Violet 500
        '#06b6d4', // Cyan 500
      ],
      background: '#ffffff',
      text: '#000000',
      grid: '#6b7280'
    },
    fonts: {
      default: 'Inter, system-ui, sans-serif',
      size: {
        title: 18,
        label: 16,
        tick: 14
      }
    }
  },
  dark: {
    name: 'Dark Mode',
    colors: {
      primary: [
        '#60a5fa', // Blue 400
        '#f87171', // Red 400
        '#34d399', // Emerald 400
        '#fbbf24', // Amber 400
        '#a78bfa', // Violet 400
        '#f472b6', // Pink 400
        '#22d3ee', // Cyan 400
        '#a3e635'  // Lime 400
      ],
      secondary: [
        '#93c5fd', // Blue 300
        '#fca5a5', // Red 300
        '#6ee7b7', // Emerald 300
        '#fcd34d', // Amber 300
        '#c4b5fd', // Violet 300
        '#f9a8d4', // Pink 300
        '#67e8f9', // Cyan 300
        '#bef264'  // Lime 300
      ],
      background: '#1f2937',
      text: '#f9fafb',
      grid: '#374151'
    },
    fonts: {
      default: 'Inter, system-ui, sans-serif',
      size: {
        title: 16,
        label: 14,
        tick: 12
      }
    }
  }
}

// Base configuration following the 5-second rule from the business requirements
export const BASE_CHART_CONFIG: ChartConfig = {
  type: 'line',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff'
    },
    accessibility: {
      description: 'Healthcare analytics chart',
      announceNewData: {
        enabled: true
      }
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false
      },
      ticks: {
        color: '#6b7280'
      }
    },
    y: {
      display: true,
      grid: {
        display: true
      },
      ticks: {
        color: '#6b7280',
        callback: function(value: any) {
          if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact'
            }).format(value)
          }
          return value
        }
      }
    }
  },
  elements: {
    line: {
      tension: 0.4
    },
    point: {
      radius: 4,
      hoverRadius: 6
    }
  }
}

// Claims trend chart configuration
export const CLAIMS_TREND_CONFIG: ChartConfig = {
  ...BASE_CHART_CONFIG,
  type: 'line',
  plugins: {
    ...BASE_CHART_CONFIG.plugins,
    accessibility: {
      description: 'Claims trend analysis showing monthly healthcare costs and claim volumes over time'
    }
  },
  scales: {
    ...BASE_CHART_CONFIG.scales,
    y: {
      ...BASE_CHART_CONFIG.scales?.y,
      ticks: {
        ...BASE_CHART_CONFIG.scales?.y?.ticks,
        callback: function(value: any) {
          if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(value)
          }
          return value
        }
      }
    }
  }
}

// Cost breakdown chart configuration
export const COST_BREAKDOWN_CONFIG: ChartConfig = {
  ...BASE_CHART_CONFIG,
  type: 'doughnut',
  plugins: {
    ...BASE_CHART_CONFIG.plugins,
    legend: {
      display: true,
      position: 'right'
    },
    accessibility: {
      description: 'Cost breakdown by service type showing distribution of healthcare spending'
    }
  },
  scales: undefined // Doughnut charts don't use scales
}

// KPI chart configuration for small sparklines
export const KPI_SPARKLINE_CONFIG: ChartConfig = {
  type: 'line',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    },
    accessibility: {
      description: 'KPI trend sparkline'
    }
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false
      }
    },
    y: {
      display: false,
      grid: {
        display: false
      }
    }
  },
  elements: {
    line: {
      tension: 0.4
    },
    point: {
      radius: 0,
      hoverRadius: 0
    }
  }
}

// Bar chart for comparisons
export const COMPARISON_BAR_CONFIG: ChartConfig = {
  ...BASE_CHART_CONFIG,
  type: 'bar',
  plugins: {
    ...BASE_CHART_CONFIG.plugins,
    accessibility: {
      description: 'Comparative analysis chart showing ranked healthcare metrics'
    }
  },
  scales: {
    ...BASE_CHART_CONFIG.scales,
    x: {
      ...BASE_CHART_CONFIG.scales?.x,
      grid: {
        display: false
      }
    },
    y: {
      ...BASE_CHART_CONFIG.scales?.y,
      grid: {
        display: true
      }
    }
  }
}

// PDF-optimized configurations
export const PDF_CHART_CONFIG: Partial<ChartConfig> = {
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      enabled: false // Tooltips not needed in static PDFs
    }
  },
  elements: {
    point: {
      radius: 3,
      hoverRadius: 3
    }
  }
}

// Function to merge configurations with theme
export function createChartConfig(
  baseConfig: ChartConfig,
  theme: ChartTheme,
  overrides: Partial<ChartConfig> = {}
): ChartConfig {
  const config = JSON.parse(JSON.stringify(baseConfig)) // Deep clone
  
  // Apply theme colors and fonts
  if (config.scales?.x?.ticks) {
    config.scales.x.ticks.color = theme.colors.text
  }
  if (config.scales?.y?.ticks) {
    config.scales.y.ticks.color = theme.colors.text
  }
  if (config.scales?.y?.grid) {
    config.scales.y.grid.color = theme.colors.grid
  }
  
  // Apply overrides
  return {
    ...config,
    ...overrides,
    plugins: {
      ...config.plugins,
      ...overrides.plugins
    },
    scales: {
      ...config.scales,
      ...overrides.scales
    }
  }
}

// Utility function to format currency for charts
export function formatCurrency(value: number, compact = true): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2
  }).format(value)
}

// Utility function to format numbers for charts
export function formatNumber(value: number, compact = true): string {
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value)
}