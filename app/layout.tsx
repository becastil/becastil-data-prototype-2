import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Navigation from '@/components/Navigation'
import NotificationProvider from '@/components/NotificationProvider'
import { PreferencesProvider } from '@/components/PreferencesProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Healthcare Analytics Dashboard',
  description: 'HIPAA-compliant healthcare claims analysis platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased` }>
        <PreferencesProvider>
          <NotificationProvider>
            <div className="flex min-h-screen flex-col">
              <Navigation />
              <main className="flex-1 bg-gray-50 dark:bg-slate-950">
                {children}
              </main>
            </div>
          </NotificationProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}
