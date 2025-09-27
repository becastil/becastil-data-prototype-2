import type { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#06b6d4', // Cyan primary
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // Background colors
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBgElevated: '#ffffff',
    
    // Border and divider
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    
    // Text colors
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    colorTextQuaternary: '#cbd5e1',
    
    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    
    // Font
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // Line height
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,
    
    // Control
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    controlHeightXS: 24,
    
    // Box shadow
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    boxShadowTertiary: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      siderBg: '#ffffff',
      bodyBg: '#f8fafc',
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e0f2fe',
      itemSelectedColor: '#0891b2',
      itemHoverBg: '#f0f9ff',
      itemHoverColor: '#0891b2',
      iconSize: 16,
      fontSize: 14,
    },
    Card: {
      headerBg: 'transparent',
      actionsBg: 'transparent',
      paddingLG: 24,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      paddingContentHorizontal: 16,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
      paddingInline: 12,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#f8fafc',
      headerColor: '#475569',
      rowHoverBg: '#f8fafc',
    },
    Form: {
      labelRequiredMarkColor: '#ef4444',
      labelColor: '#374151',
      itemMarginBottom: 24,
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
  },
}

export const darkTheme: ThemeConfig = {
  ...lightTheme,
  algorithm: 'darkAlgorithm' as any,
  token: {
    ...lightTheme.token,
    // Background colors for dark mode
    colorBgContainer: '#1e293b',
    colorBgLayout: '#0f172a',
    colorBgElevated: '#1e293b',
    
    // Text colors for dark mode
    colorText: '#f1f5f9',
    colorTextSecondary: '#cbd5e1',
    colorTextTertiary: '#94a3b8',
    colorTextQuaternary: '#64748b',
    
    // Border colors for dark mode
    colorBorder: '#334155',
    colorBorderSecondary: '#475569',
  },
  components: {
    ...lightTheme.components,
    Layout: {
      ...lightTheme.components?.Layout,
      headerBg: '#1e293b',
      siderBg: '#1e293b',
      bodyBg: '#0f172a',
    },
    Menu: {
      ...lightTheme.components?.Menu,
      itemBg: 'transparent',
      itemSelectedBg: '#0f172a',
      itemSelectedColor: '#06b6d4',
      itemHoverBg: '#334155',
      itemHoverColor: '#06b6d4',
    },
    Table: {
      ...lightTheme.components?.Table,
      headerBg: '#334155',
      headerColor: '#e2e8f0',
      rowHoverBg: '#334155',
    },
  },
}

// Responsive breakpoints
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

export type BreakpointKey = keyof typeof breakpoints