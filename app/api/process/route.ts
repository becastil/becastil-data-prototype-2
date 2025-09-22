import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CSVParser } from '@/app/lib/csv-parser'
import { FormatDetector } from '@/app/lib/format-detector'
import { DataValidator } from '@/app/lib/data-validator'
import { ProcessingResult } from '@/app/types/claims'

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

    const body = await request.json()
    const { fileId, fileData, mapping, options = {} } = body

    if (!fileId || !fileData) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify the upload session belongs to this user
    const { data: uploadSession } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (!uploadSession) {
      return NextResponse.json(
        { success: false, message: 'Upload session not found' },
        { status: 404 }
      )
    }

    // Convert base64 file data back to File object
    const fileBuffer = Buffer.from(fileData, 'base64')
    const file = new File([fileBuffer], 'upload.csv', { type: 'text/csv' })

    // Update session status to processing
    await supabase
      .from('upload_sessions')
      .update({ status: 'processing' })
      .eq('id', fileId)

    try {
      // Step 1: Parse the entire file with streaming
      let allData: any[] = []
      let headers: string[] = []
      let parseErrors: any[] = []

      const result = await CSVParser.parseFileStreaming(file, {
        chunkSize: 1024 * 1024, // 1MB chunks
        onChunk: async (chunk, info) => {
          // Update progress in database
          await supabase
            .from('upload_sessions')
            .update({
              processed_rows: info.processed,
              total_rows: info.total
            })
            .eq('id', fileId)
        }
      })

      allData = result.data
      headers = result.headers
      parseErrors = result.errors

      // Step 2: Detect format if mapping not provided
      let finalMapping = mapping
      let detectedCarrier = ''
      let confidence = 0

      if (!mapping) {
        const formatResults = await FormatDetector.detectFormat(headers, allData.slice(0, 100))
        if (formatResults.length > 0) {
          const bestMatch = formatResults[0]
          finalMapping = bestMatch.suggestedMapping
          detectedCarrier = bestMatch.carrier
          confidence = bestMatch.confidence
        }
      }

      if (!finalMapping) {
        await supabase
          .from('upload_sessions')
          .update({
            status: 'failed',
            error_message: 'No field mapping provided and auto-detection failed'
          })
          .eq('id', fileId)

        return NextResponse.json(
          { success: false, message: 'No field mapping provided and auto-detection failed' },
          { status: 400 }
        )
      }

      // Step 3: Validate data
      const validation = DataValidator.validateData(allData, finalMapping, {
        strictMode: options.strictMode || false,
        maxErrors: options.maxErrors || 10000,
        skipInvalidRows: options.skipInvalidRows !== false
      })

      // Step 4: Normalize data
      const normalizedClaims = DataValidator.normalizeData(allData, finalMapping, {
        skipInvalidRows: options.skipInvalidRows !== false
      })

      // Step 5: Store claims in database
      const claimsToInsert = normalizedClaims.map(claim => ({
        organization_id: profile.organization.id,
        upload_session_id: fileId,
        claimant_id: claim.claimantId,
        claim_date: claim.claimDate,
        service_type: claim.serviceType,
        medical_amount: claim.medicalAmount,
        pharmacy_amount: claim.pharmacyAmount,
        total_amount: claim.totalAmount,
        icd_code: claim.icdCode || null,
        medical_desc: claim.medicalDesc || null,
        layman_term: claim.laymanTerm || null,
        provider: claim.provider || null,
        location: claim.location || null,
        month_key: claim.monthKey,
        net_paid: claim.totalAmount, // Initial net paid equals total amount
        original_row: claim.originalRow
      }))

      // Insert claims in batches
      const batchSize = 1000
      let insertedCount = 0
      
      for (let i = 0; i < claimsToInsert.length; i += batchSize) {
        const batch = claimsToInsert.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('claims_data')
          .insert(batch)
          
        if (insertError) {
          console.error('Failed to insert claims batch:', insertError)
          throw new Error(`Failed to insert claims: ${insertError.message}`)
        }
        
        insertedCount += batch.length
        
        // Update progress
        await supabase
          .from('upload_sessions')
          .update({
            processed_rows: insertedCount
          })
          .eq('id', fileId)
      }

      // Update session completion
      await supabase
        .from('upload_sessions')
        .update({
          status: 'completed',
          processed_rows: normalizedClaims.length,
          failed_rows: validation.errors.filter(e => e.severity === 'error').length,
          completed_at: new Date().toISOString()
        })
        .eq('id', fileId)

      // Prepare result for response (don't return all claims data)
      const processingResult: ProcessingResult = {
        claims: normalizedClaims.slice(0, 100), // Return only first 100 for preview
        errors: validation.errors,
        stats: validation.stats,
        mapping: finalMapping,
        carrier: detectedCarrier || undefined,
        confidence: confidence || undefined
      }

      return NextResponse.json({
        success: true,
        result: processingResult,
        message: `Successfully processed and stored ${normalizedClaims.length.toLocaleString()} claims`
      })

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
          message: `Processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Process API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error during file processing' 
      },
      { status: 500 }
    )
  }
}

// Streaming endpoint for large file processing
export async function PUT(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json()
        const { fileId, fileData, mapping, options = {} } = body

        if (!fileId || !fileData) {
          const error = `data: ${JSON.stringify({ error: 'Missing required parameters' })}\n\n`
          controller.enqueue(encoder.encode(error))
          controller.close()
          return
        }

        // Convert base64 file data back to File object
        const fileBuffer = Buffer.from(fileData, 'base64')
        const file = new File([fileBuffer], 'upload.csv', { type: 'text/csv' })

        // Stream processing results
        let processedCount = 0
        const batchSize = 1000
        let allClaims: any[] = []
        let allErrors: any[] = []

        // Parse with streaming and send incremental results
        const result = await CSVParser.parseFileStreaming(file, {
          chunkSize: 512 * 1024, // 512KB chunks
          onChunk: (chunk, info) => {
            // Validate and normalize chunk
            if (mapping) {
              const chunkValidation = DataValidator.validateData(chunk, mapping, {
                maxErrors: 100
              })
              
              const normalizedChunk = DataValidator.normalizeData(chunk, mapping)
              
              allClaims.push(...normalizedChunk)
              allErrors.push(...chunkValidation.errors)
              processedCount += chunk.length

              // Send incremental update
              const update = {
                type: 'progress',
                processed: processedCount,
                total: info.total,
                validClaims: allClaims.length,
                errors: allErrors.length,
                progress: (processedCount / info.total) * 100
              }
              
              const data = `data: ${JSON.stringify(update)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
        })

        // Send final result
        const finalResult = {
          type: 'complete',
          claims: allClaims,
          errors: allErrors,
          total: processedCount,
          validClaims: allClaims.length,
          invalidClaims: processedCount - allClaims.length
        }

        const finalData = `data: ${JSON.stringify(finalResult)}\n\n`
        controller.enqueue(encoder.encode(finalData))
        controller.close()

      } catch (error) {
        const errorData = `data: ${JSON.stringify({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}