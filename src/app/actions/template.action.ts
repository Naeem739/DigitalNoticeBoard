"use server"

import { prisma as db } from "@/db/prisma"
import { PublicNoticeTemplate } from "@/types/types"
import { DashboardTemplate } from "@/types/template-types"

export async function getAllTemplates(): Promise<PublicNoticeTemplate[]> {
  try {
    const templates = await db.publicNoticeTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return templates.map(template => ({
      ...template,
      backgroundType: template.backgroundType as 'solid' | 'gradient' | 'image',
      logo: template.logo ?? undefined,
      logoFileName: template.logoFileName ?? undefined,
      backgroundColor: template.backgroundColor ?? undefined,
      gradientColors: Array.isArray(template.gradientColors) ? template.gradientColors as string[] : undefined,
      backgroundImage: template.backgroundImage ?? undefined,
      backgroundImageFileName: template.backgroundImageFileName ?? undefined,
    }))
  } catch (error) {
    console.error("Error fetching templates:", error)
    return []
  }
}

export async function getTemplateById(id: string): Promise<PublicNoticeTemplate | null> {
  try {
    const template = await db.publicNoticeTemplate.findUnique({
      where: { id }
    })
    
    if (!template) return null
    
    return {
      ...template,
      backgroundType: template.backgroundType as 'solid' | 'gradient' | 'image',
      logo: template.logo ?? undefined,
      logoFileName: template.logoFileName ?? undefined,
      backgroundColor: template.backgroundColor ?? undefined,
      gradientColors: Array.isArray(template.gradientColors) ? template.gradientColors as string[] : undefined,
      backgroundImage: template.backgroundImage ?? undefined,
      backgroundImageFileName: template.backgroundImageFileName ?? undefined,
    }
  } catch (error) {
    console.error("Error fetching template:", error)
    return null
  }
}

export async function createTemplate(data: Omit<PublicNoticeTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PublicNoticeTemplate | null> {
  try {
    const template = await db.publicNoticeTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        logo: data.logo,
        logoFileName: data.logoFileName,
        title: data.title,
        subtitle: data.subtitle,
        emergencyNumber: data.emergencyNumber,
        emergencyContact: data.emergencyContact,
        departmentName: data.departmentName,
        backgroundType: data.backgroundType,
        backgroundColor: data.backgroundColor,
        gradientColors: data.gradientColors,
        backgroundImage: data.backgroundImage,
        backgroundImageFileName: data.backgroundImageFileName,
        headerBackgroundColor: data.headerBackgroundColor,
        footerBackgroundColor: data.footerBackgroundColor,
        accentColor: data.accentColor,
      }
    })
    
    return {
      ...template,
      backgroundType: template.backgroundType as 'solid' | 'gradient' | 'image',
      logo: template.logo ?? undefined,
      logoFileName: template.logoFileName ?? undefined,
      backgroundColor: template.backgroundColor ?? undefined,
      gradientColors: Array.isArray(template.gradientColors) ? template.gradientColors as string[] : undefined,
      backgroundImage: template.backgroundImage ?? undefined,
      backgroundImageFileName: template.backgroundImageFileName ?? undefined,
    }
  } catch (error) {
    console.error("Error creating template:", error)
    return null
  }
}

