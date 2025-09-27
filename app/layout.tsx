import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import MainLayout from '@/components/layout/MainLayout'
import NotificationProvider from '@/components/NotificationProvider'
import { PreferencesProvider } from '@/components/PreferencesProvider'
import AntdProvider from '@/components/providers/AntdProvider'
import './globals.css'

export const dynamic = 'force-dynamic'

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get user data for the sidebar
  let user = null

  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      const {
        data: { user: userData },
      } = await supabase.auth.getUser()
      user = userData
    }
  } catch (error) {
    console.error('Auth initialization error:', error)
    // Continue with user = null
  }

  return (
    <html lang="en" suppressHydrationWarning className="bg-[var(--background)] text-[var(--foreground)]">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}>
        <PreferencesProvider>
          <NotificationProvider>
            <AntdProvider>
              <MainLayout user={user}>
                {children}
              </MainLayout>
            </AntdProvider>
          </NotificationProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}
