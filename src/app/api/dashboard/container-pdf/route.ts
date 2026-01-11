import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const containerId = searchParams.get('containerId')
    
    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 })
    }

    // Search through all dashboards to find the container with the PDF
    const dashboards = await prisma.dashboard.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Search for container with matching ID
    for (const dashboard of dashboards) {
      try {
        const containers = dashboard.containers as any[]
        const container = containers.find((c: any) => c.id === containerId)
        
        if (!container) continue

        const fileName = container.pdfFileName || container.title || 'document.pdf'

        // Priority 1: Use pdfUrl if available (new format - file stored in Supabase bucket)
        if (container.pdfUrl && typeof container.pdfUrl === 'string') {
          try {
            // Fetch PDF from Supabase URL
            const response = await fetch(container.pdfUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`)
            }
            
            const arrayBuffer = await response.arrayBuffer()
            const pdfBuffer = Buffer.from(arrayBuffer)
            
            return new NextResponse(pdfBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
              },
            })
          } catch (fetchError) {
            console.error('Error fetching PDF from URL:', fetchError)
            // Fall through to try base64 fallback
          }
        }

        // Priority 2: Fallback to pdfData (base64) for backward compatibility
        if (container.pdfData && typeof container.pdfData === 'string') {
          // Extract base64 data from data URL if present
          let base64Data = container.pdfData
          if (base64Data.startsWith('data:application/pdf;base64,')) {
            base64Data = base64Data.replace('data:application/pdf;base64,', '')
          } else if (base64Data.startsWith('data:')) {
            base64Data = base64Data.split(',')[1] || base64Data
          }
          
          const pdfBuffer = Buffer.from(base64Data, 'base64')
          
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${fileName}"`,
            },
          })
        }
      } catch (error) {
        // Skip invalid containers and continue searching
        console.error('Error processing container:', error)
        continue
      }
    }

    return NextResponse.json({ error: 'PDF not found for this container' }, { status: 404 })
  } catch (error) {
    console.error('Error handling container PDF download:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF download' },
      { status: 500 }
    )
  }
}
