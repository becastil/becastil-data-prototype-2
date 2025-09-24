/**
 * Enhanced navigation configuration for comprehensive site navigation
 * Central place to manage all routes and their organization
 */

import { 
  Home,
  LayoutDashboard, 
  FileBarChart, 
  FileText, 
  Upload, 
  Shield, 
  LineChart, 
  HelpCircle,
  BarChart3,
  Settings,
  LogIn,
  UserPlus,
  Lock,
  Heart,
  Lightbulb,
  Table,
  TrendingUp,
  type LucideIcon
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
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        icon: Home,
        description: 'Welcome page and getting started'
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Main dashboard with key metrics and insights'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    isCollapsible: true,
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: FileText,
        description: 'Main reports page with table and chart views'
      },
      {
        id: 'claims-analysis',
        label: 'Claims Analysis',
        href: '/reports/claims-analysis',
        icon: TrendingUp,
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
        icon: Heart,
        description: 'Healthcare cost analysis and trends'
      },
      {
        id: 'chart-testing',
        label: 'Chart Testing',
        href: '/charts/test',
        icon: BarChart3,
        description: 'Interactive chart testing and development'
      },
      {
        id: 'business-insights',
        label: 'Business Insights',
        href: '/insights/data-dashboards-for-business-success',
        icon: Lightbulb,
        description: 'Data dashboards for business success insights'
      }
    ]
  },
  {
    id: 'tools',
    label: 'Data Tools',
    items: [
      {
        id: 'upload-center',
        label: 'Upload Center',
        href: '/upload',
        icon: Upload,
        description: 'Central hub for all data uploads and processing'
      },
      {
        id: 'csv-visualizer',
        label: 'CSV Visualizer',
        href: '/tools/csv-visualizer',
        icon: Table,
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
    id: 'account',
    label: 'Account',
    items: [
      {
        id: 'login',
        label: 'Login',
        href: '/auth/login',
        icon: LogIn,
        description: 'Sign in to your account'
      },
      {
        id: 'signup',
        label: 'Sign Up',
        href: '/auth/signup',
        icon: UserPlus,
        description: 'Create a new account'
      }
    ]
  },
  {
    id: 'support',
    label: 'Support & Legal',
    items: [
      {
        id: 'help',
        label: 'Help',
        href: '/help',
        icon: HelpCircle,
        description: 'Documentation and support resources'
      },
      {
        id: 'privacy',
        label: 'Privacy Policy',
        href: '/privacy',
        icon: Lock,
        description: 'Privacy policy and data protection'
      },
      {
        id: 'terms',
        label: 'Terms of Service',
        href: '/terms',
        icon: FileText,
        description: 'Terms and conditions'
      },
      {
        id: 'security',
        label: 'Security',
        href: '/security',
        icon: Shield,
        description: 'Security information and guidelines'
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