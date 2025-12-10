import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/db/prisma"
import { emitDashboardUpdate } from "@/lib/pusher-server"

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

    // Emit Pusher event for real-time update
    await emitDashboardUpdate({ deleted: true, id });

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
