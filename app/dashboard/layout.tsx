'use client'

import { FocusProvider } from '@/components/focus/FocusProvider'
import { AppStoreProvider } from '@/lib/store/AppStoreProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppStoreProvider>
      <FocusProvider>
        <div className="relative flex min-h-screen bg-white text-black">
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </FocusProvider>
    </AppStoreProvider>
  )
}
