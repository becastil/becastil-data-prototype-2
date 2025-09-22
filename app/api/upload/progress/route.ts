import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
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
    return new Response('Authentication required', { status: 401 })
  }
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', message: 'Progress stream connected' })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up interval to send progress updates
      const interval = setInterval(async () => {
        try {
          // Get recent upload sessions for this user
          const { data: sessions } = await supabase
            .from('upload_sessions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['processing', 'completed', 'failed'])
            .order('created_at', { ascending: false })
            .limit(10)

          if (sessions) {
            sessions.forEach((session) => {
              const progressData = {
                fileId: session.id,
                stage: session.status,
                progress: session.status === 'completed' ? 100 : 
                         session.status === 'failed' ? 0 : 
                         Math.round((session.processed_rows / (session.total_rows || 1)) * 100),
                message: session.status === 'completed' ? 'Processing complete' :
                        session.status === 'failed' ? session.error_message || 'Processing failed' :
                        'Processing...',
                recordsProcessed: session.processed_rows || 0,
                totalRecords: session.total_rows || 0,
                errors: session.failed_rows || 0
              }
              
              const eventData = `data: ${JSON.stringify(progressData)}\n\n`
              controller.enqueue(encoder.encode(eventData))
            })
          }
          
          // Send heartbeat to keep connection alive
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
          
        } catch (error) {
          console.error('Error sending progress update:', error)
        }
      }, 2000) // Send updates every 2 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })

      // Clean up after 30 minutes to prevent memory leaks
      setTimeout(() => {
        clearInterval(interval)
        controller.close()
      }, 30 * 60 * 1000)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

