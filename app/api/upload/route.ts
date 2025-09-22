import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CSVParser } from '@/app/lib/csv-parser'
import { FormatDetector } from '@/app/lib/format-detector'
import { DataValidator } from '@/app/lib/data-validator'
import { UploadResponse } from '@/app/types/upload'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = ['text/csv', 'application/csv']

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

    // Get user profile and organization
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` 
        },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { success: false, message: 'Only CSV files are allowed' },
        { status: 400 }
      )
    }

    // Generate file ID for tracking
    const fileId = crypto.randomUUID()
    
    // Create upload session in database
    const { data: uploadSession, error: sessionError } = await supabase
      .from('upload_sessions')
      .insert({
        id: fileId,
        organization_id: profile.organization.id,
        user_id: user.id,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type || 'text/csv',
        status: 'processing',
        processed_rows: 0,
        failed_rows: 0
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to create upload session:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Failed to create upload session' },
        { status: 500 }
      )
    }

    try {
      // Step 1: Parse preview data for format detection
      const previewData = await CSVParser.getPreviewData(file, 20)
      
      // Update session with total rows
      await supabase
        .from('upload_sessions')
        .update({
          total_rows: previewData.totalRows,
          processed_rows: 0
        })
        .eq('id', fileId)

      // Step 2: Detect carrier format
      const formatResults = await FormatDetector.detectFormatFromFile(file, previewData)
      const bestMatch = formatResults.length > 0 ? formatResults[0] : null

      // Step 3: Validate preview data
      let validation = null
      if (bestMatch) {
        validation = DataValidator.validateData(
          previewData.data,
          bestMatch.suggestedMapping,
          { maxErrors: 100 }
        )
      }

      // Step 4: Update session with field mappings and complete
      await supabase
        .from('upload_sessions')
        .update({
          status: 'completed',
          field_mappings: bestMatch?.suggestedMapping || null,
          failed_rows: validation?.errors.filter(e => e.severity === 'error').length || 0,
          completed_at: new Date().toISOString()
        })
        .eq('id', fileId)

      const response: UploadResponse = {
        success: true,
        fileId,
        message: 'File uploaded and processed successfully',
        previewData: previewData.data.slice(0, 10), // Return first 10 rows for preview
        carrier: bestMatch?.carrier,
        confidence: bestMatch?.confidence,
        recordCount: previewData.totalRows,
        errors: validation?.errors.slice(0, 20).map(error => ({
          row: error.row,
          message: error.message,
          severity: error.severity
        })) || []
      }

      return NextResponse.json(response)

    } catch (processingError) {
      // Update session status to failed
      await supabase
        .from('upload_sessions')
        .update({
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
          error_details: { error: processingError instanceof Error ? processingError.stack : 'Unknown error' }
        })
        .eq('id', fileId)

      return NextResponse.json(
        { 
          success: false, 
          fileId,
          message: `Processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error during file upload' 
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}