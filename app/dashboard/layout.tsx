import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: User | null = null

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables missing, rendering dashboard layout without auth context')
    } else {
      const cookieStore = await cookies()
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      })

      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.error('Supabase auth lookup failed in dashboard layout:', error)
      } else {
        user = data.user
      }
    }
  } catch (error) {
    console.error('Unexpected error while resolving dashboard auth state:', error)
  }

  const userEmail = user?.email ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Healthcare Analytics Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {userEmail ? (
                <>
                  <span className="text-sm text-gray-700">{userEmail}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
