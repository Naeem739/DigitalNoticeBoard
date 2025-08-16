'use client'

import { useEffect, useState } from 'react'
import { usePublicNoticeSettings } from '@/hooks/usePublicNoticeSettings'
import { motion } from 'framer-motion'
import { 
  Phone, 
  User, 
  Building, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react'
import { NoticeQRCode } from '@/components/ui/qr-code'

type TDashboard = {
  id: string
  aspectRatio: string
  containers: any[]
  createdAt?: Date
}

type TNotice = {
  id: string
  title: string
  content?: string
  categoryName?: string
  createdAt?: Date
  pdfUrl?: string
  pdfFileName?: string
  pdfData?: string
  imageUrl?: string
  imageFileName?: string
  imageData?: string
}

type TImage = {
  id: string
  title: string
  imageUrl: string
}

type TPagination = {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: number | null
  prevPage: number | null
}

export default function PublicNoticePage() {
  const { settings, loading, refreshSettings } = usePublicNoticeSettings()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [dashboards, setDashboards] = useState<TDashboard[]>([])
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0)
  const [currentDashboard, setCurrentDashboard] = useState<TDashboard | null>(null)
  const [notices, setNotices] = useState<TNotice[]>([])
  const [images, setImages] = useState<TImage[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [pagination, setPagination] = useState<TPagination | null>(null)
  const [autoPaginationEnabled, setAutoPaginationEnabled] = useState(true)
  const [countdown, setCountdown] = useState(300) // 5 minutes = 300 seconds

  // Initialize component
  useEffect(() => {
    setMounted(true)
    
    // Add classes to prevent scrolling
    document.body.classList.add('notice-page-active')
    document.documentElement.classList.add('notice-page-active')
    
    // Cleanup function to remove classes
    return () => {
      document.body.classList.remove('notice-page-active')
      document.documentElement.classList.remove('notice-page-active')
    }
  }, [])

  // Auto-refresh every 30 minutes
  useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      refreshSettings()
      fetchDashboards()
    }, 1800000) // 30 minutes (30 * 60 * 1000 ms)

    return () => clearInterval(interval)
  }, [mounted, refreshSettings])

  // Update current time every second
  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [mounted])

  // Auto-pagination every 5 minutes
  useEffect(() => {
    if (!mounted || !autoPaginationEnabled || dashboards.length <= 1) return

    const interval = setInterval(() => {
      setCurrentDashboardIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % dashboards.length
        return nextIndex
      })
    }, 300000) // 5 minutes (5 * 60 * 1000 ms)

    return () => clearInterval(interval)
  }, [mounted, autoPaginationEnabled, dashboards.length])

  // Auto-scroll functionality for widgets
  useEffect(() => {
    if (!mounted || !currentDashboard) return

    const autoScrollWidgets = currentDashboard.containers.filter((container: any) => 
      container.settings?.autoScroll && container.type === 'notice'
    )

    const scrollIntervals = autoScrollWidgets.map((container: any) => {
      const element = document.getElementById(container.id)
      if (!element) return null

      const noticesContainer = element.querySelector(".notices-container")
      if (!noticesContainer) return null

      let scrollPosition = 0
      let isScrollingDown = true
      const scrollSpeed = 1
      const maxScroll = noticesContainer.scrollHeight - noticesContainer.clientHeight

      // Only start scrolling if there's actually content to scroll
      if (maxScroll <= 0) return null

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
  }, [mounted, currentDashboard])

  // Countdown timer for auto-pagination
  useEffect(() => {
    if (!mounted || !autoPaginationEnabled || dashboards.length <= 1) {
      setCountdown(300)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 300 // Reset to 5 minutes
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mounted, autoPaginationEnabled, dashboards.length])

  // Fetch all dashboards
  useEffect(() => {
    if (!mounted) return
    fetchDashboards()
  }, [mounted])

  // Update current dashboard when dashboards or index changes
  useEffect(() => {
    if (dashboards.length > 0 && currentDashboardIndex < dashboards.length) {
      setCurrentDashboard(dashboards[currentDashboardIndex])
      fetchDashboardContent(dashboards[currentDashboardIndex])
    }
  }, [dashboards, currentDashboardIndex])

  const fetchDashboards = async () => {
    try {
      setDashboardLoading(true)
      
      // Fetch all dashboards with pagination
      const response = await fetch('/api/dashboard/get-all?limit=100') // Get more dashboards
      const data = await response.json()
      
      if (data.success) {
        setDashboards(data.result || [])
        setPagination(data.pagination || null)
        
        // Set first dashboard as current if no current dashboard
        if (data.result && data.result.length > 0 && !currentDashboard) {
          setCurrentDashboardIndex(0)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  const fetchDashboardContent = async (dashboard: TDashboard) => {
    try {
      // Extract notice and image IDs from containers
      const noticeIds: string[] = []
      const imageIds: string[] = []
      
      dashboard.containers.forEach((container: any) => {
        if (container.type === "image" && container.imageIds) {
          imageIds.push(...container.imageIds)
        } else if (container.noticeIds) {
          noticeIds.push(...container.noticeIds)
        }
      })
      
      // Fetch notices if any
      if (noticeIds.length > 0) {
        try {
          const noticesResponse = await fetch('/api/notice/get-all')
          const noticesData = await noticesResponse.json()
          if (noticesData.success) {
            const filteredNotices = noticesData.result.filter((notice: TNotice) => 
              noticeIds.includes(notice.id)
            )
            setNotices(filteredNotices)
          }
        } catch (error) {
          console.error('Error fetching notices:', error)
        }
      } else {
        setNotices([])
      }
      
      // Fetch images if any
      if (imageIds.length > 0) {
        try {
          const imagesResponse = await fetch('/api/image/get-all')
          const imagesData = await imagesResponse.json()
          if (imagesData.success) {
            const filteredImages = imagesData.result.filter((image: TImage) => 
              imageIds.includes(image.id)
            )
            setImages(filteredImages)
          }
        } catch (error) {
          console.error('Error fetching images:', error)
        }
      } else {
        setImages([])
      }
    } catch (error) {
      console.error('Error fetching dashboard content:', error)
    }
  }

  const getNoticeById = (noticeId: string) => {
    return notices.find(notice => notice.id === noticeId)
  }

  const getImageById = (imageId: string) => {
    return images.find(image => image.id === imageId)
  }

  const goToNextDashboard = () => {
    if (currentDashboardIndex < dashboards.length - 1) {
      setCurrentDashboardIndex(currentDashboardIndex + 1)
      setCountdown(300) // Reset countdown when manually changing
    }
  }

  const goToPrevDashboard = () => {
    if (currentDashboardIndex > 0) {
      setCurrentDashboardIndex(currentDashboardIndex - 1)
      setCountdown(300) // Reset countdown when manually changing
    }
  }

  const goToDashboard = (index: number) => {
    if (index >= 0 && index < dashboards.length) {
      setCurrentDashboardIndex(index)
      setCountdown(300) // Reset countdown when manually changing
    }
  }

  const toggleAutoPagination = () => {
    setAutoPaginationEnabled(!autoPaginationEnabled)
    if (!autoPaginationEnabled) {
      setCountdown(300) // Reset countdown when enabling
    }
  }

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Get background style based on settings
  const getBackgroundStyle = () => {
    if (!settings) return {}

    switch (settings.backgroundType) {
      case 'solid':
        return {
          backgroundColor: settings.backgroundColor || '#f8fafc'
        }
      case 'gradient':
        const gradientColors = settings.gradientColors || ['#0f172a', '#1e293b', '#334155']
        return {
          background: `linear-gradient(135deg, ${gradientColors.join(', ')})`
        }
      case 'image':
        return {
          backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      default:
        return {
          background: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)'
        }
    }
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format notice creation date
  const formatNoticeDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - dateObj.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  if (loading || !mounted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={getBackgroundStyle()}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Notice Board...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden notice-page-container"
      style={getBackgroundStyle()}
    >
      {/* Header */}
      <motion.header 
        className="bg-opacity-95 backdrop-blur-sm shadow-lg border-b border-blue-500/30 flex-shrink-0"
        style={{ 
          backgroundColor: settings?.headerBackgroundColor || '#1e293b',
          borderBottomColor: settings?.accentColor || '#3b82f6'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full px-3 py-2">
          {/* Main Header Row */}
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center space-x-3">
              {settings?.logo && (
                <motion.div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md overflow-hidden bg-white/10 backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <img 
                    src={settings.logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}
              <div>
                <motion.h1 
                  className="text-lg font-bold text-white truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {settings?.title || "Smart Notice Board"}
                </motion.h1>
                <motion.p 
                  className="text-xs text-gray-300 truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {settings?.subtitle || "Information Technology Department"}
                </motion.p>
              </div>
            </div>

            {/* Center - Emergency Contact Info */}
            {(settings?.emergencyNumber || settings?.emergencyContact) && (
              <motion.div 
                className="hidden md:flex items-center space-x-4 text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {settings?.emergencyNumber && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-semibold">Emergency: {settings.emergencyNumber}</span>
                  </div>
                )}
                {settings?.emergencyContact && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-semibold">Contact: {settings.emergencyContact}</span>
                  </div>
                )}
                {settings?.departmentName && (
                  <div className="flex items-center space-x-1">
                    <Building className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-semibold">{settings.departmentName}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Right side - Time and Date */}
            <div className="text-right text-white">
              <motion.div 
                className="text-lg font-bold font-mono"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                suppressHydrationWarning
              >
                {formatTime(currentTime)}
              </motion.div>
              <motion.div 
                className="text-xs text-gray-300"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                suppressHydrationWarning
              >
                {formatDate(currentTime)}
              </motion.div>
            </div>
          </div>

          {/* Auto-refresh and Pagination Controls */}
          <motion.div 
            className="mt-2 pt-2 border-t border-white/20 flex items-center justify-center space-x-2 md:space-x-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Auto-refresh indicator */}
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-2 md:px-3 py-1 flex items-center space-x-2 text-white">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="text-xs font-medium hidden sm:inline">Auto-refreshing every 30 minutes</span>
              <span className="text-xs font-medium sm:hidden">Auto-refresh</span>
            </div>

            {/* Auto-pagination toggle */}
            {dashboards.length > 1 && (
              <button
                onClick={toggleAutoPagination}
                className="bg-white/10 backdrop-blur-sm rounded-full px-2 md:px-3 py-1 flex items-center space-x-2 text-white hover:bg-white/20 transition-all"
                title={autoPaginationEnabled ? 'Disable auto-pagination' : 'Enable auto-pagination'}
              >
                {autoPaginationEnabled ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span className="text-xs font-medium">Auto: {formatCountdown(countdown)}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span className="text-xs font-medium">Manual Mode</span>
                  </>
                )}
              </button>
            )}

            {/* Dashboard Navigation */}
            {dashboards.length > 1 && (
              <div className="flex items-center space-x-2 md:space-x-3">
                <button
                  onClick={goToPrevDashboard}
                  disabled={currentDashboardIndex === 0}
                  className="p-1 rounded-full bg-white/10 backdrop-blur-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {dashboards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToDashboard(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentDashboardIndex 
                          ? 'bg-white' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={goToNextDashboard}
                  disabled={currentDashboardIndex === dashboards.length - 1}
                  className="p-1 rounded-full bg-white/10 backdrop-blur-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <div className="text-white text-xs font-medium hidden sm:inline">
                  Page {currentDashboardIndex + 1} of {dashboards.length}
                </div>
                <div className="text-white text-xs font-medium sm:hidden">
                  {currentDashboardIndex + 1}/{dashboards.length}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-6 overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          {/* Dashboard Content */}
          {dashboardLoading ? (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                <p className="text-xl font-semibold">Loading Dashboard Content...</p>
              </div>
            </motion.div>
          ) : currentDashboard ? (
            <motion.div 
              className="w-full h-full rounded-lg shadow-lg p-2 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div 
                className="relative w-full h-full overflow-hidden rounded-lg shadow-lg"
                style={{
                  aspectRatio: currentDashboard.aspectRatio,
                  minHeight: '300px',
                  maxHeight: '100%'
                }}
              >
                {/* Grid Layout for Widgets */}
                <div className="grid gap-2 md:gap-4 p-2 md:p-4 h-full notice-grid-container" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                  {currentDashboard.containers.map((container, index) => {
                    const settings = container.settings || {}
                    const bgColor = settings.backgroundColor || '#ffffff'
                    const bgOpacity = settings.backgroundOpacity || 0.3
                    const borderColor = settings.borderColor || '#e2e8f0'
                    const borderWidth = settings.borderWidth || 1
                    
                    return (
                      <motion.div
                        key={container.id}
                        id={container.id}
                        className="relative rounded-xl shadow-lg overflow-hidden flex flex-col backdrop-blur-sm"
                        style={{
                          gridColumn: `span ${Math.min(container.w, 12)}`,
                          gridRow: `span ${Math.min(container.h, 6)}`,
                          backgroundColor: `${bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                          border: `${borderWidth}px solid ${borderColor}`,
                          position: 'relative',
                          minHeight: '150px',
                          maxHeight: '100%',
                          boxShadow: `0 4px 6px -1px ${borderColor}20, 0 2px 4px -1px ${borderColor}10`
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: `0 10px 25px -3px ${borderColor}30, 0 4px 6px -2px ${borderColor}20`
                        }}
                      >
                        {/* Widget Header */}
                        <div 
                          className="px-2 md:px-4 py-2 md:py-3 border-b relative overflow-hidden flex-shrink-0"
                          style={{
                            backgroundColor: settings.categoryBackgroundColor || '#f8fafc',
                            borderBottomColor: settings.categoryBorderColor || '#e2e8f0',
                            borderBottomWidth: settings.categoryBorderWidth || 1,
                            background: `linear-gradient(135deg, ${settings.categoryBackgroundColor || '#f8fafc'}, ${settings.categoryBackgroundColor || '#f1f5f9'})`
                          }}
                        >
                          {/* Header Background Pattern */}
                          <div 
                            className="absolute inset-0 opacity-5"
                            style={{
                              backgroundImage: `radial-gradient(circle at 20% 50%, ${borderColor} 1px, transparent 1px), radial-gradient(circle at 80% 50%, ${borderColor} 1px, transparent 1px)`,
                              backgroundSize: '20px 20px'
                            }}
                          />
                          
                          <div className="relative flex items-center justify-center">
                            <h3 
                              className="text-sm md:text-lg font-bold text-center truncate px-2 md:px-4 py-1 md:py-2 rounded-xl relative overflow-hidden"
                            style={{
                              color: settings.categoryFontColor || '#1e293b',
                              fontFamily: settings.categoryFont || 'Inter',
                              fontSize: `clamp(12px, ${settings.categoryFontSize || 16}px, 18px)`,
                              fontWeight: settings.categoryFontWeight || 'bold',
                              textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                              backgroundColor: `${settings.categoryBackgroundColor || '#f8fafc'}90`,
                              border: `2px solid ${settings.categoryBorderColor || '#e2e8f0'}`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                              backdropFilter: 'blur(10px)',
                              position: 'relative'
                            }}
                          >
                            {/* Gradient overlay for extra visual appeal */}
                            <div 
                              className="absolute inset-0 rounded-xl opacity-20"
                              style={{
                                background: `linear-gradient(135deg, ${settings.accentColor || '#3b82f6'}20, ${settings.accentColor || '#3b82f6'}10)`
                              }}
                            />
                            <span className="relative z-10">
                              {container.settings?.customCategoryName || container.title || `Widget ${index + 1}`}
                            </span>
                            {/* Decorative elements */}
                            <div 
                              className="absolute top-0 left-0 w-2 h-2 rounded-full opacity-60"
                              style={{
                                backgroundColor: settings.accentColor || '#3b82f6'
                              }}
                            />
                            <div 
                              className="absolute bottom-0 right-0 w-2 h-2 rounded-full opacity-60"
                              style={{
                                backgroundColor: settings.accentColor || '#3b82f6'
                              }}
                            />
                          </h3>
                          </div>
                          
                          {/* Header Bottom Border */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{
                              background: `linear-gradient(90deg, ${borderColor}, ${borderColor}60, ${borderColor})`
                            }}
                          />
                        </div>

                        {/* Widget Content */}
                        <div 
                          className="p-2 md:p-4 flex-1 flex flex-col justify-center overflow-hidden" 
                          style={{ 
                            minHeight: '150px'
                          }}
                        >
                          {container.type === 'notice' && container.noticeIds && (
                            <div className="h-full flex flex-col justify-between gap-2">
                              <div className="notices-container flex flex-col gap-2 overflow-auto scrollbar-hide flex-1">
                                {container.noticeIds.slice(0, 5).map((noticeId: string, noticeIndex: number) => {
                                const notice = getNoticeById(noticeId)
                                if (!notice) return null
                                
                                return (
                                  <motion.div
                                    key={noticeId}
                                    className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex-1 min-h-0"
                                    style={{
                                      backgroundColor: `${bgColor}${Math.round((settings.cardOpacity || 0.95) * 255).toString(16).padStart(2, '0')}`,
                                      borderLeft: `3px solid ${borderColor}`,
                                      backdropFilter: 'blur(10px)',
                                      border: `1px solid ${borderColor}20`,
                                      minHeight: '100px',
                                      maxHeight: '140px',
                                      width: '100%',
                                      overflow: 'hidden'
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: noticeIndex * 0.1 }}
                                    whileHover={{ 
                                      scale: 1.01,
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    {/* QR Code - Responsive Size */}
                                    <div className="qr-code-container responsive-qr-code">
                                      <NoticeQRCode 
                                        notice={notice}
                                        imageData={notice.imageData}
                                        imageTitle={notice.imageFileName || notice.title}
                                        size={64}
                                        className="opacity-80 hover:opacity-100 transition-opacity w-full h-full"
                                      />
                                    </div>
                                    {/* Notice Header */}
                                    <div className="p-2 md:p-4 pb-2 pr-16 md:pr-20 lg:pr-24 xl:pr-28">
                                      {/* Notice Title */}
                                      <h4 
                                        className="text-xs md:text-sm font-semibold leading-tight mb-2 line-clamp-2 break-words"
                                        style={{
                                          color: settings.fontColor || '#1e293b',
                                          fontSize: `clamp(10px, ${settings.fontSize || 14}px, 16px)`,
                                          fontWeight: settings.fontWeight || 'semibold',
                                          fontFamily: settings.fontFamily || 'Inter',
                                          lineHeight: '1.3',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}
                                      >
                                        {notice.title}
                                      </h4>
                                      
                                      {/* Category and Date Row */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                                                                    {/* Category Badge */}
                                            {(container.settings?.customCategoryName || notice.categoryName) && (
                                              <div className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-semibold relative overflow-hidden group"
                                                style={{
                                                  backgroundColor: `${borderColor}15`,
                                                  color: settings.fontColor || '#1e293b',
                                                  fontSize: '10px',
                                                  border: `1px solid ${borderColor}40`,
                                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                  backdropFilter: 'blur(8px)',
                                                  transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.transform = 'scale(1.05)';
                                                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.transform = 'scale(1)';
                                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                                }}
                                              >
                                                {/* Gradient background */}
                                                <div 
                                                  className="absolute inset-0 rounded-full opacity-30"
                                                  style={{
                                                    background: `linear-gradient(135deg, ${borderColor}40, ${borderColor}20)`
                                                  }}
                                                />
                                                {/* Icon for custom category names */}
                                                {container.settings?.customCategoryName && (
                                                  <svg 
                                                    className="w-3 h-3 mr-1 md:mr-1.5 relative z-10" 
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                  >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                  </svg>
                                                )}
                                                <span className="relative z-10 font-medium tracking-wide">
                                                  {container.settings?.customCategoryName || notice.categoryName}
                                                </span>
                                                {/* Subtle glow effect */}
                                                <div 
                                                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                                                  style={{
                                                    background: `radial-gradient(circle, ${borderColor}40, transparent)`
                                                  }}
                                                />
                                              </div>
                                            )}
                                        
                                        {/* Creation Date */}
                                        {notice.createdAt && (
                                          <>
                                            <div className="w-1 h-1 rounded-full opacity-40"
                                              style={{
                                                backgroundColor: settings.fontColor || '#1e293b'
                                              }}
                                            />
                                            <div 
                                              className="text-xs font-medium opacity-70"
                                              style={{
                                                color: settings.fontColor || '#1e293b',
                                                fontSize: '10px'
                                              }}
                                            >
                                              {formatNoticeDate(notice.createdAt)}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Notice Content */}
                                    {settings.showFullContent && notice.content && (
                                        <div className="mt-2 md:mt-3">
                                      <p 
                                            className="text-xs leading-tight opacity-75 line-clamp-2 break-words"
                                        style={{
                                          color: settings.fontColor || '#1e293b',
                                              fontFamily: settings.fontFamily || 'Inter',
                                              lineHeight: '1.3',
                                              fontSize: '10px',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'break-word'
                                        }}
                                      >
                                            {notice.content.length > 60 
                                              ? `${notice.content.substring(0, 60)}...` 
                                              : notice.content
                                            }
                                      </p>
                                        </div>
                                    )}
                                  </div>
                                    
                                    {/* Bottom Border Animation */}
                                    <div 
                                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                                      style={{
                                        background: `linear-gradient(90deg, ${borderColor}, ${borderColor}80)`
                                      }}
                                    />
                                  </motion.div>
                                )
                              })}
                              
                              {/* Show warning if there are more notices */}
                              {container.noticeIds.length > 5 && (
                                <div className="text-center py-1">
                                  <div 
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium opacity-60"
                                    style={{
                                      backgroundColor: `${borderColor}15`,
                                      color: settings.fontColor || '#1e293b',
                                      fontSize: '10px'
                                    }}
                                  >
                                    +{container.noticeIds.length - 5} more notices
                                  </div>
                                </div>
                              )}
                              </div>
                            </div>
                          )}

                          {container.type === 'image' && container.imageIds && (
                            <div className="h-full flex items-center justify-center p-2 md:p-4">
                              {container.imageIds.slice(0, 1).map((imageId: string) => {
                                const image = getImageById(imageId)
                                if (!image) return null
                                
                                return (
                                  <motion.div 
                                    key={imageId} 
                                    className="w-full h-full relative group overflow-hidden rounded-lg shadow-md"
                                    style={{
                                      borderRadius: `${settings.imageBorderRadius || 12}px`
                                    }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    <img
                                      src={image.imageUrl}
                                      alt={image.title}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      style={{
                                        objectFit: settings.imageFit || 'cover',
                                        borderRadius: `${settings.imageBorderRadius || 12}px`
                                      }}
                                    />
                                    
                                    {/* Image Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    {settings.showImageTitle && (
                                      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-lg">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                        <p
                                          className="text-xs md:text-sm font-semibold text-white truncate"
                                          style={{
                                            color: settings.imageTitleColor || '#ffffff',
                                            fontSize: `clamp(10px, ${settings.imageTitleFontSize || 14}px, 16px)`,
                                                fontWeight: settings.imageTitleFontWeight || 'semibold',
                                                fontFamily: settings.fontFamily || 'Inter',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                          }}
                                        >
                                          {image.title}
                                        </p>
                                          </div>
                                          <div className="flex-shrink-0 ml-2">
                                            <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Corner Badge */}
                                    <div className="absolute top-2 right-2">
                                      <div className="w-3 h-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"></div>
                                  </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          )}

                          {(!container.noticeIds || container.noticeIds.length === 0) && 
                           (!container.imageIds || container.imageIds.length === 0) && (
                            <div className="flex items-center justify-center h-full p-4 md:p-6">
                              <div className="text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full flex items-center justify-center opacity-30"
                                  style={{
                                    backgroundColor: `${borderColor}20`,
                                    border: `2px dashed ${borderColor}40`
                                  }}
                                >
                                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p 
                                  className="text-xs md:text-sm font-medium opacity-60"
                                  style={{
                                    color: settings.fontColor || '#1e293b'
                                  }}
                                >
                                No content available
                              </p>
                                <p 
                                  className="text-xs opacity-40 mt-1"
                                  style={{
                                    color: settings.fontColor || '#1e293b'
                                  }}
                                >
                                  Add notices or images to this widget
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center text-white">
                <h2 className="text-xl md:text-2xl font-bold mb-4">No Dashboards Available</h2>
                <p className="text-base md:text-lg opacity-80">Please create dashboard interfaces first.</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="bg-opacity-95 backdrop-blur-sm shadow-lg border-t border-blue-500/30 flex-shrink-0"
        style={{ 
          backgroundColor: settings?.footerBackgroundColor || '#1e293b',
          borderTopColor: settings?.accentColor || '#3b82f6'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <div className="w-full px-3 md:px-6 py-2 md:py-4">
          <div className="flex items-center justify-between text-white text-xs md:text-sm">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span>
                © {new Date().getFullYear()} {settings?.title || "Smart Notice Board"}
              </span>
              <span className="text-white/60 hidden sm:inline">•</span>
              <span className="text-white/80 hidden sm:inline">
                {settings?.departmentName || "Information Technology Department"}
              </span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 text-white/80">
              <span className="hidden md:inline">Last updated: {new Date().toLocaleString()}</span>
              <span className="text-white/60 hidden md:inline">•</span>
              <span>Auto-refresh enabled</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}