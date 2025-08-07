import { NextResponse } from "next/server"
import { createPublicNoticeSettings } from "@/app/actions/public-notice-settings.action"

export async function POST() {
  try {
    console.log("Initializing default public notice settings...")
    
    const defaultSettings = await createPublicNoticeSettings({
      title: "Smart Notice Board",
      subtitle: "Information Technology Department",
      emergencyNumber: "01734528367",
      emergencyContact: "Md. Rashid Al Asif",
      departmentName: "Information Technology Department",
      backgroundType: "gradient",
      gradientColors: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
      headerBackgroundColor: "#1e293b",
      footerBackgroundColor: "#1e293b",
      accentColor: "#3b82f6"
    })
    
    if (defaultSettings) {
      console.log("Default settings created successfully:", defaultSettings.id)
      return NextResponse.json({ 
        success: true, 
        message: "Default settings initialized successfully",
        data: defaultSettings
      })
    } else {
      console.error("Failed to create default settings")
      return NextResponse.json(
        { success: false, error: "Failed to create default settings" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error initializing settings:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to initialize settings" },
      { status: 500 }
    )
  }
} 