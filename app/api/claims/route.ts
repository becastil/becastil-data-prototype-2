import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.organization) {
      return NextResponse.json(
        { success: false, message: 'Profile setup required' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 1000)
    const offset = (page - 1) * limit
    
    const uploadSessionId = url.searchParams.get('uploadSessionId')
    const monthKey = url.searchParams.get('monthKey')
    const serviceType = url.searchParams.get('serviceType')
    const claimantId = url.searchParams.get('claimantId')

    // Build query
    let query = supabase
      .from('claims_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization.id)
      .order('claim_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters
    if (uploadSessionId) {
      query = query.eq('upload_session_id', uploadSessionId)
    }
    if (monthKey) {
      query = query.eq('month_key', monthKey)
    }
    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }
    if (claimantId) {
      query = query.eq('claimant_id', claimantId)
    }

    const { data: claims, error, count } = await query

    if (error) {
      console.error('Failed to fetch claims:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch claims' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      claims,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Claims API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}