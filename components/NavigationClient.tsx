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
            href="/reports/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625a1.125 1.125 0 001.125-1.125m-1.125 1.125h-1.5A1.125 1.125 0 0118 18.375m3.75 0v-12.75m0 12.75v-1.5c0-.621-.504-1.125-1.125-1.125M18.375 5.625v1.5c0 .621-.504 1.125-1.125 1.125s-1.125-.504-1.125-1.125v-1.5m1.125 0H18m.375 0h1.125m-1.125 0V5.625m0 0c0-.621.504-1.125 1.125-1.125M16.5 7.5V6.375c0-.621.504-1.125 1.125-1.125h1.125m-1.125 1.125c0 .621-.504 1.125-1.125 1.125H16.5V7.5" />
            </svg>
            Dashboard
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
