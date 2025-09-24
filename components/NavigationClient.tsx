'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import LogoutButton from './LogoutButton'

interface NavigationClientProps {
  user: User | null
}

export default function NavigationClient({ user }: NavigationClientProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handler)
    }

    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [userMenuOpen])

  const userInitial = user?.email?.[0]?.toUpperCase()

  return (
    <header className="bg-white/90 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200/70 dark:border-slate-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Primary">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Healthcare Analytics
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload CSV
          </Link>
          
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5-1.5m-.5 1.5l-.5-1.5m.002-3H6.248m14.015 0l-3.76-14.967A.75.75 0 0015.747 1H8.253a.75.75 0 00-.742.633L3.751 16.6m14.015 0a.75.75 0 01-.742.633H6.976a.75.75 0 01-.742-.633" />
            </svg>
            View Report
          </Link>

          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                {userInitial}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.email}</p>
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <LogoutButton className="w-full rounded-md px-2 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-slate-800" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
