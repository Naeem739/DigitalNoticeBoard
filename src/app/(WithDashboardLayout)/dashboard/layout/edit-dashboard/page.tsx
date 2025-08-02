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
} from "lucide-react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "./edit-dashboard.css"
import type { AspectRatio, TNotice, Widget, WidgetSettings, DashboardTemplate } from "@/types/template-types"
import { getCategoriesWithNotices } from "@/app/actions/category.action"
import {  saveTemplate, getTemplates } from "@/app/actions/template.action"
import { createDashboard } from "@/app/actions/dashboard.action"
import { createImage, testImageConnection } from "@/app/actions/image.action"
import { toast } from "sonner"

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
  backgroundColor: "#ffffff",
  backgroundOpacity: 0.3,
  cardOpacity: 0.9,
  borderColor: "#e2e8f0",
  borderWidth: 1,
  fontColor: "#1e293b",
  noticeCount: 3,
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: "normal",
  autoScroll: false,
  showFullContent: false,
  // Default values for new category styling options
  categoryFont: "Inter",
  categoryFontSize: 16,
  categoryFontWeight: "semibold",
  categoryFontColor: "#1e293b",
  categoryBackgroundColor: "#f8fafc",
  categoryHeight: 40,
  categoryBorderColor: "#e2e8f0",
  categoryBorderWidth: 0,
  // Image upload widget settings
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
}

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, opacity: number) => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Add this type for the settings tabs
type SettingsTab = "style" | "typography" | "layout" | "content" | "category" | "image"

// Add widget type enum
type WidgetType = "notice" | "image"

// Extend Widget type to include widget type and image data
interface ExtendedWidget extends Widget {
  type?: WidgetType
  images?: Array<{
    id: string
    url: string
    title: string
    file: File
    dbId?: string // Database ID for reference
  }>
}

// Add this before the EditDashboardDemo component
const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "style", label: "Style", icon: <Palette size={16} /> },
  { id: "typography", label: "Text", icon: <Type size={16} /> },
  { id: "layout", label: "Layout", icon: <LayoutIcon size={16} /> },
  { id: "content", label: "Content", icon: <Box size={16} /> },
  { id: "category", label: "Category", icon: <ListFilter size={16} /> },
  { id: "image", label: "Image", icon: <ImageIcon size={16} /> },
]

// Define the template type

