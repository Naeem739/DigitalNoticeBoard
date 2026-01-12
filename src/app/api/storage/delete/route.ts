import { NextRequest, NextResponse } from 'next/server'
import { deleteFileFromStorage, extractFilePathFromUrl, STORAGE_BUCKETS } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')
    const bucket = searchParams.get('bucket') // 'pdfs' or 'images'

    if (!fileUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'File URL is required' 
      }, { status: 400 })
    }

    // Determine bucket based on URL or provided bucket parameter
    let targetBucket: string
    if (bucket) {
      targetBucket = bucket === 'pdfs' ? STORAGE_BUCKETS.PDFS : STORAGE_BUCKETS.IMAGES
    } else {
      // Try to determine bucket from URL
      if (fileUrl.includes(STORAGE_BUCKETS.PDFS)) {
        targetBucket = STORAGE_BUCKETS.PDFS
      } else if (fileUrl.includes(STORAGE_BUCKETS.IMAGES)) {
        targetBucket = STORAGE_BUCKETS.IMAGES
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Could not determine storage bucket from URL' 
        }, { status: 400 })
      }
    }

    // Extract file path from URL
    const filePath = extractFilePathFromUrl(fileUrl, targetBucket)
    
    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'Could not extract file path from URL' 
      }, { status: 400 })
    }

    // Delete file from storage
    const deleteResult = await deleteFileFromStorage(targetBucket, filePath)
    
    if (!deleteResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: deleteResult.error || 'Failed to delete file from storage' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted from storage successfully' 
    })

  } catch (error) {
    console.error('Error deleting file from storage:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete file from storage' 
    }, { status: 500 })
  }
}
