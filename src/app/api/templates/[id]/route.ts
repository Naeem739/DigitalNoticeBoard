import { NextRequest, NextResponse } from "next/server"
import { getTemplateById, updateTemplate, deleteTemplate, applyTemplateToSettings } from "@/app/actions/template.action"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Fetching template with ID:", params.id)
    const template = await getTemplateById(params.id)
    
    if (template) {
      console.log("Template found:", template.id)
      return NextResponse.json({ success: true, data: template })
    } else {
      console.log("Template not found")
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch template" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log("Updating template with ID:", params.id)
    console.log("Update data:", body)
    
    const template = await updateTemplate(params.id, body)
    
    if (template) {
      console.log("Template updated successfully:", template.id)
      return NextResponse.json({ success: true, data: template })
    } else {
      console.error("Failed to update template - returned null")
      return NextResponse.json(
        { success: false, error: "Failed to update template" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update template" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Deleting template with ID:", params.id)
    const success = await deleteTemplate(params.id)
    
    if (success) {
      console.log("Template deleted successfully")
      return NextResponse.json({ success: true, message: "Template deleted successfully" })
    } else {
      console.error("Failed to delete template")
      return NextResponse.json(
        { success: false, error: "Failed to delete template" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete template" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log("Applying template with ID:", params.id)
    
    if (body.action === 'apply') {
      const success = await applyTemplateToSettings(params.id)
      
      if (success) {
        console.log("Template applied successfully")
        return NextResponse.json({ success: true, message: "Template applied successfully" })
      } else {
        console.error("Failed to apply template")
        return NextResponse.json(
          { success: false, error: "Failed to apply template" },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error applying template:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to apply template" },
      { status: 500 }
    )
  }
} 