import { NextRequest, NextResponse } from "next/server"
import { getTempDashboardScreens } from "@/app/actions/dashboard.action"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const result = await getTempDashboardScreens(id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to get temp dashboard screens"
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Error getting temp dashboard screens:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get temp dashboard screens"
      },
      { status: 500 }
    )
  }
}
