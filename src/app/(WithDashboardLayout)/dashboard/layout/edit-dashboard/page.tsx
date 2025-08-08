"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import GridLayout, { type Layout } from "react-grid-layout"
import {
  Plus,
  X,
  ChevronDown,
  Settings,
  Palette,
  Type,
  ListFilter,
  Layers,
  GripVertical,
  Box,
  LayoutIcon,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "./edit-dashboard.css"
import type { AspectRatio, TNotice, Widget, WidgetSettings, DashboardTemplate } from "@/types/template-types"
import { getCategoriesWithNotices } from "@/app/actions/category.action"
import { getAllTemplates, createTemplate, getAllDashboardTemplates, createDashboardTemplate, updateDashboardTemplate, deleteDashboardTemplate } from "@/app/actions/template.action"
import { createDashboard, getAllDashboards } from "@/app/actions/dashboard.action"
// import { createImage } from "@/app/actions/image.action"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SpinningBellLoader, WaveLoader } from "@/components/ui/loader"
import { localStorageUtils } from "@/lib/utils"

// Client-only wrapper for GridLayout to prevent hydration issues
const ClientOnlyGridLayout = ({ children, ...props }: any) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="layout flex items-center justify-center" style={{ height: '400px' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return <GridLayout {...props}>{children}</GridLayout>;
};

type TCategoriesWithNotices = {
  id: string
  name: string
  notices: TNotice[]
}

type TResult = {
  success: boolean
  result: TCategoriesWithNotices[]
}

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  // Appearance Settings
  backgroundColor: "#ffffff",
  backgroundOpacity: 0.95,
  cardOpacity: 1.0,
  borderColor: "#e2e8f0",
  borderWidth: 1,
  
  // Typography Settings
  fontColor: "#1e293b",
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: "normal",
  
  // Content Settings
  noticeCount: 5,
  autoScroll: true,
  showFullContent: false,
  
  // Category Settings
  categoryFont: "Inter",
  categoryFontSize: 14,
  categoryFontWeight: "semibold",
  categoryFontColor: "#374151",
  categoryBackgroundColor: "#f9fafb",
  categoryHeight: 36,
  categoryBorderColor: "#d1d5db",
  categoryBorderWidth: 1,
  customCategoryName: "",
  
  // Image widget settings (kept for type compatibility)
  imageFit: "cover",
  imageBorderRadius: 8,
  showImageTitle: true,
  imageTitleColor: "#1e293b",
  imageTitleFontSize: 14,
  imageTitleFontWeight: "medium",
}

const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "4:3": { width: 800, height: 600 },
  "16:9": { width: 960, height: 540 },
  "16:10": { width: 960, height: 600 },
  "21:9": { width: 1050, height: 450 },
}

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, opacity: number) => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Add this type for the settings tabs
type SettingsTab = "style" | "typography" | "content" | "category"

// Add widget type enum
type WidgetType = "notice"

// Extend Widget type to include widget type
interface ExtendedWidget extends Widget {
  type?: WidgetType
}

// Add this before the EditDashboardDemo component
const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "style", label: "Appearance", icon: <Palette size={16} /> },
  { id: "typography", label: "Typography", icon: <Type size={16} /> },
  { id: "content", label: "Content", icon: <Box size={16} /> },
  { id: "category", label: "Category", icon: <ListFilter size={16} /> },
]

// Define the template type

// Dynamic template loading - no hardcoded templates

