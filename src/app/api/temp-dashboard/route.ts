import { NextRequest, NextResponse } from "next/server"
import { getAllTempDashboards, createTempDashboard, deleteAllTempDashboards } from "@/app/actions/dashboard.action"

export async function GET() {
  try {
    const result = await getAllTempDashboards()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get temp dashboards"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error getting temp dashboards:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get temp dashboards"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createTempDashboard(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create temp dashboard"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating temp dashboard:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create temp dashboard"
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const result = await deleteAllTempDashboards()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete temp dashboards"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error deleting temp dashboards:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete temp dashboards"
      },
      { status: 500 }
    )
  }
}
