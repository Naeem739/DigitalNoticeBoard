import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'
import { deleteFileFromStorage, extractFilePathFromUrl, STORAGE_BUCKETS } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboardId')
    const containerId = searchParams.get('containerId')
    const pdfUrl = searchParams.get('pdfUrl') // URL to identify which PDF to remove
    const pdfId = searchParams.get('pdfId') // For pdfIds array case
    const pdfImageUrl = searchParams.get('pdfImageUrl') // Preview image URL to remove from storage

    if (!dashboardId || !containerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dashboard ID and Container ID are required' 
      }, { status: 400 })
    }

    // Fetch the dashboard
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId }
    })

    if (!dashboard) {
      return NextResponse.json({ 
        success: false, 
        error: 'Dashboard not found' 
      }, { status: 404 })
    }

    const containers = dashboard.containers as any[]
    if (!Array.isArray(containers)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid containers format' 
      }, { status: 400 })
    }

    // Find the container
    const containerIndex = containers.findIndex((c: any) => c.id === containerId)
    if (containerIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Container not found' 
      }, { status: 404 })
    }

    const container = containers[containerIndex]

    // Keep refs for storage cleanup
    const pdfUrlsToDelete: string[] = []
    const pdfImagesToDelete: string[] = []

    // Case 1: Remove from container.pdfs array
    if (Array.isArray(container.pdfs) && container.pdfs.length > 0) {
      if (pdfUrl) {
        // Remove PDF by URL
        const remaining: any[] = []
        for (const pdf of container.pdfs) {
          const matches = (pdf.pdfUrl === pdfUrl) || (pdf.url === pdfUrl)
          if (matches) {
            if (pdf.pdfUrl || pdf.url) pdfUrlsToDelete.push(pdf.pdfUrl || pdf.url)
            if (pdf.pdfimage || pdf.pdfImageUrl || pdfImageUrl) {
              pdfImagesToDelete.push(pdf.pdfimage || pdf.pdfImageUrl || pdfImageUrl)
            }
          } else {
            remaining.push(pdf)
          }
        }
        container.pdfs = remaining
      } else {
        // Remove all PDFs if no URL specified
        for (const pdf of container.pdfs) {
          if (pdf.pdfUrl || pdf.url) pdfUrlsToDelete.push(pdf.pdfUrl || pdf.url)
          if (pdf.pdfimage || pdf.pdfImageUrl || pdfImageUrl) {
            pdfImagesToDelete.push(pdf.pdfimage || pdf.pdfImageUrl || pdfImageUrl)
          }
        }
        container.pdfs = []
      }
    }
    // Case 2: Remove single pdfUrl/url from container
    else if (container.pdfUrl || container.url) {
      if (pdfUrl && (container.pdfUrl === pdfUrl || container.url === pdfUrl)) {
        if (container.pdfUrl || container.url) pdfUrlsToDelete.push(container.pdfUrl || container.url)
        if (container.pdfimage || container.pdfImageUrl || pdfImageUrl) {
          pdfImagesToDelete.push(container.pdfimage || container.pdfImageUrl || pdfImageUrl)
        }
        delete container.pdfUrl
        delete container.url
        delete container.pdfFileName
        delete container.pdfimage
        delete container.pdfImageUrl
      }
    }
    // Case 3: Remove from pdfIds array (legacy)
    else if (Array.isArray(container.pdfIds) && container.pdfIds.length > 0) {
      if (pdfId) {
        container.pdfIds = container.pdfIds.filter((id: string) => id !== pdfId)
      }
    }

    // Update the containers array
    containers[containerIndex] = container

    // Update the dashboard
    const updatedDashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: {
        containers: containers
      }
    })

    // Delete PDF files from storage
    for (const pdfUrl of pdfUrlsToDelete) {
      try {
        const pdfFilePath = extractFilePathFromUrl(pdfUrl, STORAGE_BUCKETS.PDFS)
        if (pdfFilePath) {
          await deleteFileFromStorage(STORAGE_BUCKETS.PDFS, pdfFilePath)
        }
      } catch (error) {
        console.error(`Error deleting PDF file ${pdfUrl} from storage:`, error)
      }
    }

    // Delete PDF preview images from storage
    for (const pdfImageUrl of pdfImagesToDelete) {
      if (!pdfImageUrl) continue
      try {
        const pdfImgPath = extractFilePathFromUrl(pdfImageUrl, STORAGE_BUCKETS.IMAGES)
        if (pdfImgPath) {
          await deleteFileFromStorage(STORAGE_BUCKETS.IMAGES, pdfImgPath)
        }
      } catch (error) {
        console.error(`Error deleting PDF preview image ${pdfImageUrl} from storage:`, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'PDF removed from dashboard container',
      result: updatedDashboard,
      deletedPdfUrls: pdfUrlsToDelete,
      deletedPdfImages: pdfImagesToDelete
    })

  } catch (error) {
    console.error('Error removing PDF from dashboard:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove PDF from dashboard' 
    }, { status: 500 })
  }
}
