import { NextRequest, NextResponse } from "next/server"
import { getAllTemplates, createTemplate } from "@/app/actions/template.action"

export async function GET() {
  try {
    console.log("Fetching all templates...")
    const templates = await getAllTemplates()
    console.log("Templates fetched:", templates.length)
    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating template with data:", body)
    
    const template = await createTemplate(body)
    
    if (template) {
      console.log("Template created successfully:", template.id)
      return NextResponse.json({ success: true, data: template })
    } else {
      console.error("Failed to create template - returned null")
      return NextResponse.json(
        { success: false, error: "Failed to create template" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 }
    )
  }
} 