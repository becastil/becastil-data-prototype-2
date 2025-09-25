import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import EnhancedSidebar from '@/components/EnhancedSidebar'
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
    <html lang="en" className="bg-white text-black">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}>
        <PreferencesProvider>
          <NotificationProvider>
            <div className="flex min-h-screen">
              <EnhancedSidebar user={user} />
              <div className="flex min-h-screen flex-1 flex-col lg:ml-72">
                <Navigation />
                <main className="flex-1 bg-white px-4 py-6 lg:px-6">
                  {children}
                </main>
              </div>
            </div>
          </NotificationProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}