// Define the dashboard templates
const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "template-1",
    name: "Simple Overview",
    description: "A basic dashboard with key metrics.",
    widgets: [
      { id: "widget-1", title: "Total Revenue" },
      { id: "widget-2", title: "New Users" },
    ],
    layout: [
      { i: "widget-1", x: 0, y: 0, w: 5, h: 4 },
      { i: "widget-2", x: 6, y: 0, w: 5, h: 4 },
    ],
    widgetSettings: {
      "widget-1": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#f0fdfa" },
      "widget-2": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#ecfdf5" },
    },
  },
  {
    id: "template-2",
    name: "Marketing Dashboard",
    description: "Dashboard focused on marketing performance.",
    widgets: [
      { id: "widget-3", title: "Website Traffic" },
      { id: "widget-4", title: "Lead Generation" },
    ],
    layout: [
      { i: "widget-3", x: 0, y: 0, w: 6, h: 4 },
      { i: "widget-4", x: 6, y: 0, w: 6, h: 4 },
    ],
    widgetSettings: {
      "widget-3": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#f0f9ff" },
      "widget-4": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#e0f2fe" },
    },
  },
  {
    id: "template-3",
    name: "Left-Dominant Split",
    description: "One large widget on left, two smaller on right.",
    widgets: [
      { id: "widget-5", title: "Main Content" },
      { id: "widget-6", title: "Secondary Info" },
      { id: "widget-7", title: "Additional Details" },
    ],
    layout: [
      { i: "widget-5", x: 0, y: 0, w: 6, h: 8 }, // Left widget takes half width, full height
      { i: "widget-6", x: 6, y: 0, w: 6, h: 4 }, // Top-right widget
      { i: "widget-7", x: 6, y: 4, w: 6, h: 4 }, // Bottom-right widget
    ],
    widgetSettings: {
      "widget-5": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" },
      "widget-6": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#faf5ff", borderColor: "#d8b4fe" },
      "widget-7": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#f3e8ff", borderColor: "#c084fc" },
    },
  },
  {
    id: "template-4",
    name: "Right-Dominant Split",
    description: "Two smaller widgets on left, one large on right.",
    widgets: [
      { id: "widget-8", title: "Quick Stats" },
      { id: "widget-9", title: "Recent Activity" },
      { id: "widget-10", title: "Detailed Overview" },
    ],
    layout: [
      { i: "widget-8", x: 0, y: 0, w: 6, h: 4 }, // Top-left widget
      { i: "widget-9", x: 0, y: 4, w: 6, h: 4 }, // Bottom-left widget
      { i: "widget-10", x: 6, y: 0, w: 6, h: 8 }, // Right widget takes half width, full height
    ],
    widgetSettings: {
      "widget-8": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
      "widget-9": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#dbeafe", borderColor: "#60a5fa" },
      "widget-10": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#bfdbfe", borderColor: "#3b82f6" },
    },
  },
  {
    id: "template-5",
    name: "Horizontal Stack",
    description: "Three widgets stacked horizontally, equal height.",
    widgets: [
      { id: "widget-11", title: "Top Section" },
      { id: "widget-12", title: "Middle Section" },
      { id: "widget-13", title: "Bottom Section" },
    ],
    layout: [
      { i: "widget-11", x: 0, y: 0, w: 12, h: 3 }, // Top widget, full width
      { i: "widget-12", x: 0, y: 3, w: 12, h: 3 }, // Middle widget, full width
      { i: "widget-13", x: 0, y: 6, w: 12, h: 3 }, // Bottom widget, full width
    ],
    widgetSettings: {
      "widget-11": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" },
      "widget-12": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#d1fae5", borderColor: "#34d399" },
      "widget-13": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#a7f3d0", borderColor: "#10b981" },
    },
  },
  {
    id: "template-6",
    name: "Vertical Columns",
    description: "Three widgets as vertical columns, equal width.",
    widgets: [
      { id: "widget-14", title: "Left Column" },
      { id: "widget-15", title: "Middle Column" },
      { id: "widget-16", title: "Right Column" },
    ],
    layout: [
      { i: "widget-14", x: 0, y: 0, w: 4, h: 8 }, // Left column, 1/3 width, full height
      { i: "widget-15", x: 4, y: 0, w: 4, h: 8 }, // Middle column, 1/3 width, full height
      { i: "widget-16", x: 8, y: 0, w: 4, h: 8 }, // Right column, 1/3 width, full height
    ],
    widgetSettings: {
      "widget-14": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
      "widget-15": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#dbeafe", borderColor: "#60a5fa" },
      "widget-16": { ...DEFAULT_WIDGET_SETTINGS, backgroundColor: "#bfdbfe", borderColor: "#3b82f6" },
    },
  },
]

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

  // Add useEffect to load saved state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('dashboardState')
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        const { selectedRatio: savedRatio, widgets: savedWidgets, layout: savedLayout } = parsedState
        
        // Check if there was previous content (widgets or layout)
        if (savedWidgets && savedWidgets.length > 0 || savedLayout && savedLayout.length > 0) {
          // Show confirmation dialog instead of clearing immediately
          setPendingSavedState(parsedState)
          setShowConfirmationDialog(true)
        } else {
          // No previous content, just load the ratio
          setSelectedRatio(savedRatio)
          localStorage.removeItem('dashboardState')
        }
      } catch (error) {
        console.error('Error loading saved dashboard state:', error)
        localStorage.removeItem('dashboardState')
      }
    }
  }, [])

  // Add useEffect to save state whenever it changes
  useEffect(() => {
    if (widgets.length > 0 || layout.length > 0) {
      const stateToSave = {
        widgets,
        layout,
        selectedRatio,
        widgetSettings
      }
      localStorage.setItem('dashboardState', JSON.stringify(stateToSave))
    } else if (selectedRatio) {
      // Only save the selected ratio if no widgets exist
      const stateToSave = {
        selectedRatio
      }
      localStorage.setItem('dashboardState', JSON.stringify(stateToSave))
    }
  }, [widgets, layout, selectedRatio, widgetSettings])

  // Add function to clear saved state
  const clearSavedState = () => {
    localStorage.removeItem('dashboardState')
  }

  // Handle confirmation dialog actions
  const handleConfirmClear = () => {
    if (pendingSavedState) {
      // Load only the ratio, clear everything else
      setSelectedRatio(pendingSavedState.selectedRatio)
    }
    localStorage.removeItem('dashboardState')
    setShowConfirmationDialog(false)
    setPendingSavedState(null)
  }

  const handleCancelClear = () => {
    if (pendingSavedState) {
      // Load the full saved state (including widgets)
      setWidgets(pendingSavedState.widgets || [])
      setLayout(pendingSavedState.layout || [])
      setSelectedRatio(pendingSavedState.selectedRatio)
      setWidgetSettings(pendingSavedState.widgetSettings || {})
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

  // Add this after the existing useEffect hooks
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true)
      try {
        const result = await getTemplates()
        if (result.success) {
          setCustomTemplates(result?.templates)
        } else {
          toast.error("Failed to load templates")
        }
      } catch (error) {
        console.error("Error loading templates:", error)
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [])

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
  }

  const addWidget = (type: WidgetType = "notice") => {
    if (!selectedRatio) return

    const newWidgetId = `widget-${Date.now()}`
    const newWidget: ExtendedWidget = {
      id: newWidgetId,
      title: type === "image" ? `Image Widget ${widgets.length + 1}` : `Widget ${widgets.length + 1}`,
      type: type,
      images: type === "image" ? [] : undefined,
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

    toast.success(`Added ${categoryName} to widget`)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Image upload functionality - Single image per widget
  const handleImageUpload = async (widgetId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const widget = widgets.find(w => w.id === widgetId)
    if (!widget || widget.type !== "image") return

    // Test database connection first
    console.log("Testing database connection...")
    const connectionTest = await testImageConnection()
    console.log("Connection test result:", connectionTest)

    // Take only the first file for single image widget
    const file = files[0]
    
    // Convert file to base64 for database storage
    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageData = e.target?.result as string
      
      try {
        // Save image to database
        const imagePayload = {
          title: file.name,
          imageUrl: imageData,
          imageData: imageData, // Store base64 data
          fileName: file.name,
        }

        console.log("Sending image payload to database:", {
          title: imagePayload.title,
          fileName: imagePayload.fileName,
          dataLength: imagePayload.imageData?.length || 0
        })

        const result = await createImage(imagePayload)
        
        console.log("Database result:", result)
        
        if (result.success) {
          const savedImage = result.message
          const newImage = {
            id: savedImage.id,
            url: imageData,
            title: file.name,
            file: file,
            dbId: savedImage.id // Store database ID for reference
          }

          setWidgets(widgets.map(w => 
            w.id === widgetId 
              ? { ...w, images: [newImage] } // Replace with single image
              : w
          ))

          toast.success("Image uploaded and saved successfully!")
        } else {
          console.error("Failed to save image:", result.message)
          toast.error(`Failed to save image to database: ${result.message}`)
        }
      } catch (error) {
        console.error("Error saving image:", error)
        toast.error("Failed to save image")
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId 
        ? { ...w, images: [] } // Clear all images (single image widget)
        : w
    ))
    toast.success("Image removed successfully!")
  }

  const handleImageDrop = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(widgetId, files)
    }
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
    const dashboard = {
      aspectRatio: selectedRatio,
      containers: [...positions],
    }

    try {
      const result = await createDashboard(dashboard)
      if (result.success) {
        clearSavedState() // Clear saved state after successful save
        toast.success("Dashboard Created Successfully!")
      } else {
        toast.error("Something went wrong!")
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

        // Handle different widget types
        if (widget.type === "image") {
          // For image widgets, include image data
          const imageData = widget.images && widget.images.length > 0 ? widget.images[0] : null
          const imageIds = imageData ? [imageData.id] : []

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
            type: "image",
            imageIds: imageIds,
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
              // Image-specific settings
              imageFit: settings.imageFit,
              imageBorderRadius: settings.imageBorderRadius,
              showImageTitle: settings.showImageTitle,
              imageTitleColor: settings.imageTitleColor,
              imageTitleFontSize: settings.imageTitleFontSize,
              imageTitleFontWeight: settings.imageTitleFontWeight,
            },
          }
        } else {
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
          },
          }
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

    const newTemplateId = `custom-template-${Date.now()}`

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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
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
              {(["4:3", "16:9", "16:10"] as AspectRatio[]).map((ratio) => (
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

        <div className="relative">
          <button
            onClick={() => addWidget("image")}
            disabled={!selectedRatio}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ${
              selectedRatio ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <ImageIcon size={20} /> Create Image Widget
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 transition-all shadow hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              Use Template
              <ChevronDown size={16} />
            </span>
          </button>
          {isTemplateDropdownOpen && (
            <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 w-64">
              {/* Built-in Templates */}
              <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50">Built-in Templates</div>
              {DASHBOARD_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="block w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  <div className="text-xs text-purple-600 mt-1">{template.widgets.length} widgets</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => applyTemplate(template)}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      Apply Template
                    </button>
                    <button
                      onClick={() => createDashboardFromTemplate(template)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Create Dashboard
                    </button>
                  </div>
                </div>
              ))}

              {/* Custom Templates */}
              <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50">Custom Templates</div>
              {isLoadingTemplates ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading templates...</div>
              ) : customTemplates.length > 0 ? (
                customTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="block w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                    <div className="text-xs text-purple-600 mt-1">{template.widgets.length} widgets</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => applyTemplate(template)}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                      >
                        Apply Template
                      </button>
                      <button
                        onClick={() => createDashboardFromTemplate(template)}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Create Dashboard
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">No custom templates yet</div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSaveTemplate}
          disabled={!canCreateTemplate}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ${
            canCreateTemplate
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Create Template
        </button>

        <button
          onClick={handleSave}
          disabled={!selectedRatio || widgets.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ml-auto ${
            selectedRatio && widgets.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Save Dashboard
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

      {selectedRatio && (
        <div
          className="border-4 border-dashed border-gray-300 rounded-lg mx-auto overflow-hidden bg-white p-4"
          style={{
            width: RATIO_DIMENSIONS[selectedRatio].width,
            height: RATIO_DIMENSIONS[selectedRatio].height,
          }}
        >
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={50}
            width={RATIO_DIMENSIONS[selectedRatio].width - 32}
            onLayoutChange={(newLayout) => setLayout(newLayout)}
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
                  onDrop={(e) => widget.type === "image" ? handleImageDrop(e, widget.id) : handleDrop(e, widget.id)}
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
                      {widget.content || widget.title}
                    </h3>
                  </div>

                  {/* Widget Content - Flex grow to fill available space */}
                  <div className={`${widget.type === "image" ? "p-0" : "p-2"} flex-grow flex flex-col overflow-hidden`}>
                    {widget.type === "image" ? (
                      // Single Image Widget Content - More compact like Notice widget
                      <div className="flex flex-col h-full relative group">
                        <div
                          className="image-container flex-grow relative rounded-lg overflow-hidden shadow-inner"
                          style={{
                            height: `${noticesContainerHeight}px`,
                            maxHeight: `${noticesContainerHeight}px`,
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          }}
                        >
                          {widget.images && widget.images.length > 0 ? (
                            <div className="w-full h-full relative">
                              <img
                                src={widget.images[0].url}
                                alt={widget.images[0].title}
                                className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                                style={{
                                  objectFit: settings.imageFit as any,
                                  borderRadius: `${settings.imageBorderRadius}px`,
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                }}
                              />
                              {settings.showImageTitle && (
                                <div 
                                  className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent rounded-b"
                                  style={{
                                    borderBottomLeftRadius: `${settings.imageBorderRadius}px`,
                                    borderBottomRightRadius: `${settings.imageBorderRadius}px`,
                                  }}
                                >
                                  <p
                                    className="text-sm font-semibold text-white truncate drop-shadow-lg"
                                    style={{
                                      color: settings.imageTitleColor,
                                      fontSize: `${settings.imageTitleFontSize}px`,
                                      fontWeight: settings.imageTitleFontWeight,
                                      fontFamily: settings.fontFamily,
                                    }}
                                    title={widget.images[0].title}
                                  >
                                    {widget.images[0].title}
                                  </p>
                                </div>
                              )}
                              <button
                                onClick={() => removeImage(widget.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm bg-opacity-90"
                                style={{ fontSize: '8px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
                              style={{
                                borderColor: settings.fontColor,
                                opacity: 0.8,
                                fontFamily: settings.fontFamily,
                              }}
                            >
                              <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                                <Upload size={32} style={{ color: '#3b82f6', opacity: 0.8 }} />
                              </div>
                              <p style={{ color: settings.fontColor, marginTop: '8px', fontWeight: '500' }}>
                                Drag & drop an image here or click to upload
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(widget.id, e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Notice Widget Content (existing logic)
                      widget.topNotices ? (
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
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </GridLayout>
        </div>
      )}

      {/* Draggable Settings Modal */}
      {activeSettingsWidget && (
        <div
          ref={settingsRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-96 max-h-[80vh] flex flex-col"
          style={{
            left: `${settingsPosition.x}px`,
            top: `${settingsPosition.y}px`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-3 cursor-move bg-gray-50 rounded-t-lg border-b"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-gray-400" />
              <h4 className="font-medium">Widget Settings</h4>
            </div>
            <button
              onClick={() => setActiveSettingsWidget(null)}
              className="hover:bg-gray-200 rounded-full p-1 transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b overflow-x-auto">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors whitespace-nowrap
                  ${
                    activeSettingsTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content with proper scrolling */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Style Tab */}
            {activeSettingsTab === "style" && (
              <div className="space-y-4">
                {/* Background Color */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Palette size={14} /> Background Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "backgroundColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300"
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
                      className="w-6 h-6 p-0 rounded-full ml-1"
                    />
                  </div>
                </div>

                {/* Background & Card Opacity */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Layers size={14} /> Opacity Settings
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">Background:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
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
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {Math.round(
                          (widgetSettings[activeSettingsWidget]?.backgroundOpacity ||
                            DEFAULT_WIDGET_SETTINGS.backgroundOpacity) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">Card:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={widgetSettings[activeSettingsWidget]?.cardOpacity || DEFAULT_WIDGET_SETTINGS.cardOpacity}
                        onChange={(e) =>
                          updateWidgetSetting(activeSettingsWidget, "cardOpacity", Number.parseFloat(e.target.value))
                        }
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {Math.round(
                          (widgetSettings[activeSettingsWidget]?.cardOpacity || DEFAULT_WIDGET_SETTINGS.cardOpacity) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Border Settings */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Box size={14} /> Border Settings
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {getPresetColors().map((color) => (
                        <button
                          key={color}
                          onClick={() => updateWidgetSetting(activeSettingsWidget, "borderColor", color)}
                          className="w-6 h-6 rounded-full border border-gray-300"
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">Width:</span>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={widgetSettings[activeSettingsWidget]?.borderWidth || DEFAULT_WIDGET_SETTINGS.borderWidth}
                        onChange={(e) =>
                          updateWidgetSetting(activeSettingsWidget, "borderWidth", Number.parseInt(e.target.value))
                        }
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {widgetSettings[activeSettingsWidget]?.borderWidth || DEFAULT_WIDGET_SETTINGS.borderWidth}px
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeSettingsTab === "typography" && (
              <div className="space-y-4">
                {/* Font Color */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Font Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "fontColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: color,
                          outline:
                            widgetSettings[activeSettingsWidget]?.fontColor === color ? "2px solid #3b82f6" : "none",
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Font Family
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.fontFamily || DEFAULT_WIDGET_SETTINGS.fontFamily}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontFamily", e.target.value)}
                    className="w-full text-sm border rounded-md p-2"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="system-ui">System UI</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Font Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={widgetSettings[activeSettingsWidget]?.fontSize || DEFAULT_WIDGET_SETTINGS.fontSize}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "fontSize", Number.parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {widgetSettings[activeSettingsWidget]?.fontSize || DEFAULT_WIDGET_SETTINGS.fontSize}px
                    </span>
                  </div>
                </div>

                {/* Font Weight */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Font Weight
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.fontWeight || DEFAULT_WIDGET_SETTINGS.fontWeight}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontWeight", e.target.value)}
                    className="w-full text-sm border rounded-md p-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            )}

            {/* Layout Tab */}
            {activeSettingsTab === "layout" && (
              <div className="space-y-4">
                {/* Add layout-specific settings here */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <LayoutIcon size={14} /> Padding
                  </label>
                  {/* Add padding controls */}
                </div>
                {/* Add more layout settings as needed */}
              </div>
            )}

            {/* Content Tab */}
            {activeSettingsTab === "content" && (
              <div className="space-y-4">
                {/* Notice Count */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <ListFilter size={14} /> Number of Notices
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={widgetSettings[activeSettingsWidget]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "noticeCount", Number.parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {widgetSettings[activeSettingsWidget]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount}
                    </span>
                  </div>
                </div>

                {/* Auto Scroll Toggle */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <ListFilter size={14} /> Auto Scroll
                  </label>
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm text-gray-600">
                      {widgetSettings[activeSettingsWidget]?.autoScroll ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Show Full Content Toggle */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <ListFilter size={14} /> Show Full Content
                  </label>
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm text-gray-600">
                      {widgetSettings[activeSettingsWidget]?.showFullContent ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Category Tab - New tab for category styling */}
            {activeSettingsTab === "category" && (
              <div className="space-y-4">
                {/* Category Background Color */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Palette size={14} /> Category Background
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "categoryBackgroundColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300"
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
                      className="w-6 h-6 p-0 rounded-full ml-1"
                    />
                  </div>
                </div>

                {/* Category Height */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Box size={14} /> Category Height
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="30"
                      max="80"
                      value={
                        widgetSettings[activeSettingsWidget]?.categoryHeight || DEFAULT_WIDGET_SETTINGS.categoryHeight
                      }
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "categoryHeight", Number.parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {widgetSettings[activeSettingsWidget]?.categoryHeight || DEFAULT_WIDGET_SETTINGS.categoryHeight}px
                    </span>
                  </div>
                </div>

                {/* Category Font Color */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Category Font Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "categoryFontColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300"
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
                      onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFontColor", e.target.value)}
                      className="w-6 h-6 p-0 rounded-full ml-1"
                    />
                  </div>
                </div>

                {/* Category Font Family */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Category Font
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.categoryFont || DEFAULT_WIDGET_SETTINGS.categoryFont}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFont", e.target.value)}
                    className="w-full text-sm border rounded-md p-2"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="system-ui">System UI</option>
                  </select>
                </div>

                {/* Category Font Size */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Category Font Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="28"
                      value={
                        widgetSettings[activeSettingsWidget]?.categoryFontSize ||
                        DEFAULT_WIDGET_SETTINGS.categoryFontSize
                      }
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "categoryFontSize", Number.parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {widgetSettings[activeSettingsWidget]?.categoryFontSize ||
                        DEFAULT_WIDGET_SETTINGS.categoryFontSize}
                      px
                    </span>
                  </div>
                </div>

                {/* Category Font Weight */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Category Font Weight
                  </label>
                  <select
                    value={
                      widgetSettings[activeSettingsWidget]?.categoryFontWeight ||
                      DEFAULT_WIDGET_SETTINGS.categoryFontWeight
                    }
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFontWeight", e.target.value)}
                    className="w-full text-sm border rounded-md p-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                {/* Category Border */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Box size={14} /> Category Border
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {getPresetColors().map((color) => (
                        <button
                          key={color}
                          onClick={() => updateWidgetSetting(activeSettingsWidget, "categoryBorderColor", color)}
                          className="w-6 h-6 rounded-full border border-gray-300"
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
                        className="w-6 h-6 p-0 rounded-full ml-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">Width:</span>
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
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {widgetSettings[activeSettingsWidget]?.categoryBorderWidth ||
                          DEFAULT_WIDGET_SETTINGS.categoryBorderWidth}
                        px
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Tab - New tab for image widget settings */}
            {activeSettingsTab === "image" && (
              <div className="space-y-4">
                {/* Image Fit */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <ImageIcon size={14} /> Image Fit
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.imageFit || DEFAULT_WIDGET_SETTINGS.imageFit}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageFit", e.target.value)}
                    className="w-full text-sm border rounded-md p-2"
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                    <option value="scale-down">Scale Down</option>
                  </select>
                </div>

                {/* Image Border Radius */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Box size={14} /> Border Radius
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={widgetSettings[activeSettingsWidget]?.imageBorderRadius || DEFAULT_WIDGET_SETTINGS.imageBorderRadius}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "imageBorderRadius", Number.parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {widgetSettings[activeSettingsWidget]?.imageBorderRadius || DEFAULT_WIDGET_SETTINGS.imageBorderRadius}px
                    </span>
                  </div>
                </div>

                {/* Show Image Title Toggle */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Show Image Title
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateWidgetSetting(
                          activeSettingsWidget,
                          "showImageTitle",
                          !(widgetSettings[activeSettingsWidget]?.showImageTitle || true),
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        widgetSettings[activeSettingsWidget]?.showImageTitle !== false ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          widgetSettings[activeSettingsWidget]?.showImageTitle !== false ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">
                      {widgetSettings[activeSettingsWidget]?.showImageTitle !== false ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Image Title Color */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Title Color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getPresetColors().map((color) => (
                      <button
                        key={color}
                        onClick={() => updateWidgetSetting(activeSettingsWidget, "imageTitleColor", color)}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: color,
                          outline:
                            widgetSettings[activeSettingsWidget]?.imageTitleColor === color
                              ? "2px solid #3b82f6"
                              : "none",
                        }}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      value={
                        widgetSettings[activeSettingsWidget]?.imageTitleColor ||
                        DEFAULT_WIDGET_SETTINGS.imageTitleColor
                      }
                      onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageTitleColor", e.target.value)}
                      className="w-6 h-6 p-0 rounded-full ml-1"
                    />
                  </div>
                </div>

                {/* Image Title Font Size */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Title Font Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="20"
                      value={widgetSettings[activeSettingsWidget]?.imageTitleFontSize || DEFAULT_WIDGET_SETTINGS.imageTitleFontSize}
                      onChange={(e) =>
                        updateWidgetSetting(activeSettingsWidget, "imageTitleFontSize", Number.parseInt(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {widgetSettings[activeSettingsWidget]?.imageTitleFontSize || DEFAULT_WIDGET_SETTINGS.imageTitleFontSize}px
                    </span>
                  </div>
                </div>

                {/* Image Title Font Weight */}
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <Type size={14} /> Title Font Weight
                  </label>
                  <select
                    value={widgetSettings[activeSettingsWidget]?.imageTitleFontWeight || DEFAULT_WIDGET_SETTINGS.imageTitleFontWeight}
                    onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageTitleFontWeight", e.target.value)}
                    className="w-full text-sm border rounded-md p-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Update the button in the settings panel to use the new function */}
          {/* Find the button at the end of the settings panel (around line 1300) */}
          {/* Replace:
          <button
            onClick={() => {
              const widget = widgets.find((w) => w.id === activeSettingsWidget)
              if (widget) {
                handleSaveTemplate(widget)
              }
            }}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            Save as Template
          </button> */}

          {/* With: */}
          <div className="p-3 border-t">
            <button
              onClick={handleSaveTemplate}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Save as Template
            </button>
          </div>
        </div>
      )}

      {/* Add the template modal at the end of the component, just before the final closing div */}
      {/* Add this before the final </div> (around line 1310) */}

      {/* Template Creation Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Describe your template..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomTemplate}
                disabled={isSavingTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {isSavingTemplate ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update the template dropdown to include custom templates */}
      {/* Find the template dropdown section (around line 520) and modify it: */}
    </div>
  )
}

export default EditDashboardDemo
