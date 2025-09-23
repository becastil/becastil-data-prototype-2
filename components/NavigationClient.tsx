'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import LogoutButton from './LogoutButton'
import NotificationBell from './NotificationBell'
import QuickActions from './QuickActions'
import PreferencesTrigger from './PreferencesTrigger'

interface NavigationClientProps {
  user: User | null
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/upload', label: 'Upload' },
  { href: '/help', label: 'Help' },
]

export default function NavigationClient({ user }: NavigationClientProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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

  const renderLinks = (className?: string) => (
    navLinks.map((link) => {
      const isActive = pathname === link.href
      return (
        <Link
          key={link.href}
          href={link.href}
          className={
            className ??
            `text-sm font-medium transition hover:text-blue-500 ${
              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
            }`
          }
        >
          {link.label}
        </Link>
      )
    })
  )

  const userInitial = user?.email?.[0]?.toUpperCase()

  return (
    <header className="bg-white/90 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200/70 dark:border-slate-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Primary">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            HealthDash
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {renderLinks()}
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <QuickActions />
          <NotificationBell />
          <PreferencesTrigger />
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {userInitial}
                </span>
                <span className="hidden sm:block max-w-[160px] truncate">{user.email}</span>
                <span className="sr-only">Toggle user menu</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Connected</p>
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <Link
                      href="/dashboard"
                      className="block rounded-md px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      View Dashboard
                    </Link>
                    <div className="mt-1">
                      <PreferencesTrigger />
                    </div>
                    <LogoutButton className="mt-2 w-full rounded-md px-2 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-slate-800" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="rounded-full border border-blue-500 px-4 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <div className="flex flex-col gap-4">
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Activity</p>
                <NotificationBell />
              </div>
              <QuickActions />
              <PreferencesTrigger />
            </div>
            {renderLinks('text-sm font-medium text-slate-700 hover:text-blue-500 dark:text-slate-200')}
            {user ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{user.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Signed in</p>
                  </div>
                <LogoutButton className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" />
                </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