export async function updateTemplate(id: string, data: Partial<PublicNoticeTemplate>): Promise<PublicNoticeTemplate | null> {
  try {
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.logo !== undefined) updateData.logo = data.logo
    if (data.logoFileName !== undefined) updateData.logoFileName = data.logoFileName
    if (data.title !== undefined) updateData.title = data.title
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
    if (data.emergencyNumber !== undefined) updateData.emergencyNumber = data.emergencyNumber
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact
    if (data.departmentName !== undefined) updateData.departmentName = data.departmentName
    if (data.backgroundType !== undefined) updateData.backgroundType = data.backgroundType
    if (data.backgroundColor !== undefined) updateData.backgroundColor = data.backgroundColor
    if (data.gradientColors !== undefined) updateData.gradientColors = data.gradientColors
    if (data.backgroundImage !== undefined) updateData.backgroundImage = data.backgroundImage
    if (data.backgroundImageFileName !== undefined) updateData.backgroundImageFileName = data.backgroundImageFileName
    if (data.headerBackgroundColor !== undefined) updateData.headerBackgroundColor = data.headerBackgroundColor
    if (data.footerBackgroundColor !== undefined) updateData.footerBackgroundColor = data.footerBackgroundColor
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor

    const template = await db.publicNoticeTemplate.update({
      where: { id },
      data: updateData
    })
    
    return {
      ...template,
      backgroundType: template.backgroundType as 'solid' | 'gradient' | 'image',
      logo: template.logo ?? undefined,
      logoFileName: template.logoFileName ?? undefined,
      backgroundColor: template.backgroundColor ?? undefined,
      gradientColors: Array.isArray(template.gradientColors) ? template.gradientColors as string[] : undefined,
      backgroundImage: template.backgroundImage ?? undefined,
      backgroundImageFileName: template.backgroundImageFileName ?? undefined,
    }
  } catch (error) {
    console.error("Error updating template:", error)
    return null
  }
}

export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    await db.publicNoticeTemplate.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error("Error deleting template:", error)
    return false
  }
}

export async function applyTemplateToSettings(templateId: string): Promise<boolean> {
  try {
    const template = await db.publicNoticeTemplate.findUnique({
      where: { id: templateId }
    })
    
    if (!template) return false
    
    // Update the public notice settings with template data
    await db.publicNoticeSettings.upsert({
      where: { id: 'default' }, // Assuming there's a default settings record
      update: {
        logo: template.logo,
        logoFileName: template.logoFileName,
        title: template.title,
        subtitle: template.subtitle,
        emergencyNumber: template.emergencyNumber,
        emergencyContact: template.emergencyContact,
        departmentName: template.departmentName,
        backgroundType: template.backgroundType,
        backgroundColor: template.backgroundColor,
        gradientColors: template.gradientColors,
        backgroundImage: template.backgroundImage,
        backgroundImageFileName: template.backgroundImageFileName,
        headerBackgroundColor: template.headerBackgroundColor,
        footerBackgroundColor: template.footerBackgroundColor,
        accentColor: template.accentColor,
      },
      create: {
        id: 'default',
        logo: template.logo,
        logoFileName: template.logoFileName,
        title: template.title,
        subtitle: template.subtitle,
        emergencyNumber: template.emergencyNumber,
        emergencyContact: template.emergencyContact,
        departmentName: template.departmentName,
        backgroundType: template.backgroundType,
        backgroundColor: template.backgroundColor,
        gradientColors: template.gradientColors,
        backgroundImage: template.backgroundImage,
        backgroundImageFileName: template.backgroundImageFileName,
        headerBackgroundColor: template.headerBackgroundColor,
        footerBackgroundColor: template.footerBackgroundColor,
        accentColor: template.accentColor,
      }
    })
    
    return true
  } catch (error) {
    console.error("Error applying template:", error)
    return false
  }
}

// Dashboard Template CRUD Operations
export async function getAllDashboardTemplates(): Promise<DashboardTemplate[]> {
  try {
    const templates = await db.template.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || "",
      widgets: template.widgets as any[],
      layout: template.layout as any[],
      widgetSettings: template.widgetSettings as Record<string, any>
    }))
  } catch (error) {
    console.error("Error fetching dashboard templates:", error)
    return []
  }
}

export async function getDashboardTemplateById(id: string): Promise<DashboardTemplate | null> {
  try {
    const template = await db.template.findUnique({
      where: { id }
    })
    
    if (!template) return null
    
    return {
      id: template.id,
      name: template.name,
      description: template.description || "",
      widgets: template.widgets as any[],
      layout: template.layout as any[],
      widgetSettings: template.widgetSettings as Record<string, any>
    }
  } catch (error) {
    console.error("Error fetching dashboard template:", error)
    return null
  }
}

