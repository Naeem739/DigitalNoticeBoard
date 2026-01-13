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

    // Optional: pdf preview image URL passed from client (first-page image stored in notices-images bucket)
    let pdfImageUrl = searchParams.get('pdfImageUrl')
    
    // If pdfImageUrl not provided, search dashboard containers for it
    if (!pdfImageUrl && pdf.pdfUrl) {
      try {
        const dashboards = await prisma.dashboard.findMany()
        for (const dashboard of dashboards) {
          const containers = dashboard.containers as any[]
          if (!Array.isArray(containers)) continue
          
          for (const container of containers) {
            // Check if this container has the PDF URL we're deleting
            if (container.type === 'pdf') {
              // Case 1: container.pdfs array
              if (Array.isArray(container.pdfs) && container.pdfs.length > 0) {
                for (const pdfItem of container.pdfs) {
                  if ((pdfItem.pdfUrl || pdfItem.url) === pdf.pdfUrl) {
                    pdfImageUrl = pdfItem.pdfimage || pdfItem.pdfImageUrl
                    if (pdfImageUrl) break
                  }
                }
              }
              // Case 2: single pdfUrl
              else if ((container.pdfUrl || container.url) === pdf.pdfUrl) {
                pdfImageUrl = container.pdfimage || container.pdfImageUrl
              }
              
              if (pdfImageUrl) break
            }
          }
          if (pdfImageUrl) break
        }
      } catch (error) {
        console.error('Error searching dashboard containers for pdfImageUrl:', error)
      }
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

    // Delete PDF preview image from Supabase Storage (if provided by client)
    if (pdfImageUrl) {
      try {
        const pdfImgPath = extractFilePathFromUrl(pdfImageUrl, STORAGE_BUCKETS.IMAGES)
        if (pdfImgPath) {
          const deleteResult = await deleteFileFromStorage(STORAGE_BUCKETS.IMAGES, pdfImgPath)
          if (!deleteResult.success) {
            console.warn(`Failed to delete PDF preview image from storage: ${deleteResult.error}`)
          }
        }
      } catch (error) {
        console.error('Error deleting PDF preview image from storage:', error)
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



