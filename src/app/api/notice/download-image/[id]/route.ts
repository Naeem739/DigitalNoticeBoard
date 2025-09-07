import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noticeId } = await params

    // Try to find the image data from the Notice model instead of Image
    const notice = await prisma.notice.findFirst({
      where: {
        id: noticeId
      }
    })

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    // Return the image data as a downloadable file
    if (notice.imageData) {
      // Remove data URL prefix if present
      const base64Data = notice.imageData.replace(/^data:image\/[a-z]+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${notice.imageFileName || notice.title}.jpg"`,
        },
      })
    } else {
      return NextResponse.json({ error: 'No image data available' }, { status: 404 })
    }

  } catch (error) {
    console.error('Error handling image download:', error)
    return NextResponse.json({ error: 'Failed to process image download' }, { status: 500 })
  }
} 