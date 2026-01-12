import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { deleteFileFromStorage, extractFilePathFromUrl, STORAGE_BUCKETS } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'PDF ID is required' 
      }, { status: 400 })
    }

    // First, fetch the PDF to get file URL
    const pdf = await prisma.pdf.findUnique({
      where: { id }
    })

    if (!pdf) {
      return NextResponse.json({ 
        success: false, 
        error: 'PDF not found' 
      }, { status: 404 })
    }

    // Delete PDF file from Supabase Storage if it exists
    if (pdf.pdfUrl) {
      try {
        const pdfFilePath = extractFilePathFromUrl(pdf.pdfUrl, STORAGE_BUCKETS.PDFS)
        if (pdfFilePath) {
          const deleteResult = await deleteFileFromStorage(STORAGE_BUCKETS.PDFS, pdfFilePath)
          if (!deleteResult.success) {
            console.warn(`Failed to delete PDF file from storage: ${deleteResult.error}`)
            // Continue with database deletion even if storage deletion fails
          }
        }
      } catch (error) {
        console.error('Error deleting PDF file from storage:', error)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the PDF from database
    const deletedPdf = await prisma.pdf.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      result: deletedPdf 
    })

  } catch (error) {
    console.error('Error deleting PDF:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete PDF' 
    }, { status: 500 })
  }
}



