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
        ${isActive ? 'bg-black/10 text-black' : 'text-black hover:bg-black/5'}
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon
        className={`
          flex-shrink-0 transition-colors duration-200
          ${isActive ? 'text-black' : 'text-black/60 group-hover:text-black'}
          ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'}
        `}
      />
      
      {!isCollapsed && (
        <span className="truncate text-sm font-medium">
          {item.label}
        </span>
      )}

      {/* Active indicator */}
      {isActive && <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-black" />}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 hidden group-hover:block">
          <div className="rounded-md bg-black px-2 py-1 text-xs text-white shadow-lg">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2">
              <div className="h-2 w-2 rotate-45 bg-black" />
            </div>
          </div>
        </div>
      )}

      {/* Badge */}
      {item.badge && !isCollapsed && (
        <span className="ml-auto rounded-full border border-black/20 px-2 py-0.5 text-xs font-medium text-black">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
