'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface QuickActionItem {
  label: string
  description: string
  href: string
  icon: JSX.Element
}

const items: QuickActionItem[] = [
  {
    label: 'Upload claims data',
    description: 'Start a new CSV import with automated mapping',
    href: '/upload',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    label: 'Open dashboard',
    description: 'Review KPIs, stop-loss signals, and top claimants',
    href: '/dashboard',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Download sample data',
    description: 'Use our anonymized healthcare dataset to test features',
    href: '/sample-data/healthcare_cost_dummy_data.csv',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5l3.75-3.75m-3.75 3.75l-3.75-3.75M12 16.5V4.5m0 12l3.75-3.75M12 16.5l-3.75-3.75M18.75 16.5V18A2.25 2.25 0 0116.5 20.25H7.5A2.25 2.25 0 015.25 18v-1.5" />
      </svg>
    ),
  },
  {
    label: 'Help & resources',
    description: 'Guides, tutorials, and onboarding checklists',
    href: '/help',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19h.01M12 12a3 3 0 10-3-3" />
      </svg>
    ),
  },
]

export default function QuickActions() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!popoverRef.current) return
      if (popoverRef.current.contains(event.target as Node)) return
      setOpen(false)
    }

    if (open) {
      document.addEventListener('mousedown', handler)
    }

    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-400 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-200"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
        Quick actions
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Shortcuts</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Jump into the workflows you use most</p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-blue-50/80 dark:hover:bg-blue-900/30"
                  onClick={() => setOpen(false)}
                >
                  <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                    {item.icon}
                  </span>
                  <span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{item.description}</p>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
