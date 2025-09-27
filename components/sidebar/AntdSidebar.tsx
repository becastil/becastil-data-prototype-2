'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Drawer, Input, Avatar, Typography, Space, Divider, Button } from 'antd'
import {
  DashboardOutlined,
  CloudUploadOutlined,
  DollarOutlined,
  TableOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Title, Text } = Typography

interface AntdSidebarProps {
  user?: any
  collapsed?: boolean
  mobileMenuOpen?: boolean
  setMobileMenuOpen?: (open: boolean) => void
}

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem
}

export default function AntdSidebar({ 
  user, 
  collapsed = false, 
  mobileMenuOpen = false, 
  setMobileMenuOpen 
}: AntdSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')

  // Menu items configuration
  const menuItems: MenuItem[] = [
    getItem('Dashboard', '/dashboard', <DashboardOutlined />),
    getItem('Workflow', 'workflow', null, [
      getItem('Upload Data', '/dashboard/upload', <CloudUploadOutlined />),
      getItem('Configure Fees', '/dashboard/fees', <DollarOutlined />),
      getItem('Summary Table', '/dashboard/table', <TableOutlined />),
      getItem('Charts & Analytics', '/dashboard/charts', <BarChartOutlined />),
    ], 'group'),
  ]

  // Get current selected keys based on pathname
  const getSelectedKeys = () => {
    if (pathname === '/dashboard') return ['/dashboard']
    if (pathname.startsWith('/dashboard/upload')) return ['/dashboard/upload']
    if (pathname.startsWith('/dashboard/fees')) return ['/dashboard/fees']
    if (pathname.startsWith('/dashboard/table')) return ['/dashboard/table']
    if (pathname.startsWith('/dashboard/charts')) return ['/dashboard/charts']
    return [pathname]
  }

  const getOpenKeys = () => {
    if (pathname.startsWith('/dashboard/')) return ['workflow']
    return []
  }

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    router.push(e.key)
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout clicked')
  }

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        {!collapsed && (
          <div className="text-center">
            <Title level={4} style={{ margin: 0, color: '#06b6d4' }}>
              Healthcare Analytics
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              HIPAA Compliant Dashboard
            </Text>
          </div>
        )}
        {collapsed && (
          <div className="text-center">
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: '#06b6d4',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              H
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-4">
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            size="small"
          />
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
          }}
          inlineCollapsed={collapsed}
        />
      </div>

      {/* User Section */}
      <div className="border-t border-gray-100">
        {!collapsed && user && (
          <div className="p-4">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="flex items-center gap-3">
                <Avatar 
                  icon={<UserOutlined />} 
                  src={user.user_metadata?.avatar_url}
                  size="small"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  size="small"
                  style={{ padding: 0, width: 24, height: 24 }}
                />
              </div>
              
              <Divider style={{ margin: '8px 0' }} />
              
              <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  type="text" 
                  icon={<SettingOutlined />} 
                  size="small"
                  onClick={() => router.push('/settings')}
                >
                  Settings
                </Button>
                <Button 
                  type="text" 
                  icon={<LogoutOutlined />} 
                  size="small"
                  danger
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Space>
            </Space>
          </div>
        )}
        
        {collapsed && user && (
          <div className="p-2 text-center">
            <Space direction="vertical" size="small">
              <Avatar 
                icon={<UserOutlined />} 
                src={user.user_metadata?.avatar_url}
                size="small"
              />
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                size="small"
                style={{ padding: 0, width: 24, height: 24 }}
                onClick={() => router.push('/settings')}
              />
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                size="small"
                danger
                style={{ padding: 0, width: 24, height: 24 }}
                onClick={handleLogout}
              />
            </Space>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar Content */}
      <div className="hidden lg:block h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Navigation"
        placement="left"
        onClose={() => setMobileMenuOpen?.(false)}
        open={mobileMenuOpen}
        bodyStyle={{ padding: 0 }}
        width={288}
        className="lg:hidden"
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}