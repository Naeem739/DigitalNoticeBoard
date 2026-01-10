/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
  Edit,
  ArrowLeft,
} from "lucide-react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "./edit-dashboard.css"
import type { AspectRatio, TNotice, Widget, WidgetSettings, DashboardTemplate } from "@/types/template-types"
import { getCategories, getDefaultCategory, ensureDefaultCategories, getTextCategoriesWithNotices } from "@/app/actions/category.action"
import {  getAllDashboardTemplates, createDashboardTemplate, updateDashboardTemplate, deleteDashboardTemplate } from "@/app/actions/template.action"
import { createDashboard } from "@/app/actions/dashboard.action"
import { createNotice } from "@/app/actions/notice.action"
import { createCategory } from "@/app/actions/category.action"
// import { createImage } from "@/app/actions/image.action"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SpinningBellLoader } from "@/components/ui/loader"
import { localStorageUtils } from "@/lib/utils"
import { useSession } from "next-auth/react"
import InlinePdfWidget from "./components/InlinePdfWidget"
import ImageWidget from "./components/ImageWidget"
import TemplatesPanel from "./components/TemplatesPanel"
import ScreenControls from "./components/ScreenControls"

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

  // Fix: Use GridLayout.default if available to support default React export
  const GridLayoutComponent = (GridLayout as any).default ?? GridLayout;

  return <GridLayoutComponent {...props}>{children}</GridLayoutComponent>;
};

// Client-only wrapper for the entire dashboard to prevent hydration issues
const ClientOnlyDashboard = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard editor...</p>
        </div>
      </div>
    );
  }

  return <EditDashboardDemo />;
};

type TCategoriesWithNotices = {
  id: string
  name: string
  notices: TNotice[]
  categoryType?: 'TEXT' | 'IMAGE' | 'PDF'
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
  
  // Notice Card Settings
  noticeCardHeight: 20, // Default notice card height as percentage of widget container height
  
  // Image display settings (enhanced for professional use)
  imageFit: "fill",
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
  "4:3":   { width: 1200, height: 900 },
  "16:9":  { width: 1440, height: 810 },
  "16:10": { width: 1440, height: 900 },
};

// Shared grid configuration for layout sizing and bounds
const GRID_ROW_HEIGHT = 50
const GRID_MARGIN: [number, number] = [12, 12]
// Account for the padded/bordered dashboard container so maxRows matches visible space
const DASHBOARD_VERTICAL_PADDING = 24 // p-3 top + bottom (12px each)
const DASHBOARD_VERTICAL_BORDER = 8   // border-4 top + bottom (4px each)

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
type WidgetType = "notice" | "image" | "pdf"

