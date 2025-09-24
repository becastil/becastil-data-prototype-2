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
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/70 dark:border-slate-700/50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Page Title Area - Will be populated by individual pages */}
        <div className="flex-1">
          {/* This space can be used for page titles, breadcrumbs, etc. */}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="User menu"
              >
                {userInitial}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-3 pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Authenticated User</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                    <LogoutButton className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!user && (
            <Link
              href="/auth/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
