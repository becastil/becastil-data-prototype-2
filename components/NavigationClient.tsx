'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import LogoutButton from './LogoutButton'
import ThemeToggle from './ThemeToggle'
import { Space, Avatar, Dropdown, Button } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface NavigationClientProps {
  user: User | null
  mobileMenuOpen?: boolean
  setMobileMenuOpen?: (open: boolean) => void
}

export default function NavigationClient({ user, mobileMenuOpen, setMobileMenuOpen }: NavigationClientProps) {
  const pathname = usePathname()
  const userInitial = user?.email?.[0]?.toUpperCase()

  // User dropdown menu items
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="px-2 py-1">
          <div className="text-sm font-medium">{user?.email}</div>
          <div className="text-xs text-gray-500">Authenticated User</div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <LogoutButton className="text-red-600 hover:text-red-700" />
      ),
      icon: <LogoutOutlined />,
    },
  ]

  return (
    <div className="flex items-center justify-between w-full">
      {/* Page Title Area - Will be populated by individual pages */}
      <div className="flex-1">
        {/* This space can be used for page titles, breadcrumbs, etc. */}
      </div>

      {/* Right side actions */}
      <Space>
        <ThemeToggle />
        {user ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar
              style={{ 
                backgroundColor: '#06b6d4', 
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
              icon={userInitial ? undefined : <UserOutlined />}
            >
              {userInitial}
            </Avatar>
          </Dropdown>
        ) : (
          <Link href="/auth/login">
            <Button type="default">
              Sign In
            </Button>
          </Link>
        )}
      </Space>
    </div>
  )
}
