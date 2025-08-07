import { NextResponse } from "next/server"
import { createTemplate } from "@/app/actions/template.action"

export async function POST() {
  try {
    console.log("Creating sample templates...")
    
    const sampleTemplates = [
      {
        name: "Professional Dark",
        description: "A professional dark theme with blue accents",
        title: "Smart Notice Board",
        subtitle: "Information Technology Department",
        emergencyNumber: "01734528367",
        emergencyContact: "Md. Rashid Al Asif",
        departmentName: "Information Technology Department",
        backgroundType: "gradient" as const,
        gradientColors: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
        headerBackgroundColor: "#1e293b",
        footerBackgroundColor: "#1e293b",
        accentColor: "#3b82f6"
      },
      {
        name: "Corporate Blue",
        description: "A corporate blue theme for professional environments",
        title: "Corporate Notice Board",
        subtitle: "Business Administration",
        emergencyNumber: "01734528367",
        emergencyContact: "Admin Department",
        departmentName: "Business Administration",
        backgroundType: "gradient" as const,
        gradientColors: ["#0c4a6e", "#075985", "#0369a1", "#0284c7", "#0ea5e9"],
        headerBackgroundColor: "#0c4a6e",
        footerBackgroundColor: "#0c4a6e",
        accentColor: "#0ea5e9"
      },
      {
        name: "Modern Purple",
        description: "A modern purple theme with elegant styling",
        title: "Modern Notice Board",
        subtitle: "Creative Department",
        emergencyNumber: "01734528367",
        emergencyContact: "Creative Team",
        departmentName: "Creative Department",
        backgroundType: "gradient" as const,
        gradientColors: ["#1e1b4b", "#312e81", "#4338ca", "#6366f1", "#8b5cf6"],
        headerBackgroundColor: "#1e1b4b",
        footerBackgroundColor: "#1e1b4b",
        accentColor: "#8b5cf6"
      },
      {
        name: "Clean White",
        description: "A clean white theme for minimal design",
        title: "Clean Notice Board",
        subtitle: "Design Department",
        emergencyNumber: "01734528367",
        emergencyContact: "Design Team",
        departmentName: "Design Department",
        backgroundType: "solid" as const,
        backgroundColor: "#ffffff",
        headerBackgroundColor: "#f8fafc",
        footerBackgroundColor: "#f8fafc",
        accentColor: "#3b82f6"
      }
    ]
    
    const createdTemplates = []
    
    for (const template of sampleTemplates) {
      const created = await createTemplate(template)
      if (created) {
        createdTemplates.push(created)
        console.log(`Created template: ${created.name}`)
      }
    }
    
    console.log(`Successfully created ${createdTemplates.length} sample templates`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Created ${createdTemplates.length} sample templates`,
      templates: createdTemplates
    })
  } catch (error) {
    console.error("Error creating sample templates:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create sample templates" },
      { status: 500 }
    )
  }
} 