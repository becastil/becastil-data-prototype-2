'use client'

import { FocusToggleButton } from '@/components/focus/FocusProvider'

export default function TopBar() {
  return (
    <header className="h-16 border-b border-white/6 bg-[var(--background-elevated)]/80 backdrop-blur-lg">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left - Brand and Environment */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
              <span className="text-sm font-bold text-white">H</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Healthcare Analytics</h1>
              <p className="text-xs text-gray-400">v1.0 Enterprise</p>
            </div>
          </div>
          
          {/* HIPAA Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-medium text-emerald-400">HIPAA Compliant</span>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <FocusToggleButton className="btn-premium btn-premium--secondary text-sm" />
        </div>
      </div>
    </header>
  )
}