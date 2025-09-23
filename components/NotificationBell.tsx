'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useNotifications, NotificationItem } from './NotificationProvider'

dayjs.extend(relativeTime)

export default function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, removeNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current) return
      if (panelRef.current.contains(event.target as Node)) return
      setOpen(false)
    }

    if (open) {
      document.addEventListener('mousedown', handleClick)
    }

    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllAsRead()
    }
  }, [open, unreadCount, markAllAsRead])

  const hasNotifications = notifications.length > 0
  const recentNotifications = useMemo(() => notifications.slice(0, 10), [notifications])

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 17h5l-1.405-1.405A2.032 2.032 0 0117 14.158V11a5 5 0 00-9.33-2.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 17h9m-7 0v1a3 3 0 006 0v-1"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest activity and system updates</p>
            </div>
            {hasNotifications && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  markAllAsRead()
                }}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {hasNotifications ? (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDismiss={removeNotification}
                  />
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationRow({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: NotificationItem
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const { id, title, message, variant, createdAt, status } = notification

  return (
    <li className={`flex items-start gap-3 px-4 py-3 ${status === 'unread' ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}>
      <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getIndicatorStyles(variant)}`}>
        {getIndicatorIcon(variant)}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        {message && <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{message}</p>}
        <button
          type="button"
          onClick={() => onMarkRead(id)}
          className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
        >
          Mark read
        </button>
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {dayjs(createdAt).fromNow()}
        </span>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-xs text-slate-400 transition hover:text-red-500"
        >
          Dismiss
        </button>
      </div>
    </li>
  )
}

function getIndicatorStyles(variant: NotificationItem['variant']) {
  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    case 'error':
      return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    case 'warning':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  }
}

function getIndicatorIcon(variant: NotificationItem['variant']) {
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
