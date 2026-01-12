import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboardId')
    const containerId = searchParams.get('containerId')
    const pdfUrl = searchParams.get('pdfUrl') // URL to identify which PDF to remove
    const pdfId = searchParams.get('pdfId') // For pdfIds array case

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

    // Case 1: Remove from container.pdfs array
    if (Array.isArray(container.pdfs) && container.pdfs.length > 0) {
      if (pdfUrl) {
        // Remove PDF by URL
        container.pdfs = container.pdfs.filter((pdf: any) => 
          pdf.pdfUrl !== pdfUrl && pdf.url !== pdfUrl
        )
      } else {
        // Remove all PDFs if no URL specified
        container.pdfs = []
      }
    }
    // Case 2: Remove single pdfUrl/url from container
    else if (container.pdfUrl || container.url) {
      if (pdfUrl && (container.pdfUrl === pdfUrl || container.url === pdfUrl)) {
        delete container.pdfUrl
        delete container.url
        delete container.pdfFileName
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

    return NextResponse.json({ 
      success: true, 
      message: 'PDF removed from dashboard container',
      result: updatedDashboard
    })

  } catch (error) {
    console.error('Error removing PDF from dashboard:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove PDF from dashboard' 
    }, { status: 500 })
  }
}
