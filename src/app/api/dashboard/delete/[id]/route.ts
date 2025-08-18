import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/db/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete the dashboard
    const result = await prisma.dashboard.delete({
      where: { id }
    })

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
