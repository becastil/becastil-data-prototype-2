'use client'

import { useState, useEffect } from 'react'
import { Layout, Grid } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import AntdSidebar from '@/components/sidebar/AntdSidebar'
import Navigation from '@/components/Navigation'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

interface MainLayoutProps {
  children: React.ReactNode
  user?: any
}

export default function MainLayout({ children, user }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const screens = useBreakpoint()

  // Auto-collapse on small screens
  useEffect(() => {
    if (screens.lg === false) {
      setCollapsed(true)
    } else {
      setCollapsed(false)
    }
  }, [screens.lg])

  const isMobile = !screens.lg

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={288} // 18rem equivalent
          collapsedWidth={80}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            zIndex: 1000,
          }}
          theme="light"
        >
          <AntdSidebar user={user} collapsed={collapsed} />
        </Sider>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 288,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 999,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            background: '#ffffff',
            borderBottom: '1px solid #f0f0f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MenuUnfoldOutlined style={{ fontSize: '16px' }} />
            </button>
          )}

          {/* Desktop collapse button */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: '16px' }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: '16px' }} />
              )}
            </button>
          )}

          <div className="flex-1">
            <Navigation 
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              user={user}
            />
          </div>

          {/* Pass mobile menu props to sidebar for mobile drawer */}
          <AntdSidebar 
            user={user} 
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </Header>

        <Content
          style={{
            padding: '24px',
            background: '#f8fafc',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}