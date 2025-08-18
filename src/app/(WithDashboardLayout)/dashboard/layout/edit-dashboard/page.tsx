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
import { getCategoriesWithNotices, getCategories } from "@/app/actions/category.action"
import { getAllTemplates, createTemplate, getAllDashboardTemplates, createDashboardTemplate, updateDashboardTemplate, deleteDashboardTemplate } from "@/app/actions/template.action"
import { createDashboard, getAllDashboards } from "@/app/actions/dashboard.action"
import { createNotice } from "@/app/actions/notice.action"
import { createCategory } from "@/app/actions/category.action"
// import { createImage } from "@/app/actions/image.action"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SpinningBellLoader, WaveLoader } from "@/components/ui/loader"
import { localStorageUtils } from "@/lib/utils"
import { useSession } from "next-auth/react"

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
  
  // Image display settings (enhanced for professional use)
  imageFit: "cover",
  imageBorderRadius: 8,
  showImageTitle: true,
  imageTitleColor: "#ffffff",
  imageTitleFontSize: 14,
  imageTitleFontWeight: "medium",
  imageOverlay: true,
  imageOverlayOpacity: 0.3,
  imageShadow: true,
  imageShadowColor: "rgba(0, 0, 0, 0.2)",
  imageShadowBlur: 8,
  imageShadowOffset: 4,
  imageZoom: false,
  imageRotation: 0,
  imageBrightness: 100,
  imageContrast: 100,
  imageSaturation: 100,
  imageBlur: 0,
  imageGrayscale: false,
  imageSepia: false,
  imageInvert: false,
  

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

// Helper function to reconstruct image URL from notice data
const reconstructImageUrl = (notice: any) => {
  let imageUrl = notice.imageUrl
  if (!imageUrl && notice.imageData) {
    // If we only have base64 data, reconstruct the full data URL
    // We need to determine the image type from the notice data
    const imageType = notice.imageFileName ? 
      notice.imageFileName.split('.').pop()?.toLowerCase() : 'jpeg'
    const mimeType = imageType === 'png' ? 'image/png' : 
                   imageType === 'gif' ? 'image/gif' : 
                   imageType === 'webp' ? 'image/webp' : 'image/jpeg'
    imageUrl = `data:${mimeType};base64,${notice.imageData}`
  }
  return imageUrl || ''
}

// Add this type for the settings tabs
type SettingsTab = "style" | "typography" | "content" | "category" | "image"

// Add widget type enum
type WidgetType = "notice" | "image"

// Extend Widget type to include widget type and images
interface ExtendedWidget extends Widget {
  type?: WidgetType
  images?: Array<{
    id: string
    url: string
    title: string
    file: File
    dbId?: string
    width?: number
    height?: number
    size?: number
    type?: string
  }>

}

// Add this before the EditDashboardDemo component
const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "style", label: "Appearance", icon: <Palette size={16} /> },
  { id: "typography", label: "Typography", icon: <Type size={16} /> },
  { id: "content", label: "Content", icon: <Box size={16} /> },
  { id: "category", label: "Category", icon: <ListFilter size={16} /> },
  { id: "image", label: "Image", icon: <ImageIcon size={16} /> },
]

// Define the template type

// Dynamic template loading - no hardcoded templates

