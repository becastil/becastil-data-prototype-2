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

    // Get configurations for this organization
    const { data: configurations, error } = await supabase
      .from('configurations')
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .eq('organization_id', profile.organization.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch configurations:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch configurations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configurations
    })

  } catch (error) {
    console.error('Configurations API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const body = await request.json()
    const { name, config, is_default = false } = body

    if (!name || !config) {
      return NextResponse.json(
        { success: false, message: 'Name and config are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset current default
    if (is_default) {
      await supabase
        .from('configurations')
        .update({ is_default: false })
        .eq('organization_id', profile.organization.id)
        .eq('is_default', true)
    }

    // Create new configuration
    const { data: newConfig, error } = await supabase
      .from('configurations')
      .insert({
        organization_id: profile.organization.id,
        user_id: user.id,
        name,
        config,
        is_default
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create configuration:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configuration: newConfig,
      message: 'Configuration created successfully'
    })

  } catch (error) {
    console.error('Configurations POST API error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}