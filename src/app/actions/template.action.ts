"use server"

import { revalidatePath } from "next/cache"
// import { db } from "@/lib/db"
// import type { DashboardTemplate } from "@/types/types"
import { prisma } from "@/db/prisma"
import { DashboardTemplate } from "@/types/template-types"

// Existing createDashboard function...

/**
 * Save a template to the database
 */
export async function saveTemplate(template: DashboardTemplate) {
  try {
    // Save template to database
    await prisma.template.create({
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        // Store the complex objects as JSON strings
        widgets: JSON.stringify(template.widgets),
        layout: JSON.stringify(template.layout),
        widgetSettings: JSON.stringify(template.widgetSettings),
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error saving template:", error)
    return { success: false, error }
  }
}

/**
 * Get all templates from the database
 */
export async function getTemplates() {
  try {
    const dbTemplates = await prisma.template.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    // Convert the JSON strings back to objects
    const templates = dbTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      widgets: JSON.parse(template.widgets as string),
      layout: JSON.parse(template.layout as string),
      widgetSettings: JSON.parse(template.widgetSettings as string),
    }))

    return { success: true, templates }
  } catch (error) {
    console.error("Error getting templates:", error)
    return { success: false, error, templates: [] }
  }
}
