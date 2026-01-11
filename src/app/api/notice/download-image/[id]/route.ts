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

    // Return the image data as a downloadable file from Supabase Storage
    if (notice.imageUrl) {
      try {
        const response = await fetch(notice.imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        
        // Determine content type from file name or default to jpeg
        const contentType = notice.imageFileName?.toLowerCase().endsWith('.png')
          ? 'image/png'
          : notice.imageFileName?.toLowerCase().endsWith('.gif')
            ? 'image/gif'
            : notice.imageFileName?.toLowerCase().endsWith('.webp')
              ? 'image/webp'
              : 'image/jpeg'
        
        const fileExtension = notice.imageFileName?.split('.').pop() || 'jpg'
        
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${notice.imageFileName || notice.title}.${fileExtension}"`,
          },
        })
      } catch (error) {
        console.error('Error fetching image from Supabase:', error)
        return NextResponse.json(
          { error: 'Failed to fetch image file' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json({ error: 'No image URL available' }, { status: 404 })
    }

  } catch (error) {
    console.error('Error handling image download:', error)
    return NextResponse.json({ error: 'Failed to process image download' }, { status: 500 })
  }
} 