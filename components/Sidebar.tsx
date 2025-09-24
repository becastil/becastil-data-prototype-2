'use client'

import { useState, useEffect } from 'react'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { navigationConfig } from '@/lib/navigation-config'
import SidebarItem from './SidebarItem'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileOpen(false)
      }
    }

    if (isMobileOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden dark:bg-slate-900"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full bg-white shadow-xl transition-all duration-300 dark:bg-slate-900
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Healthcare Analytics
            </h1>
          )}
          
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:block dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 px-4 pb-4">
          {navigationConfig.map((group) => (
            <div key={group.id} className="space-y-2">
              {!isCollapsed && (
                <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {group.label}
                </h2>
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          {!isCollapsed && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p>Healthcare Analytics v1.0</p>
              <p>HIPAA Compliant</p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}