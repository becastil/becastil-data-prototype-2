'use client'

import { AppStoreProvider } from '@/lib/store/AppStoreProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppStoreProvider>
      <div className="flex min-h-screen bg-white text-black">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </AppStoreProvider>
  )
}
