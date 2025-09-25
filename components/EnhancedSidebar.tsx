'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Bell,
  User,
  Settings,
  Search
} from 'lucide-react'
import { navigationConfig, isActiveNavItem, type NavigationGroup, type NavigationItem } from '@/lib/navigation-config'

interface EnhancedSidebarProps {
  className?: string
  user?: any
}

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  expandedGroups: Set<string>
  searchQuery: string
}

export default function EnhancedSidebar({ className, user }: EnhancedSidebarProps) {
  const [state, setState] = useState<SidebarState>({
    isCollapsed: false,
    isMobileOpen: false,
    expandedGroups: new Set(['workflow']), // Default expanded workflow group
    searchQuery: ''
  })

  const pathname = usePathname()

  // Update state helper
  const updateState = useCallback((updates: Partial<SidebarState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Toggle functions
  const toggleCollapse = useCallback(() => {
    updateState({ isCollapsed: !state.isCollapsed })
  }, [state.isCollapsed, updateState])

  const toggleMobile = useCallback(() => {
    updateState({ isMobileOpen: !state.isMobileOpen })
  }, [state.isMobileOpen, updateState])

  const toggleGroup = useCallback((groupId: string) => {
    const newExpanded = new Set(state.expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    updateState({ expandedGroups: newExpanded })
  }, [state.expandedGroups, updateState])

  // Close mobile sidebar on route change
  useEffect(() => {
    updateState({ isMobileOpen: false })
  }, [pathname, updateState])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        updateState({ isMobileOpen: false })
      }
      
      // Keyboard shortcuts
      if (event.altKey && event.key === 's') {
        event.preventDefault()
        toggleCollapse()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleCollapse, updateState])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (state.isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [state.isMobileOpen])

  // Filter navigation based on search
  const filteredNavigation = navigationConfig.map(group => ({
    ...group,
    items: group.items.filter(item => 
      state.searchQuery === '' || 
      item.label.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0)

  const sidebarWidth = state.isCollapsed ? 'w-16' : 'w-72'
  const sidebarTransition = 'transition-all duration-300 ease-in-out'

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg border border-slate-200 lg:hidden dark:bg-slate-900 dark:border-slate-700"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </button>

      {/* Mobile Overlay */}
      {state.isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => updateState({ isMobileOpen: false })}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full bg-white shadow-xl border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800
          ${sidebarWidth} ${sidebarTransition}
          ${state.isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <SidebarHeader
          isCollapsed={state.isCollapsed}
          isMobile={state.isMobileOpen}
          onToggleCollapse={toggleCollapse}
          onCloseMobile={() => updateState({ isMobileOpen: false })}
          searchQuery={state.searchQuery}
          onSearchChange={(query) => updateState({ searchQuery: query })}
        />

        {/* Navigation Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {filteredNavigation.map((group) => (
              <NavigationGroup
                key={group.id}
                group={group}
                isCollapsed={state.isCollapsed}
                isExpanded={state.expandedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
                pathname={pathname}
              />
            ))}
          </nav>

          {/* Footer */}
          <SidebarFooter
            isCollapsed={state.isCollapsed}
            user={user}
          />
        </div>
      </aside>
    </>
  )
}

// Header Component
function SidebarHeader({ 
  isCollapsed, 
  isMobile, 
  onToggleCollapse, 
  onCloseMobile,
  searchQuery,
  onSearchChange
}: {
  isCollapsed: boolean
  isMobile: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      {/* Brand and Controls */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">HA</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Healthcare Analytics
            </h1>
          </div>
        )}
        
        {isCollapsed && (
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center mx-auto">
            <span className="text-white text-sm font-bold">HA</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-1">
          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:block dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Navigation Group Component
function NavigationGroup({
  group,
  isCollapsed,
  isExpanded,
  onToggle,
  pathname
}: {
  group: NavigationGroup
  isCollapsed: boolean
  isExpanded: boolean
  onToggle: () => void
  pathname: string
}) {
  const hasActiveItem = group.items.some(item => isActiveNavItem(pathname, item.href))

  return (
    <div className="space-y-2">
      {/* Group Header */}
      {!isCollapsed && (
        <div className="flex items-center justify-between">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {group.label}
          </h2>
          {group.isCollapsible && (
            <button
              onClick={onToggle}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.label} section`}
            >
              <ChevronRight className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      )}
      
      {/* Navigation Items */}
      {(!group.isCollapsible || isExpanded || hasActiveItem) && (
        <div className="space-y-1">
          {group.items.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              isActive={isActiveNavItem(pathname, item.href)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Navigation Item Component
function NavigationItem({ 
  item, 
  isCollapsed, 
  isActive 
}: { 
  item: NavigationItem
  isCollapsed: boolean
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`
        group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300' 
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }
        ${isCollapsed ? 'justify-center' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
      `}
      title={isCollapsed ? `${item.label}${item.description ? ` - ${item.description}` : ''}` : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`
        flex-shrink-0 transition-colors duration-200
        ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}
        ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'}
      `} />
      
      {!isCollapsed && (
        <span className="truncate">
          {item.label}
        </span>
      )}

      {/* Badge */}
      {item.badge && !isCollapsed && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {item.badge}
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400" />
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 hidden group-hover:block z-50">
          <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap">
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-xs opacity-75 mt-1">{item.description}</div>
            )}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2">
              <div className="h-2 w-2 rotate-45 bg-slate-900 dark:bg-slate-100" />
            </div>
          </div>
        </div>
      )}
    </Link>
  )
}

// Footer Component
function SidebarFooter({ 
  isCollapsed, 
  user 
}: { 
  isCollapsed: boolean
  user?: any
}) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-800 p-4">
      {!isCollapsed ? (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <button className="flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500 truncate dark:text-slate-400">
                  Healthcare Professional
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>Healthcare Analytics v1.0</p>
              <p>HIPAA Compliant Platform</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <button className="flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
          {user && (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
