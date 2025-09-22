import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Browser client for client-side components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server client for server-side components and API routes
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // This can fail during static generation
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // This can fail during static generation
          }
        },
      },
    }
  )
}

// Database types (update these based on your actual Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          organization_id: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          name?: string
          updated_at?: string
        }
      }
      upload_sessions: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          filename: string
          file_size: number
          mime_type: string
          status: 'processing' | 'completed' | 'failed'
          total_rows: number | null
          processed_rows: number
          failed_rows: number
          field_mappings: any | null
          error_message: string | null
          error_details: any | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          filename: string
          file_size: number
          mime_type: string
          status?: 'processing' | 'completed' | 'failed'
          total_rows?: number | null
          processed_rows?: number
          failed_rows?: number
          field_mappings?: any | null
          error_message?: string | null
          error_details?: any | null
        }
        Update: {
          status?: 'processing' | 'completed' | 'failed'
          total_rows?: number | null
          processed_rows?: number
          failed_rows?: number
          field_mappings?: any | null
          error_message?: string | null
          error_details?: any | null
          completed_at?: string | null
        }
      }
      claims_data: {
        Row: {
          id: string
          organization_id: string
          upload_session_id: string
          claimant_id: string
          claim_date: string
          service_type: string
          medical_amount: number
          pharmacy_amount: number
          total_amount: number
          icd_code: string | null
          medical_desc: string | null
          layman_term: string | null
          provider: string | null
          location: string | null
          month_key: string
          net_paid: number
          original_row: any
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          upload_session_id: string
          claimant_id: string
          claim_date: string
          service_type: string
          medical_amount: number
          pharmacy_amount: number
          total_amount: number
          icd_code?: string | null
          medical_desc?: string | null
          layman_term?: string | null
          provider?: string | null
          location?: string | null
          month_key: string
          net_paid: number
          original_row: any
        }
        Update: {
          claimant_id?: string
          claim_date?: string
          service_type?: string
          medical_amount?: number
          pharmacy_amount?: number
          total_amount?: number
          icd_code?: string | null
          medical_desc?: string | null
          layman_term?: string | null
          provider?: string | null
          location?: string | null
          month_key?: string
          net_paid?: number
          original_row?: any
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}