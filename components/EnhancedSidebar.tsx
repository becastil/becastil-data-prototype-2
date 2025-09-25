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
        className="fixed left-4 top-4 z-50 rounded-lg border border-black/10 bg-white p-2 shadow-lg lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-black" />
      </button>

      {/* Mobile Overlay */}
      {state.isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => updateState({ isMobileOpen: false })}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full bg-white shadow-xl border-r border-black/10
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
    <div className="border-b border-black/10">
      {/* Brand and Controls */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white">
              <span className="text-sm font-bold text-black">HA</span>
            </div>
            <h1 className="text-lg font-semibold text-black">
              Healthcare Analytics
            </h1>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white">
            <span className="text-sm font-bold text-black">HA</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-1">
          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-black/60 hover:bg-black/5 hover:text-black lg:block transition-colors"
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
            className="rounded-lg p-2 text-black/60 hover:bg-black/5 hover:text-black lg:hidden transition-colors"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-black/20 bg-white pl-10 pr-4 py-2 text-sm placeholder-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-black/60">
            {group.label}
          </h2>
          {group.isCollapsible && (
            <button
              onClick={onToggle}
              className="rounded p-1 text-black/50 hover:bg-black/5 hover:text-black transition-colors"
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
        ${isActive ? 'bg-black/10 text-black' : 'text-black hover:bg-black/5'}
        ${isCollapsed ? 'justify-center' : ''}
        focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
      `}
      title={isCollapsed ? `${item.label}${item.description ? ` - ${item.description}` : ''}` : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={`
          flex-shrink-0 transition-colors duration-200
          ${isActive ? 'text-black' : 'text-black/60 group-hover:text-black'}
          ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'}
        `}
      />
      
      {!isCollapsed && (
        <span className="truncate">
          {item.label}
        </span>
      )}

      {/* Badge */}
      {item.badge && !isCollapsed && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-black/20 text-xs font-medium text-black">
          {item.badge}
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-black" />
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 hidden group-hover:block z-50">
          <div className="rounded-lg bg-black px-3 py-2 text-sm text-white shadow-lg whitespace-nowrap">
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-xs opacity-75 mt-1">{item.description}</div>
            )}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2">
              <div className="h-2 w-2 rotate-45 bg-black" />
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
    <div className="border-t border-black/10 p-4">
      {!isCollapsed ? (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <button className="flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 text-black hover:bg-black/5 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 text-black hover:bg-black/5 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full border border-black/10 bg-white flex items-center justify-center">
                <User className="h-4 w-4 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">
                  {user.email}
                </p>
                <p className="text-xs text-black/60 truncate">
                  Healthcare Professional
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-black/60 space-y-1">
              <p>Healthcare Analytics v1.0</p>
              <p>HIPAA Compliant Platform</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <button className="flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 text-black hover:bg-black/5 transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 text-black hover:bg-black/5 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
          {user && (
            <div className="h-8 w-8 rounded-full border border-black/10 bg-white flex items-center justify-center">
              <User className="h-4 w-4 text-black" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
