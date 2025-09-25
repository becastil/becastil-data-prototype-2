/**
 * Enhanced navigation configuration for comprehensive site navigation
 * Central place to manage all routes and their organization
 */

import {
  Upload,
  FileText,
  Table,
  LineChart,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description?: string
  badge?: string | number
  isExternal?: boolean
}

export interface NavigationGroup {
  id: string
  label: string
  items: NavigationItem[]
  isCollapsible?: boolean
}

export const navigationConfig: NavigationGroup[] = [
  {
    id: 'workflow',
    label: 'Workflow',
    items: [
      {
        id: 'upload',
        label: 'Upload CSV',
        href: '/dashboard/upload',
        icon: Upload,
        description: 'Start by uploading your healthcare data CSV.'
      },
      {
        id: 'fees',
        label: 'Monthly Fees',
        href: '/dashboard/fees',
        icon: FileText,
        description: 'Enter administrative and stop loss fees by month.'
      },
      {
        id: 'summary-table',
        label: 'Summary Table',
        href: '/dashboard/table',
        icon: Table,
        description: 'Review aggregated monthly results.'
      },
      {
        id: 'charts',
        label: 'Charts',
        href: '/dashboard/charts',
        icon: LineChart,
        description: 'Visualize performance trends and KPIs.'
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
