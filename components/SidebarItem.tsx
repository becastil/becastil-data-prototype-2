'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isActiveNavItem, type NavigationItem } from '@/lib/navigation-config'

interface SidebarItemProps {
  item: NavigationItem
  isCollapsed?: boolean
}

export default function SidebarItem({ item, isCollapsed = false }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = isActiveNavItem(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`
        group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' 
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className={`
        flex-shrink-0 transition-colors duration-200
        ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}
        ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'}
      `} />
      
      {!isCollapsed && (
        <span className="truncate text-sm font-medium">
          {item.label}
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400" />
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 hidden group-hover:block">
          <div className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2">
              <div className="h-2 w-2 rotate-45 bg-slate-900 dark:bg-slate-100" />
            </div>
          </div>
        </div>
      )}

      {/* Badge */}
      {item.badge && !isCollapsed && (
        <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {item.badge}
        </span>
      )}
    </Link>
  )
}