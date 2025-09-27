'use client'

import { useState, ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'default',
  size = 'md'
}: TabNavigationProps) {
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-6 py-4'
  }

  const getTabClasses = (tab: Tab) => {
    const baseClasses = `
      relative inline-flex items-center gap-2 font-medium transition-all duration-200 ease-out
      ${sizeClasses[size]}
      ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `

    if (variant === 'pills') {
      return `${baseClasses} rounded-lg ${
        activeTab === tab.id
          ? 'bg-[var(--accent)] text-white shadow-md'
          : tab.disabled
          ? 'text-gray-400'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }

    if (variant === 'underline') {
      return `${baseClasses} border-b-2 ${
        activeTab === tab.id
          ? 'border-[var(--accent)] text-[var(--accent)]'
          : tab.disabled
          ? 'border-transparent text-gray-400'
          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
      }`
    }

    // Default variant
    return `${baseClasses} rounded-md ${
      activeTab === tab.id
        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20'
        : tab.disabled
        ? 'text-gray-400'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
    }`
  }

  return (
    <nav className={`flex items-center ${className}`} aria-label="Tabs">
      <div className={`flex ${
        variant === 'underline' ? 'border-b border-gray-200' : 'gap-1'
      }`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={getTabClasses(tab)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon && (
              <span className="flex-shrink-0">
                {tab.icon}
              </span>
            )}
            
            <span>{tab.label}</span>
            
            {tab.badge && (
              <span className={`
                inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full
                ${activeTab === tab.id && variant === 'pills'
                  ? 'bg-white/20 text-white'
                  : activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {tab.badge}
              </span>
            )}

            {/* Active indicator for underline variant */}
            {variant === 'underline' && activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}