import { NextRequest, NextResponse } from "next/server"
import { getPublicNoticeSettings, updatePublicNoticeSettings } from "@/app/actions/public-notice-settings.action"

export async function GET() {
  try {
    console.log("Fetching public notice settings...")
    const settings = await getPublicNoticeSettings()
    console.log("Settings fetched:", settings ? "Found" : "Not found")
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error("Error fetching public notice settings:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received settings data:", body)
    
    const settings = await updatePublicNoticeSettings(body)
    
    if (settings) {
      console.log("Settings updated successfully:", settings.id)
      return NextResponse.json({ success: true, data: settings })
    } else {
      console.error("Failed to update settings - returned null")
      return NextResponse.json(
        { success: false, error: "Failed to update settings" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error updating public notice settings:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    )
  }
} 