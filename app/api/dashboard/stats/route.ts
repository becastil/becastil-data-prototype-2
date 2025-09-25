import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEMO_STATS = {
  summary: {
    totalClaims: 4821,
    totalAmount: 1284500,
    totalSessions: 6,
    avgClaimAmount: 266.51,
  },
  recentSessions: [
    {
      id: 'demo-session-6',
      filename: 'anthem_claims_q2.csv',
      status: 'completed',
      total_rows: 940,
      processed_rows: 940,
      created_at: '2025-06-02T14:12:00Z',
    },
    {
      id: 'demo-session-5',
      filename: 'esi_rx_april.csv',
      status: 'completed',
      total_rows: 610,
      processed_rows: 610,
      created_at: '2025-05-18T19:45:00Z',
    },
    {
      id: 'demo-session-4',
      filename: 'uhc_large_claims.csv',
      status: 'completed',
      total_rows: 1250,
      processed_rows: 1250,
      created_at: '2025-04-09T16:30:00Z',
    },
    {
      id: 'demo-session-3',
      filename: 'cigna_stoploss.csv',
      status: 'completed',
      total_rows: 420,
      processed_rows: 420,
      created_at: '2025-03-21T11:08:00Z',
    },
    {
      id: 'demo-session-2',
      filename: 'anthem_claims_q1.csv',
      status: 'completed',
      total_rows: 780,
      processed_rows: 780,
      created_at: '2025-02-14T09:26:00Z',
    },
  ],
  monthlyTotals: [
    { month_key: '2025-05', sum: 218340 },
    { month_key: '2025-04', sum: 205120 },
    { month_key: '2025-03', sum: 198560 },
    { month_key: '2025-02', sum: 187430 },
    { month_key: '2025-01', sum: 176890 },
    { month_key: '2024-12', sum: 171250 },
  ],
  serviceTypes: [
    { service_type: 'Inpatient', sum: 425600, count: 312 },
    { service_type: 'Outpatient', sum: 318900, count: 1275 },
    { service_type: 'Pharmacy', sum: 218750, count: 1720 },
    { service_type: 'Emergency', sum: 164300, count: 284 },
    { service_type: 'Specialty', sum: 112950, count: 196 },
  ],
  topClaimants: [
    { claimant_id: 'CLA-2041', sum: 38500, count: 9 },
    { claimant_id: 'CLA-1789', sum: 32450, count: 7 },
    { claimant_id: 'CLA-1522', sum: 28740, count: 5 },
    { claimant_id: 'CLA-0987', sum: 25410, count: 6 },
    { claimant_id: 'CLA-0654', sum: 21980, count: 4 },
  ],
} as const

export async function GET(request: NextRequest): Promise<NextResponse> {
  const fallbackResponse = NextResponse.json({ success: true, stats: DEMO_STATS, demo: true })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Dashboard stats API: Supabase environment variables missing, serving demo data')
    return fallbackResponse
  }

  try {
    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Dashboard stats API auth error, serving demo data:', authError)
      return fallbackResponse
    }

    if (!user) {
      return NextResponse.json({ success: true, stats: DEMO_STATS, demo: true })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Dashboard stats API profile lookup failed:', profileError)
      return NextResponse.json(
        { success: false, message: 'Profile lookup failed' },
        { status: 500 }
      )
    }

    if (!profile || !profile.organization) {
      return NextResponse.json(
        { success: false, message: 'Profile setup required' },
        { status: 400 }
      )
    }

    // Get organization stats
    const organizationId = profile.organization.id

    // Get total claims count and amount
    const { data: claimsStats, error: claimsError } = await supabase
      .from('claims_data')
      .select('total_amount.sum(), id.count()')
      .eq('organization_id', organizationId)
      .single()

    if (claimsError) {
      console.error('Dashboard stats API claims aggregation failed:', claimsError)
      return NextResponse.json(
        { success: false, message: 'Failed to aggregate claims data' },
        { status: 500 }
      )
    }

    // Get recent upload sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (sessionsError) {
      console.error('Dashboard stats API upload sessions lookup failed:', sessionsError)
    }

    // Get monthly claim totals (last 12 months)
    const { data: monthlyTotals, error: monthlyError } = await supabase
      .from('claims_data')
      .select('month_key, total_amount.sum()')
      .eq('organization_id', organizationId)
      .gte('claim_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('month_key', { ascending: false })
      .limit(12)

    if (monthlyError) {
      console.error('Dashboard stats API monthly totals lookup failed:', monthlyError)
    }

    // Get service type breakdown
    const { data: serviceTypes, error: serviceTypeError } = await supabase
      .from('claims_data')
      .select('service_type, total_amount.sum(), id.count()')
      .eq('organization_id', organizationId)
      .order('sum', { ascending: false })
      .limit(10)

    if (serviceTypeError) {
      console.error('Dashboard stats API service type aggregation failed:', serviceTypeError)
    }

    // Get top claimants by total amount
    const { data: topClaimants, error: topClaimantsError } = await supabase
      .from('claims_data')
      .select('claimant_id, total_amount.sum(), id.count()')
      .eq('organization_id', organizationId)
      .order('sum', { ascending: false })
      .limit(10)

    if (topClaimantsError) {
      console.error('Dashboard stats API top claimants aggregation failed:', topClaimantsError)
    }

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
    console.error('Dashboard stats API unexpected error, serving demo data:', error)
    return fallbackResponse
  }
}