export async function checkTemplateNameExists(name: string, excludeId?: string): Promise<boolean> {
  try {
    const whereClause: any = { name }
    if (excludeId) {
      whereClause.id = { not: excludeId }
    }
    
    const existingTemplate = await db.template.findFirst({
      where: whereClause
    })
    
    return !!existingTemplate
  } catch (error) {
    console.error("Error checking template name:", error)
    return false
  }
}

export async function createDashboardTemplate(data: Omit<DashboardTemplate, 'id'>, replaceExisting?: boolean): Promise<{ success: boolean; template?: DashboardTemplate; error?: string }> {
  try {
    // Validate required fields
    if (!data.name || !data.widgets || !data.layout || !data.widgetSettings) {
      return { success: false, error: "Missing required template data" }
    }

    // Clean widgets data to ensure they're serializable
    const cleanedWidgets = data.widgets.map(widget => {
      const cleanedWidget = { ...widget }
      
      // If this is an image widget, ensure images don't contain File objects
      if (widget.type === 'image' && widget.images) {
        cleanedWidget.images = widget.images.map(image => ({
          id: image.id,
          url: image.url,
          title: image.title,
          dbId: image.dbId
          // Explicitly exclude the 'file' property
        }))
      }
      
      return cleanedWidget
    })

    // Check if template name already exists
    const nameExists = await checkTemplateNameExists(data.name)
    
    if (nameExists && !replaceExisting) {
      return { 
        success: false, 
        error: "DUPLICATE_NAME",
        template: null 
      }
    }
    
    let template
    if (nameExists && replaceExisting) {
      // Find and update existing template
      const existingTemplate = await db.template.findFirst({
        where: { name: data.name }
      })
      
      if (existingTemplate) {
        template = await db.template.update({
          where: { id: existingTemplate.id },
          data: {
            description: data.description,
            widgets: cleanedWidgets,
            layout: data.layout,
            widgetSettings: data.widgetSettings
          }
        })
      }
    } else {
      // Create new template
      template = await db.template.create({
      data: {
        name: data.name,
        description: data.description,
        widgets: cleanedWidgets,
        layout: data.layout,
        widgetSettings: data.widgetSettings
      }
    })
    }
    
    if (!template) {
      return { success: false, error: "Failed to save template" }
    }
    
    return {
      success: true,
      template: {
      id: template.id,
      name: template.name,
      description: template.description || "",
      widgets: template.widgets as any[],
      layout: template.layout as any[],
      widgetSettings: template.widgetSettings as Record<string, any>
      }
    }
  } catch (error) {
    console.error("Error creating dashboard template:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('payload')) {
        return { success: false, error: "Invalid template data - contains non-serializable content" }
      }
      return { success: false, error: error.message }
    }
    
    return { success: false, error: "Database error" }
  }
}

export async function updateDashboardTemplate(id: string, data: Partial<DashboardTemplate>): Promise<DashboardTemplate | null> {
  try {
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.widgets !== undefined) updateData.widgets = data.widgets
    if (data.layout !== undefined) updateData.layout = data.layout
    if (data.widgetSettings !== undefined) updateData.widgetSettings = data.widgetSettings

    const template = await db.template.update({
      where: { id },
      data: updateData
    })
    
    return {
      id: template.id,
      name: template.name,
      description: template.description || "",
      widgets: template.widgets as any[],
      layout: template.layout as any[],
      widgetSettings: template.widgetSettings as Record<string, any>
    }
  } catch (error) {
    console.error("Error updating dashboard template:", error)
    return null
  }
}

export async function deleteDashboardTemplate(id: string): Promise<boolean> {
  try {
    await db.template.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error("Error deleting dashboard template:", error)
    return false
  }
}