function EditDashboardDemo() {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  
  // Screen management state
  const [screens, setScreens] = useState<Array<{
    id: string
    name: string
    widgets: ExtendedWidget[]
    layout: Layout[]
    widgetSettings: Record<string, WidgetSettings>
  }>>([{
    id: 'screen-1',
    name: 'Screen 1',
    widgets: [],
    layout: [],
    widgetSettings: {}
  }])
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)
  
  // Current screen data (derived from screens array)
  const currentScreen = screens[currentScreenIndex]
  const widgets = currentScreen?.widgets || []
  const layout = currentScreen?.layout || []
  const widgetSettings = currentScreen?.widgetSettings || {}
  
  const setWidgets = (newWidgets: ExtendedWidget[] | ((prev: ExtendedWidget[]) => ExtendedWidget[])) => {
    setScreens(prevScreens => {
      const newScreens = [...prevScreens]
      const newWidgetsArray = typeof newWidgets === 'function' ? newWidgets(newScreens[currentScreenIndex]?.widgets || []) : newWidgets
      newScreens[currentScreenIndex] = {
        ...newScreens[currentScreenIndex],
        widgets: newWidgetsArray
      }
      return newScreens
    })
  }
  
  const setLayout = (newLayout: Layout[] | ((prev: Layout[]) => Layout[])) => {
    setScreens(prevScreens => {
      const newScreens = [...prevScreens]
      const newLayoutArray = typeof newLayout === 'function' ? newLayout(newScreens[currentScreenIndex]?.layout || []) : newLayout
      newScreens[currentScreenIndex] = {
        ...newScreens[currentScreenIndex],
        layout: newLayoutArray
      }
      return newScreens
    })
  }
  
  const setWidgetSettings = (newSettings: Record<string, WidgetSettings> | ((prev: Record<string, WidgetSettings>) => Record<string, WidgetSettings>)) => {
    setScreens(prevScreens => {
      const newScreens = [...prevScreens]
      const newSettingsObj = typeof newSettings === 'function' ? newSettings(newScreens[currentScreenIndex]?.widgetSettings || {}) : newSettings
      newScreens[currentScreenIndex] = {
        ...newScreens[currentScreenIndex],
        widgetSettings: newSettingsObj
      }
      return newScreens
    })
  }
  
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null)
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false)
  const [categories, setCategories] = useState<TCategoriesWithNotices[]>([])
  const [activeSettingsWidget, setActiveSettingsWidget] = useState<string | null>(null)

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

  // Add state for duplicate template name handling
  const [showDuplicateNameDialog, setShowDuplicateNameDialog] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<DashboardTemplate | null>(null)

  // State for tracking drag over dashboard area
  const [isDragOverDashboard, setIsDragOverDashboard] = useState(false)

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
        const { selectedRatio: savedRatio, screens: savedScreens, currentScreenIndex: savedScreenIndex } = savedState
        
        // Check if there was previous content (screens with widgets)
        if (savedScreens && savedScreens.length > 0 && savedScreens.some(screen => screen.widgets.length > 0)) {
          // Show confirmation dialog instead of clearing immediately
          setPendingSavedState(savedState)
          setShowConfirmationDialog(true)
        } else {
          // No previous content, just load the ratio and screens structure
          setSelectedRatio(savedRatio)
          if (savedScreens) {
            setScreens(savedScreens)
            setCurrentScreenIndex(savedScreenIndex || 0)
          }
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
    
    // Create a lightweight version of screens without large file data
    const lightweightScreens = screens.map((screen: any) => ({
      ...screen,
      widgets: screen.widgets.map((widget: any) => ({
        ...widget,
        // Don't include file, url (base64 data), or other large properties
      }))
    }))
    
    const stateToSave = {
      screens: lightweightScreens,
      currentScreenIndex,
      selectedRatio
    }
    
    const success = localStorageUtils.setItem('dashboardState', stateToSave)
    if (!success) {
      console.warn('Failed to save dashboard state to localStorage (quota exceeded or data too large)')
    }
  }, [screens, currentScreenIndex, selectedRatio])

  // Debug useEffect to log state changes
  useEffect(() => {
    console.log("State updated:", {
      screens: screens.length,
      currentScreenIndex,
      widgets: widgets.length,
      layout: layout.length,
      selectedRatio
    })
  }, [screens, currentScreenIndex, widgets.length, layout.length, selectedRatio])

  // Add function to clear saved state
  const clearSavedState = () => {
    localStorageUtils.removeItem('dashboardState')
  }

  // Screen management functions
  const addScreen = () => {
    const newScreenId = `screen-${screens.length + 1}`
    const newScreen = {
      id: newScreenId,
      name: `Screen ${screens.length + 1}`,
      widgets: [],
      layout: [],
      widgetSettings: {}
    }
    setScreens([...screens, newScreen])
    setCurrentScreenIndex(screens.length) // Switch to the new screen
  }

  const removeScreen = (screenIndex: number) => {
    if (screens.length <= 1) {
      toast.error("Cannot remove the last screen")
      return
    }
    
    const newScreens = screens.filter((_, index) => index !== screenIndex)
    setScreens(newScreens)
    
    // Adjust current screen index if needed
    if (currentScreenIndex >= screenIndex) {
      setCurrentScreenIndex(Math.max(0, currentScreenIndex - 1))
    }
  }

  const renameScreen = (screenIndex: number, newName: string) => {
    const newScreens = [...screens]
    newScreens[screenIndex] = {
      ...newScreens[screenIndex],
      name: newName
    }
    setScreens(newScreens)
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
      // Load the saved state (screens will be lightweight version)
      setScreens(pendingSavedState.screens || [{
        id: 'screen-1',
        name: 'Screen 1',
        widgets: [],
        layout: [],
        widgetSettings: {}
      }])
      setCurrentScreenIndex(pendingSavedState.currentScreenIndex || 0)
      setSelectedRatio(pendingSavedState.selectedRatio)
      
      // Check if there are image widgets that need to be re-uploaded
      const hasImageWidgets = pendingSavedState.screens?.some((screen: any) => 
        screen.widgets?.some((widget: any) => 
          widget.type === 'notice' && widget.images?.length > 0
        )
      )
      
      if (hasImageWidgets) {
        toast.info("Dashboard restored! Note: Image displays need to be re-uploaded due to storage limitations.")
      } else {
        toast.success("Dashboard restored successfully!", { duration: 1500 })
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
          
          // Get all screens for this dashboard
          const response = await fetch('/api/dashboard/get-screens/' + dashboardId)
          const data = await response.json()
          
          if (data.success && data.result && data.result.length > 0) {
            const dashboards = data.result
            
            // Set the aspect ratio from the first dashboard
            setSelectedRatio(dashboards[0].aspectRatio as AspectRatio)
            
            // Create screens array from the dashboards
            const newScreens = await Promise.all(dashboards.map(async (dashboard: any) => {
              // Convert containers to widgets and layout
              const newWidgets: ExtendedWidget[] = []
              const newLayout: Layout[] = []
              const newWidgetSettings: Record<string, WidgetSettings> = {}
              
              // First, collect all notice IDs from containers (both notice and image widgets use noticeIds)
              const allNoticeIds: string[] = []
              
              dashboard.containers.forEach((container: any) => {
                if (container.noticeIds) {
                  allNoticeIds.push(...container.noticeIds)
                }
              })
              
              // Fetch all notices
              const noticesResponse = allNoticeIds.length > 0 ? await fetch('/api/notice/get-all') : null
              const noticesData = noticesResponse ? await noticesResponse.json() : { success: false, result: [] }
              
              const allNotices = noticesData.success ? noticesData.result : []
              
              dashboard.containers.forEach((container: any, index: number) => {
                const widgetId = container.id
                
                // Get notices for this widget
                const widgetNotices = container.noticeIds 
                  ? allNotices.filter((notice: any) => container.noticeIds.includes(notice.id))
                  : []
                
                // For image widgets, extract image data from notices
                let widgetImages = undefined
                if (container.type === 'image' && widgetNotices.length > 0) {
                  widgetImages = widgetNotices.map((notice: any) => ({
                    id: notice.id,
                    url: reconstructImageUrl(notice),
                    title: notice.title,
                    file: new File([], notice.title), // Placeholder file object
                    dbId: notice.id
                  }))
                }
                
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
                  images: widgetImages
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
              
              return {
                id: dashboard.id,
                name: dashboard.screenName || `Screen ${dashboard.screenIndex + 1}`,
                widgets: newWidgets,
                layout: newLayout,
                widgetSettings: newWidgetSettings
              }
            }))
            
            // Set the loaded screens
            setScreens(newScreens)
            setCurrentScreenIndex(0)
            
            toast.success(`Dashboard loaded successfully! ${newScreens.length} screen${newScreens.length > 1 ? 's' : ''} found.`, { duration: 1500 })
          } else {
            // Fallback to single dashboard loading for backward compatibility
            const singleResponse = await fetch('/api/dashboard/get-by-id/' + dashboardId)
            const singleData = await singleResponse.json()
            
            if (singleData.success && singleData.result) {
              const dashboard = singleData.result
              
              // Set the aspect ratio
              setSelectedRatio(dashboard.aspectRatio as AspectRatio)
              
              // Convert containers to widgets and layout
              const newWidgets: ExtendedWidget[] = []
              const newLayout: Layout[] = []
              const newWidgetSettings: Record<string, WidgetSettings> = {}
              
              // First, collect all notice IDs from containers (both notice and image widgets use noticeIds)
              const allNoticeIds: string[] = []
              
              dashboard.containers.forEach((container: any) => {
                if (container.noticeIds) {
                  allNoticeIds.push(...container.noticeIds)
                }
              })
              
              // Fetch all notices
              const noticesResponse = allNoticeIds.length > 0 ? await fetch('/api/notice/get-all') : null
              const noticesData = noticesResponse ? await noticesResponse.json() : { success: false, result: [] }
              
              const allNotices = noticesData.success ? noticesData.result : []
              
              dashboard.containers.forEach((container: any, index: number) => {
                const widgetId = container.id
                
                // Get notices for this widget
                const widgetNotices = container.noticeIds 
                  ? allNotices.filter((notice: any) => container.noticeIds.includes(notice.id))
                  : []
                
                // For image widgets, extract image data from notices
                let widgetImages = undefined
                if (container.type === 'image' && widgetNotices.length > 0) {
                  widgetImages = widgetNotices.map((notice: any) => ({
                    id: notice.id,
                    url: reconstructImageUrl(notice),
                    title: notice.title,
                    file: new File([], notice.title), // Placeholder file object
                    dbId: notice.id
                  }))
                }
                
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
                  images: widgetImages
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
              
              // Create a single screen for backward compatibility
              const singleScreen = {
                id: dashboard.id,
                name: 'Screen 1',
                widgets: newWidgets,
                layout: newLayout,
                widgetSettings: newWidgetSettings
              }
              
              setScreens([singleScreen])
              setCurrentScreenIndex(0)
              
              toast.success('Existing dashboard loaded successfully!', { duration: 1500 })
            } else {
              toast.error('Failed to load existing dashboard')
              // Redirect back to view page if dashboard not found
              setTimeout(() => {
                window.location.href = `/dashboard/view-dashboard/${dashboardId}`
              }, 2000)
            }
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
        toast.error("Failed to load templates", { duration: 2000 })
      }
    }

    loadTemplates()
  }, [])

  // Database template saving function
  const saveTemplate = async (template: DashboardTemplate, replaceExisting?: boolean) => {
    try {
      const result = await createDashboardTemplate(template, replaceExisting)
      if (result.success && result.template) {
        setTemplates(prev => [...prev, result.template!])
        return { success: true }
      } else if (result.error === "DUPLICATE_NAME") {
        return { success: false, error: "DUPLICATE_NAME" }
      } else {
        return { success: false, message: result.error || "Failed to save template" }
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
          toast.success("Template deleted successfully!", { duration: 1500 })
        } else {
          toast.error("Failed to delete template", { duration: 2000 })
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
        toast.success("Template updated successfully!", { duration: 1500 })
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
    const widgetTitle = type === "image" ? "Image Display" : 
                       `Notice Widget ${widgets.length + 1}`
    
    const newWidget: ExtendedWidget = {
      id: newWidgetId,
      title: widgetTitle,
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

    console.log("Adding widget:", newWidget, "Layout:", newLayout, "Current widgets:", widgets.length)
    setWidgets(prev => [...prev, newWidget])
    setLayout(prev => [...prev, newLayout])

    toast.success("Widget added successfully!", { duration: 1200 })
  }

  const removeWidget = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    setWidgets(prev => prev.filter((widget) => widget.id !== id))
    setLayout(prev => prev.filter((item) => item.i !== id))
    setWidgetSettings(prev => {
      const updatedSettings = { ...prev }
      delete updatedSettings[id]
      return updatedSettings
    })
    setActiveSettingsWidget(null)

            toast.success("Widget removed", { duration: 1200 })
  }

  const handleRatioSelect = (ratio: AspectRatio) => {
    setSelectedRatio(ratio)
    setIsRatioDropdownOpen(false)
    
    // Instead of clearing everything, adjust the layout to fit the new ratio
    setLayout(prev => {
      if (prev.length > 0) {
        const newLayout = prev.map(item => {
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
        
        toast(`Display ratio adjusted to ${ratio} while preserving widgets`)
        return newLayout
      } else {
        toast(`Display ratio set to ${ratio}`)
        return prev
      }
    })
  }

  const handleDragStart2 = (e: React.DragEvent, category: TCategoriesWithNotices) => {
    e.dataTransfer.setData("categoryId", category.id)
    e.dataTransfer.setData("categoryName", category.name)
    e.dataTransfer.effectAllowed = "copy"
    console.log("Drag started for category:", category.name, "with ID:", category.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    // Check if this is a drag operation by checking if there are any types in dataTransfer
    if (e.dataTransfer.types.length > 0) {
      setIsDragOverDashboard(true)
    }
  }

  const handleWidgetDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
    // Add visual feedback for widget drop zone
    const target = e.currentTarget as HTMLElement
    target.style.borderColor = '#3b82f6'
    target.style.borderWidth = '2px'
    target.style.borderStyle = 'dashed'
    target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
    console.log("Widget drag over:", target.id)
  }

  const handleWidgetDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Remove visual feedback for widget drop zone
    const target = e.currentTarget as HTMLElement
    const settings = widgetSettings[target.id] || DEFAULT_WIDGET_SETTINGS
    target.style.borderColor = settings.borderColor
    target.style.borderWidth = `${settings.borderWidth}px`
    target.style.borderStyle = 'solid'
    target.style.backgroundColor = ''
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only set to false if we're leaving the dashboard area completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverDashboard(false)
    }
  }

  const handleDrop = (e: React.DragEvent, widgetId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverDashboard(false)
    
    // Remove visual feedback if dropping on widget
    if (widgetId) {
      const target = e.currentTarget as HTMLElement
      const settings = widgetSettings[widgetId] || DEFAULT_WIDGET_SETTINGS
      target.style.borderColor = settings.borderColor
      target.style.borderWidth = `${settings.borderWidth}px`
      target.style.borderStyle = 'solid'
      target.style.backgroundColor = ''
    }
    
    const categoryId = e.dataTransfer.getData("categoryId")
    const categoryName = e.dataTransfer.getData("categoryName")
    
    console.log("Drop event - categoryId:", categoryId, "categoryName:", categoryName, "widgetId:", widgetId, "Current widgets:", widgets.length)

    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) {
      console.log("Category not found for ID:", categoryId)
      return
    }

    // If widgetId is provided, update existing widget
    if (widgetId) {
      console.log("Updating existing widget:", widgetId, "with category:", category.name)
      // Get top N notices from the category based on widget settings
      const noticeCount = widgetSettings[widgetId]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount
      // Limit the number of notices to prevent overflow
      const topNotices = [...category.notices].slice(0, noticeCount)

      setWidgets(prev =>
        prev.map((widget) =>
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

              toast.success(`Added ${categoryName} to widget`, { duration: 1200 })
    } else {
      console.log("Creating new widget with category:", category.name)
      // Create new widget at drop location
      createWidgetFromCategory(category, e)
    }
  }

  const createWidgetFromCategory = (category: TCategoriesWithNotices, e: React.DragEvent) => {
    if (!selectedRatio) {
      toast.error("Please select a display ratio first")
      return
    }

    // Calculate drop position relative to the dashboard container
    const dashboardContainer = e.currentTarget as HTMLElement
    const rect = dashboardContainer.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel position to grid position
    // GridLayout configuration: cols=12, rowHeight=50, margin=[12,12]
    const containerWidth = RATIO_DIMENSIONS[selectedRatio].width - 32
    const containerHeight = RATIO_DIMENSIONS[selectedRatio].height
    
    // Calculate grid cell dimensions
    const colWidth = (containerWidth - 11 * 24) / 12 // 11 gaps between 12 columns, each gap is 24px (12px margin on each side)
    const rowHeight = 50 // Fixed row height
    
    // Calculate grid position (ensure it's within bounds)
    const gridX = Math.max(0, Math.min(11, Math.floor(x / (colWidth + 24))))
    const gridY = Math.max(0, Math.min(11, Math.floor(y / (rowHeight + 24))))

    const newWidgetId = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newWidget: ExtendedWidget = {
      id: newWidgetId,
      title: category.name,
      type: "notice",
      content: category.name,
      category: category.name,
      categoryId: category.id,
      notices: category.notices,
      topNotices: category.notices.slice(0, DEFAULT_WIDGET_SETTINGS.noticeCount),
    }

    const newLayout: Layout = {
      i: newWidget.id,
      x: gridX,
      y: gridY,
      w: 4, // Default width
      h: 4, // Default height
    }

    // Initialize settings for this widget
    setWidgetSettings((prev) => ({
      ...prev,
      [newWidgetId]: { ...DEFAULT_WIDGET_SETTINGS },
    }))

    console.log("Creating widget from category:", newWidget, "Layout:", newLayout, "Current widgets:", widgets.length)
    setWidgets(prev => [...prev, newWidget])
    setLayout(prev => [...prev, newLayout])

    toast.success(`Created new widget with ${category.name} category!`, { duration: 1200 })
  }

  const calculateDimensionsPercentage = (widgetLayout: Layout) => {
    if (!selectedRatio) return { width: "0%", height: "0%" }

    const containerWidth = RATIO_DIMENSIONS[selectedRatio].width - 32
    const containerHeight = RATIO_DIMENSIONS[selectedRatio].height

    const colWidth = (containerWidth - 11 * 24) / 12 // Fixed: 11 gaps between 12 columns, each gap is 24px
    const rowHeight = 50 // Match the new rowHeight

    const widgetWidth = ((widgetLayout.w * colWidth + (widgetLayout.w - 1) * 24) / containerWidth) * 100
    const widgetHeight = ((widgetLayout.h * rowHeight + (widgetLayout.h - 1) * 24) / containerHeight) * 100

    return {
      width: `${widgetWidth.toFixed(1)}%`,
      height: `${widgetHeight.toFixed(1)}%`,
    }
  }

  const handleSave = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const dashboardId = urlParams.get('id')
    
    try {
      if (dashboardId) {
        // Update existing dashboards - delete old ones and create new ones
        // First, delete existing dashboards for this ID
        try {
          const deleteResponse = await fetch(`/api/dashboard/delete/${dashboardId}`, {
            method: 'DELETE',
          })
          const deleteResult = await deleteResponse.json()
          console.log("Delete result:", deleteResult)
          
          if (!deleteResult.success) {
            console.warn("Failed to delete existing dashboard:", deleteResult.error)
            // Continue with creation even if delete fails
          }
        } catch (error) {
          console.warn("Error deleting existing dashboard:", error)
          // Continue with creation even if delete fails
        }
      }

      // Create a separate dashboard record for each screen
      const dashboardResults = []
      
      for (let screenIndex = 0; screenIndex < screens.length; screenIndex++) {
        const screen = screens[screenIndex]
        
        // Calculate positions for this screen
        const positions = await Promise.all(screen.widgets.map(async (widget) => {
          const specificLayout = screen.layout.filter((item) => widget.id === item.i)[0]
          if (!specificLayout) return null

          const containerWidth = RATIO_DIMENSIONS[selectedRatio || "4:3"].width - 32
          const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height

          const colWidth = (containerWidth - 11 * 24) / 12
          const rowHeight = 50

          const leftPx = specificLayout.x * (colWidth + 24)
          const topPx = specificLayout.y * (rowHeight + 24)

          const leftPercent = (leftPx / containerWidth) * 100
          const topPercent = (topPx / containerHeight) * 100

          const widgetWidth = ((specificLayout.w * colWidth + (specificLayout.w - 1) * 24) / containerWidth) * 100
          const widgetHeight = ((specificLayout.h * rowHeight + (specificLayout.h - 1) * 24) / containerHeight) * 100

          const settings = screen.widgetSettings[widget.id] || DEFAULT_WIDGET_SETTINGS

          // Handle different widget types
          if (widget.type === "image" && widget.images && widget.images.length > 0) {
            // For image displays, create notices for each image and collect their IDs
            const imageNoticeIds = []
            
            // Use a default category for image displays (first available category or create a generic one)
            let imageCategoryId = ""
            try {
              const categories = await getCategories()
              if (categories.result && categories.result.length > 0) {
                // Use the first available category
                imageCategoryId = categories.result[0].id
              } else {
                // Create a default category if none exist
                const createCategoryResult = await createCategory({ name: "General" })
                if (createCategoryResult.success) {
                  const newCategories = await getCategories()
                  if (newCategories.result && newCategories.result.length > 0) {
                    imageCategoryId = newCategories.result[0].id
                  }
                }
              }
            } catch (error) {
              console.error("Error handling image display category:", error)
            }
            
            for (const image of widget.images) {
              try {
                // Create a notice for this image
                const noticeData = {
                  title: image.title || "Image Notice",
                  content: `Image: ${image.title}`,
                  category: "Image", // Use generic category name
                  categoryId: imageCategoryId,
                  imageUrl: image.url, // Store the full data URL for display
                  imageFileName: image.title,
                  imageData: image.url.split(',')[1], // Store only the base64 data without the prefix
                }
                
                // Create the notice using the server action directly
                const noticeResult = await createNotice(noticeData)
                
                if (noticeResult.success) {
                  imageNoticeIds.push(noticeResult.message.id)
                  console.log(`Created notice for image: ${image.title} with ID: ${noticeResult.message.id}`)
                } else {
                  console.error(`Failed to create notice for image: ${image.title}`, noticeResult)
                }
              } catch (error) {
                console.error(`Error creating notice for image: ${image.title}`, error)
              }
            }
            
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
              title: widget.content || widget.title || "Image Display",
              category: "Image", // Use generic category name
              type: "image",
              noticeIds: imageNoticeIds, // Use the created notice IDs
              settings: {
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
                categoryFont: settings.categoryFont,
                categoryFontSize: settings.categoryFontSize,
                categoryFontWeight: settings.categoryFontWeight,
                categoryFontColor: settings.categoryFontColor,
                categoryBackgroundColor: settings.categoryBackgroundColor,
                categoryHeight: settings.categoryHeight,
                categoryBorderColor: settings.categoryBorderColor,
                categoryBorderWidth: settings.categoryBorderWidth,
                customCategoryName: settings.customCategoryName,
                // Add image-specific settings
                imageFit: settings.imageFit,
                imageBorderRadius: settings.imageBorderRadius,
                showImageTitle: settings.showImageTitle,
                imageTitleColor: settings.imageTitleColor,
                imageTitleFontSize: settings.imageTitleFontSize,
                imageTitleFontWeight: settings.imageTitleFontWeight,
                imageOverlay: settings.imageOverlay,
                imageOverlayOpacity: settings.imageOverlayOpacity,
                imageShadow: settings.imageShadow,
                imageShadowColor: settings.imageShadowColor,
                imageShadowBlur: settings.imageShadowBlur,
                imageShadowOffset: settings.imageShadowOffset,
                imageZoom: settings.imageZoom,
                imageRotation: settings.imageRotation,
                imageBrightness: settings.imageBrightness,
                imageContrast: settings.imageContrast,
                imageSaturation: settings.imageSaturation,
                imageBlur: settings.imageBlur,
                imageGrayscale: settings.imageGrayscale,
                imageSepia: settings.imageSepia,
                imageInvert: settings.imageInvert,
              },
            }
          } else {
            // For notice widgets, use existing logic
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
                categoryFont: settings.categoryFont,
                categoryFontSize: settings.categoryFontSize,
                categoryFontWeight: settings.categoryFontWeight,
                categoryFontColor: settings.categoryFontColor,
                categoryBackgroundColor: settings.categoryBackgroundColor,
                categoryHeight: settings.categoryHeight,
                categoryBorderColor: settings.categoryBorderColor,
                categoryBorderWidth: settings.categoryBorderWidth,
                customCategoryName: settings.customCategoryName,
              },
            }
          }
        }))

        // Filter out null positions
        const validPositions = positions.filter(Boolean)

        // Create dashboard data for this screen
        const dashboardData = {
          aspectRatio: selectedRatio,
          containers: validPositions,
          screenName: screen.name,
          screenIndex: screenIndex,
          totalScreens: screens.length
        }

        // Create the dashboard record
        console.log("Saving dashboard data:", dashboardData)
        const result = await createDashboard(dashboardData)
        console.log("Save result:", result)
        dashboardResults.push(result)
        
        if (!result.success) {
          console.error("Failed to save screen:", result.result)
          toast.error(`Failed to save screen ${screenIndex + 1}: ${screen.name} - ${result.result}`)
          return
        }
      }

      // Check if all screens were saved successfully
      const allSuccessful = dashboardResults.every(result => result.success)
      
      if (allSuccessful) {
        clearSavedState() // Clear saved state after successful save
        toast.success(`Dashboard saved successfully! ${screens.length} screen${screens.length > 1 ? 's' : ''} created.`, { duration: 2000 })
        console.log("All screens saved successfully:", dashboardResults)
      } else {
        toast.error("Some screens failed to save!")
        console.error("Some screens failed to save:", dashboardResults)
      }
      
    } catch (error) {
      console.error("Error saving dashboard:", error)
      toast.error(`Error saving dashboard: ${error}`)
    }
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
      setWidgets(prev => {
        const widget = prev.find((w) => w.id === widgetId)
        if (widget && widget.notices) {
          const topNotices = [...widget.notices].slice(0, value)
          return prev.map((w) =>
            w.id === widgetId
              ? {
                  ...w,
                  topNotices: topNotices,
                }
              : w,
          )
        }
        return prev
      })
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

  const handleTemplateSave = async (replaceExisting?: boolean) => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    const newTemplate: DashboardTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      widgets: [...widgets],
      layout: [...layout],
      widgetSettings: { ...widgetSettings }
    }

    try {
      const result = await saveTemplate(newTemplate, replaceExisting)
      
      if (result.success) {
        setShowTemplateModal(false)
        setTemplateName("")
        setTemplateDescription("")
        setShowDuplicateNameDialog(false)
        setPendingTemplate(null)
        toast.success("Template saved successfully!", { duration: 1500 })
      } else if (result.error === "DUPLICATE_NAME") {
        // Show duplicate name dialog
        setPendingTemplate(newTemplate)
        setShowDuplicateNameDialog(true)
        setShowTemplateModal(false)
      } else {
        toast.error("Failed to save template", { duration: 2000 })
      }
    } catch (error) {
      toast.error("Error saving template")
    }
  }

  const handleReplaceTemplate = async () => {
    if (pendingTemplate) {
      // Check if this is a custom template or regular template
      if (pendingTemplate.id.startsWith('custom-template-')) {
        await saveCustomTemplate(true)
      } else {
        await handleTemplateSave(true)
      }
    }
  }

  const handleTryAnotherName = () => {
    setShowDuplicateNameDialog(false)
    setPendingTemplate(null)
    // Check if this was a custom template or regular template
    if (pendingTemplate?.id.startsWith('custom-template-')) {
      setIsTemplateModalOpen(true)
    } else {
      setShowTemplateModal(true)
    }
  }

  // Add this new function to save the custom template
  // Add after handleSaveTemplate

  const saveCustomTemplate = async (replaceExisting?: boolean) => {
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
      const result = await saveTemplate(newTemplate, replaceExisting)

      if (result.success) {
        // Update local state
        setCustomTemplates([...customTemplates, newTemplate])
        setIsTemplateModalOpen(false)
        setNewTemplateName("")
        setNewTemplateDescription("")
        setShowDuplicateNameDialog(false)
        setPendingTemplate(null)
        toast.success(`Template "${newTemplateName}" saved successfully!`, { duration: 1500 })
      } else if (result.error === "DUPLICATE_NAME") {
        // Show duplicate name dialog for custom template
        setPendingTemplate(newTemplate)
        setShowDuplicateNameDialog(true)
        setIsTemplateModalOpen(false)
      } else {
        toast.error("Failed to save template to database", { duration: 2000 })
      }
    } catch (error) {
      toast.error(`Error saving template: ${error}`)
    } finally {
      setIsSavingTemplate(false)
    }
  }

  // Enhanced image upload for image displays with professional features
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, widgetId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Enhanced file validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)')
      return
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Image file size must be less than 10MB')
      return
    }

    // Show loading toast
    const loadingToast = toast.loading('Processing image...')

    const reader = new FileReader()
    reader.onload = (event) => {
      // Create image element to get dimensions
      const img = new Image()
      img.onload = () => {
      const imageData = {
        id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        url: event.target?.result as string,
        title: file.name,
        file: file,
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
      }

      setWidgets(prev => prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, images: [imageData] }
          : widget
      ))

        toast.dismiss(loadingToast)
        toast.success(`Image uploaded successfully! (${img.width}×${img.height})`, {
          description: `${(file.size / 1024 / 1024).toFixed(1)}MB`
        })
      }
      img.onerror = () => {
        toast.dismiss(loadingToast)
        toast.error('Failed to process image. Please try again.')
      }
      img.src = event.target?.result as string
    }
    reader.onerror = () => {
      toast.dismiss(loadingToast)
      toast.error('Failed to read image file. Please try again.')
    }
    reader.readAsDataURL(file)
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

    // Reserve space for the widget header and other elements
    const reservedSpace = 120 // Space for header and other elements

    return Math.max(80, widgetHeight - reservedSpace) // Ensure minimum height of 80px
  }

  // Add this function inside the EditDashboardDemo component
  const applyTemplate = (template: DashboardTemplate) => {
    // Store all existing widget data (categories, notices, content) by position
    const existingWidgetData = widgets.map((widget) => ({
      notices: widget.notices || [],
      topNotices: widget.topNotices || [],
      category: widget.category,
      categoryId: widget.categoryId,
      content: widget.content,
      customCategoryName: widgetSettings[widget.id]?.customCategoryName || ''
    }))

    // Apply template completely but preserve existing categories and notices for corresponding positions
    const newWidgets = template.widgets.map((templateWidget, index) => {
      const existingData = existingWidgetData[index]
      
      return {
        ...templateWidget,
        // Always preserve existing notices if they exist
        notices: existingData?.notices || [],
        topNotices: existingData?.topNotices || [],
        // Preserve existing category COMPLETELY - don't fall back to template
        category: existingData?.category || templateWidget.title,
        categoryId: existingData?.categoryId || '',
        // Preserve existing content if it exists
        content: existingData?.content || templateWidget.title
      }
    })

    // Update widget settings to apply template colors while preserving only specific user settings
    const newWidgetSettings = { ...template.widgetSettings }
    
    // For each new widget, preserve only specific settings (not colors/styling)
    newWidgets.forEach((newWidget, index) => {
      const oldWidget = widgets[index]
      if (oldWidget && widgetSettings[oldWidget.id]) {
        const oldSettings = widgetSettings[oldWidget.id]
        const existingData = existingWidgetData[index]
        
        // Check if this widget has an existing category or content
        const hasExistingCategory = !!(existingData?.category || existingData?.content)
        
        // Apply template settings first, then selectively preserve only non-visual settings
        newWidgetSettings[newWidget.id] = {
          ...newWidgetSettings[newWidget.id], // Template settings (including colors)
          // Preserve only content-related settings, not visual/color settings
          noticeCount: oldSettings.noticeCount || newWidgetSettings[newWidget.id]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount,
          autoScroll: oldSettings.autoScroll !== undefined ? oldSettings.autoScroll : newWidgetSettings[newWidget.id]?.autoScroll,
          showFullContent: oldSettings.showFullContent !== undefined ? oldSettings.showFullContent : newWidgetSettings[newWidget.id]?.showFullContent,
          // Preserve customCategoryName ONLY if the widget has an existing category or content
          // If there's an existing category, preserve the customCategoryName exactly as it was
          // If there's no existing category, use the template's customCategoryName
          customCategoryName: hasExistingCategory 
            ? oldSettings.customCategoryName ?? '' // Preserve existing customCategoryName exactly as it was (use nullish coalescing)
            : (newWidgetSettings[newWidget.id]?.customCategoryName || '')
        }
      }
    })

    // Update the current screen with the new template data
    const newScreens = [...screens]
    newScreens[currentScreenIndex] = {
      ...newScreens[currentScreenIndex],
      widgets: newWidgets,
      layout: template.layout,
      widgetSettings: newWidgetSettings
    }
    setScreens(newScreens)
    
    toast.success(`Applied "${template.name}" template to current screen while preserving all categories and content!`, { duration: 1500 })
  }

  const createDashboardFromTemplate = async (template: DashboardTemplate) => {
    if (!selectedRatio) {
      toast.error("Please select a display ratio first")
      return
    }

    // Apply template without preserving notices to the current screen
    const newScreens = [...screens]
    newScreens[currentScreenIndex] = {
      ...newScreens[currentScreenIndex],
      widgets: template.widgets,
      layout: template.layout,
      widgetSettings: template.widgetSettings
    }
    setScreens(newScreens)

    // Wait a moment for the state to update
    setTimeout(async () => {
      try {
        // Create a separate dashboard record for each screen
        const dashboardResults = []
        
        // Use the updated screens state
        const updatedScreens = newScreens
        
        for (let screenIndex = 0; screenIndex < updatedScreens.length; screenIndex++) {
          const screen = updatedScreens[screenIndex]
          
          // Calculate positions for this screen
          const positions = await Promise.all(screen.widgets.map(async (widget) => {
            const specificLayout = screen.layout.filter((item) => widget.id === item.i)[0]
            if (!specificLayout) return null

            const containerWidth = RATIO_DIMENSIONS[selectedRatio || "4:3"].width - 32
            const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height

            const colWidth = (containerWidth - 11 * 24) / 12
            const rowHeight = 50

            const leftPx = specificLayout.x * (colWidth + 24)
            const topPx = specificLayout.y * (rowHeight + 24)

            const leftPercent = (leftPx / containerWidth) * 100
            const topPercent = (topPx / containerHeight) * 100

            const widgetWidth = ((specificLayout.w * colWidth + (specificLayout.w - 1) * 24) / containerWidth) * 100
            const widgetHeight = ((specificLayout.h * rowHeight + (specificLayout.h - 1) * 24) / containerHeight) * 100

            const settings = screen.widgetSettings[widget.id] || DEFAULT_WIDGET_SETTINGS

            // Handle different widget types
            if (widget.type === "image" && widget.images && widget.images.length > 0) {
              // For image displays, create notices for each image and collect their IDs
              const imageNoticeIds = []
              
              // Use a default category for image displays (first available category or create a generic one)
              let imageCategoryId = ""
              try {
                const categories = await getCategories()
                if (categories.result && categories.result.length > 0) {
                  // Use the first available category
                  imageCategoryId = categories.result[0].id
                } else {
                  // Create a default category if none exist
                  const createCategoryResult = await createCategory({ name: "General" })
                  if (createCategoryResult.success) {
                    const newCategories = await getCategories()
                    if (newCategories.result && newCategories.result.length > 0) {
                      imageCategoryId = newCategories.result[0].id
                    }
                  }
                }
              } catch (error) {
                console.error("Error handling image display category:", error)
              }
              
              for (const image of widget.images) {
                try {
                                  // Create a notice for this image
                const noticeData = {
                  title: image.title || "Image Title",
                  content: `Image: ${image.title}`,
                  category: "Image", // Use generic category name
                  categoryId: imageCategoryId,
                  imageUrl: image.url, // Store the full data URL for display
                  imageFileName: image.title,
                  imageData: image.url.split(',')[1], // Store only the base64 data without the prefix
                }
                  
                  // Create the notice using the server action directly
                  const noticeResult = await createNotice(noticeData)
                  
                  if (noticeResult.success) {
                    imageNoticeIds.push(noticeResult.message.id)
                    console.log(`Created notice for image: ${image.title} with ID: ${noticeResult.message.id}`)
                  } else {
                    console.error(`Failed to create notice for image: ${image.title}`, noticeResult)
                  }
                } catch (error) {
                  console.error(`Error creating notice for image: ${image.title}`, error)
                }
              }
              
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
                title: widget.content || widget.title || "Image Display",
                category: "Image", // Use generic category name
                type: "image",
                noticeIds: imageNoticeIds, // Use the created notice IDs
                settings: {
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
                  categoryFont: settings.categoryFont,
                  categoryFontSize: settings.categoryFontSize,
                  categoryFontWeight: settings.categoryFontWeight,
                  categoryFontColor: settings.categoryFontColor,
                  categoryBackgroundColor: settings.categoryBackgroundColor,
                  categoryHeight: settings.categoryHeight,
                  categoryBorderColor: settings.categoryBorderColor,
                  categoryBorderWidth: settings.categoryBorderWidth,
                  customCategoryName: settings.customCategoryName,
                  // Add image-specific settings
                  imageFit: settings.imageFit,
                  imageBorderRadius: settings.imageBorderRadius,
                  showImageTitle: settings.showImageTitle,
                  imageTitleColor: settings.imageTitleColor,
                  imageTitleFontSize: settings.imageTitleFontSize,
                  imageTitleFontWeight: settings.imageTitleFontWeight,
                  imageOverlay: settings.imageOverlay,
                  imageOverlayOpacity: settings.imageOverlayOpacity,
                  imageShadow: settings.imageShadow,
                  imageShadowColor: settings.imageShadowColor,
                  imageShadowBlur: settings.imageShadowBlur,
                  imageShadowOffset: settings.imageShadowOffset,
                  imageZoom: settings.imageZoom,
                  imageRotation: settings.imageRotation,
                  imageBrightness: settings.imageBrightness,
                  imageContrast: settings.imageContrast,
                  imageSaturation: settings.imageSaturation,
                  imageBlur: settings.imageBlur,
                  imageGrayscale: settings.imageGrayscale,
                  imageSepia: settings.imageSepia,
                  imageInvert: settings.imageInvert,
                },
              }
            } else {
              // For notice widgets, use existing logic
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
                  categoryFont: settings.categoryFont,
                  categoryFontSize: settings.categoryFontSize,
                  categoryFontWeight: settings.categoryFontWeight,
                  categoryFontColor: settings.categoryFontColor,
                  categoryBackgroundColor: settings.categoryBackgroundColor,
                  categoryHeight: settings.categoryHeight,
                  categoryBorderColor: settings.categoryBorderColor,
                  categoryBorderWidth: settings.categoryBorderWidth,
                  customCategoryName: settings.customCategoryName,
                },
              }
            }
          }))

          // Filter out null positions
          const validPositions = positions.filter(Boolean)

          // Create dashboard data for this screen
          const dashboardData = {
            aspectRatio: selectedRatio,
            containers: validPositions,
            screenName: screen.name,
            screenIndex: screenIndex,
            totalScreens: updatedScreens.length
          }

          // Create the dashboard record
          console.log("Saving dashboard data from template:", dashboardData)
          const result = await createDashboard(dashboardData)
          console.log("Save result from template:", result)
          dashboardResults.push(result)
          
          if (!result.success) {
            console.error("Failed to save screen from template:", result.result)
            toast.error(`Failed to save screen ${screenIndex + 1}: ${screen.name} - ${result.result}`)
            return
          }
        }

        // Check if all screens were saved successfully
        const allSuccessful = dashboardResults.every(result => result.success)
        
        if (allSuccessful) {
          toast.success(`Dashboard created from "${template.name}" template! ${updatedScreens.length} screen${updatedScreens.length > 1 ? 's' : ''} created.`, { duration: 2000 })
          console.log("All screens created from template successfully:", dashboardResults)
        } else {
          toast.error("Some screens failed to save!")
          console.error("Some screens failed to save from template:", dashboardResults)
        }
        
      } catch (error) {
        console.error("Error creating dashboard from template:", error)
        toast.error(`Error creating dashboard: ${error}`)
      }
    }, 500)
  }

  const isEditing = new URLSearchParams(window.location.search).get('id') !== null



  // Template management state
  const [templates, setTemplates] = useState<DashboardTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  
  
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



      <div className="mb-6 flex flex-wrap gap-4 ml-4">
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
            className="bg-slate-700 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-all shadow-sm hover:shadow-md border border-slate-600"
          >
            <span className="flex items-center gap-2 font-medium">
              <LayoutIcon size={16} />
              Display: {selectedRatio ? selectedRatio : "Select"}
              <ChevronDown size={14} />
            </span>
          </button>
          {isRatioDropdownOpen && (
            <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 z-10 min-w-[120px]">
              {(["4:3", "16:9", "16:10"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleRatioSelect(ratio)}
                  className="block w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 first:rounded-t-lg last:rounded-b-lg"
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => addWidget("notice")}
            disabled={!selectedRatio}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium ${
              selectedRatio ? "bg-blue-600 text-white hover:bg-blue-700 border border-blue-500" : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
            }`}
          >
            <Plus size={18} /> Create Notice Widget
          </button>
          
          <button
            onClick={() => addWidget("image")}
            disabled={!selectedRatio}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md font-medium ${
              selectedRatio ? "bg-green-600 text-white hover:bg-green-700 border border-green-500" : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
            }`}
          >
            <ImageIcon size={18} /> Create Image Display
          </button>
          

        </div>
        


        

        



        <button
          onClick={handleSave}
          disabled={!selectedRatio || screens.every(screen => screen.widgets.length === 0)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md ml-auto font-medium ${
            selectedRatio && screens.some(screen => screen.widgets.length > 0)
              ? "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-500"
              : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
          }`}
        >
          {new URLSearchParams(window.location.search).get('id') ? 'Update Dashboard' : `Save Dashboard (${screens.length} screen${screens.length > 1 ? 's' : ''})`}
        </button>
      </div>

      {/* Screen Management Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Screen Management</h3>
              <p className="text-slate-600 text-sm mt-1">Organize and manage multiple display screens</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{screens.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Active Screens</div>
            </div>
            <button
              onClick={addScreen}
              className="group relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl border-0 transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all">
                  <Plus size={18} className="text-white" />
                </div>
                <span>Add New Screen</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
            </button>
          </div>
        </div>
        
        {/* Screen Tabs with Enhanced Design */}
        <div className="relative">
          <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {screens.map((screen, index) => (
              <div
                key={screen.id}
                className={`group relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all duration-300 min-w-fit ${
                  index === currentScreenIndex
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg shadow-blue-200/50'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 hover:shadow-md'
                }`}
                onClick={() => setCurrentScreenIndex(index)}
              >
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentScreenIndex 
                    ? 'bg-blue-500 shadow-sm shadow-blue-400' 
                    : 'bg-slate-300 group-hover:bg-blue-400'
                }`} />
                <span className="font-semibold text-sm whitespace-nowrap">{screen.name}</span>
                {screens.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeScreen(index)
                    }}
                    className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 group/remove opacity-0 group-hover:opacity-100"
                    title="Remove screen"
                  >
                    <X size={14} className="text-red-500 group-hover/remove:text-red-700" />
                  </button>
                )}
                {index === currentScreenIndex && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
          

        </div>
      </div>

      <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border border-slate-200 w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-100 rounded-lg">
            <GripVertical className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Notice Categories</h3>
            <p className="text-sm text-slate-500 mt-1">Drag categories to widgets to populate with notices</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {categories.length === 0 ? (
            <div className="w-full text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
                <ListFilter className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No categories available</p>
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => handleDragStart2(e, category)}
                className="group relative bg-slate-50 hover:bg-blue-50 px-4 py-3 rounded-xl cursor-move border border-slate-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-200 group-hover:bg-blue-200 rounded-lg transition-colors">
                    <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-blue-800 transition-colors text-sm truncate">
                      {category.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-slate-600 font-medium">
                        {category.notices.length} {category.notices.length === 1 ? 'notice' : 'notices'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Dashboard Area - Left Side (3/4 width) */}
        <div className="xl:col-span-3">
          {/* Current Screen Indicator */}
          <div className="mb-3 px-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Editing:</span>
              <span className="text-blue-600 font-medium">{currentScreen?.name}</span>
              <span className="text-gray-400">({currentScreenIndex + 1} of {screens.length})</span>
            </div>
          </div>
          
      {selectedRatio && (
        <div
          className={`border-4 border-dashed rounded-lg mx-auto overflow-hidden bg-white p-4 relative transition-all duration-200 ${
            isDragOverDashboard 
              ? 'border-blue-400 bg-blue-50 shadow-lg' 
              : 'border-gray-300'
          }`}
          style={{
            width: RATIO_DIMENSIONS[selectedRatio].width,
            height: RATIO_DIMENSIONS[selectedRatio].height,
          }}
          onDrop={(e) => handleDrop(e)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Drop zone indicator */}
          {isDragOverDashboard && (
            <div className="absolute inset-0 pointer-events-none bg-blue-50 bg-opacity-50 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-blue-700 font-medium">Drop category to create notice widget</p>
              </div>
            </div>
          )}
          
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
                  onDragOver={handleWidgetDragOver}
                  onDragLeave={handleWidgetDragLeave}
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
                      {settings.customCategoryName || 
                        (widget.type === "image" ? "Image Display" : 
                         widget.content || widget.title)}
                      {widget.type === "notice" && widget.topNotices && widget.topNotices.length > 0 && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {widget.topNotices.length} notices
                        </span>
                      )}
                      {widget.type === "image" && widget.images && widget.images.length > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {widget.images.length} image{widget.images.length > 1 ? 's' : ''}
                        </span>
                      )}

                    </h3>
                  </div>

                  {/* Widget Content - Flex grow to fill available space */}
                  <div className="p-2 flex-grow flex flex-col overflow-hidden">
                    {/* Widget Content based on type */}
                    {widget.type === "notice" && (
                      <>
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
                                      <div
                                        className="text-xs mt-1"
                                        style={{
                                          color: settings.fontColor,
                                          opacity: 0.7,
                                          fontFamily: settings.fontFamily,
                                          wordBreak: "break-word", // Prevent long words from overflowing
                                        }}
                                      >
                                        <div 
                                          dangerouslySetInnerHTML={{ __html: notice.content }}
                                        />
                                      </div>
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
                      </>
                    )}

                    {/* Enhanced Professional Image Display Content */}
                    {widget.type === "image" && (
                      <div className="flex flex-col h-full">
                        {widget.images && widget.images.length > 0 ? (
                          <div className="flex-grow flex items-center justify-center relative overflow-hidden">
                            <div className="relative w-full h-full group">
                              {/* Professional Image Container with Enhanced Styling */}
                              <div
                                className="w-full h-full relative overflow-hidden"
                                style={{
                                  borderRadius: `${settings.imageBorderRadius}px`,
                                  boxShadow: settings.imageShadow 
                                    ? `${settings.imageShadowOffset}px ${settings.imageShadowOffset}px ${settings.imageShadowBlur}px ${settings.imageShadowColor}`
                                    : 'none',
                                }}
                              >
                                {/* Image with Professional Filters */}
                              <img
                                src={widget.images[0].url}
                                alt={widget.images[0].title}
                                  className="w-full h-full transition-all duration-300"
                                style={{
                                  objectFit: settings.imageFit as any,
                                  borderRadius: `${settings.imageBorderRadius}px`,
                                    transform: `rotate(${settings.imageRotation}deg)`,
                                    filter: `
                                      brightness(${settings.imageBrightness}%) 
                                      contrast(${settings.imageContrast}%) 
                                      saturate(${settings.imageSaturation}%) 
                                      blur(${settings.imageBlur}px)
                                      ${settings.imageGrayscale ? 'grayscale(100%)' : ''}
                                      ${settings.imageSepia ? 'sepia(100%)' : ''}
                                      ${settings.imageInvert ? 'invert(100%)' : ''}
                                    `,
                                    cursor: settings.imageZoom ? 'zoom-in' : 'default',
                                }}
                                onError={() => {
                                  toast.error('Image could not be loaded')
                                }}
                              />
                                
                                {/* Professional Overlay */}
                                {settings.imageOverlay && (
                                  <div
                                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                                    style={{
                                      opacity: settings.imageOverlayOpacity,
                                    }}
                                  />
                                )}
                                
                                {/* Enhanced Image Title */}
                              {settings.showImageTitle && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
                                  style={{
                                    color: settings.imageTitleColor,
                                    fontSize: `${settings.imageTitleFontSize}px`,
                                    fontWeight: settings.imageTitleFontWeight,
                                  }}
                                >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{widget.images[0].title}</p>
                                        {widget.images[0].width && widget.images[0].height && (
                                          <p className="text-xs opacity-75 mt-1">
                                            {widget.images[0].width} × {widget.images[0].height}
                                            {widget.images[0].size && (
                                              <span className="ml-2">
                                                ({(widget.images[0].size / 1024 / 1024).toFixed(1)}MB)
                                              </span>
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                </div>
                              )}
                              </div>
                              
                              {/* Professional Control Overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                      <Upload size={16} />
                                      Replace
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      onChange={(e) => handleImageUpload(e, widget.id)}
                                                      className="hidden"
                                                    />
                                                  </label>
                                    <button
                                      onClick={() => toggleWidgetSettings(widget.id)}
                                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                    >
                                      <Settings size={16} />
                                      Settings
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/30"
                            style={{
                              borderColor: settings.fontColor,
                              opacity: 0.6,
                              fontFamily: settings.fontFamily,
                            }}
                          >
                            <div className="text-center flex flex-col items-center justify-center h-full">
                              <p className="text-sm opacity-75 mb-6" style={{ color: settings.fontColor }}>
                                JPG, PNG, GIF, WebP • Max 10MB
                              </p>
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 text-xs font-medium">
                                <Upload size={12} />
                                Browse Files
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, widget.id)}
                                  className="hidden"
                            />
                              </label>
                            </div>
                          </div>
                        )}
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
                {userRole !== 'MODERATOR' && (
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Save Current
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Templates List */}
            <div className="space-y-2">
              {/* Template Count Header */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                {widgets.length === 0 ? (
                  <span className="text-amber-600">
                    Add widgets to see available templates
                  </span>
                ) : (
                  <>
                    <span>
                      {templates.filter(t => t.widgets.length === widgets.length).length} template{templates.filter(t => t.widgets.length === widgets.length).length !== 1 ? 's' : ''} available for {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
                    </span>
                    {templates.length > templates.filter(t => t.widgets.length === widgets.length).length && (
                      <span className="text-gray-400">
                        {templates.length - templates.filter(t => t.widgets.length === widgets.length).length} other template{templates.length - templates.filter(t => t.widgets.length === widgets.length).length !== 1 ? 's' : ''} available
                      </span>
                    )}
                  </>
                )}
              </div>
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : templates.filter(template => template.widgets.length === widgets.length).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">No templates available for {widgets.length} widget{widgets.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-400 mt-1">Create a template with {widgets.length} widget{widgets.length !== 1 ? 's' : ''} or add more widgets</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {templates
                    .filter(template => {
                      // Filter by search term
                      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        template.description?.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      // Filter by widget count to match current screen
                      const matchesWidgetCount = template.widgets.length === widgets.length;
                      
                      return matchesSearch && matchesWidgetCount;
                    })
                    .map((template) => (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
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
                            {userRole !== 'MODERATOR' && (
                              <>
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
                              </>
                            )}
                          </div>
                        </div>
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
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 animate-in fade-in-0 duration-200 z-40"
            onClick={() => setActiveSettingsWidget(null)}
          />
          <div
            ref={settingsRef}
            className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-[500px] max-h-[85vh] flex flex-col animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
            style={{
              left: `${settingsPosition.x}px`,
              top: `${settingsPosition.y}px`,
            }}
          >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-gray-200 animate-in slide-in-from-top-2 duration-200"
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
          <div className="flex border-b border-gray-200 bg-gray-50 animate-in slide-in-from-top-2 duration-300 delay-100">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-all duration-200 flex-1 min-w-0
                  ${
                    activeSettingsTab === tab.id
                      ? "text-blue-700 border-b-2 border-blue-600 bg-white shadow-sm"
                      : "text-gray-600 hover:bg-white hover:text-gray-800"
                  }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content with proper scrolling */}
          <div className="p-6 overflow-y-auto flex-1 bg-white animate-in fade-in-0 duration-500 delay-200">
            {/* Style Tab */}
            {activeSettingsTab === "style" && (
              <div className="space-y-8 animate-in fade-in-0 slide-in-from-left-2 duration-300">
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
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
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
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
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
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
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

            {/* Image Tab - Only show for image displays */}
            {activeSettingsTab === "image" && (
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
                {/* Image Display Settings */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <ImageIcon size={16} /> Display Settings
                  </label>
                  <div className="space-y-4">
                    {/* Image Fit */}
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">Image Fit</span>
                      <select
                        value={widgetSettings[activeSettingsWidget]?.imageFit || DEFAULT_WIDGET_SETTINGS.imageFit}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageFit", e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="cover">Cover (Fill)</option>
                        <option value="contain">Contain (Fit)</option>
                        <option value="fill">Fill (Stretch)</option>
                        <option value="none">None (Original)</option>
                        <option value="scale-down">Scale Down</option>
                      </select>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Border Radius</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.imageBorderRadius || DEFAULT_WIDGET_SETTINGS.imageBorderRadius}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={widgetSettings[activeSettingsWidget]?.imageBorderRadius || DEFAULT_WIDGET_SETTINGS.imageBorderRadius}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageBorderRadius", Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Show Image Title */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Show Image Title</span>
                        <button
                          onClick={() =>
                            updateWidgetSetting(
                              activeSettingsWidget,
                              "showImageTitle",
                              !(widgetSettings[activeSettingsWidget]?.showImageTitle || false),
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            widgetSettings[activeSettingsWidget]?.showImageTitle ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              widgetSettings[activeSettingsWidget]?.showImageTitle ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Effects */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Palette size={16} /> Image Effects
                  </label>
                  <div className="space-y-4">
                    {/* Brightness */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Brightness</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.imageBrightness || DEFAULT_WIDGET_SETTINGS.imageBrightness}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={widgetSettings[activeSettingsWidget]?.imageBrightness || DEFAULT_WIDGET_SETTINGS.imageBrightness}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageBrightness", Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Contrast</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.imageContrast || DEFAULT_WIDGET_SETTINGS.imageContrast}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={widgetSettings[activeSettingsWidget]?.imageContrast || DEFAULT_WIDGET_SETTINGS.imageContrast}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageContrast", Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Saturation</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.imageSaturation || DEFAULT_WIDGET_SETTINGS.imageSaturation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={widgetSettings[activeSettingsWidget]?.imageSaturation || DEFAULT_WIDGET_SETTINGS.imageSaturation}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageSaturation", Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Blur */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Blur</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.imageBlur || DEFAULT_WIDGET_SETTINGS.imageBlur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={widgetSettings[activeSettingsWidget]?.imageBlur || DEFAULT_WIDGET_SETTINGS.imageBlur}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageBlur", Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Rotation */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Rotation</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.imageRotation || DEFAULT_WIDGET_SETTINGS.imageRotation}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={widgetSettings[activeSettingsWidget]?.imageRotation || DEFAULT_WIDGET_SETTINGS.imageRotation}
                        onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageRotation", Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Filters */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Layers size={16} /> Image Filters
                  </label>
                  <div className="space-y-3">
                    {/* Grayscale */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Grayscale</span>
                        <button
                          onClick={() =>
                            updateWidgetSetting(
                              activeSettingsWidget,
                              "imageGrayscale",
                              !(widgetSettings[activeSettingsWidget]?.imageGrayscale || false),
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            widgetSettings[activeSettingsWidget]?.imageGrayscale ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              widgetSettings[activeSettingsWidget]?.imageGrayscale ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Sepia */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sepia</span>
                        <button
                          onClick={() =>
                            updateWidgetSetting(
                              activeSettingsWidget,
                              "imageSepia",
                              !(widgetSettings[activeSettingsWidget]?.imageSepia || false),
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            widgetSettings[activeSettingsWidget]?.imageSepia ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              widgetSettings[activeSettingsWidget]?.imageSepia ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Invert */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Invert Colors</span>
                        <button
                          onClick={() =>
                            updateWidgetSetting(
                              activeSettingsWidget,
                              "imageInvert",
                              !(widgetSettings[activeSettingsWidget]?.imageInvert || false),
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            widgetSettings[activeSettingsWidget]?.imageInvert ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              widgetSettings[activeSettingsWidget]?.imageInvert ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Overlay & Shadow */}
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <Box size={16} /> Overlay & Shadow
                  </label>
                  <div className="space-y-4">
                    {/* Image Overlay */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Image Overlay</span>
                        <button
                          onClick={() =>
                            updateWidgetSetting(
                              activeSettingsWidget,
                              "imageOverlay",
                              !(widgetSettings[activeSettingsWidget]?.imageOverlay || false),
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            widgetSettings[activeSettingsWidget]?.imageOverlay ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              widgetSettings[activeSettingsWidget]?.imageOverlay ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Overlay Opacity */}
                    {widgetSettings[activeSettingsWidget]?.imageOverlay && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Overlay Opacity</span>
                          <span className="text-xs text-gray-600">
                            {Math.round((widgetSettings[activeSettingsWidget]?.imageOverlayOpacity || DEFAULT_WIDGET_SETTINGS.imageOverlayOpacity) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={widgetSettings[activeSettingsWidget]?.imageOverlayOpacity || DEFAULT_WIDGET_SETTINGS.imageOverlayOpacity}
                          onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageOverlayOpacity", Number.parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}

                    {/* Image Shadow */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Image Shadow</span>
                        <button
                          onClick={() =>
                            updateWidgetSetting(
                              activeSettingsWidget,
                              "imageShadow",
                              !(widgetSettings[activeSettingsWidget]?.imageShadow || false),
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            widgetSettings[activeSettingsWidget]?.imageShadow ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              widgetSettings[activeSettingsWidget]?.imageShadow ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Shadow Blur */}
                    {widgetSettings[activeSettingsWidget]?.imageShadow && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Shadow Blur</span>
                          <span className="text-xs text-gray-600">
                            {widgetSettings[activeSettingsWidget]?.imageShadowBlur || DEFAULT_WIDGET_SETTINGS.imageShadowBlur}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={widgetSettings[activeSettingsWidget]?.imageShadowBlur || DEFAULT_WIDGET_SETTINGS.imageShadowBlur}
                          onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageShadowBlur", Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}

                    {/* Shadow Offset */}
                    {widgetSettings[activeSettingsWidget]?.imageShadow && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Shadow Offset</span>
                          <span className="text-xs text-gray-600">
                            {widgetSettings[activeSettingsWidget]?.imageShadowOffset || DEFAULT_WIDGET_SETTINGS.imageShadowOffset}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={widgetSettings[activeSettingsWidget]?.imageShadowOffset || DEFAULT_WIDGET_SETTINGS.imageShadowOffset}
                          onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageShadowOffset", Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


                </div>
          </div>
        </>
      )}

      {/* Template Save Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                  onClick={() => handleTemplateSave()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Name Confirmation Dialog */}
      {showDuplicateNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Template Name Already Exists</h3>
                <button
                  onClick={() => {
                    setShowDuplicateNameDialog(false)
                    setPendingTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Template "{pendingTemplate?.name || templateName}" already exists</p>
                      <p className="text-yellow-600 mt-1">
                        Choose an option to proceed:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleReplaceTemplate}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Replace Existing Template
                  </button>
                  
                  <button
                    onClick={handleTryAnotherName}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Try Another Name
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDuplicateNameDialog(false)
                      setPendingTemplate(null)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Templates Modal */}
      {showViewAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
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
                          {userRole !== 'MODERATOR' && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      {/* Template Preview - Same structure as View modal */}
                      <div className="w-full flex justify-center mb-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-2" style={{ width: 240, height: 'auto', minHeight: 200 }}>
                          <div className="relative w-full" style={{ height: `${Math.max(200, Math.max(...template.layout.map(l => (l.y + l.h) * 20)) + 10)}px` }}>
                            {template.layout.map((layoutItem) => {
                              const widget = template.widgets.find(w => w.id === layoutItem.i)
                              if (!widget) return null
                              
                              const widgetSettings = template.widgetSettings?.[widget.id] || DEFAULT_WIDGET_SETTINGS
                              
                              // Generate background colors
                              const bgColor = hexToRgba(widgetSettings.backgroundColor, widgetSettings.backgroundOpacity)
                              const cardBgColor = hexToRgba(widgetSettings.backgroundColor, widgetSettings.cardOpacity)
                              const categoryBgColor = widgetSettings.categoryBackgroundColor || DEFAULT_WIDGET_SETTINGS.categoryBackgroundColor
                              
                              return (
                                <div
                                  key={widget.id}
                                  className="rounded-lg shadow-md absolute"
                                  style={{
                                    left: `${(layoutItem.x / 12) * 100}%`,
                                    top: `${layoutItem.y * 20}px`,
                                    width: `${(layoutItem.w / 12) * 100}%`,
                                    height: `${layoutItem.h * 20}px`,
                                    backgroundColor: bgColor,
                                    borderColor: widgetSettings.borderColor,
                                    borderWidth: `${widgetSettings.borderWidth}px`,
                                    borderStyle: "solid",
                                    display: "flex",
                                    flexDirection: "column",
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* Widget Header */}
                                  <div
                                    className="p-1 flex-shrink-0"
                                    style={{
                                      backgroundColor: categoryBgColor,
                                      height: `${Math.min(widgetSettings.categoryHeight, 20)}px`,
                                      borderBottom: widgetSettings.categoryBorderWidth > 0
                                        ? `${widgetSettings.categoryBorderWidth}px solid ${widgetSettings.categoryBorderColor}`
                                        : "none",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <div
                                      className="text-xs font-semibold text-center"
                                      style={{
                                        color: widgetSettings.categoryFontColor,
                                        fontFamily: widgetSettings.categoryFont,
                                        fontSize: `${Math.min(widgetSettings.categoryFontSize, 10)}px`,
                                        fontWeight: widgetSettings.categoryFontWeight,
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
                                            borderLeft: `2px solid ${widgetSettings.borderColor}`,
                                            fontFamily: widgetSettings.fontFamily,
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Template card content */}
            <div className="p-6">
              {/* Template name with close button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedTemplate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Template description */}
              {selectedTemplate.description && (
                <p className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</p>
              )}
              
              {/* Template Preview */}
              <div className="w-full flex justify-center mb-4">
                <div className="bg-white border border-gray-200 rounded-lg p-2" style={{ width: '100%', height: 'auto', minHeight: 200 }}>
                  <div className="relative w-full" style={{ height: `${Math.max(200, Math.max(...selectedTemplate.layout.map(l => (l.y + l.h) * 25)) + 15)}px` }}>
                    {selectedTemplate.layout.map((layoutItem) => {
                      const widget = selectedTemplate.widgets.find(w => w.id === layoutItem.i)
                      if (!widget) return null
                      
                      const widgetSettings = selectedTemplate.widgetSettings?.[widget.id] || DEFAULT_WIDGET_SETTINGS
                      
                      // Generate background colors
                      const bgColor = hexToRgba(widgetSettings.backgroundColor, widgetSettings.backgroundOpacity)
                      const cardBgColor = hexToRgba(widgetSettings.backgroundColor, widgetSettings.cardOpacity)
                      const categoryBgColor = widgetSettings.categoryBackgroundColor || DEFAULT_WIDGET_SETTINGS.categoryBackgroundColor
                      
                      return (
                        <div
                          key={widget.id}
                          className="rounded-lg shadow-md absolute"
                          style={{
                            left: `${(layoutItem.x / 12) * 100}%`,
                            top: `${layoutItem.y * 25}px`,
                            width: `${(layoutItem.w / 12) * 100}%`,
                            height: `${layoutItem.h * 25}px`,
                            backgroundColor: bgColor,
                            borderColor: widgetSettings.borderColor,
                            borderWidth: `${widgetSettings.borderWidth}px`,
                            borderStyle: "solid",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                          }}
                        >
                          {/* Widget Header */}
                          <div
                            className="p-1 flex-shrink-0"
                            style={{
                              backgroundColor: categoryBgColor,
                              height: `${Math.min(widgetSettings.categoryHeight, 20)}px`,
                              borderBottom: widgetSettings.categoryBorderWidth > 0
                                ? `${widgetSettings.categoryBorderWidth}px solid ${widgetSettings.categoryBorderColor}`
                                : "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              className="text-xs font-semibold text-center"
                              style={{
                                color: widgetSettings.categoryFontColor,
                                fontFamily: widgetSettings.categoryFont,
                                fontSize: `${Math.min(widgetSettings.categoryFontSize, 10)}px`,
                                fontWeight: widgetSettings.categoryFontWeight,
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
                                    borderLeft: `2px solid ${widgetSettings.borderColor}`,
                                    fontFamily: widgetSettings.fontFamily,
                                    height: '15px', // Smaller height for preview
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
              
              {/* Template stats */}
              <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <span>{selectedTemplate.widgets.length} widgets</span>
                <span>{selectedTemplate.layout.length} layout items</span>
              </div>
              
              {/* Apply Template button */}
              <button
                onClick={() => {
                  applyTemplate(selectedTemplate)
                  setShowViewModal(false)
                  setSelectedTemplate(null)
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditDashboardDemo
