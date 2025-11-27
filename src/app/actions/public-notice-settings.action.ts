/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { prisma as db } from "@/db/prisma"
import { PublicNoticeSettings } from "@/types/types"

export async function getPublicNoticeSettings(): Promise<PublicNoticeSettings | null> {
  try {
    const settings = await db.publicNoticeSettings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      console.log("No settings found, creating default settings...")
      return await createPublicNoticeSettings({
        title: "Smart Notice Board",
        subtitle: "Information Technology Department",
        emergencyNumber: "01734528367",
        emergencyContact: "Md. Rashid Al Asif",
        departmentName: "Information Technology Department",
        backgroundType: "gradient",
        gradientColors: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
        headerBackgroundColor: "#1e293b",
        footerBackgroundColor: "#1e293b",
        accentColor: "#3b82f6",
        fontColor: "#ffffff"
      })
    }
    
    // Convert null values to undefined to match the type
    return {
      ...settings,
      backgroundType: settings.backgroundType as 'solid' | 'gradient' | 'image',
      logo: settings.logo ?? undefined,
      logoFileName: settings.logoFileName ?? undefined,
      backgroundColor: settings.backgroundColor ?? undefined,
      gradientColors: Array.isArray(settings.gradientColors) ? settings.gradientColors as string[] : undefined,
      backgroundImage: settings.backgroundImage ?? undefined,
      backgroundImageFileName: settings.backgroundImageFileName ?? undefined,
    }
  } catch (error) {
    console.error("Error fetching public notice settings:", error)
    return null
  }
}

export async function createPublicNoticeSettings(data: Partial<PublicNoticeSettings>): Promise<PublicNoticeSettings | null> {
  try {
    console.log("Creating new public notice settings with data:", JSON.stringify(data, null, 2))
    
    const createData = {
        title: data.title || "Smart Notice Board",
        subtitle: data.subtitle || "Information Technology Department",
        emergencyNumber: data.emergencyNumber || "01734528367",
        emergencyContact: data.emergencyContact || "Md. Rashid Al Asif",
        departmentName: data.departmentName || "Information Technology Department",
        backgroundType: data.backgroundType || "gradient",
        backgroundColor: data.backgroundColor,
        gradientColors: data.gradientColors,
        backgroundImage: data.backgroundImage,
        backgroundImageFileName: data.backgroundImageFileName,
        headerBackgroundColor: data.headerBackgroundColor || "#1e293b",
        footerBackgroundColor: data.footerBackgroundColor || "#1e293b",
        accentColor: data.accentColor || "#3b82f6",
        fontColor: data.fontColor || "#ffffff",
        logo: data.logo,
        logoFileName: data.logoFileName,
      }
    
    console.log("Create data:", JSON.stringify(createData, null, 2))
    
    const settings = await db.publicNoticeSettings.create({
      data: createData
    })
    
    console.log("Settings created successfully:", settings.id)
    // Convert null values to undefined to match the type
    return {
      ...settings,
      backgroundType: settings.backgroundType as 'solid' | 'gradient' | 'image',
      logo: settings.logo ?? undefined,
      logoFileName: settings.logoFileName ?? undefined,
      backgroundColor: settings.backgroundColor ?? undefined,
      gradientColors: Array.isArray(settings.gradientColors) ? settings.gradientColors as string[] : undefined,
      backgroundImage: settings.backgroundImage ?? undefined,
      backgroundImageFileName: settings.backgroundImageFileName ?? undefined,
    }
  } catch (error) {
    console.error("Error creating public notice settings:", error)
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return null
  }
}

export async function updatePublicNoticeSettings(data: Partial<PublicNoticeSettings>): Promise<PublicNoticeSettings | null> {
  try {
    console.log("Starting updatePublicNoticeSettings with data:", JSON.stringify(data, null, 2))
    
    // Check if settings exist
    const existingSettings = await db.publicNoticeSettings.findFirst()
    console.log("Existing settings found:", existingSettings ? "Yes" : "No")
    
    if (existingSettings) {
      console.log("Updating existing settings with ID:", existingSettings.id)
      // Update existing settings - only include fields that are provided
      const updateData: any = {}
      
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
      if (data.fontColor !== undefined) updateData.fontColor = data.fontColor
      if (data.logo !== undefined) updateData.logo = data.logo
      if (data.logoFileName !== undefined) updateData.logoFileName = data.logoFileName
      
      console.log("Update data:", JSON.stringify(updateData, null, 2))
      
      const settings = await db.publicNoticeSettings.update({
        where: { id: existingSettings.id },
        data: updateData
      })
      console.log("Settings updated successfully:", settings.id)
      // Convert null values to undefined to match the type
      return {
        ...settings,
        backgroundType: settings.backgroundType as 'solid' | 'gradient' | 'image',
        logo: settings.logo ?? undefined,
        logoFileName: settings.logoFileName ?? undefined,
        backgroundColor: settings.backgroundColor ?? undefined,
        gradientColors: Array.isArray(settings.gradientColors) ? settings.gradientColors as string[] : undefined,
        backgroundImage: settings.backgroundImage ?? undefined,
        backgroundImageFileName: settings.backgroundImageFileName ?? undefined,
      }
    } else {
      console.log("No existing settings found, creating new settings")
      // Create new settings if none exist
      return await createPublicNoticeSettings(data)
    }
  } catch (error) {
    console.error("Error updating public notice settings:", error)
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return null
  }
}

export async function uploadImage(file: File): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`
    
    return { success: true, data: dataUrl }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { success: false, error: "Failed to upload image" }
  }
} 