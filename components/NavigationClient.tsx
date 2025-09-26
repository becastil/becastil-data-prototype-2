'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import LogoutButton from './LogoutButton'
import ThemeToggle from './ThemeToggle'

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
    <header className="border-b bg-[var(--surface)] transition-colors duration-300 [border-color:var(--surface-border)]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Page Title Area - Will be populated by individual pages */}
        <div className="flex-1">
          {/* This space can be used for page titles, breadcrumbs, etc. */}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-black/5 hover:text-black [border-color:var(--surface-border)]"
                aria-label="User menu"
              >
                {userInitial}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-[var(--surface)] p-4 shadow-xl [border-color:var(--surface-border)]">
                  <div className="flex items-center gap-3 pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-[var(--surface)] text-sm font-semibold text-[var(--foreground)] [border-color:var(--surface-border)]">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{user.email}</p>
                      <p className="text-xs text-[var(--foreground)] opacity-70">Authenticated User</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 [border-color:var(--surface-border)]">
                    <LogoutButton className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!user && (
            <Link
              href="/auth/login"
              className="rounded-lg border bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-black/5 hover:text-black [border-color:var(--surface-border)]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
