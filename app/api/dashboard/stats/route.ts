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

    // Get organization stats
    const organizationId = profile.organization.id

    // Get total claims count and amount
    const { data: claimsStats } = await supabase
      .from('claims_data')
      .select('total_amount.sum(), id.count()')
      .eq('organization_id', organizationId)
      .single()

    // Get recent upload sessions
    const { data: recentSessions } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get monthly claim totals (last 12 months)
    const { data: monthlyTotals } = await supabase
      .from('claims_data')
      .select('month_key, total_amount.sum()')
      .eq('organization_id', organizationId)
      .gte('claim_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('month_key', { ascending: false })
      .limit(12)

    // Get service type breakdown
    const { data: serviceTypes } = await supabase
      .from('claims_data')
      .select('service_type, total_amount.sum(), id.count()')
      .eq('organization_id', organizationId)
      .order('sum', { ascending: false })
      .limit(10)

    // Get top claimants by total amount
    const { data: topClaimants } = await supabase
      .from('claims_data')
      .select('claimant_id, total_amount.sum(), id.count()')
      .eq('organization_id', organizationId)
      .order('sum', { ascending: false })
      .limit(10)

    const stats = {
      summary: {
        totalClaims: claimsStats?.count || 0,
        totalAmount: claimsStats?.sum || 0,
        totalSessions: recentSessions?.length || 0,
        avgClaimAmount: claimsStats?.count > 0 ? (claimsStats.sum / claimsStats.count) : 0
      },
      recentSessions: recentSessions || [],
      monthlyTotals: monthlyTotals || [],
      serviceTypes: serviceTypes || [],
      topClaimants: topClaimants || []
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}