import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/db/prisma"

export async function DELETE(
  request: NextRequest,
  // { params }: { params: { id: string } }
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete the dashboard
    const result = await prisma.dashboard.delete({
      where: { id }
    })

    // Real-time updates are handled by TanStack Query polling
    // No need for Socket.io emits

    return NextResponse.json({
      success: true,
      result: result
    })
  } catch (error) {
    console.error("Error deleting dashboard:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete dashboard"
      },
      { status: 500 }
    )
  }
}
