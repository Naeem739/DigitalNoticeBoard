import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboardId')
    const containerId = searchParams.get('containerId')
    const imageUrl = searchParams.get('imageUrl') // URL to identify which image to remove

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

    // Case 1: Remove from container.images array
    if (Array.isArray(container.images) && container.images.length > 0) {
      if (imageUrl) {
        // Remove image by URL
        container.images = container.images.filter((img: any) => 
          img.imageUrl !== imageUrl && img.url !== imageUrl
        )
      } else {
        // Remove all images if no URL specified
        container.images = []
      }
    }
    // Case 2: Remove single imageUrl/url from container
    else if (container.imageUrl || container.url) {
      if (imageUrl && (container.imageUrl === imageUrl || container.url === imageUrl)) {
        delete container.imageUrl
        delete container.url
        delete container.imageFileName
      }
    }
    // Case 3: Remove from noticeIds array (images stored as notices)
    else if (Array.isArray(container.noticeIds) && container.noticeIds.length > 0) {
      // If imageUrl is provided, we'd need to fetch notices to find matching ones
      // For now, we'll just leave noticeIds as is since they reference notices
      // The notice deletion will handle removing the image
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
      message: 'Image removed from dashboard container',
      result: updatedDashboard
    })

  } catch (error) {
    console.error('Error removing image from dashboard:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove image from dashboard' 
    }, { status: 500 })
  }
}
