import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found, skipping auth middleware')
    return response
  }

  let supabase

  try {
    supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to initialize Supabase middleware client:', error)
    return response
  }

  const getSupabaseUser = async () => {
    try {
      return await supabase.auth.getUser()
    } catch (error) {
      console.error('Supabase auth.getUser() failed in middleware:', error)
      return {
        data: { user: null },
        error,
      }
    }
  }

  // Protected routes that require authentication
  const protectedPaths = ['/api/upload', '/api/process']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Check authentication for protected routes
  if (isProtectedPath) {
    const {
      data: { user },
    } = await getSupabaseUser()

    // Require auth for API routes
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Auth routes redirects
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const {
      data: { user },
    } = await getSupabaseUser()

    // Redirect authenticated users away from auth pages
    if (user && (
      request.nextUrl.pathname === '/auth/login' || 
      request.nextUrl.pathname === '/auth/signup'
    )) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