// Extend Widget type to include widget type and images
interface ExtendedWidget extends Widget {
  type?: WidgetType
  images?: Array<{
    id: string
    url: string
    title: string
    file?: File
    dbId?: string
    width?: number
    height?: number
    size?: number
    type?: string
    isPlaceholder?: boolean
  }>
  pdfs?: Array<{
    id: string
    title: string
    pdfData: string
    fileName: string
    dbId?: string
    pdfimage?: string // First page of PDF as image (base64)
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

// Function to get appropriate tabs based on widget type
const getTabsForWidgetType = (widgetType: WidgetType | undefined) => {
  if (widgetType === "image") {
    // Image widgets: show style, typography, category, and image tabs
    return SETTINGS_TABS.filter(tab => tab.id !== "content");
  } else if (widgetType === "pdf") {
    // PDF widgets: show style and category tabs (no content/image specific)
    return SETTINGS_TABS.filter(tab => tab.id !== "content" && tab.id !== "image");
  } else {
    // Notice widgets: show style, typography, content, and category tabs
    return SETTINGS_TABS.filter(tab => tab.id !== "image");
  }
}

// Define the template type

// Dynamic template loading - no hardcoded templates

function EditDashboardDemo() {
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
                             /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                             ('ontouchstart' in window)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
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
  
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>('16:9')
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false)
  const [categories, setCategories] = useState<TCategoriesWithNotices[]>([])
  const [activeSettingsWidget, setActiveSettingsWidget] = useState<string | null>(null)

  // Responsive container width tracking
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  // Track container width for responsive design
  useEffect(() => {
    if (!containerRef.current) return

    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        // Only update if width is valid and greater than 0
        if (width > 0) {
          setContainerWidth(width)
        }
      }
    }

    // Initial width - use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateWidth()
      // Also try after a small delay to catch any layout shifts
      setTimeout(updateWidth, 100)
    })

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      updateWidth()
    })

    resizeObserver.observe(containerRef.current)

    // Fallback to window resize listener
    window.addEventListener('resize', updateWidth)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [selectedRatio]) // Re-run when ratio changes

  // Calculate responsive dimensions based on container width while maintaining aspect ratio
  const responsiveDimensions = useMemo(() => {
    if (!selectedRatio || containerWidth === 0) {
      return { width: 0, height: 0 }
    }

    const aspectRatio = RATIO_DIMENSIONS[selectedRatio]
    const aspectRatioValue = aspectRatio.width / aspectRatio.height

    // Calculate max width (account for padding: 0.5rem = 8px on each side, so 16px total, plus container padding 12px on each side)
    const maxWidth = containerWidth - 16
    // Calculate max height (account for viewport and padding)
    const maxHeight = Math.min(window.innerHeight * 0.85, containerWidth / aspectRatioValue)

    // Calculate dimensions that fit within container while maintaining aspect ratio
    let width = Math.min(maxWidth, aspectRatio.width)
    let height = width / aspectRatioValue

    // If height exceeds max height, scale down
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatioValue
    }

    // Ensure minimum size
    const minWidth = 320
    if (width < minWidth) {
      width = minWidth
      height = width / aspectRatioValue
    }

    return { width: Math.floor(width), height: Math.floor(height) }
  }, [selectedRatio, containerWidth])

  // Calculate the maximum rows the grid can fit inside the visible container
  const gridMaxRows = useMemo(() => {
    if (!selectedRatio || responsiveDimensions.height === 0) return undefined
    const containerHeight = responsiveDimensions.height
    const innerHeight = Math.max(
      0,
      containerHeight - DASHBOARD_VERTICAL_PADDING - DASHBOARD_VERTICAL_BORDER,
    )
    const totalRowHeight = GRID_ROW_HEIGHT + GRID_MARGIN[1]
    const rows = Math.floor((innerHeight + GRID_MARGIN[1]) / totalRowHeight)
    return Math.max(1, rows)
  }, [selectedRatio, responsiveDimensions.height])

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
  // UI toggles
  const [showScreenControls, setShowScreenControls] = useState(true)

  const [customTemplates, setCustomTemplates] = useState<DashboardTemplate[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [canCreateTemplate, setCanCreateTemplate] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  

  
  // Add state for loading existing dashboard
  const [isLoadingExistingDashboard, setIsLoadingExistingDashboard] = useState(false)

  // Add state for duplicate template name handling
  const [showDuplicateNameDialog, setShowDuplicateNameDialog] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<DashboardTemplate | null>(null)

  // State for tracking drag over dashboard area
  const [isDragOverDashboard, setIsDragOverDashboard] = useState(false)

  // Loading states for all buttons
  const [isSavingDashboard, setIsSavingDashboard] = useState(false)
  const [isAddingWidget, setIsAddingWidget] = useState(false)
  const [isRemovingWidget, setIsRemovingWidget] = useState(false)
  const [isAddingScreen, setIsAddingScreen] = useState(false)
  const [isRemovingScreen, setIsRemovingScreen] = useState(false)
  const [isClearingScreens, setIsClearingScreens] = useState(false)
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false)
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState<string | null>(null) // widgetId for which image is being uploaded
  const [isImageSelectOpen, setIsImageSelectOpen] = useState(false)
  const [imageSelectWidgetId, setImageSelectWidgetId] = useState<string | null>(null)
  const [isLoadingExistingImages, setIsLoadingExistingImages] = useState(false)
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [animateImageOpen, setAnimateImageOpen] = useState(false)

  // Counts for special widgets sourced from notices (same as showNotices page uses)
  const [pdfCount, setPdfCount] = useState<number | null>(null)
  const [imageCount, setImageCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchCountsFromNotices = async () => {
      try {
        const response = await fetch('/api/notice/get-all')
        const data = await response.json()
        if (data?.success && Array.isArray(data.result)) {
          const notices = data.result
          const pdfs = notices.filter((n: any) => !!n.pdfData)
          const images = notices.filter((n: any) => !!n.imageData)
          setPdfCount(pdfs.length)
          setImageCount(images.length)
        } else {
          setPdfCount(0)
          setImageCount(0)
        }
      } catch (e) {
        setPdfCount(0)
        setImageCount(0)
      }
    }
    fetchCountsFromNotices()
  }, [])


  // Enhanced localStorage state management
  const [hasInitialized, setHasInitialized] = useState(false)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })

  // Removed TempDashboard - using localStorage only for better performance

  // Template management state
  const [templates, setTemplates] = useState<DashboardTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  
  // Additional template management state
  const [showViewAllModal, setShowViewAllModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<DashboardTemplate | null>(null)

  // Enhanced useEffect to load saved state on component mount
  useEffect(() => {
    // Only run on client side and after component has mounted
    if (typeof window === 'undefined') return
    
    // Use a timeout to ensure we're fully on the client side
    const timer = setTimeout(() => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const dashboardId = urlParams.get('id')
        
        // Don't show confirmation dialog if we're loading an existing dashboard
        if (dashboardId) {
          setHasInitialized(true)
          return
        }
        
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
          setHasInitialized(true)
          return
        }
        
        // Check if localStorageUtils is available
        if (!localStorageUtils || typeof localStorageUtils.getItem !== 'function') {
          setHasInitialized(true)
          return
        }
        
        const savedState = localStorageUtils.getItem('dashboardState')
        
        if (savedState) {
          const { 
            selectedRatio: savedRatio, 
            screens: savedScreens, 
            currentScreenIndex: savedScreenIndex,
            activeSettingsTab: savedActiveTab,
            activeSettingsWidget: savedActiveWidget,
            settingsPosition: savedSettingsPos,
            scrollPosition: savedScrollPos,
            isRatioDropdownOpen: savedRatioDropdown,
            isTemplateDropdownOpen: savedTemplateDropdown,
            searchTerm: savedSearchTerm,
            filterType: savedFilterType,
            templateName: savedTemplateName,
            templateDescription: savedTemplateDescription,
            newTemplateName: savedNewTemplateName,
            newTemplateDescription: savedNewTemplateDescription
          } = savedState
          
          // Check if there was previous content (screens with widgets)
          if (savedScreens && savedScreens.length > 0 && savedScreens.some((screen: any) => screen.widgets.length > 0)) {
            // Automatically restore the saved state
            restoreStateFromSaved(savedState)
            localStorageUtils.removeItem('dashboardState')
          } else {
            // No previous content, just load the ratio and screens structure
            restoreStateFromSaved(savedState)
            localStorageUtils.removeItem('dashboardState')
          }
        }
      } catch (error) {
        console.error('Error loading saved dashboard state:', error)
        try {
          localStorageUtils.removeItem('dashboardState')
        } catch (e) {
          console.warn('Could not remove localStorage item:', e)
        }
      }
      
      setHasInitialized(true)
    }, 100) // Small delay to ensure hydration is complete
    
    return () => clearTimeout(timer)
  }, [])

  // Function to restore state from saved data
  const restoreStateFromSaved = (savedState: any) => {
    if (savedState.selectedRatio) setSelectedRatio(savedState.selectedRatio)
    if (savedState.screens) {
      setScreens(savedState.screens)
      setCurrentScreenIndex(savedState.currentScreenIndex || 0)
    }
    if (savedState.activeSettingsTab) setActiveSettingsTab(savedState.activeSettingsTab)
    if (savedState.activeSettingsWidget) setActiveSettingsWidget(savedState.activeSettingsWidget)
    if (savedState.settingsPosition) setSettingsPosition(savedState.settingsPosition)
    if (savedState.scrollPosition) {
      setScrollPosition(savedState.scrollPosition)
      // Restore scroll position after a short delay to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(savedState.scrollPosition.x, savedState.scrollPosition.y)
      }, 100)
    }
    if (savedState.isRatioDropdownOpen !== undefined) setIsRatioDropdownOpen(savedState.isRatioDropdownOpen)
    if (savedState.isTemplateDropdownOpen !== undefined) setIsTemplateDropdownOpen(savedState.isTemplateDropdownOpen)
    if (savedState.searchTerm !== undefined) setSearchTerm(savedState.searchTerm)
    if (savedState.filterType !== undefined) setFilterType(savedState.filterType)
    if (savedState.templateName !== undefined) setTemplateName(savedState.templateName)
    if (savedState.templateDescription !== undefined) setTemplateDescription(savedState.templateDescription)
    if (savedState.newTemplateName !== undefined) setNewTemplateName(savedState.newTemplateName)
    if (savedState.newTemplateDescription !== undefined) setNewTemplateDescription(savedState.newTemplateDescription)
  }

  // Ensure default categories (TEXT, IMAGE, PDF) exist
  useEffect(() => {
    const ensureDefaults = async () => {
      try {
        await ensureDefaultCategories()
      } catch (e) {
        console.warn('Error ensuring default categories:', e)
      }
    }

    ensureDefaults()
  }, [])

  // Removed autoSaveToTempDashboard - using localStorage only for better performance

  // Enhanced useEffect to save state whenever it changes
  useEffect(() => {
    // Only run on client side and after initialization
    if (typeof window === 'undefined' || !hasInitialized) return
    
    // Use a timeout to ensure we're fully on the client side
    const timer = setTimeout(() => {
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
        selectedRatio,
        activeSettingsTab,
        activeSettingsWidget,
        settingsPosition,
        scrollPosition,
        isRatioDropdownOpen,
        isTemplateDropdownOpen,
        searchTerm,
        filterType,
        templateName,
        templateDescription,
        newTemplateName,
        newTemplateDescription
      }
      
      try {
        const success = localStorageUtils.setItem('dashboardState', stateToSave)
        if (!success) {
          console.warn('Failed to save dashboard state to localStorage (quota exceeded or data too large)')
        }
      } catch (error) {
        console.warn('Error saving to localStorage:', error)
      }
    }, 100) // Small delay to ensure hydration is complete
    
    return () => clearTimeout(timer)
  }, [
    screens, 
    currentScreenIndex, 
    selectedRatio, 
    activeSettingsTab, 
    activeSettingsWidget, 
    settingsPosition, 
    scrollPosition,
    isRatioDropdownOpen,
    isTemplateDropdownOpen,
    searchTerm,
    filterType,
    templateName,
    templateDescription,
    newTemplateName,
    newTemplateDescription,
    hasInitialized
  ])

  // Save scroll position on scroll events
  useEffect(() => {
    // Only run on client side and after initialization
    if (typeof window === 'undefined' || !hasInitialized) return
    
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY
      })
    }

    // Use a timeout to ensure we're fully on the client side
    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }, 100)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasInitialized])

  // Removed TempDashboard auto-save - using localStorage only for better performance

  // Removed TempDashboard loading - using localStorage only for better performance

  // Save state before page unload
  useEffect(() => {
    // Only run on client side and after initialization
    if (typeof window === 'undefined' || !hasInitialized) return
    
    const handleBeforeUnload = () => {
      try {
        // Force save current state before page unload
        const stateToSave = {
          screens: screens.map((screen: any) => ({
            ...screen,
            widgets: screen.widgets.map((widget: any) => ({
              ...widget,
              // Don't include file, url (base64 data), or other large properties
            }))
          })),
          currentScreenIndex,
          selectedRatio,
          activeSettingsTab,
          activeSettingsWidget,
          settingsPosition,
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY
          },
          isRatioDropdownOpen,
          isTemplateDropdownOpen,
          searchTerm,
          filterType,
          templateName,
          templateDescription,
          newTemplateName,
          newTemplateDescription
        }
        
        localStorageUtils.setItem('dashboardState', stateToSave)
      } catch (error) {
        console.warn('Error saving state before unload:', error)
      }
    }

    // Use a timeout to ensure we're fully on the client side
    const timer = setTimeout(() => {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [
    screens, 
    currentScreenIndex, 
    selectedRatio, 
    activeSettingsTab, 
    activeSettingsWidget, 
    settingsPosition, 
    scrollPosition,
    isRatioDropdownOpen,
    isTemplateDropdownOpen,
    searchTerm,
    filterType,
    templateName,
    templateDescription,
    newTemplateName,
    newTemplateDescription,
    hasInitialized
  ])

  // Debug useEffect to log state changes
  useEffect(() => {
    console.log("State updated:", {
      screens: screens.length,
      currentScreenIndex,
      widgets: widgets.length,
      layout: layout.length,
      selectedRatio,
      activeSettingsTab,
      activeSettingsWidget,
      scrollPosition
    })
  }, [screens, currentScreenIndex, widgets.length, layout.length, selectedRatio, activeSettingsTab, activeSettingsWidget, scrollPosition])

  // Removed TempDashboard auto-save - using localStorage only for better performance

  // Add function to clear saved state
  const clearSavedState = () => {
    localStorageUtils.removeItem('dashboardState')
  }

  // Removed saveToTempDashboard - using localStorage only for better performance

  // Screen management functions
  const addScreen = async () => {
    try {
      setIsAddingScreen(true)
      
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
    } catch (error) {
      console.error("Error adding screen:", error)
      toast.error("Failed to add screen")
    } finally {
      setIsAddingScreen(false)
    }
  }

  const removeScreen = async (screenIndex: number) => {
    if (screens.length <= 1) {
      toast.error("Cannot remove the last screen")
      return
    }
    
    try {
      setIsRemovingScreen(true)
    
    const newScreens = screens.filter((_, index) => index !== screenIndex)
    setScreens(newScreens)
    
    // Adjust current screen index if needed
    if (currentScreenIndex >= screenIndex) {
      setCurrentScreenIndex(Math.max(0, currentScreenIndex - 1))
      }
    } catch (error) {
      console.error("Error removing screen:", error)
      toast.error("Failed to remove screen")
    } finally {
      setIsRemovingScreen(false)
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

  const clearAllScreens = async () => {
    try {
      setIsClearingScreens(true)
      // Reset to a single empty screen
      const initialScreen = {
        id: 'screen-1',
        name: 'Screen 1',
        widgets: [],
        layout: [],
        widgetSettings: {}
      }
      setScreens([initialScreen])
      setCurrentScreenIndex(0)

      // Clear saved local state
      clearSavedState()
      
      toast.success('All screens cleared')
    } catch (error) {
      console.error('Error clearing all screens:', error)
      toast.error('Failed to clear screens')
    } finally {
      setIsClearingScreens(false)
    }
  }



  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoadingCategories(true)
      const categoriesWithNotices = (await getTextCategoriesWithNotices()) as TResult
      if (categoriesWithNotices.success) {
        setCategories(categoriesWithNotices.result as TCategoriesWithNotices[])
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        toast.error("Failed to load categories")
      } finally {
        setIsLoadingCategories(false)
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
        setIsDeletingTemplate(true)
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
      } finally {
        setIsDeletingTemplate(false)
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
      setIsUpdatingTemplate(true)
      
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
    } finally {
      setIsUpdatingTemplate(false)
    }
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
  }

  const addWidget = async (type: WidgetType = "notice") => {
    if (!selectedRatio) return

    try {
      setIsAddingWidget(true)

    const newWidgetId = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const widgetTitle = type === "image" ? "Image Display" : 
                       type === "pdf" ? "PDF Widget" :
                       `Notice Widget ${widgets.length + 1}`
    
    const newWidget: ExtendedWidget = {
      id: newWidgetId,
      title: widgetTitle,
      type: type,
      ...(type === "pdf" ? { url: "/dashboard/test-pdf-scroll" } : {}),
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
    } catch (error) {
      console.error("Error adding widget:", error)
      toast.error("Failed to add widget")
    } finally {
      setIsAddingWidget(false)
    }
  }

  const removeWidget = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsRemovingWidget(true)

    setWidgets(prev => prev.filter((widget) => widget.id !== id))
    setLayout(prev => prev.filter((item) => item.i !== id))
    setWidgetSettings(prev => {
      const updatedSettings = { ...prev }
      delete updatedSettings[id]
      return updatedSettings
    })
    setActiveSettingsWidget(null)


    toast.success("Widget removed", { duration: 1200 })
    } catch (error) {
      console.error("Error removing widget:", error)
      toast.error("Failed to remove widget")
    } finally {
      setIsRemovingWidget(false)
    }
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

  // Drag start for special widgets (pdf/image)
  const handleDragStartSpecial = (e: React.DragEvent, type: 'pdf' | 'image') => {
    e.dataTransfer.setData("specialType", type)
    e.dataTransfer.effectAllowed = "copy"
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
    
    const specialType = e.dataTransfer.getData("specialType") as 'pdf' | 'image'
    const categoryId = e.dataTransfer.getData("categoryId")
    const categoryName = e.dataTransfer.getData("categoryName")
    
    console.log("Drop event - specialType:", specialType, "categoryId:", categoryId, "categoryName:", categoryName, "widgetId:", widgetId, "Current widgets:", widgets.length)

    // If a special widget (pdf/image) is dragged, create that widget immediately
    if (!widgetId && specialType) {
      addWidget(specialType)
      return
    }

    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) {
      console.log("Category not found for ID:", categoryId)
      return
    }

    // Validate that TEXT type categories can only be dropped on notice widgets
    if (widgetId) {
      const targetWidget = widgets.find(widget => widget.id === widgetId)
      if (targetWidget && targetWidget.type === "image" && category.categoryType === "TEXT") {
        toast.error("Text categories cannot be dropped on image widgets. Only image categories are allowed.")
        return
      }
      if (targetWidget && targetWidget.type === "pdf" && category.categoryType === "TEXT") {
        toast.error("Text categories cannot be dropped on PDF widgets. Only PDF categories are allowed.")
        return
      }
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

    // Ensure TEXT type categories only create notice widgets
    if (category.categoryType === "TEXT") {
      // TEXT categories can only create notice widgets (which is the default)
      console.log("Creating notice widget from TEXT category:", category.name)
    } else {
      // For non-TEXT categories, show error (they should not be in the TEXT categories list)
      toast.error(`Category type ${category.categoryType} is not allowed for notice widgets. Only TEXT categories are allowed.`)
      return
    }

    // Calculate drop position relative to the dashboard container
    const dashboardContainer = e.currentTarget as HTMLElement
    const rect = dashboardContainer.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert pixel position to grid position
    // GridLayout configuration: cols=12, rowHeight=50, margin=[12,12]
    // Use actual container dimensions (accounting for padding: 12px on each side = 24px total)
    const containerWidth = responsiveDimensions.width > 0 ? responsiveDimensions.width - 24 : rect.width - 24
    const containerHeight = responsiveDimensions.height > 0 ? responsiveDimensions.height : rect.height
    
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
    if (!selectedRatio || responsiveDimensions.width === 0) return { width: "0%", height: "0%" }

    // Use responsive dimensions (accounting for padding: 12px on each side = 24px total)
    const containerWidth = responsiveDimensions.width - 24
    const containerHeight = responsiveDimensions.height

    const colWidth = (containerWidth - 11 * 24) / 12 // Fixed: 11 gaps between 12 columns, each gap is 24px
    const rowHeight = 50 // Match the new rowHeight

    const widgetWidth = ((widgetLayout.w * colWidth + (widgetLayout.w - 1) * 24) / containerWidth) * 100
    const widgetHeight = ((widgetLayout.h * rowHeight + (widgetLayout.h - 1) * 24) / containerHeight) * 100

    return {
      width: `${widgetWidth.toFixed(1)}%`,
      height: `${widgetHeight.toFixed(1)}%`,
    }
  }

  const handleLayoutChange = (newLayout: Layout[]) => {
    // Prevent dragging past the bottom by clamping y within the allowed rows
    const boundedLayout = gridMaxRows
      ? newLayout.map((item) => {
          const maxY = Math.max(0, gridMaxRows - item.h)
          return item.y > maxY ? { ...item, y: maxY } : item
        })
      : newLayout

    setLayout(boundedLayout)
  }

  const handleSave = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const dashboardId = urlParams.get('id')
    
    try {
      setIsSavingDashboard(true)
      
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
      // Process all screens in parallel for better performance
      const dashboardPromises = screens.map(async (screen, screenIndex) => {
        
        // Calculate positions for this screen
        // Some widgets may need async operations (like PDF data fetching)
        const positions = await Promise.all(screen.widgets.map(async (widget) => {
          const specificLayout = screen.layout.filter((item) => widget.id === item.i)[0]
          if (!specificLayout) return null

          const containerWidth = (RATIO_DIMENSIONS[selectedRatio || "4:3"].width * 1.3) - 24
          const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height * 1.0 // Fixed: Use 100% height instead of 130%

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
            // For image displays, collect image data but don't create notices during save
            // Notices should be created when images are added to the widget, not during save
            // This significantly improves save performance
            const imageNoticeIds: string[] = []
            
            // If images already have notice IDs (from previous saves), use those
            widget.images.forEach((image: any) => {
              if (image.dbId) {
                imageNoticeIds.push(image.dbId)
              }
            })
            
            // If no existing notice IDs, we'll need to create them, but do it in batch
            // For now, skip notice creation during save to improve performance
            // TODO: Create notices when images are added to widget, not during save
            
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
              title: widget.content || widget.title || "Dashboard Image Display",
              category: "Default(Images)", // Use Default(Images) category name
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
                noticeCardHeight: settings.noticeCardHeight || DEFAULT_WIDGET_SETTINGS.noticeCardHeight,
              },
            }
          } else if (widget.type === "pdf" && widget.pdfs && widget.pdfs.length > 0) {
            // For PDF widgets, save PDF data directly in the container
            const pdf = widget.pdfs[0] // Take the first PDF for now
            
            // Get PDF data directly from widget (no TempDashboard needed)
            const pdfData = pdf.pdfData || ''
            // Get PDF image (first page converted to image)
            const pdfimage = pdf.pdfimage || ''

            // Skip PDF notice creation during save to improve performance
            // PDF notices should be created when PDFs are added to widgets, not during save
            // TODO: Create PDF notices when PDFs are added, not during save
            
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
              title: widget.content || widget.title || "Dashboard PDF Widget",
              category: "Default(Pdf)",
              type: "pdf",
              pdfData: pdfData || '',
              pdfFileName: pdf.fileName || pdf.title || 'uploaded.pdf',
              pdfimage: pdfimage, // Store first page as image
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
                noticeCardHeight: settings.noticeCardHeight || DEFAULT_WIDGET_SETTINGS.noticeCardHeight,
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
                noticeCardHeight: settings.noticeCardHeight || DEFAULT_WIDGET_SETTINGS.noticeCardHeight,
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
        const result = await createDashboard({
          ...dashboardData,
          aspectRatio: dashboardData.aspectRatio ?? "" // Ensure aspectRatio is always a string
        })
        console.log("Save result:", result)
        
        if (!result.success) {
          console.error("Failed to save screen:", result.result)
          toast.error(`Failed to save screen ${screenIndex + 1}: ${screen.name} - ${result.result}`)
        }
        
        return result
      })
      
      // Wait for all screens to save in parallel
      const dashboardResults = await Promise.all(dashboardPromises)

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
    } finally {
      setIsSavingDashboard(false)
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
    setShowTemplateModal(true)
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
        setShowTemplateModal(false)
        setNewTemplateName("")
        setNewTemplateDescription("")
        setShowDuplicateNameDialog(false)
        setPendingTemplate(null)
        toast.success(`Template "${newTemplateName}" saved successfully!`, { duration: 1500 })
      } else if (result.error === "DUPLICATE_NAME") {
        // Show duplicate name dialog for custom template
        setPendingTemplate(newTemplate)
        setShowDuplicateNameDialog(true)
        setShowTemplateModal(false)
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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, widgetId: string) => {
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

    try {
      setIsUploadingImage(widgetId)

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
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploadingImage(null)
    }
  }

  // PDF widget support removed



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

  // Helper function to determine widget type based on content
  const getWidgetType = (widget: ExtendedWidget): "notice" | "image" | "pdf" => {
    // If widget has explicit type, use it
    if (widget.type) {
      console.log(`Widget ${widget.id} has explicit type: ${widget.type}`);
      return widget.type as "notice" | "image" | "pdf";
    }
    
    // If widget has PDFs, treat as pdf widget
    if ((widget as any).pdfs && (widget as any).pdfs.length > 0) {
      console.log(`Widget ${widget.id} determined as pdf type due to pdfs array`);
      return "pdf";
    }
    
    // If widget has images array with content, it's an image widget
    if (widget.images && widget.images.length > 0) {
      console.log(`Widget ${widget.id} determined as image type due to images array`);
      return "image";
    }
    
    // If widget has notices or content, it's a notice widget
    if (widget.notices || widget.content || widget.category) {
      console.log(`Widget ${widget.id} determined as notice type due to notices/content/category`);
      return "notice";
    }
    
    // Default to notice if no clear indication
    console.log(`Widget ${widget.id} defaulting to notice type`);
    return "notice";
  };

  // Helper function to get widget types as a string for display
  const getWidgetTypesString = (widgets: ExtendedWidget[]): string => {
    const sortedWidgets = [...widgets].sort((a, b) => {
      const layoutA = layout.find(l => l.i === a.id);
      const layoutB = layout.find(l => l.i === b.id);
      if (!layoutA || !layoutB) return 0;
      return layoutA.y === layoutB.y ? layoutA.x - layoutB.x : layoutA.y - layoutB.y;
    });
    
    return sortedWidgets.map(widget => getWidgetType(widget)).join(', ');
  };

  // Helper function to check if two widget arrays have matching types
  const hasMatchingWidgetTypes = (currentWidgets: ExtendedWidget[], templateWidgets: Widget[]): boolean => {
    if (currentWidgets.length !== templateWidgets.length) {
      return false;
    }
    
    // Sort current widgets by position (x, y coordinates) to ensure proper matching
    const sortedCurrent = [...currentWidgets].sort((a, b) => {
      const layoutA = layout.find(l => l.i === a.id);
      const layoutB = layout.find(l => l.i === b.id);
      if (!layoutA || !layoutB) return 0;
      return layoutA.y === layoutB.y ? layoutA.x - layoutB.x : layoutA.y - layoutB.y;
    });
    
    // Sort template widgets by their index (assuming they're in the order they should be applied)
    const sortedTemplate = [...templateWidgets];
    
    // Check if each position has matching widget types
    for (let i = 0; i < sortedCurrent.length; i++) {
      const currentType = getWidgetType(sortedCurrent[i]);
      const templateType = getWidgetType(sortedTemplate[i] as ExtendedWidget);
      
      if (currentType !== templateType) {
        console.log(`Widget type mismatch at position ${i}: current=${currentType}, template=${templateType}`);
        return false;
      }
    }
    
    return true;
  };

  // Add this function inside the EditDashboardDemo component
  const applyTemplate = async (template: DashboardTemplate) => {
    try {
      setIsApplyingTemplate(true)
      
      // Debug logging for current widgets
      console.log('Current widgets before applying template:', widgets);
      console.log('Template widgets:', template.widgets);
      
    // Determine positional order of current widgets by their layout (top-left to bottom-right)
    const currentLayout = [...layout]
    const currentWidgetsSorted = [...widgets].sort((a, b) => {
      const la = currentLayout.find(l => l.i === a.id)
      const lb = currentLayout.find(l => l.i === b.id)
      if (!la || !lb) return 0
      return la.y === lb.y ? la.x - lb.x : la.y - lb.y
    })

    // Build mapping from index -> current widget id and type
    const indexToCurrent = currentWidgetsSorted.map(w => ({ id: w.id, type: getWidgetType(w as ExtendedWidget) }))

    // Remap template layout positions onto current widget ids in the same index order
    const templateLayoutSorted = [...template.layout].sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y)
    const remappedLayout = templateLayoutSorted.map((tplItem, idx) => ({
      ...tplItem,
      i: indexToCurrent[idx]?.id || tplItem.i
    }))

    // Rebuild widgetSettings:
    // - For Notice widgets: take template settings from matching index and assign to current widget id
    // - For Image/PDF widgets: keep existing settings
    const newWidgetSettings: Record<string, any> = { ...widgetSettings }
    const templateWidgetSettings = template.widgetSettings || {}

    // Sort template widgets by their positional order (mirror of templateLayoutSorted order)
    const templateWidgetsSorted = [...template.widgets]

    remappedLayout.forEach((mappedItem, idx) => {
      const currentId = mappedItem.i
      const currentType = indexToCurrent[idx]?.type
      const templateWidget = templateWidgetsSorted[idx] as ExtendedWidget | undefined
      const templateWidgetId = templateWidget?.id
      if (!currentId) return

      if (currentType && currentType !== 'image' && currentType !== 'pdf') {
        // Notice-like widget: fully affected by template settings
        if (templateWidgetId && templateWidgetSettings[templateWidgetId]) {
          newWidgetSettings[currentId] = { ...templateWidgetSettings[templateWidgetId] }
        }
      } else {
        // Image/PDF: keep existing settings untouched
        newWidgetSettings[currentId] = { ...widgetSettings[currentId] }
      }
    })

    // Update the current screen: keep widgets unchanged, only update positions and settings
    const newScreens = [...screens]
    newScreens[currentScreenIndex] = {
      ...newScreens[currentScreenIndex],
      widgets: [...widgets],
      layout: remappedLayout,
      widgetSettings: newWidgetSettings
    }
    setScreens(newScreens)
    
    
    toast.success(`Applied "${template.name}" template. Notice widgets updated, PDF/Image positions adjusted.`, { duration: 1500 })
    } catch (error) {
      console.error("Error applying template:", error)
      toast.error("Failed to apply template")
    } finally {
      setIsApplyingTemplate(false)
    }
  }

  const createDashboardFromTemplate = async (template: DashboardTemplate) => {
    if (!selectedRatio) {
      toast.error("Please select a display ratio first")
      return
    }

    try {
      setIsCreatingFromTemplate(true)

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

                      const containerWidth = (RATIO_DIMENSIONS[selectedRatio || "4:3"].width * 1.3) - 24
          const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height * 1.0 // Fixed: Use 100% height instead of 130%

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
              
              // Use the Default(Images) category for dashboard images
              let imageCategoryId = ""
              try {
                const defaultImageCategory: any = await getDefaultCategory('IMAGE')
                if (defaultImageCategory.success && defaultImageCategory.result) {
                  // Use the Default(Images) category
                  imageCategoryId = (defaultImageCategory.result as any).id
                } else {
                  // Fallback: try to find any IMAGE category if Default category doesn't exist
                  const categoriesResp: any = await getCategories()
                  const imageCategory = categoriesResp.result?.find((cat: any) => cat.categoryType === 'IMAGE')
                  if (imageCategory) {
                    imageCategoryId = (imageCategory as any).id
                  } else {
                    console.error("No Default(Images) category with type IMAGE found")
                  }
                }
              } catch (error) {
                console.error("Error handling Default(Images) category:", error)
              }
              
              for (const image of widget.images) {
                try {
                  // Create a notice for this image following the same pattern as create-notice page
                  const noticeData = {
                    title: image.title || "Dashboard Image",
                    content: `Dashboard Image: ${image.title}`,
                    category: "Default(Images)", // Use Default(Images) category name
                    categoryId: imageCategoryId,
                    imageUrl: image.url, // Store the full data URL for display (same as imagePreview in create-notice)
                    imageFileName: image.title,
                    imageData: image.url.split(',')[1], // Store only the base64 data without the prefix (same as convertImageToBase64)
                  }
                  
                  // Create the notice using the server action directly
                  const noticeResult = await createNotice(noticeData)
                  
                  const created: any = noticeResult as any
                  if (created.success && created.message && typeof created.message !== 'string' && created.message.id) {
                    imageNoticeIds.push(created.message.id as string)
                    console.log(`Created notice for image: ${image.title} with ID: ${created.message.id}`)
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
                title: widget.content || widget.title || "Dashboard Image Display",
                category: "Default(Images)", // Use Default(Images) category name
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
                noticeCardHeight: settings.noticeCardHeight || DEFAULT_WIDGET_SETTINGS.noticeCardHeight,
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
        } finally {
          setIsCreatingFromTemplate(false)
      }
    }, 500)
    } catch (error) {
      console.error("Error creating dashboard from template:", error)
      toast.error(`Error creating dashboard: ${error}`)
      setIsCreatingFromTemplate(false)
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  
  // Set isEditing on client side only to prevent hydration issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setIsEditing(urlParams.get('id') !== null)
    }
  }, [])



  return (
    <div className="min-h-screen w-full bg-white" suppressHydrationWarning={true}>
      {/* Header for editing mode */}
      {isEditing && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Editing Existing Dashboard</h2>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            You are editing an existing dashboard. Make your changes and click &quot;Update Dashboard&quot; to save.
          </p>
          {isLoadingExistingDashboard && (
            <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700">
              <SpinningBellLoader size="sm" />
              <span>Loading dashboard content...</span>
            </div>
          )}
        </div>
      )}






      <div className="mb-6 flex flex-wrap gap-4 ml-4">
        {isEditing && (
          <Link href={`/dashboard/view-dashboard/${typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : ''}`}>
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
        <div className="flex items-center gap-3"></div>
        


        

        





        <button
          onClick={handleSave}
          disabled={!selectedRatio || screens.every(screen => screen.widgets.length === 0) || isSavingDashboard}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-opacity duration-200 ml-auto font-medium ${
            !selectedRatio || screens.every(screen => screen.widgets.length === 0) || isSavingDashboard
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {isSavingDashboard ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Saving Interface...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{isEditing ? 'Update Dashboard' : `Save Interface (${screens.length} screen${screens.length > 1 ? 's' : ''})`}</span>
            </>
          )}
        </button>


      </div>

      {/* Improved Screen Management Section - Left Side */}
      <ScreenControls
        showScreenControls={showScreenControls}
        setShowScreenControls={setShowScreenControls}
        screens={screens.map(({ id, name }) => ({ id, name }))}
        currentScreenIndex={currentScreenIndex}
        setCurrentScreenIndex={setCurrentScreenIndex}
        addScreen={addScreen}
        clearAllScreens={clearAllScreens}
        removeScreen={removeScreen}
        isAddingScreen={isAddingScreen}
        isClearingScreens={isClearingScreens}
        isRemovingScreen={isRemovingScreen}
      />

      {/* Minimal Notice Categories Section */}
      <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="p-1.5 bg-gray-100 rounded-md">
            <GripVertical className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mr-2">Notice Categories</h3>
          {/* Special widgets moved beside categories below */}
        </div>
        
          
        <div className="flex flex-wrap gap-2">
            {categories.filter(cat => cat.name.toLowerCase() !== "default(text)").length === 0 ? (
            <div className="w-full text-center py-4">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mb-2">
                <ListFilter className="w-4 h-4 text-gray-500" />
                </div>
              <p className="text-gray-500 text-xs">No categories available</p>
              </div>
            ) : (
              <>
                {categories.filter(cat => cat.name.toLowerCase() !== "default(text)").map((category) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart2(e, category)}
                  title={`${category.name} - Text Category (Drag to create notice widget only)`}
                className="group relative bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-md cursor-move border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gray-200 group-hover:bg-blue-200 rounded transition-colors">
                    <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-blue-600" />
                    </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 group-hover:text-blue-800 text-sm truncate">
                        {category.name}
                      </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">
                          {category.notices.length} {category.notices.length === 1 ? 'notice' : 'notices'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                ))}

                {/* Special widgets placed at the end with same design as categories */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStartSpecial(e, 'pdf')}
                  title="PDF (Drag to create PDF widget)"
                  className="group relative bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-md cursor-move border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-200 group-hover:bg-blue-200 rounded transition-colors">
                      <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 group-hover:text-blue-800 text-sm truncate flex items-center gap-1">
                        <Upload className="w-3 h-3 text-indigo-600" />
                        PDF
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">{pdfCount ?? '…'} PDF{(pdfCount ?? 0) === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  draggable
                  onDragStart={(e) => handleDragStartSpecial(e, 'image')}
                  title="IMAGES (Drag to create Image widget)"
                  className="group relative bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-md cursor-move border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-200 group-hover:bg-blue-200 rounded transition-colors">
                      <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 group-hover:text-blue-800 text-sm truncate flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-green-600" />
                        IMAGES
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">{imageCount ?? '…'} Image{(imageCount ?? 0) === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
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
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {widgets.length} widget{widgets.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          
      {selectedRatio && (
        <div className="dashboard-screen-container" ref={containerRef}>
          <div
            className={`border-4 border-dashed rounded-lg overflow-hidden bg-white p-3 relative transition-all duration-200 ${
              isDragOverDashboard 
                ? 'border-amber-500 bg-amber-50 shadow-lg' 
                : 'border-amber-400'
            }`}
            style={{
              width: responsiveDimensions.width > 0 ? `${responsiveDimensions.width}px` : '100%',
              height: responsiveDimensions.height > 0 ? `${responsiveDimensions.height}px` : 'auto',
              maxWidth: '100%',
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
            rowHeight={GRID_ROW_HEIGHT}
            width={responsiveDimensions.width > 0 ? responsiveDimensions.width - 24 : 1200}
            onLayoutChange={handleLayoutChange}
            margin={GRID_MARGIN}
            {...(gridMaxRows ? { maxRows: gridMaxRows } : {})}
            // On mobile: allow dragging from anywhere on widget. On desktop: only from drag handle
            draggableHandle={isMobile ? undefined : ".widget-drag-handle"}
            isDraggable={true}
            isResizable={!isMobile} // Disable resize on mobile for better UX
            compactType={null}
            preventCollision={false}
            useCSSTransforms={true}
            // Mobile-specific: allow touch dragging
            {...(isMobile && {
              allowOverlap: false,
              transformScale: 1
            })}
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
                  className={`rounded-lg shadow-md relative ${isMobile ? 'touch-manipulation' : ''}`}
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
                    // Mobile: make entire widget draggable
                    ...(isMobile && {
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    })
                  }}
                  onDrop={(e) => handleDrop(e, widget.id)}
                  onDragOver={handleWidgetDragOver}
                  onDragLeave={handleWidgetDragLeave}
                >
                  {/* Widget Controls - Responsive positioning for small widgets */}
                  <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded z-10">
                    {dimensions.width} × {dimensions.height}
                  </div>

                  <div className="absolute top-1 right-8 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWidgetSettings(widget.id)
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Settings size={16} className="text-gray-600" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(e, widget.id)
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={isRemovingWidget}
                    className="absolute top-1 right-1 p-0.5 hover:bg-red-100 rounded transition-colors z-10"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {isRemovingWidget ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                    ) : (
                    <X size={16} className="text-red-500" />
                    )}
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

                    {/* Image Widget */}
                    {widget.type === "image" && (
                      <ImageWidget
                        widget={widget as any}
                        settings={settings}
                        onSetWidgetImages={(images) => {
                          setWidgets(prev => prev.map(w => w.id === widget.id ? { ...w, images } : w))
                        }}
                        onOpenSettings={() => toggleWidgetSettings(widget.id)}
                      />
                    )}

                    {/* PDF widget content: inline upload + render + auto-scroll */}
                    {widget.type === "pdf" && (
                      <InlinePdfWidget 
                        widgetId={widget.id}
                        onPdfStored={(pdfId: string, pdfData: string, fileName: string, pdfimage?: string) => {
                          // Store PDF reference in widget with PDF data and client-generated image
                          setWidgets(prev => prev.map(w => 
                            w.id === widget.id 
                              ? { 
                                  ...w, 
                                  pdfs: [{ 
                                    id: pdfId, 
                                    title: fileName || 'PDF', 
                                    pdfData: pdfData, 
                                    fileName: fileName || 'uploaded.pdf', 
                                    dbId: pdfId,
                                    pdfimage: pdfimage
                                  }] 
                                }
                              : w
                          ))

                          if (pdfimage) {
                            console.log('[PDF IMAGE] pdfimage stored on widget state (client-generated)', {
                              widgetId: widget.id,
                              pdfId,
                              fileName,
                            })
                          } else {
                            console.warn('[PDF IMAGE] No pdfimage provided from client generation', {
                              widgetId: widget.id,
                              pdfId,
                              fileName,
                            })
                          }
                        }}
                      />
                    )}

                    {/* PDF widget rendering removed */}


                  </div>
                </div>
              )
            })}
                      </ClientOnlyGridLayout>
          </div>
        </div>
      )}
        </div>

        {/* Template Section - Right Side (1/4 width) */}
        <div className="xl:col-span-1">
          <TemplatesPanel
            userRole={userRole}
            templates={templates}
            widgets={widgets}
            layout={layout}
            isLoadingTemplates={isLoadingTemplates}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isApplyingTemplate={isApplyingTemplate}
            isDeletingTemplate={isDeletingTemplate}
            isUpdatingTemplate={isUpdatingTemplate}
            isSavingTemplate={isSavingTemplate}
            onViewAll={handleViewAllTemplates}
            onView={handleViewTemplate}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onApply={applyTemplate}
            showTemplateModal={showTemplateModal}
            setShowTemplateModal={setShowTemplateModal}
            templateName={templateName}
            setTemplateName={setTemplateName}
            templateDescription={templateDescription}
            setTemplateDescription={setTemplateDescription}
            onSaveTemplate={() => handleTemplateSave()}
            showDuplicateNameDialog={showDuplicateNameDialog}
            setShowDuplicateNameDialog={setShowDuplicateNameDialog}
            pendingTemplate={pendingTemplate}
            onReplaceTemplate={handleReplaceTemplate}
            onTryAnotherName={handleTryAnotherName}
            showViewAllModal={showViewAllModal}
            setShowViewAllModal={setShowViewAllModal}
            showEditModal={showEditModal}
            setShowEditModal={setShowEditModal}
            editingTemplate={editingTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            showViewModal={showViewModal}
            setShowViewModal={setShowViewModal}
            selectedTemplate={selectedTemplate}
            hexToRgba={hexToRgba}
            defaultWidgetSettings={DEFAULT_WIDGET_SETTINGS}
              />
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
            {(() => {
              const activeWidget = widgets.find(w => w.id === activeSettingsWidget);
              const availableTabs = getTabsForWidgetType(activeWidget?.type);
              
              // If current active tab is not available for this widget type, switch to first available tab
              if (activeSettingsWidget && !availableTabs.find(tab => tab.id === activeSettingsTab)) {
                setActiveSettingsTab(availableTabs[0].id);
              }
              
              return availableTabs.map((tab) => (
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
              ));
            })()}
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
                      max={(() => {
                        const activeWidget = widgets.find(w => w.id === activeSettingsWidget);
                        return activeWidget && activeWidget.notices ? Math.max(1, activeWidget.notices.length) : 10;
                      })()}
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

                    {/* Notice Card Height */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Notice Card Height</span>
                        <span className="text-xs text-gray-600">
                          {widgetSettings[activeSettingsWidget]?.noticeCardHeight || DEFAULT_WIDGET_SETTINGS.noticeCardHeight}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        step="1"
                        value={widgetSettings[activeSettingsWidget]?.noticeCardHeight || DEFAULT_WIDGET_SETTINGS.noticeCardHeight}
                        onChange={(e) =>
                          updateWidgetSetting(activeSettingsWidget, "noticeCardHeight", Number.parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <p className="text-xs text-gray-400 mt-1">Percentage of widget container height</p>
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

      {/* Image Select Modal */}
      {isImageSelectOpen && createPortal(
        <div className="fixed inset-0 z-[1000]">
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-150 ${animateImageOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              setAnimateImageOpen(false)
              setTimeout(() => {
                setIsImageSelectOpen(false)
                setImageSelectWidgetId(null)
              }, 150)
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[92vw] max-w-5xl max-h-[85vh] overflow-hidden transition-all duration-150 transform ${animateImageOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3 text-base font-semibold text-gray-800">
                  <div className="p-2 rounded-lg bg-white border border-gray-200"><ImageIcon size={18} className="text-emerald-600" /></div>
                  Choose Existing Image
                </div>
                <button
                  onClick={() => {
                    setAnimateImageOpen(false)
                    setTimeout(() => {
                      setIsImageSelectOpen(false)
                      setImageSelectWidgetId(null)
                    }, 150)
                  }}
                  className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 grid place-items-center"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 bg-white">
                {isLoadingExistingImages ? (
                  <div className="flex items-center justify-center py-16 text-sm text-gray-500">Loading images...</div>
                ) : existingImages.length === 0 ? (
                  <div className="text-center py-16 text-sm text-gray-500">No existing image notices found.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                    {existingImages.map((n: any) => {
                      const url = reconstructImageUrl(n)
                      return (
                        <button
                          key={n.id}
                          className="text-left rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white p-3 flex flex-col gap-3"
                          onClick={async () => {
                            try {
                              if (!imageSelectWidgetId || !url) return
                              setWidgets(prev => prev.map(w => w.id === imageSelectWidgetId ? {
                                ...w,
                                images: [{
                                  id: `img-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                                  url,
                                  title: n.imageFileName || n.title || 'Image',
                                  dbId: n.id
                                }]
                              } : w))
                              setAnimateImageOpen(false)
                              setTimeout(() => {
                                setIsImageSelectOpen(false)
                                setImageSelectWidgetId(null)
                              }, 150)
                              toast.success('Image selected successfully')
                            } catch (err) {
                              console.error('Error selecting existing image:', err)
                              toast.error('Failed to select image')
                            }
                          }}
                          title={n.imageFileName || n.title || 'Image'}
                        >
                          <div className="w-full h-28 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt={n.title || 'Image'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-xs text-gray-400">No preview</div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate">{n.imageFileName || n.title || 'Image'}</div>
                          <div className="text-xs text-gray-400 truncate">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>, document.body)
      }

      {/* View Template Modal moved to TemplatesPanel */}
    </div>
  )
}

export default ClientOnlyDashboard
