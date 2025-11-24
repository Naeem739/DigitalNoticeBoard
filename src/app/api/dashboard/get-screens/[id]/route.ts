import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/db/prisma"

export async function GET(
  request: NextRequest,
  // { params }: { params: { id: string } }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First, get the dashboard with the provided ID to get its creation time
    const originalDashboard = await prisma.dashboard.findUnique({
      where: { id }
    })

    if (!originalDashboard) {
      return NextResponse.json(
        {
          success: false,
          error: "Dashboard not found"
        },
        { status: 404 }
      )
    }

    // Get all dashboards created within 1 second of the original dashboard
    // This assumes all screens of a dashboard are created together
    const oneSecondLater = new Date(originalDashboard.createdAt!.getTime() + 1000)
    const oneSecondEarlier = new Date(originalDashboard.createdAt!.getTime() - 1000)

    const allScreens = await prisma.dashboard.findMany({
      where: {
        createdAt: {
          gte: oneSecondEarlier,
          lte: oneSecondLater
        }
      },
      orderBy: {
        screenIndex: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      result: allScreens
    })
  } catch (error) {
    console.error("Error getting dashboard screens:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get dashboard screens"
      },
      { status: 500 }
    )
  }
}