function EditDashboardDemo() {
  const [widgets, setWidgets] = useState<ExtendedWidget[]>([])
  const [layout, setLayout] = useState<Layout[]>([])
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null)
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false)
  const [categories, setCategories] = useState<TCategoriesWithNotices[]>([])
  const [activeSettingsWidget, setActiveSettingsWidget] = useState<string | null>(null)
  const [widgetSettings, setWidgetSettings] = useState<Record<string, WidgetSettings>>({})

  // New state for draggable settings panel
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const settingsRef = useRef<HTMLDivElement>(null)

  // Inside the EditDashboardDemo component, add this state
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>("style")
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false)

  // First, add a new state for custom templates and template modal
  // Add these after the existing state declarations (around line 370)

  const [customTemplates, setCustomTemplates] = useState<DashboardTemplate[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [canCreateTemplate, setCanCreateTemplate] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  
  // Add state for confirmation dialog
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [pendingSavedState, setPendingSavedState] = useState<any>(null)
  
  // Add state for loading existing dashboard
  const [isLoadingExistingDashboard, setIsLoadingExistingDashboard] = useState(false)

  // Add useEffect to load saved state on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const dashboardId = urlParams.get('id')
    
    // Don't show confirmation dialog if we're loading an existing dashboard
    if (dashboardId) {
      return
    }
    
    const savedState = localStorageUtils.getItem('dashboardState')
    
    if (savedState) {
      try {
        const { selectedRatio: savedRatio, widgets: savedWidgets, layout: savedLayout } = savedState
        
        // Check if there was previous content (widgets or layout)
        if (savedWidgets && savedWidgets.length > 0 || savedLayout && savedLayout.length > 0) {
          // Show confirmation dialog instead of clearing immediately
          setPendingSavedState(savedState)
          setShowConfirmationDialog(true)
        } else {
          // No previous content, just load the ratio
          setSelectedRatio(savedRatio)
          localStorageUtils.removeItem('dashboardState')
        }
      } catch (error) {
        console.error('Error loading saved dashboard state:', error)
        localStorageUtils.removeItem('dashboardState')
      }
    }
  }, [])

  // Add useEffect to save state whenever it changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    if (widgets.length > 0 || layout.length > 0) {
      // Create a lightweight version of widgets without large file data
      const lightweightWidgets = widgets.map(widget => ({
        ...widget,
          // Don't include file, url (base64 data), or other large properties
      }))
      
      const stateToSave = {
        widgets: lightweightWidgets,
        layout,
        selectedRatio,
        widgetSettings
      }
      
      const success = localStorageUtils.setItem('dashboardState', stateToSave)
      if (!success) {
        console.warn('Failed to save dashboard state to localStorage (quota exceeded or data too large)')
      }
    } else if (selectedRatio) {
      // Only save the selected ratio if no widgets exist
      const stateToSave = {
        selectedRatio
      }
      const success = localStorageUtils.setItem('dashboardState', stateToSave)
      if (!success) {
        console.warn('Failed to save dashboard state to localStorage')
      }
    }
  }, [widgets, layout, selectedRatio, widgetSettings])

  // Add function to clear saved state
  const clearSavedState = () => {
    localStorageUtils.removeItem('dashboardState')
  }

  // Handle confirmation dialog actions
  const handleConfirmClear = () => {
    if (pendingSavedState) {
      // Load only the ratio, clear everything else
      setSelectedRatio(pendingSavedState.selectedRatio)
    }
    localStorageUtils.removeItem('dashboardState')
    setShowConfirmationDialog(false)
    setPendingSavedState(null)
  }

  const handleCancelClear = () => {
    if (pendingSavedState) {
      // Load the saved state (widgets will be lightweight version)
      setWidgets(pendingSavedState.widgets || [])
      setLayout(pendingSavedState.layout || [])
      setSelectedRatio(pendingSavedState.selectedRatio)
      setWidgetSettings(pendingSavedState.widgetSettings || {})
      
      // Check if there are image widgets that need to be re-uploaded
      const hasImageWidgets = pendingSavedState.widgets?.some((widget: any) => 
        widget.type === 'image' && widget.images?.length > 0
      )
      
      if (hasImageWidgets) {
        toast.info("Dashboard restored! Note: Image widgets need to be re-uploaded due to storage limitations.")
      } else {
        toast.success("Dashboard restored successfully!")
      }
    }
    setShowConfirmationDialog(false)
    setPendingSavedState(null)
  }

  useEffect(() => {
    const getData = async () => {
      const categoriesWithNotices = (await getCategoriesWithNotices()) as TResult
      if (categoriesWithNotices.success) {
        setCategories(categoriesWithNotices.result as TCategoriesWithNotices[])
      }
    }

    getData()
  }, [])

  // Load existing dashboard data if ID is provided in URL
  useEffect(() => {
    const loadExistingDashboard = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return
      
      const urlParams = new URLSearchParams(window.location.search)
      const dashboardId = urlParams.get('id')
      
      if (dashboardId) {
        try {
          setIsLoadingExistingDashboard(true)
          const response = await fetch('/api/dashboard/get-by-id/' + dashboardId)
          const data = await response.json()
          
          if (data.success && data.result) {
            const dashboard = data.result
            
            // Set the aspect ratio
            setSelectedRatio(dashboard.aspectRatio as AspectRatio)
            
            // Convert containers to widgets and layout
            const newWidgets: ExtendedWidget[] = []
            const newLayout: Layout[] = []
            const newWidgetSettings: Record<string, WidgetSettings> = {}
            
            // First, collect all notice and image IDs from containers
            const allNoticeIds: string[] = []
            const allImageIds: string[] = []
            
            dashboard.containers.forEach((container: any) => {
              if (container.type === "image" && container.imageIds) {
                allImageIds.push(...container.imageIds)
              } else if (container.noticeIds) {
                allNoticeIds.push(...container.noticeIds)
              }
            })
            
            // Fetch all notices and images in parallel
            const [noticesResponse, imagesResponse] = await Promise.all([
              allNoticeIds.length > 0 ? fetch('/api/notice/get-all') : Promise.resolve(null),
              allImageIds.length > 0 ? fetch('/api/image/get-all') : Promise.resolve(null)
            ])
            
            const noticesData = noticesResponse ? await noticesResponse.json() : { success: false, result: [] }
            const imagesData = imagesResponse ? await imagesResponse.json() : { success: false, result: [] }
            
            const allNotices = noticesData.success ? noticesData.result : []
            const allImages = imagesData.success ? imagesData.result : []
            
            dashboard.containers.forEach((container: any, index: number) => {
              const widgetId = container.id
              
              // Get notices for this widget
              const widgetNotices = container.noticeIds 
                ? allNotices.filter((notice: any) => container.noticeIds.includes(notice.id))
                : []
              
              // Get images for this widget
              const widgetImages = container.type === 'image' && container.imageIds
                ? allImages.filter((image: any) => container.imageIds.includes(image.id))
                : []
              
              // Create widget with actual content
              const widget: ExtendedWidget = {
                id: widgetId,
                title: container.title || `Widget ${index + 1}`,
                type: container.type || 'notice',
                content: container.title,
                category: container.category,
                categoryId: container.categoryId,
                notices: widgetNotices,
                topNotices: widgetNotices.slice(0, container.settings?.noticeCount || 3),
                images: container.type === 'image' ? widgetImages.map((img: any) => ({
                  id: img.id,
                  url: img.imageUrl,
                  title: img.title,
                  file: new File([], img.title), // Placeholder file object
                  dbId: img.id
                })) : undefined
              }
              
              newWidgets.push(widget)
              
              // Create layout item
              const layoutItem: Layout = {
                i: widgetId,
                x: container.x,
                y: container.y,
                w: container.w,
                h: container.h
              }
              
              newLayout.push(layoutItem)
              
              // Set widget settings
              if (container.settings) {
                newWidgetSettings[widgetId] = {
                  ...DEFAULT_WIDGET_SETTINGS,
                  ...container.settings
                }
              } else {
                newWidgetSettings[widgetId] = { ...DEFAULT_WIDGET_SETTINGS }
              }
            })
            
            setWidgets(newWidgets)
            setLayout(newLayout)
            setWidgetSettings(newWidgetSettings)
            
            toast.success('Existing dashboard loaded successfully!')
          }
        } catch (error) {
          console.error('Error loading existing dashboard:', error)
          toast.error('Failed to load existing dashboard')
          // Redirect back to view page if dashboard not found
          setTimeout(() => {
            window.location.href = `/dashboard/view-dashboard/${dashboardId}`
          }, 2000)
        } finally {
          setIsLoadingExistingDashboard(false)
        }
      }
    }

    loadExistingDashboard()
  }, [])

  // Add event handlers for dragging the settings panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = settingsPosition.x + (e.clientX - startPosition.x)
      const newY = settingsPosition.y + (e.clientY - startPosition.y)

      setSettingsPosition({ x: newX, y: newY })
      setStartPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, startPosition, settingsPosition])

  // Reset settings position when opening for a new widget
  useEffect(() => {
    if (activeSettingsWidget && settingsRef.current) {
      // Position it near the current widget but ensure it's visible
      const widgetElement = document.getElementById(activeSettingsWidget)
      if (widgetElement) {
        const rect = widgetElement.getBoundingClientRect()
        setSettingsPosition({
          x: Math.min(rect.right, window.innerWidth - 300),
          y: Math.max(rect.top, 100),
        })
      } else {
        // Default position if widget not found
        setSettingsPosition({ x: window.innerWidth / 2 - 150, y: 100 })
      }
    }
  }, [activeSettingsWidget])

  // Add this useEffect to check if template creation should be enabled
  // Add after the other useEffect hooks

  useEffect(() => {
    // Enable template creation if there's at least one widget
    setCanCreateTemplate(widgets.length > 0)
  }, [widgets, layout])

  // Load templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await getAllDashboardTemplates()
        setTemplates(templates || [])
      } catch (error) {
        console.error("Error loading templates:", error)
        toast.error("Failed to load templates")
      }
    }

    loadTemplates()
  }, [])

  // Database template saving function
  const saveTemplate = async (template: DashboardTemplate) => {
    try {
      const result = await createDashboardTemplate(template)
      if (result) {
        setTemplates(prev => [...prev, result])
        return { success: true }
      } else {
        return { success: false, message: "Failed to save template" }
      }
    } catch (error) {
      console.error("Error saving template:", error)
      return { success: false, message: error }
    }
  }

  // Template management functions
  const handleEditTemplate = (template: DashboardTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setShowEditModal(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        const success = await deleteDashboardTemplate(templateId)
        if (success) {
          setTemplates(prev => prev.filter(t => t.id !== templateId))
          toast.success("Template deleted successfully!")
        } else {
          toast.error("Failed to delete template")
        }
      } catch (error) {
        console.error("Error deleting template:", error)
        toast.error("Error deleting template")
      }
    }
  }

  const handleViewTemplate = (template: DashboardTemplate) => {
    setSelectedTemplate(template)
    setShowViewModal(true)
  }

  const handleViewAllTemplates = () => {
    setShowViewAllModal(true)
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    try {
      const updatedTemplate: DashboardTemplate = {
        ...editingTemplate,
        name: templateName,
        description: templateDescription,
        widgets: [...widgets],
        layout: [...layout],
        widgetSettings: { ...widgetSettings }
      }

      const result = await updateDashboardTemplate(editingTemplate.id, updatedTemplate)
      if (result) {
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? result : t
        ))
        
        setShowEditModal(false)
        setEditingTemplate(null)
        setTemplateName("")
        setTemplateDescription("")
        toast.success("Template updated successfully!")
      } else {
        toast.error("Failed to update template")
      }
    } catch (error) {
      console.error("Error updating template:", error)
      toast.error("Error updating template")
    }
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
  }

  const addWidget = (type: WidgetType = "notice") => {
    if (!selectedRatio) return

    const newWidgetId = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newWidget: ExtendedWidget = {
      id: newWidgetId,
      title: `Widget ${widgets.length + 1}`,
      type: type,
    }

    const newLayout: Layout = {
      i: newWidget.id,
      x: (layout.length * 2) % 12, // Updated to use 12 columns
      y: Number.POSITIVE_INFINITY,
      w: 4, // Adjusted for 12 columns
      h: 4, // Adjusted for smaller rowHeight
    }

    // Initialize settings for this widget
    setWidgetSettings((prev) => ({
      ...prev,
      [newWidgetId]: { ...DEFAULT_WIDGET_SETTINGS },
    }))

    setWidgets([...widgets, newWidget])
    setLayout([...layout, newLayout])

    toast.success(`${type === "image" ? "Image" : ""} Widget added successfully!`)
  }

  const removeWidget = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    const updatedWidgets = widgets.filter((widget) => widget.id !== id)
    const updatedLayout = layout.filter((item) => item.i !== id)

    // Also remove settings for this widget
    const updatedSettings = { ...widgetSettings }
    delete updatedSettings[id]

    setWidgets(updatedWidgets)
    setLayout(updatedLayout)
    setWidgetSettings(updatedSettings)
    setActiveSettingsWidget(null)

    toast.success("Widget removed")
  }

  const handleRatioSelect = (ratio: AspectRatio) => {
    setSelectedRatio(ratio)
    setIsRatioDropdownOpen(false)
    
    // Instead of clearing everything, adjust the layout to fit the new ratio
    if (layout.length > 0) {
      const newLayout = layout.map(item => {
        // Keep the same relative position but ensure it fits within the new dimensions
        const newX = Math.min(item.x, 11) // Ensure x doesn't exceed 11 (12 columns - 1)
        const newY = Math.min(item.y, 11) // Ensure y doesn't exceed 11
        const newW = Math.min(item.w, 12 - newX) // Ensure width fits within remaining space
        const newH = Math.min(item.h, 12 - newY) // Ensure height fits within remaining space
        
        return {
          ...item,
          x: newX,
          y: newY,
          w: newW,
          h: newH
        }
      })
      
      setLayout(newLayout)
      toast(`Display ratio adjusted to ${ratio} while preserving widgets`)
    } else {
      toast(`Display ratio set to ${ratio}`)
    }
  }

  const handleDragStart2 = (e: React.DragEvent, category: TCategoriesWithNotices) => {
    e.dataTransfer.setData("categoryId", category.id)
    e.dataTransfer.setData("categoryName", category.name)
  }

  const handleDrop = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault()
    const categoryId = e.dataTransfer.getData("categoryId")
    const categoryName = e.dataTransfer.getData("categoryName")

    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return

    // Get top N notices from the category based on widget settings
    const noticeCount = widgetSettings[widgetId]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount
    // Limit the number of notices to prevent overflow
    const topNotices = [...category.notices].slice(0, noticeCount)

    setWidgets(
      widgets.map((widget) =>
        widget.id === widgetId
          ? {
              ...widget,
              content: categoryName,
              categoryId: categoryId,
              category: categoryName,
              notices: category.notices,
              topNotices: topNotices,
            }
          : widget,
      ),
    )

    // Initialize custom category name if not already set
    if (!widgetSettings[widgetId]?.customCategoryName) {
      setWidgetSettings((prev) => ({
        ...prev,
        [widgetId]: {
          ...prev[widgetId],
          customCategoryName: "",
        },
      }))
    }

    toast.success(`Added ${categoryName} to widget`)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }



  const calculateDimensionsPercentage = (widgetLayout: Layout) => {
    if (!selectedRatio) return { width: "0%", height: "0%" }

    const containerWidth = RATIO_DIMENSIONS[selectedRatio].width - 32
    const containerHeight = RATIO_DIMENSIONS[selectedRatio].height

    const colWidth = (containerWidth - 11 * 12 * 2) / 12 // Updated for 12 columns
    const rowHeight = 50 // Match the new rowHeight

    const widgetWidth = ((widgetLayout.w * colWidth + (widgetLayout.w - 1) * 24) / containerWidth) * 100
    const widgetHeight = ((widgetLayout.h * rowHeight + (widgetLayout.h - 1) * 24) / containerHeight) * 100

    return {
      width: `${widgetWidth.toFixed(1)}%`,
      height: `${widgetHeight.toFixed(1)}%`,
    }
  }

  const handleSave = async () => {
    const positions = calculatePercentagePositions()
    const urlParams = new URLSearchParams(window.location.search)
    const dashboardId = urlParams.get('id')
    
    const dashboard = {
      aspectRatio: selectedRatio,
      containers: [...positions],
    }

    try {
      let result
      if (dashboardId) {
        // Update existing dashboard
        result = await fetch(`/api/dashboard/update/${dashboardId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dashboard)
        })
        const data = await result.json()
        if (data.success) {
          clearSavedState() // Clear saved state after successful save
          toast.success("Dashboard Updated Successfully!")
        } else {
          toast.error("Failed to update dashboard!")
        }
      } else {
        // Create new dashboard
        result = await createDashboard(dashboard)
      if (result.success) {
        clearSavedState() // Clear saved state after successful save
        toast.success("Dashboard Created Successfully!")
      } else {
        toast.error("Something went wrong!")
        }
      }
    } catch (error) {
      toast.error(`${error}`)
    }
  }

  const calculatePercentagePositions = () => {
    const containers = widgets
      .map((widget) => {
        const specificLayout = layout.filter((item) => widget.id === item.i)[0]
        if (!specificLayout) return null

        const containerWidth = RATIO_DIMENSIONS[selectedRatio || "4:3"].width - 32
        const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height

        const colWidth = (containerWidth - 11 * 12 * 2) / 12 // Updated for 12 columns
        const rowHeight = 50 // Match the new rowHeight

        const leftPx = specificLayout.x * (colWidth + 24)
        const topPx = specificLayout.y * (rowHeight + 24)

        const leftPercent = (leftPx / containerWidth) * 100
        const topPercent = (topPx / containerHeight) * 100

        const widgetWidth = ((specificLayout.w * colWidth + (specificLayout.w - 1) * 24) / containerWidth) * 100
        const widgetHeight = ((specificLayout.h * rowHeight + (specificLayout.h - 1) * 24) / containerHeight) * 100

        // Get complete widget settings or use defaults
        const settings = widgetSettings[widget.id] || DEFAULT_WIDGET_SETTINGS

          // For notice widgets, include notice data
        const noticeIds = widget.topNotices ? widget.topNotices.map((notice) => notice.id) : []

        return {
          id: specificLayout.i,
          x: specificLayout.x,
          y: specificLayout.y,
          w: specificLayout.w,
          h: specificLayout.h,
          leftPx: `${leftPx.toFixed(1)}px`,
          topPx: `${topPx.toFixed(1)}px`,
          leftPercent: `${leftPercent.toFixed(2)}%`,
          topPercent: `${topPercent.toFixed(2)}%`,
          width: `${widgetWidth.toFixed(2)}%`,
          height: `${widgetHeight.toFixed(2)}%`,
          title: widget.content || widget.title,
          category: widget.category,
            type: "notice",
          noticeIds: noticeIds,
          settings: {
            // Include all settings properties explicitly to ensure nothing is missed
            backgroundColor: settings.backgroundColor,
            backgroundOpacity: settings.backgroundOpacity,
            cardOpacity: settings.cardOpacity,
            borderColor: settings.borderColor,
            borderWidth: settings.borderWidth,
            fontColor: settings.fontColor,
            noticeCount: settings.noticeCount,
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            fontWeight: settings.fontWeight,
            autoScroll: settings.autoScroll,
            showFullContent: settings.showFullContent,
            // New category styling properties
            categoryFont: settings.categoryFont,
            categoryFontSize: settings.categoryFontSize,
            categoryFontWeight: settings.categoryFontWeight,
            categoryFontColor: settings.categoryFontColor,
            categoryBackgroundColor: settings.categoryBackgroundColor,
            categoryHeight: settings.categoryHeight,
            categoryBorderColor: settings.categoryBorderColor,
            categoryBorderWidth: settings.categoryBorderWidth,
            // Custom category name
            customCategoryName: settings.customCategoryName,
          },
        }
      })
      .filter(Boolean)

    return containers
  }

  const toggleWidgetSettings = (widgetId: string) => {
    if (activeSettingsWidget === widgetId) {
      setActiveSettingsWidget(null)
    } else {
      setActiveSettingsWidget(widgetId)
    }
  }

  const updateWidgetSetting = (widgetId: string, setting: keyof WidgetSettings, value: any) => {
    setWidgetSettings((prev) => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        [setting]: value,
      },
    }))

    // If this is a notice count change and the widget has a category, update topNotices
    if (setting === "noticeCount") {
      const widget = widgets.find((w) => w.id === widgetId)
      if (widget && widget.notices) {
        const topNotices = [...widget.notices].slice(0, value)
        setWidgets(
          widgets.map((w) =>
            w.id === widgetId
              ? {
                  ...w,
                  topNotices: topNotices,
                }
              : w,
          ),
        )
      }
    }
  }

  const getPresetColors = () => [
    "#ffffff",
    "#f8fafc",
    "#f1f5f9",
    "#e2e8f0",
    "#cbd5e1",
    "#94a3b8",
    "#64748b",
    "#1e293b",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#10b981",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
  ]

  // Replace the handleSaveTemplate function with this implementation
  // Around line 650

  const handleSaveTemplate = () => {
    setIsTemplateModalOpen(true)
  }

  // Add this new function to save the custom template
  // Add after handleSaveTemplate

  const saveCustomTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    const newTemplateId = `custom-template-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create a deep copy of the current widgets and settings
    const templateWidgets = JSON.parse(JSON.stringify(widgets))
    const templateLayout = JSON.parse(JSON.stringify(layout))
    const templateSettings = JSON.parse(JSON.stringify(widgetSettings))

    const newTemplate: DashboardTemplate = {
      id: newTemplateId,
      name: newTemplateName,
      description: newTemplateDescription || "Custom template",
      widgets: templateWidgets,
      layout: templateLayout,
      widgetSettings: templateSettings,
    }

    // Add loading state
    setIsSavingTemplate(true)

    try {
      // Save to database
      const result = await saveTemplate(newTemplate)

      if (result.success) {
        // Update local state
        setCustomTemplates([...customTemplates, newTemplate])
        setIsTemplateModalOpen(false)
        setNewTemplateName("")
        setNewTemplateDescription("")
        toast.success(`Template "${newTemplateName}" saved successfully!`)
      } else {
        toast.error("Failed to save template to database")
      }
    } catch (error) {
      toast.error(`Error saving template: ${error}`)
    } finally {
      setIsSavingTemplate(false)
    }
  }

  useEffect(() => {
    const autoScrollWidgets = widgets.filter((widget) => widgetSettings[widget.id]?.autoScroll)

    const scrollIntervals = autoScrollWidgets.map((widget) => {
      const element = document.getElementById(widget.id)
      if (!element) return null

      const noticesContainer = element.querySelector(".notices-container")
      if (!noticesContainer) return null

      let scrollPosition = 0
      let isScrollingDown = true
      const scrollSpeed = 1
      const maxScroll = noticesContainer.scrollHeight - noticesContainer.clientHeight

      const interval = setInterval(() => {
        if (isScrollingDown) {
          scrollPosition += scrollSpeed
          if (scrollPosition >= maxScroll) {
            isScrollingDown = false
          }
        } else {
          scrollPosition -= scrollSpeed
          if (scrollPosition <= 0) {
            isScrollingDown = true
          }
        }

        noticesContainer.scrollTop = scrollPosition
      }, 30)

      return interval
    })

    return () => {
      scrollIntervals.forEach((interval) => {
        if (interval) clearInterval(interval)
      })
    }
  }, [widgets, widgetSettings])

  // Calculate the maximum height for notices container based on widget size
  const calculateNoticesContainerHeight = (widgetLayout: Layout | undefined, widgetType?: WidgetType) => {
    if (!widgetLayout) return 200 // Default height

    // Calculate based on widget height
    const rowHeight = 50 // Match the new rowHeight
    const widgetHeight = widgetLayout.h * rowHeight

    // For image widgets, reserve much less space for a very compact layout
    const reservedSpace = widgetType === "image" ? 50 : 120 // Much reduced space for image widgets

    return Math.max(80, widgetHeight - reservedSpace) // Ensure minimum height of 80px
  }

  // Add this function inside the EditDashboardDemo component
  const applyTemplate = (template: DashboardTemplate) => {
    // Create a map of existing widget notices based on position
    const existingNotices = new Map(
      widgets.map((widget, index) => [index, {
        notices: widget.notices,
        topNotices: widget.topNotices,
        category: widget.category,
        categoryId: widget.categoryId,
        content: widget.content
      }])
    )

    // Apply template while preserving notices
    const newWidgets = template.widgets.map((templateWidget, index) => {
      const existingData = existingNotices.get(index)
      return {
        ...templateWidget,
        notices: existingData?.notices || [],
        topNotices: existingData?.topNotices || [],
        category: existingData?.category || templateWidget.title,
        categoryId: existingData?.categoryId || '',
        content: existingData?.content || templateWidget.title
      }
    })

    // Update widget settings to include notice count from existing widgets
    const newWidgetSettings = { ...template.widgetSettings }
    widgets.forEach((widget, index) => {
      if (newWidgetSettings[template.widgets[index]?.id]) {
        newWidgetSettings[template.widgets[index].id] = {
          ...newWidgetSettings[template.widgets[index].id],
          noticeCount: widgetSettings[widget.id]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount
        }
      }
    })

    setWidgets(newWidgets)
    setLayout(template.layout)
    setWidgetSettings(newWidgetSettings)
    toast.success(`Applied "${template.name}" Template while preserving notices!`)
  }

  const createDashboardFromTemplate = async (template: DashboardTemplate) => {
    if (!selectedRatio) {
      toast.error("Please select a display ratio first")
      return
    }

    // Apply template without preserving notices
    setWidgets(template.widgets)
    setLayout(template.layout)
    setWidgetSettings(template.widgetSettings)

    // Wait a moment for the state to update
    setTimeout(async () => {
      try {
        const positions = calculatePercentagePositions()
        const dashboard = {
          aspectRatio: selectedRatio,
          containers: [...positions],
          templateId: template.id,
          templateName: template.name,
        }

        const result = await createDashboard(dashboard)
        if (result.success) {
          toast.success(`Dashboard Created from "${template.name}" Template!`)
        } else {
          toast.error("Something went wrong!")
        }
      } catch (error) {
        toast.error(`${error}`)
      }
    }, 500)
  }

  const isEditing = new URLSearchParams(window.location.search).get('id') !== null

  // Get localStorage usage info
  const [storageUsage, setStorageUsage] = useState<{ used: number; available: number; total: number } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const usage = localStorageUtils.getUsageInfo()
      setStorageUsage(usage)
    }
  }, [])

  // Template management state
  const [templates, setTemplates] = useState<DashboardTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  
  // Enhanced template management state
  const [showViewAllModal, setShowViewAllModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<DashboardTemplate | null>(null)

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Header for editing mode */}
      {isEditing && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Editing Existing Dashboard</h2>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            You are editing an existing dashboard. Make your changes and click "Update Dashboard" to save.
          </p>
          {isLoadingExistingDashboard && (
            <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700">
              <SpinningBellLoader size="sm" />
              <span>Loading dashboard content...</span>
            </div>
          )}
        </div>
      )}

      {/* localStorage Usage Indicator */}
      {storageUsage && (
        <div className={`mb-4 p-3 rounded-lg border ${
          storageUsage.used / storageUsage.total > 0.8 
            ? 'bg-red-50 border-red-200' 
            : storageUsage.used / storageUsage.total > 0.6 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              storageUsage.used / storageUsage.total > 0.8 
                ? 'text-red-700' 
                : storageUsage.used / storageUsage.total > 0.6 
                ? 'text-yellow-700' 
                : 'text-green-700'
            }`}>
              Local Storage Usage: {((storageUsage.used / storageUsage.total) * 100).toFixed(1)}%
            </span>
            <span className={`text-xs ${
              storageUsage.used / storageUsage.total > 0.8 
                ? 'text-red-600' 
                : storageUsage.used / storageUsage.total > 0.6 
                ? 'text-yellow-600' 
                : 'text-green-600'
            }`}>
              {((storageUsage.used / 1024 / 1024)).toFixed(2)}MB / {((storageUsage.total / 1024 / 1024)).toFixed(2)}MB
            </span>
          </div>
          {storageUsage.used / storageUsage.total > 0.8 && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Storage is nearly full. Consider removing some widgets or clearing saved data.
            </p>
          )}
        </div>
      )}
      {/* Minimal Confirmation Dialog */}
      {showConfirmationDialog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Unsaved Changes
                </h3>
                <p className="text-sm text-gray-500">
                  You have a previous dashboard. What would you like to do?
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirmClear}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start Fresh
                </button>
                <button
                  onClick={handleCancelClear}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Restore Previous
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-4">
        {isEditing && (
          <Link href={`/dashboard/view-dashboard/${new URLSearchParams(window.location.search).get('id')}`}>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to View
            </Button>
          </Link>
        )}
        <div className="relative">
          <button
            onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 transition-all shadow hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              Select Display {selectedRatio ? `(${selectedRatio})` : ""}
              <ChevronDown size={16} />
            </span>
          </button>
          {isRatioDropdownOpen && (
            <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              {(["4:3", "16:9", "16:10", "21:9"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleRatioSelect(ratio)}
                  className="block w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors"
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
        <button
            onClick={() => addWidget("notice")}
          disabled={!selectedRatio}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ${
            selectedRatio ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
            <Plus size={20} /> Create Notice Widget
        </button>
        </div>

        

        



        <button
          onClick={handleSave}
          disabled={!selectedRatio || widgets.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ml-auto ${
            selectedRatio && widgets.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {new URLSearchParams(window.location.search).get('id') ? 'Update Dashboard' : 'Save Dashboard'}
        </button>
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Draggable Categories:</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart2(e, category)}
              className="bg-indigo-50 px-3 py-1 rounded-md cursor-move hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              {category.name} ({category.notices.length} notices)
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Dashboard Area - Left Side (3/4 width) */}
        <div className="xl:col-span-3">
      {selectedRatio && (
        <div
          className="border-4 border-dashed border-gray-300 rounded-lg mx-auto overflow-hidden bg-white p-4"
          style={{
            width: RATIO_DIMENSIONS[selectedRatio].width,
            height: RATIO_DIMENSIONS[selectedRatio].height,
          }}
        >
          <ClientOnlyGridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={50}
            width={RATIO_DIMENSIONS[selectedRatio].width - 32}
            onLayoutChange={(newLayout: Layout[]) => setLayout(newLayout)}
            margin={[12, 12]}
            draggableHandle=".widget-drag-handle"
          >
            {widgets.map((widget) => {
              const widgetLayout = layout.find((l) => l.i === widget.id)
              const dimensions = widgetLayout
                ? calculateDimensionsPercentage(widgetLayout)
                : { width: "0%", height: "0%" }
              const settings = widgetSettings[widget.id] || DEFAULT_WIDGET_SETTINGS

              // Generate background color with opacity
              const bgColor = hexToRgba(settings.backgroundColor, settings.backgroundOpacity)
              const cardBgColor = hexToRgba(settings.backgroundColor, settings.cardOpacity)

              // Generate category background color
              const categoryBgColor =
                settings.categoryBackgroundColor || DEFAULT_WIDGET_SETTINGS.categoryBackgroundColor

              // Calculate the appropriate height for notices container
              const noticesContainerHeight = calculateNoticesContainerHeight(widgetLayout, widget.type)

              return (
                <div
                  id={widget.id}
                  key={widget.id}
                  className="rounded-lg shadow-md relative"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: settings.borderColor,
                    borderWidth: `${settings.borderWidth}px`,
                    borderStyle: "solid",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden", // Prevent content from overflowing the widget
                  }}
                  onDrop={(e) => handleDrop(e, widget.id)}
                  onDragOver={handleDragOver}
                >
                  <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md z-10">
                    {dimensions.width} × {dimensions.height}
                  </div>

                  <div className="absolute top-2 right-10 z-10">
                    <button
                      onClick={() => toggleWidgetSettings(widget.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Settings size={20} className="text-gray-600" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => removeWidget(e, widget.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                  >
                    <X size={20} className="text-red-500" />
                  </button>

                  <div
                    className="widget-drag-handle cursor-move p-2 flex-shrink-0"
                    style={{
                      backgroundColor: categoryBgColor,
                      height: `${settings.categoryHeight}px`,
                      borderBottom:
                        settings.categoryBorderWidth > 0
                          ? `${settings.categoryBorderWidth}px solid ${settings.categoryBorderColor}`
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <h3
                      className="text-lg font-semibold text-center"
                      style={{
                        color: settings.categoryFontColor,
                        fontFamily: settings.categoryFont,
                        fontSize: `${settings.categoryFontSize}px`,
                        fontWeight: settings.categoryFontWeight,
                      }}
                    >
                      {settings.customCategoryName || widget.content || widget.title}
                      {widget.topNotices && widget.topNotices.length > 0 && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {widget.topNotices.length} notices
                        </span>
                      )}
                      {widget.images && widget.images.length > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {widget.images.length} image{widget.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Widget Content - Flex grow to fill available space */}
                  <div className="p-2 flex-grow flex flex-col overflow-hidden">
                    {/* Notice Widget Content */}
                    {widget.topNotices ? (
                      <div className="flex flex-col h-full">
                        <div className="bg-indigo-50 py-1 px-2 rounded mb-2 text-center flex-shrink-0">
                          <span className="text-sm font-medium text-indigo-600">
                            Top {widget.topNotices.length} Notices
                          </span>
                        </div>
                        <div
                          className="notices-container flex-grow overflow-auto"
                          style={{
                            height: `${noticesContainerHeight}px`,
                            maxHeight: `${noticesContainerHeight}px`,
                          }}
                        >
                          <div className="space-y-2">
                            {widget.topNotices.map((notice) => (
                              <div
                                key={notice.id}
                                className="rounded shadow p-2"
                                style={{
                                  backgroundColor: cardBgColor,
                                  borderLeft: `3px solid ${settings.borderColor}`,
                                  fontFamily: settings.fontFamily,
                                }}
                              >
                                <p
                                  className="text-sm font-medium"
                                  style={{
                                    color: settings.fontColor,
                                    fontSize: `${settings.fontSize}px`,
                                    fontWeight: settings.fontWeight,
                                    wordBreak: "break-word", // Prevent long words from overflowing
                                  }}
                                >
                                  {notice.title}
                                </p>
                                {settings.showFullContent && notice.content && (
                                  <p
                                    className="text-xs mt-1"
                                    style={{
                                      color: settings.fontColor,
                                      opacity: 0.7,
                                      fontFamily: settings.fontFamily,
                                      wordBreak: "break-word", // Prevent long words from overflowing
                                    }}
                                  >
                                    {notice.content}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {widget.notices && (
                          <p
                            className="text-xs mt-1 text-right flex-shrink-0"
                            style={{ color: settings.fontColor, opacity: 0.6 }}
                          >
                            Total: {widget.notices.length} notices
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center h-full border-2 border-dashed rounded-lg"
                        style={{
                          borderColor: settings.fontColor,
                          opacity: 0.4,
                          fontFamily: settings.fontFamily,
                        }}
                      >
                        <p style={{ color: settings.fontColor }}>Drag a category here</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
                      </ClientOnlyGridLayout>
        </div>
      )}
        </div>

        {/* Template Section - Right Side (1/4 width) */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Templates</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleViewAllTemplates}
                  className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  View All
                </button>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Current
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                {/* Removed Types dropdown menu */}
                <button
                  onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                  className="p-1 border border-gray-300 rounded text-xs"
                >
                  {viewMode === "list" ? "Grid" : "List"}
                </button>
              </div>
            </div>

            {/* Templates List */}
            <div className="space-y-2">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">No templates available</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first template</p>
                </div>
              ) : (
                <div className={`space-y-2 max-h-96 overflow-y-auto ${
                  viewMode === "grid" ? "grid grid-cols-1 gap-2" : ""
                }`}>
                  {templates
                    .filter(template => 
                      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((template) => (
                      <div
                        key={template.id}
                        className={`border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all ${
                          viewMode === "grid" ? "text-center" : ""
                        }`}
                      >
                        {viewMode === "grid" ? (
                          <div className="space-y-2">
                            <div className="w-full h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-2"></div>
                            <h4 className="font-medium text-gray-900 text-sm truncate">{template.name}</h4>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => applyTemplate(template)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                              {template.description && (
                                <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {template.widgets.length} widgets
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleViewTemplate(template)}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                                title="View Template"
                              >
                                View
                              </button>
                              <button
                                onClick={() => applyTemplate(template)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                title="Apply Template"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => handleEditTemplate(template)}
                                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                                title="Edit Template"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                title="Delete Template"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Settings Modal */}
      {activeSettingsWidget && (
        <div
          ref={settingsRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-[500px] max-h-[85vh] flex flex-col backdrop-blur-sm"
          style={{
            left: `${settingsPosition.x}px`,
            top: `${settingsPosition.y}px`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-gray-200"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GripVertical size={18} className="text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-lg">Widget Settings</h4>
            </div>
            <button
              onClick={() => setActiveSettingsWidget(null)}
              className="hover:bg-gray-200 rounded-full p-2 transition-colors duration-200"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    activeSettingsTab === tab.id
                      ? "text-blue-700 border-b-2 border-blue-600 bg-white shadow-sm"
                      : "text-gray-600 hover:bg-white hover:text-gray-800"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content with proper scrolling */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {/* Style Tab */}
            {activeSettingsTab === "style" && (
              <div className="space-y-8">
                {/* Background Settings */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Palette size={18} className="text-blue-600" /> Background
                  </label>
                  <div className="space-y-3">
                    {/* Background Color */}
                    <div>
                      <span className="text-xs font-medium text-gray-600 block mb-3">Color</span>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "backgroundColor", color)}
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: color,
                          outline:
                            widgetSettings[activeSettingsWidget]?.backgroundColor === color
                              ? "2px solid #3b82f6"
                              : "none",
                        }}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      value={
                        widgetSettings[activeSettingsWidget]?.backgroundColor || DEFAULT_WIDGET_SETTINGS.backgroundColor
                      }
                      onChange={(e) => updateWidgetSetting(activeSettingsWidget, "backgroundColor", e.target.value)}
                          className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform"
                    />
                  </div>
                </div>

                    {/* Background Opacity */}
                <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">Opacity</span>
                        <span className="text-xs font-semibold text-blue-600">
                          {Math.round(
                            (widgetSettings[activeSettingsWidget]?.backgroundOpacity ||
                              DEFAULT_WIDGET_SETTINGS.backgroundOpacity) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={
                          widgetSettings[activeSettingsWidget]?.backgroundOpacity ||
                          DEFAULT_WIDGET_SETTINGS.backgroundOpacity
                        }
                        onChange={(e) =>
                          updateWidgetSetting(
                            activeSettingsWidget,
                            "backgroundOpacity",
                            Number.parseFloat(e.target.value),
                          )
                        }
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Border Settings */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Box size={18} className="text-blue-600" /> Border
                  </label>
                  <div className="space-y-3">
                    {/* Border Color */}
                    <div>
                      <span className="text-xs font-medium text-gray-600 block mb-3">Color</span>
                    <div className="flex flex-wrap gap-1">
                      {getPresetColors().map((color) => (
                        <button
                          key={color}
                          onClick={() => updateWidgetSetting(activeSettingsWidget, "borderColor", color)}
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: color,
                            outline:
                              widgetSettings[activeSettingsWidget]?.borderColor === color
                                ? "2px solid #3b82f6"
                                : "none",
                          }}
                          title={color}
                        />
                      ))}
                        <input
                          type="color"
                          value={
                            widgetSettings[activeSettingsWidget]?.borderColor || DEFAULT_WIDGET_SETTINGS.borderColor
                          }
                          onChange={(e) => updateWidgetSetting(activeSettingsWidget, "borderColor", e.target.value)}
                          className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform"
                        />
                    </div>
                    </div>

                    {/* Border Width */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">Width</span>
                        <span className="text-xs font-semibold text-blue-600">
                          {widgetSettings[activeSettingsWidget]?.borderWidth || DEFAULT_WIDGET_SETTINGS.borderWidth}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={widgetSettings[activeSettingsWidget]?.borderWidth || DEFAULT_WIDGET_SETTINGS.borderWidth}
                        onChange={(e) =>
                          updateWidgetSetting(activeSettingsWidget, "borderWidth", Number.parseInt(e.target.value))
                        }
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Opacity */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Layers size={18} className="text-blue-600" /> Card Opacity
                  </label>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-600">Transparency</span>
                    <span className="text-xs font-semibold text-blue-600">
                      {Math.round(
                        (widgetSettings[activeSettingsWidget]?.cardOpacity || DEFAULT_WIDGET_SETTINGS.cardOpacity) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={widgetSettings[activeSettingsWidget]?.cardOpacity || DEFAULT_WIDGET_SETTINGS.cardOpacity}
                    onChange={(e) =>
                      updateWidgetSetting(activeSettingsWidget, "cardOpacity", Number.parseFloat(e.target.value))
                    }
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeSettingsTab === "typography" && (
              <div className="space-y-6">
                {/* Font Color */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Type size={16} /> Text Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "fontColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: color,
                          outline:
                            widgetSettings[activeSettingsWidget]?.fontColor === color ? "2px solid #3b82f6" : "none",
                        }}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      value={widgetSettings[activeSettingsWidget]?.fontColor || DEFAULT_WIDGET_SETTINGS.fontColor}
                      onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontColor", e.target.value)}
                      className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform"
                    />
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Type size={16} /> Font Family
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.fontFamily || DEFAULT_WIDGET_SETTINGS.fontFamily}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontFamily", e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="Inter">Inter (Modern)</option>
                    <option value="Arial">Arial (Classic)</option>
                    <option value="Helvetica">Helvetica (Clean)</option>
                    <option value="Times New Roman">Times New Roman (Traditional)</option>
                    <option value="Georgia">Georgia (Elegant)</option>
                    <option value="Verdana">Verdana (Readable)</option>
                    <option value="system-ui">System UI (Native)</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Type size={16} /> Font Size
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Size</span>
                    <span className="text-xs text-gray-600">
                      {widgetSettings[activeSettingsWidget]?.fontSize || DEFAULT_WIDGET_SETTINGS.fontSize}px
                    </span>
                  </div>
                    <input
                      type="range"
                    min="10"
                      max="24"
                      value={widgetSettings[activeSettingsWidget]?.fontSize || DEFAULT_WIDGET_SETTINGS.fontSize}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "fontSize", Number.parseInt(e.target.value))
                      }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                {/* Font Weight */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Type size={16} /> Font Weight
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.fontWeight || DEFAULT_WIDGET_SETTINGS.fontWeight}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontWeight", e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="normal">Normal (400)</option>
                    <option value="medium">Medium (500)</option>
                    <option value="semibold">Semibold (600)</option>
                    <option value="bold">Bold (700)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeSettingsTab === "content" && (
              <div className="space-y-6">
                {/* Notice Count */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <ListFilter size={16} /> Display Settings
                  </label>
                  <div className="space-y-4">
                    {/* Number of Notices */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Number of Notices</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount}
                        </span>
                      </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={widgetSettings[activeSettingsWidget]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "noticeCount", Number.parseInt(e.target.value))
                      }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                {/* Auto Scroll Toggle */}
                <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Auto Scroll</span>
                    <button
                      onClick={() =>
                        updateWidgetSetting(
                          activeSettingsWidget,
                          "autoScroll",
                          !(widgetSettings[activeSettingsWidget]?.autoScroll || false),
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        widgetSettings[activeSettingsWidget]?.autoScroll ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          widgetSettings[activeSettingsWidget]?.autoScroll ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Automatically scroll through notices when content overflows
                      </p>
                </div>

                {/* Show Full Content Toggle */}
                <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Show Full Content</span>
                    <button
                      onClick={() =>
                        updateWidgetSetting(
                          activeSettingsWidget,
                          "showFullContent",
                          !(widgetSettings[activeSettingsWidget]?.showFullContent || false),
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        widgetSettings[activeSettingsWidget]?.showFullContent ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          widgetSettings[activeSettingsWidget]?.showFullContent ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Display complete notice content instead of truncated text
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Tab */}
            {activeSettingsTab === "category" && (
              <div className="space-y-6">
                {/* Category Name Editing */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Edit size={16} /> Category Name
                  </label>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">Display Name</span>
                      <input
                        type="text"
                        value={widgetSettings[activeSettingsWidget]?.customCategoryName || ""}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "customCategoryName", e.target.value)}
                        placeholder="Enter custom category name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Leave empty to use the original category name
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Styling */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <ListFilter size={16} /> Category Styling
                  </label>
              <div className="space-y-4">
                {/* Category Background Color */}
                <div>
                      <span className="text-xs text-gray-500 block mb-2">Background Color</span>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                            onClick={() =>
                              updateWidgetSetting(activeSettingsWidget, "categoryBackgroundColor", color)
                            }
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: color,
                          outline:
                            widgetSettings[activeSettingsWidget]?.categoryBackgroundColor === color
                              ? "2px solid #3b82f6"
                              : "none",
                        }}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      value={
                        widgetSettings[activeSettingsWidget]?.categoryBackgroundColor ||
                        DEFAULT_WIDGET_SETTINGS.categoryBackgroundColor
                      }
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "categoryBackgroundColor", e.target.value)
                      }
                          className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform"
                    />
                  </div>
                </div>

                {/* Category Height */}
                <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Height</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.categoryHeight || DEFAULT_WIDGET_SETTINGS.categoryHeight}px
                        </span>
                      </div>
                    <input
                      type="range"
                        min="24"
                        max="60"
                        value={widgetSettings[activeSettingsWidget]?.categoryHeight || DEFAULT_WIDGET_SETTINGS.categoryHeight}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "categoryHeight", Number.parseInt(e.target.value))
                      }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    </div>
                  </div>
                </div>

                {/* Category Typography */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Type size={16} /> Category Typography
                  </label>
                  <div className="space-y-4">
                    {/* Category Font Color */}
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">Text Color</span>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "categoryFontColor", color)}
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: color,
                          outline:
                            widgetSettings[activeSettingsWidget]?.categoryFontColor === color
                              ? "2px solid #3b82f6"
                              : "none",
                        }}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      value={
                        widgetSettings[activeSettingsWidget]?.categoryFontColor ||
                        DEFAULT_WIDGET_SETTINGS.categoryFontColor
                      }
                          onChange={(e) =>
                            updateWidgetSetting(activeSettingsWidget, "categoryFontColor", e.target.value)
                          }
                          className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform"
                    />
                  </div>
                </div>

                {/* Category Font Family */}
                <div>
                      <span className="text-xs text-gray-500 block mb-2">Font Family</span>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.categoryFont || DEFAULT_WIDGET_SETTINGS.categoryFont}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFont", e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Inter">Inter (Modern)</option>
                        <option value="Arial">Arial (Classic)</option>
                        <option value="Helvetica">Helvetica (Clean)</option>
                        <option value="Times New Roman">Times New Roman (Traditional)</option>
                        <option value="Georgia">Georgia (Elegant)</option>
                        <option value="Verdana">Verdana (Readable)</option>
                        <option value="system-ui">System UI (Native)</option>
                  </select>
                </div>

                {/* Category Font Size */}
                <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Font Size</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.categoryFontSize ||
                            DEFAULT_WIDGET_SETTINGS.categoryFontSize}
                          px
                        </span>
                      </div>
                    <input
                      type="range"
                        min="10"
                        max="20"
                      value={
                        widgetSettings[activeSettingsWidget]?.categoryFontSize ||
                        DEFAULT_WIDGET_SETTINGS.categoryFontSize
                      }
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "categoryFontSize", Number.parseInt(e.target.value))
                      }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                </div>

                {/* Category Font Weight */}
                <div>
                      <span className="text-xs text-gray-500 block mb-2">Font Weight</span>
                  <select
                    value={
                      widgetSettings[activeSettingsWidget]?.categoryFontWeight ||
                      DEFAULT_WIDGET_SETTINGS.categoryFontWeight
                    }
                        onChange={(e) =>
                          updateWidgetSetting(activeSettingsWidget, "categoryFontWeight", e.target.value)
                        }
                        className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="normal">Normal (400)</option>
                        <option value="medium">Medium (500)</option>
                        <option value="semibold">Semibold (600)</option>
                        <option value="bold">Bold (700)</option>
                  </select>
                    </div>
                  </div>
                </div>

                {/* Category Border */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Box size={16} /> Category Border
                  </label>
                  <div className="space-y-3">
                    {/* Category Border Color */}
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">Border Color</span>
                    <div className="flex flex-wrap gap-1">
                      {getPresetColors().map((color) => (
                        <button
                          key={color}
                            onClick={() =>
                              updateWidgetSetting(activeSettingsWidget, "categoryBorderColor", color)
                            }
                            className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: color,
                            outline:
                              widgetSettings[activeSettingsWidget]?.categoryBorderColor === color
                                ? "2px solid #3b82f6"
                                : "none",
                          }}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={
                          widgetSettings[activeSettingsWidget]?.categoryBorderColor ||
                          DEFAULT_WIDGET_SETTINGS.categoryBorderColor
                        }
                        onChange={(e) =>
                          updateWidgetSetting(activeSettingsWidget, "categoryBorderColor", e.target.value)
                        }
                          className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform"
                      />
                    </div>
                    </div>

                    {/* Category Border Width */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Border Width</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.categoryBorderWidth ||
                            DEFAULT_WIDGET_SETTINGS.categoryBorderWidth}
                          px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={
                          widgetSettings[activeSettingsWidget]?.categoryBorderWidth ||
                          DEFAULT_WIDGET_SETTINGS.categoryBorderWidth
                        }
                        onChange={(e) =>
                          updateWidgetSetting(
                            activeSettingsWidget,
                            "categoryBorderWidth",
                            Number.parseInt(e.target.value),
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}


                </div>


                </div>
      )}

      {/* Template Save Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
                    <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                    </button>
                </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                    <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Describe your template..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Template Preview</p>
                      <p className="text-blue-600 mt-1">
                        {widgets.length} widgets • {layout.length} layout items
                      </p>
                </div>
              </div>
                </div>
          </div>

              <div className="flex gap-3 mt-6">
          <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!templateName.trim()) {
                      toast.error("Please enter a template name");
                      return;
                    }
                    
                    try {
                      const newTemplate: DashboardTemplate = {
                        id: `template-${Date.now()}`,
                        name: templateName,
                        description: templateDescription,
                        widgets: [...widgets],
                        layout: [...layout],
                        widgetSettings: { ...widgetSettings }
                      };
                      
                      const result = await saveTemplate(newTemplate);
                      if (result.success) {
                        setTemplates([...templates, newTemplate]);
                        setShowTemplateModal(false);
                        setTemplateName("");
                        setTemplateDescription("");
                        toast.success("Template saved successfully!");
                      } else {
                        toast.error("Failed to save template");
                      }
                    } catch (error) {
                      toast.error("Error saving template");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Templates Modal */}
      {showViewAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">All Templates</h3>
            <button
                  onClick={() => setShowViewAllModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                  <X size={24} />
            </button>
          </div>
        </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h4>
                  <p className="text-gray-500">Create your first template to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewTemplate(template)}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      {/* Template Preview - Same structure as View modal */}
                      <div className="w-full flex justify-center mb-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-2" style={{ width: 240, minHeight: 160 }}>
                          <div className="relative w-full h-full">
                            {template.layout.map((layoutItem) => {
                              const widget = template.widgets.find(w => w.id === layoutItem.i)
                              const settings = template.widgetSettings?.[widget?.id] || DEFAULT_WIDGET_SETTINGS
                              if (!widget) return null
                              
                              // Generate background colors
                              const bgColor = hexToRgba(settings.backgroundColor, settings.backgroundOpacity)
                              const cardBgColor = hexToRgba(settings.backgroundColor, settings.cardOpacity)
                              const categoryBgColor = settings.categoryBackgroundColor || DEFAULT_WIDGET_SETTINGS.categoryBackgroundColor
                              
                              return (
                                <div
                                  key={widget.id}
                                  className="rounded-lg shadow-md absolute"
                                  style={{
                                    left: `${(layoutItem.x / 12) * 100}%`,
                                    top: `${layoutItem.y * 4}px`,
                                    width: `${(layoutItem.w / 12) * 100}%`,
                                    height: `${layoutItem.h * 25}px`,
                                    backgroundColor: bgColor,
                                    borderColor: settings.borderColor,
                                    borderWidth: `${settings.borderWidth}px`,
                                    borderStyle: "solid",
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%",
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* Widget Header */}
                                  <div
                                    className="p-1 flex-shrink-0"
                                    style={{
                                      backgroundColor: categoryBgColor,
                                      height: `${Math.min(settings.categoryHeight, 20)}px`,
                                      borderBottom: settings.categoryBorderWidth > 0
                                        ? `${settings.categoryBorderWidth}px solid ${settings.categoryBorderColor}`
                                        : "none",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <div
                                      className="text-xs font-semibold text-center"
                                      style={{
                                        color: settings.categoryFontColor,
                                        fontFamily: settings.categoryFont,
                                        fontSize: `${Math.min(settings.categoryFontSize, 10)}px`,
                                        fontWeight: settings.categoryFontWeight,
                                      }}
                                    >
                                      {/* Empty title - just structure */}
                                    </div>
                                  </div>

                                  {/* Widget Content */}
                                  <div className="p-1 flex-grow flex flex-col overflow-hidden">
                                    <div className="space-y-1 flex-grow overflow-y-auto">
                                      {/* Render empty notice placeholders */}
                                      {Array.from({ length: 2 }).map((_, index) => (
                                        <div
                                          key={index}
                                          className="rounded shadow p-1"
                                          style={{
                                            backgroundColor: cardBgColor,
                                            borderLeft: `2px solid ${settings.borderColor}`,
                                            fontFamily: settings.fontFamily,
                                            height: '20px', // Smaller height for preview
                                          }}
                                        >
                                          {/* Empty notice - just structure */}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      {/* End Template Preview */}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.widgets.length} widgets</span>
                        <span>{template.layout.length} layout items</span>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => applyTemplate(template)}
                          className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          Apply Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingTemplate(null)
                    setTemplateName("")
                    setTemplateDescription("")
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                </label>
                <input
                  type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                </label>
                <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe your template..."
                  rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Update Current Dashboard</p>
                      <p className="text-yellow-600 mt-1">
                        This will update the template with your current dashboard layout and settings.
                      </p>
                    </div>
                  </div>
              </div>
            </div>

              <div className="flex gap-3 mt-6">
              <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingTemplate(null)
                    setTemplateName("")
                    setTemplateDescription("")
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                  onClick={handleUpdateTemplate}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                  Update Template
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {showViewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Template Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedTemplate.name}</h4>
                  {selectedTemplate.description && (
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  )}
                </div>
                {/* Render real widgets preview */}
                <div className="w-full flex justify-center">
                  <div className="bg-white border border-gray-200 rounded-lg p-2" style={{ width: 480, minHeight: 320 }}>
                    <div className="relative w-full h-full">
                      {selectedTemplate.layout.map((layoutItem) => {
                        const widget = selectedTemplate.widgets.find(w => w.id === layoutItem.i)
                        const settings = selectedTemplate.widgetSettings?.[widget?.id] || DEFAULT_WIDGET_SETTINGS
                        if (!widget) return null
                        
                        // Generate background colors
                        const bgColor = hexToRgba(settings.backgroundColor, settings.backgroundOpacity)
                        const cardBgColor = hexToRgba(settings.backgroundColor, settings.cardOpacity)
                        const categoryBgColor = settings.categoryBackgroundColor || DEFAULT_WIDGET_SETTINGS.categoryBackgroundColor
                        
                        return (
                          <div
                            key={widget.id}
                            className="rounded-lg shadow-md absolute"
                            style={{
                              left: `${(layoutItem.x / 12) * 100}%`,
                              top: `${layoutItem.y * 8}px`,
                              width: `${(layoutItem.w / 12) * 100}%`,
                              height: `${layoutItem.h * 50}px`,
                              backgroundColor: bgColor,
                              borderColor: settings.borderColor,
                              borderWidth: `${settings.borderWidth}px`,
                              borderStyle: "solid",
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                              overflow: "hidden",
                            }}
                          >
                            {/* Widget Header */}
                            <div
                              className="p-2 flex-shrink-0"
                              style={{
                                backgroundColor: categoryBgColor,
                                height: `${settings.categoryHeight}px`,
                                borderBottom: settings.categoryBorderWidth > 0
                                  ? `${settings.categoryBorderWidth}px solid ${settings.categoryBorderColor}`
                                  : "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                className="text-lg font-semibold text-center"
                                style={{
                                  color: settings.categoryFontColor,
                                  fontFamily: settings.categoryFont,
                                  fontSize: `${settings.categoryFontSize}px`,
                                  fontWeight: settings.categoryFontWeight,
                                }}
                              >
                                {/* Empty title - just structure */}
                  </div>
                </div>
                
                            {/* Widget Content */}
                            <div className="p-2 flex-grow flex flex-col overflow-hidden">
                              <div className="space-y-2 flex-grow overflow-y-auto">
                                {/* Render empty notice placeholders */}
                                {Array.from({ length: 4 }).map((_, index) => (
                                  <div
                                    key={index}
                                    className="rounded shadow p-2"
                                    style={{
                                      backgroundColor: cardBgColor,
                                      borderLeft: `3px solid ${settings.borderColor}`,
                                      fontFamily: settings.fontFamily,
                                      height: '40px', // Fixed height for placeholder
                                    }}
                                  >
                                    {/* Empty notice - just structure */}
                        </div>
                                ))}
                        </div>
                      </div>
                  </div>
                        )
                      })}
                </div>
                </div>
                </div>
                {/* End real widgets preview */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditDashboardDemo
