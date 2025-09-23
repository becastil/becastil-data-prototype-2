'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type NotificationVariant = 'success' | 'error' | 'info' | 'warning'

type NotificationStatus = 'unread' | 'read'

export interface NotificationItem {
  id: string
  title: string
  message?: string
  variant: NotificationVariant
  createdAt: string
  status: NotificationStatus
}

interface AddNotificationOptions {
  title: string
  message?: string
  variant?: NotificationVariant
  autoDismissMs?: number
  persistent?: boolean
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (options: AddNotificationOptions) => string
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  markAllAsRead: () => void
}

interface NotificationProviderProps {
  children: React.ReactNode
}

interface ToastItem extends NotificationItem {
  expireAt?: number
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function NotificationToasts({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-80 rounded-xl border px-4 py-3 shadow-lg transition-all ${getToastStyles(toast.variant)}`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${getToastIconStyles(toast.variant)}`}>
              {getToastIcon(toast.variant)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="-mr-1 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function getToastStyles(variant: NotificationVariant) {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50/95 dark:border-green-800 dark:bg-green-950/80'
    case 'error':
      return 'border-red-200 bg-red-50/95 dark:border-red-800 dark:bg-red-950/80'
    case 'warning':
      return 'border-amber-200 bg-amber-50/95 dark:border-amber-700 dark:bg-amber-950/80'
    default:
      return 'border-blue-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/85'
  }
}

function getToastIconStyles(variant: NotificationVariant) {
  switch (variant) {
    case 'success':
      return 'bg-green-600 text-white'
    case 'error':
      return 'bg-red-600 text-white'
    case 'warning':
      return 'bg-amber-500 text-white'
    default:
      return 'bg-blue-600 text-white'
  }
}

function getToastIcon(variant: NotificationVariant) {
  switch (variant) {
    case 'success':
      return '✓'
    case 'error':
      return '!'
    case 'warning':
      return '⚠'
    default:
      return 'ℹ'
  }
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const unreadCount = useMemo(
    () => notifications.reduce((count, notification) => (notification.status === 'unread' ? count + 1 : count), 0),
    [notifications]
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addNotification = useCallback(
    ({ title, message, variant = 'info', autoDismissMs = 5000, persistent = false }: AddNotificationOptions) => {
      const id = generateId()
      const createdAt = new Date().toISOString()
      const notification: NotificationItem = {
        id,
        title,
        message,
        variant,
        createdAt,
        status: 'unread',
      }

      setNotifications((prev) => [notification, ...prev].slice(0, 50))

      setToasts((prev) => [...prev, notification])

      if (!persistent && autoDismissMs > 0 && typeof window !== 'undefined') {
        window.setTimeout(() => removeToast(id), autoDismissMs)
      }

      return id
    },
    [removeToast]
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, status: 'read' } : notification
      )
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    removeToast(id)
  }, [removeToast])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, status: 'read' })))
  }, [])

  const contextValue = useMemo(
    () => ({ notifications, unreadCount, addNotification, markAsRead, removeNotification, markAllAsRead }),
    [notifications, unreadCount, addNotification, markAsRead, removeNotification, markAllAsRead]
  )

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationToasts toasts={toasts} onDismiss={removeToast} />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
