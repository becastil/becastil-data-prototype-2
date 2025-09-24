'use client'

import { AppStoreProvider } from '@/lib/store/AppStoreProvider'
import StepNav from '@/components/nav/StepNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppStoreProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <StepNav />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </AppStoreProvider>
  )
}