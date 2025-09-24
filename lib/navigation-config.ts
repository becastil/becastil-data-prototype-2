/**
 * Navigation configuration for the application
 * Central place to manage all routes and their organization
 */

import { 
  LayoutDashboard, 
  FileBarChart, 
  FileText, 
  Wrench, 
  Upload, 
  Shield, 
  LineChart, 
  HelpCircle,
  BarChart3,
  Settings,
  type LucideIcon
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description?: string
  badge?: string
}

export interface NavigationGroup {
  id: string
  label: string
  items: NavigationItem[]
}

export const navigationConfig: NavigationGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Main dashboard with key metrics and insights'
      }
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics', 
    items: [
      {
        id: 'claims-analysis',
        label: 'Claims Analysis',
        href: '/reports/claims-analysis',
        icon: FileText,
        description: 'Analyze healthcare claims data with interactive tables'
      },
      {
        id: 'reports-dashboard',
        label: 'Reports Dashboard',
        href: '/reports/dashboard',
        icon: FileBarChart,
        description: 'Comprehensive reporting dashboard'
      },
      {
        id: 'healthcare-costs',
        label: 'Healthcare Costs',
        href: '/dashboards/healthcare-costs',
        icon: BarChart3,
        description: 'Healthcare cost analysis and trends'
      }
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      {
        id: 'csv-visualizer',
        label: 'CSV Visualizer',
        href: '/tools/csv-visualizer',
        icon: LineChart,
        description: 'Upload and visualize CSV data with AI insights'
      },
      {
        id: 'hcc-analysis',
        label: 'HCC Analysis',
        href: '/hcc',
        icon: Shield,
        description: 'Hierarchical Condition Category risk analysis'
      }
    ]
  },
  {
    id: 'data',
    label: 'Data Management',
    items: [
      {
        id: 'upload-center',
        label: 'Upload Center',
        href: '/upload',
        icon: Upload,
        description: 'Central hub for all data uploads and processing'
      }
    ]
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      {
        id: 'help',
        label: 'Help',
        href: '/help',
        icon: HelpCircle,
        description: 'Documentation and support resources'
      }
    ]
  }
]

/**
 * Get navigation item by href
 */
export function getNavigationItem(href: string): NavigationItem | undefined {
  for (const group of navigationConfig) {
    for (const item of group.items) {
      if (item.href === href) {
        return item
      }
    }
  }
  return undefined
}

/**
 * Check if path matches navigation item
 */
export function isActiveNavItem(pathname: string, href: string): boolean {
  if (href === '/dashboard' && pathname === '/') return true
  if (href === '/' && pathname === '/') return true
  return pathname.startsWith(href) && href !== '/'
}

/**
 * Get all navigation items as flat array
 */
export function getAllNavigationItems(): NavigationItem[] {
  return navigationConfig.flatMap(group => group.items)
}