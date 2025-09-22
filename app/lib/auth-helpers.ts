import { createClient } from './supabase-client'
import { createServerSupabaseClient } from './supabase-client'

// Client-side auth helpers
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string, options?: {
  data?: {
    full_name?: string
    organization_name?: string
  }
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  
  if (error) throw error
}

// Server-side auth helpers
export async function getServerUser() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function createUserProfile(user: any, profileData: {
  full_name?: string
  organization_name?: string
}) {
  const supabase = await createServerSupabaseClient()
  
  let organizationId = null
  
  // Create organization if provided
  if (profileData.organization_name) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: profileData.organization_name
      })
      .select()
      .single()
    
    if (orgError) throw orgError
    organizationId = org.id
  }
  
  // Create profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: profileData.full_name,
      organization_id: organizationId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Auth state change listener
export function onAuthStateChange(callback: (user: any) => void) {
  const supabase = createClient()
  
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

// Check if user has completed profile setup
export async function checkProfileCompletion(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', userId)
    .single()
  
  return {
    hasProfile: !!data,
    hasOrganization: !!data?.organization_id,
    isComplete: !!data?.full_name && !!data?.organization_id
  }
}