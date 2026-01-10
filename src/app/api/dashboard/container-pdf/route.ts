import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const containerId = searchParams.get('containerId')
    
    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 })
    }

    // Search through all dashboards to find the container with the PDF data
    const dashboards = await prisma.dashboard.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Search for container with matching ID
    for (const dashboard of dashboards) {
      try {
        const containers = dashboard.containers as any[]
        const container = containers.find((c: any) => c.id === containerId)
        
        if (container && container.pdfData && typeof container.pdfData === 'string') {
          // Extract base64 data from data URL if present
          let base64Data = container.pdfData
          if (base64Data.startsWith('data:application/pdf;base64,')) {
            base64Data = base64Data.replace('data:application/pdf;base64,', '')
          } else if (base64Data.startsWith('data:')) {
            base64Data = base64Data.split(',')[1] || base64Data
          }
          
          const pdfBuffer = Buffer.from(base64Data, 'base64')
          const fileName = container.pdfFileName || container.title || 'document.pdf'
          
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${fileName}"`,
            },
          })
        }
      } catch (error) {
        // Skip invalid containers and continue searching
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
