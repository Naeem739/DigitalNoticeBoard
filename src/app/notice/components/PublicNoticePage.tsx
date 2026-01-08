
'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import { usePublicNoticeSettings } from '@/hooks/usePublicNoticeSettings'
import { motion } from 'framer-motion'
import { 
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { NoticeQRCode } from '@/components/ui/qr-code'
import LazyPdfWidget from './LazyPdfWidget'
import ClientOnly from './ClientOnly'
import { useDashboards } from '@/hooks/useDashboardData'
import { useNotices } from '@/hooks/useNotices'
import { usePDFs } from '@/hooks/usePDFs'


type TDashboard = {
  id: string
  aspectRatio: string
  containers: any[]
  createdAt?: Date
  screenName?: string
  screenIndex?: number
  totalScreens?: number
}

type TNotice = {
  id: string
  title: string
  content?: string
  category?: string
  categoryId?: string
  categoryName?: string
  createdAt?: Date
  updatedAt?: Date
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
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0)
  const [currentDashboard, setCurrentDashboard] = useState<TDashboard | null>(null)
  const [images, setImages] = useState<TImage[]>([])
  const [autoPaginationEnabled, setAutoPaginationEnabled] = useState(true)
  const [countdown, setCountdown] = useState(120) // 2 minutes = 120 seconds
  const [viewportWidth, setViewportWidth] = useState(0)
  const isMobile = viewportWidth > 0 && viewportWidth <= 480
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now())

  // TanStack Query hooks for real-time data fetching
  // Refetch every 3 seconds for real-time updates (works on Vercel)
  const { data: dashboardsData, isLoading: dashboardLoading } = useDashboards(3000)
  const { data: noticesData } = useNotices(3000)
  const { data: pdfsData } = usePDFs(3000)

  // Extract data from query results
  const dashboards = dashboardsData?.result || []
  const allNotices = noticesData?.result || []
  const allPdfs = pdfsData?.result || []

  // Initialize component
  useEffect(() => {
    setMounted(true)
    return () => {}
  }, [])

  // Track when actual data changes (not just refetches)
  useEffect(() => {
    if (!mounted) return
    
    // Create a hash of the data to detect changes
    const dataHash = JSON.stringify({
      dashboardsCount: dashboards.length,
      noticesCount: allNotices.length,
      pdfsCount: allPdfs.length,
      dashboardIds: dashboards.map(d => d.id).sort(),
      noticeIds: allNotices.map(n => n.id).sort(),
      pdfIds: allPdfs.map(p => p.id).sort(),
    })
    
    // Store hash in ref to compare on next render
    const prevHashKey = 'prevDataHash'
    const prevHash = sessionStorage.getItem(prevHashKey)
    
    if (prevHash !== dataHash && prevHash !== null) {
      // Data actually changed, update timestamp
      setLastDataUpdate(Date.now())
    }
    
    sessionStorage.setItem(prevHashKey, dataHash)
  }, [mounted, dashboards, allNotices, allPdfs])

  // Update current time every second
  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [mounted])

  // Track viewport width for responsive font sizing
  useEffect(() => {
    if (!mounted) return

    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth)
    }

    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [mounted])

  // Responsive font-size mapping for notice titles - Optimized for 75" 4K display
  const getResponsiveTitleFontSize = () => {
    const w = viewportWidth
    if (!w) return 14 // default until measured
    if (w < 360) return 12 // Very small phones
    if (w < 400) return 13 // 6.1"-6.3"
    if (w < 480) return 14 // ~6.4"-6.7" narrow
    if (w < 640) return 15 // Larger mobiles / small tablets
    if (w < 1700) return 20 // Typical laptops (13–15.6")
    if (w < 2560) return 28 // 2K displays
    if (w < 3400) return 36 // Medium monitors (32–44")
    if (w < 3840) return 42 // Large 4K displays (60-70")
    return 48 // 75" 4K display (3840px+)
  }

  // Responsive notice card height (in em) - Optimized for 75" 4K display
  const getResponsiveNoticeHeight = () => {
    const w = viewportWidth
    if (!w) return '8.125em' // default until measured
    if (w < 360) return '7.25em' // ~116px
    if (w < 400) return '7.5em' // ~120px
    if (w < 480) return '7.75em' // ~124px
    if (w <= 640) return '8.125em' // 130px equivalent
    if (w <= 1366) return '9.0625em' // 145px equivalent
    if (w <= 2560) return '10em' // 160px equivalent
    if (w <= 3400) return '11em' // 176px equivalent
    if (w < 3840) return '12em' // 192px equivalent
    return '13em' // 208px equivalent for 75" 4K
  }

  // Limit number of notices per widget based on viewport for readability
  const getMaxNoticesPerWidget = () => {
    const w = viewportWidth
    if (!w) return 5
    if (w < 360) return 3
    if (w < 400) return 3
    if (w < 480) return 4
    if (w <= 640) return 4
    if (w <= 2560) return 5
    if (w <= 3840) return 6
    return 7 // More notices for 75" display
  }

  // Get responsive QR code size - Optimized for 75" 4K display
  const getResponsiveQRSize = () => {
    const w = viewportWidth
    if (!w) return 80
    if (w <= 360) return 30
    if (w <= 400) return 30
    if (w <= 640) return 30
    if (w <= 1366) return 30
    if (w <= 2560) return 100
    if (w <= 3400) return 120
    if (w < 3840) return 140
    return 160 // Large QR codes for 75" 4K display
  }

  // Get responsive QR code container size (includes padding) - Optimized for scanning
  const getResponsiveQRContainerSize = () => {
    const qrSize = getResponsiveQRSize()
    return qrSize + 24 // Add more padding for better scanning visibility
  }

  // Get responsive header font size
  const getResponsiveHeaderFontSize = () => {
    const w = viewportWidth
    if (!w) return 'text-sm sm:text-lg'
    if (w < 640) return 'text-sm'
    if (w < 1700) return 'text-lg'
    if (w < 2560) return 'text-xl'
    if (w < 3840) return 'text-2xl'
    return 'text-3xl' // Large header for 75" display
  }

  // Get responsive subtitle font size
  const getResponsiveSubtitleFontSize = () => {
    const w = viewportWidth
    if (!w) return 'text-xs'
    if (w < 640) return 'text-xs'
    if (w < 1700) return 'text-sm'
    if (w < 2560) return 'text-base'
    if (w < 3840) return 'text-lg'
    return 'text-xl' // Large subtitle for 75" display
  }

  // Get responsive time font size
  const getResponsiveTimeFontSize = () => {
    const w = viewportWidth
    if (!w) return 'text-sm sm:text-lg'
    if (w < 640) return 'text-sm'
    if (w < 1700) return 'text-lg'
    if (w < 2560) return 'text-xl'
    if (w < 3840) return 'text-2xl'
    return 'text-3xl' // Large time for 75" display
  }

  // Get responsive padding
  const getResponsivePadding = () => {
    const w = viewportWidth
    if (!w) return 'px-2 sm:px-3 py-1 sm:py-2'
    if (w < 640) return 'px-2 sm:px-3 py-1 sm:py-2'
    if (w < 1700) return 'px-4 py-2'
    if (w < 2560) return 'px-6 py-3'
    if (w < 3840) return 'px-8 py-4'
    return 'px-10 py-5' // Large padding for 75" display
  }

  // Get responsive grid gap
  const getResponsiveGridGap = () => {
    const w = viewportWidth
    if (!w) return 'gap-1 sm:gap-2 md:gap-4'
    if (w < 640) return 'gap-1 sm:gap-2'
    if (w < 1700) return 'gap-2 md:gap-4'
    if (w < 2560) return 'gap-4 lg:gap-6'
    if (w < 3840) return 'gap-6 lg:gap-8'
    return 'gap-8 lg:gap-10' // Large gaps for 75" display
  }

  // Get responsive content padding
  const getResponsiveContentPadding = () => {
    const w = viewportWidth
    if (!w) return 'p-1 sm:p-2 md:p-3'
    if (w < 640) return 'p-1 sm:p-2'
    if (w < 1700) return 'p-2 md:p-3'
    if (w < 2560) return 'p-3 md:p-4'
    if (w < 3840) return 'p-4 lg:p-6'
    return 'p-6 lg:p-8' // Large padding for 75" display
  }

  // Ensure QR code fits comfortably on mobile by raising min height
  const getMobileNoticeMinHeight = () => {
    const w = viewportWidth
    if (!w) return '9.5em'
    if (w <= 360) return '9.5em'   // ~152px
    if (w <= 400) return '10em'    // ~160px
    return '10.5em'                // ~168px up to 480px
  }

  // Auto-pagination every 2 minutes
  useEffect(() => {
    if (!mounted || !autoPaginationEnabled || dashboards.length <= 1) return

    const interval = setInterval(() => {
      setCurrentDashboardIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % dashboards.length
        return nextIndex
      })
    }, 120000) // 2 minutes (2 * 60 * 1000 ms)

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
      setCountdown(120)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 120 // Reset to 2 minutes
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mounted, autoPaginationEnabled, dashboards.length])

  // Update current dashboard when dashboards or index changes
  useEffect(() => {
    if (dashboards.length > 0) {
      if (currentDashboardIndex < dashboards.length) {
        const selectedDashboard = dashboards[currentDashboardIndex]
        setCurrentDashboard(selectedDashboard)
      } else {
        // Reset to first dashboard if index is out of bounds
        setCurrentDashboardIndex(0)
        setCurrentDashboard(dashboards[0])
      }
    } else {
      setCurrentDashboard(null)
    }
  }, [dashboards, currentDashboardIndex])

  // Helper to get notice by ID from all notices (not filtered)
  const getNoticeById = (noticeId: string) => {
    return allNotices.find(notice => notice.id === noticeId)
  }

  // Helper to get notices by categoryId (used for image widgets)
  const getNoticesByCategoryId = (categoryId: string): TNotice[] => {
    return allNotices.filter((notice: TNotice) => notice.categoryId === categoryId)
  }

  // const getImageById = (imageId: string) => {
  //   return images.find(image => image.id === imageId)
  // }

  const getPdfById = (pdfId: string) => {
    return allPdfs.find(pdf => pdf.id === pdfId)
  }

  // Helper function to reconstruct image URL from notice data
  const reconstructImageUrl = (notice: TNotice) => {
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

  const goToNextDashboard = () => {
    if (currentDashboardIndex < dashboards.length - 1) {
      setCurrentDashboardIndex(currentDashboardIndex + 1)
      setCountdown(120) // Reset countdown when manually changing
    }
  }

  const goToPrevDashboard = () => {
    if (currentDashboardIndex > 0) {
      setCurrentDashboardIndex(currentDashboardIndex - 1)
      setCountdown(120) // Reset countdown when manually changing
    }
  }

  const goToDashboard = (index: number) => {
    if (index >= 0 && index < dashboards.length) {
      setCurrentDashboardIndex(index)
      setCountdown(120) // Reset countdown when manually changing
    }
  }

  // const toggleAutoPagination = () => {
  //   setAutoPaginationEnabled(!autoPaginationEnabled)
  //   if (!autoPaginationEnabled) {
  //     setCountdown(300) // Reset countdown when enabling
  //   }
  // }

  // const formatCountdown = (seconds: number) => {
  //   const minutes = Math.floor(seconds / 60)
  //   const remainingSeconds = seconds % 60
  //   return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  // }

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
    const timeString = date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    })
    return `Time: ${timeString} BST`
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

  // Format countdown timer (MM:SS)
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
      style={{
        ...getBackgroundStyle(),
        fontFamily: "'Tiro Bangla', 'Inter', sans-serif"
      }}
    >
      {/* Header */}
      <motion.header 
        className="bg-opacity-95 backdrop-blur-sm shadow-lg border-b border-blue-500/30 flex-shrink-0"
        style={{ 
          backgroundColor: settings?.headerBackgroundColor || '#1e293b',
          borderBottomColor: settings?.accentColor || '#3b82f6',
          color: settings?.fontColor || '#ffffff'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`w-full ${getResponsivePadding()}`}>
          {/* Main Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            {/* Left side - Last Updated */}
            <div className="flex-1 text-center sm:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                suppressHydrationWarning
              >
                <div className={`${getResponsiveSubtitleFontSize()} opacity-75`}>
                  Last Refresh:
                </div>
                <div className={`${
                  viewportWidth < 640 ? 'text-xs' :
                  viewportWidth < 1700 ? 'text-sm' :
                  viewportWidth < 2560 ? 'text-base' :
                  viewportWidth < 3840 ? 'text-lg' : 'text-xl'
                } font-mono opacity-90`}>
                  {new Date(lastDataUpdate).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </motion.div>
            </div>

            {/* Center - Logo, Title and Department Name */}
            <div className="flex flex-col items-center justify-center text-center flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3 justify-center">
                {settings?.logo && (
                  <motion.div 
                    className={`rounded-lg flex items-center justify-center shadow-md overflow-hidden bg-white/10 backdrop-blur-sm ${
                      viewportWidth < 640 ? 'w-6 h-6 sm:w-8 sm:h-8' :
                      viewportWidth < 1700 ? 'w-10 h-10' :
                      viewportWidth < 2560 ? 'w-12 h-12' :
                      viewportWidth < 3840 ? 'w-14 h-14' : 'w-16 h-16'
                    }`}
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
                <div className="min-w-0">
                  <motion.h1 
                    className={`${getResponsiveHeaderFontSize()} font-bold`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {settings?.title || "Digital Notice Board"}
                  </motion.h1>
                  <motion.p 
                    className={`${getResponsiveSubtitleFontSize()} opacity-90`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {settings?.departmentName || settings?.subtitle || "Information Technology Department"}
                  </motion.p>
                </div>
              </div>

              {/* Dashboard Navigation - Below title */}
              {dashboards.length > 1 && (
                <motion.div 
                  className="flex items-center justify-center space-x-2 sm:space-x-3 mt-1 sm:mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={goToPrevDashboard}
                    disabled={currentDashboardIndex === 0}
                    className="p-0.5 sm:p-1 rounded-full bg-white/10 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                  >
                    <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  
                  {/* Compact Screen Info and Countdown */}
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-2.5 py-0.5 bg-white/5 rounded-md">
                    <span className={`${getResponsiveSubtitleFontSize()} text-white/80`}>
                      {currentDashboardIndex + 1}/{dashboards.length}
                    </span>
                    {autoPaginationEnabled && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className={`${getResponsiveSubtitleFontSize()} font-mono text-white/80`}>
                          {formatCountdown(countdown)}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    {dashboards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToDashboard(index)}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all ${
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
                    className="p-0.5 sm:p-1 rounded-full bg-white/10 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                  >
                    <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right side - Time and Date */}
            <div className="text-center sm:text-right flex-1">
              <motion.div 
                className={`${getResponsiveTimeFontSize()} font-bold font-mono`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                suppressHydrationWarning
              >
                {formatTime(currentTime)}
              </motion.div>
              <motion.div 
                className={`${getResponsiveSubtitleFontSize()} opacity-90`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                suppressHydrationWarning
              >
                {formatDate(currentTime)}
              </motion.div>
            </div>
          </div>


        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 p-0 overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          {/* Dashboard Content */}
          {dashboardLoading ? (
            <motion.div 
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center text-white px-4">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-white border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                <p className="text-lg sm:text-xl font-semibold">Loading Dashboard Content...</p>
                <p className="text-xs sm:text-sm opacity-70 mt-2">Ordering: Latest first, then by screen order (1, 2, 3...)</p>
              </div>
            </motion.div>
          ) : currentDashboard ? (
            <motion.div 
              className={`w-full h-full rounded-lg shadow-lg ${getResponsiveContentPadding()} overflow-hidden`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div 
                className="relative w-full h-full overflow-hidden rounded-lg shadow-lg"
                style={{
                  minHeight: '0',
                  height: '100%'
                }}
              >
                {/* Grid Layout for Widgets */}
                <div 
                  className={`grid ${getResponsiveGridGap()} ${getResponsiveContentPadding()} notice-grid-container`} 
                  style={{ 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                    height: '100%',
                    maxHeight: '100%',
                    overflow: 'hidden'
                  }}
                >
                  {currentDashboard.containers.map((container, index) => {
                    const settings = container.settings || {}
                    const bgColor = settings.backgroundColor || '#ffffff'
                    const bgOpacity = settings.backgroundOpacity || 0.3
                    const borderColor = settings.borderColor || '#e2e8f0'
                    const borderWidth = settings.borderWidth || 1
                    
                    // Calculate grid position using x, y coordinates from database
                    const gridX = container.x || 0
                    const gridY = container.y || 0
                    const gridW = Math.min(container.w || 1, 12)
                    const gridH = Math.min(container.h || 1, 6)
                    
                    return (
                      <motion.div
                        key={container.id}
                        id={container.id}
                        className="relative rounded-xl shadow-lg overflow-hidden flex flex-col backdrop-blur-sm"
                        style={{
                          gridColumn: isMobile ? '1 / -1' : `${gridX + 1} / span ${gridW}`,
                          gridRow: isMobile ? 'auto' : `${gridY + 1} / span ${gridH}`,
                          backgroundColor: (container.type === 'pdf' || container.type === 'image') ? '#ffffff' : `${bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                          border: (container.type === 'pdf' || container.type === 'image') ? '2px solid #e5e7eb' : `${borderWidth}px solid ${borderColor}`,
                          position: 'relative',
                          minHeight: isMobile ? 'auto' : (container.type === 'pdf' || container.type === 'image') ? '200px' : '150px',
                          maxHeight: isMobile ? 'none' : '100%',
                          boxShadow: (container.type === 'pdf' || container.type === 'image') ? '0 8px 25px -5px rgba(0,0,0,0.1), 0 4px 10px -2px rgba(0,0,0,0.05)' : `0 4px 6px -1px ${borderColor}20, 0 2px 4px -1px ${borderColor}10`,
                          // Ensure PDF containers fill completely and have white background
                          ...(container.type === 'pdf' ? {
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#ffffff',
                            overflow: 'hidden'
                          } : {})
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ 
                          scale: container.type === 'image' ? 1.01 : 1.02,
                          boxShadow: container.type === 'image' 
                            ? '0 12px 30px -8px rgba(0,0,0,0.15), 0 6px 15px -3px rgba(0,0,0,0.1)' 
                            : `0 10px 25px -3px ${borderColor}30, 0 4px 6px -2px ${borderColor}20`
                        }}
                      >
                        {/* Widget Header - Hidden for PDF and Image widgets */}
                        {container.type !== 'pdf' && container.type !== 'image' && (
                        <div 
                          className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-3 border-b relative overflow-hidden flex-shrink-0"
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
                          
                        <div className="relative flex items-center justify-center w-full">
                            <h3 
                              className="text-xs sm:text-sm md:text-lg font-bold text-center px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 relative"
                            style={{
                              color: settings.categoryFontColor || '#1e293b',
                              fontFamily: settings.categoryFont || "'Tiro Bangla', 'Inter', sans-serif",
                              fontSize: `clamp(10px, ${settings.categoryFontSize || 16}px, 18px)`,
                              fontWeight: settings.categoryFontWeight || 'bold',
                              position: 'relative',
                              display: 'inline-block',
                              maxWidth: '90%',
                              borderBottom: `3px solid ${settings.categoryBorderColor || settings.accentColor || '#3b82f6'}`,
                              paddingBottom: '8px'
                            }}
                          >
                            <span className="relative z-10">
                              {container.settings?.customCategoryName || container.title || `Widget ${index + 1}`}
                            </span>
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
                        )}

                        {/* Widget Content */}
                        <div 
                          className="flex-1 flex flex-col justify-center overflow-hidden" 
                          style={{ 
                            minHeight: isMobile ? 'auto' : '120px',
                            padding: (container.type === 'pdf' || container.type === 'image') ? '0' : (isMobile ? '0.75rem' : '1rem')
                          }}
                        >
                          {container.type === 'notice' && (container.category || container.categoryId || container.noticeIds) && (
                            <div className="flex flex-col h-full gap-2">
                              {(() => {
                                // Determine which notices to display based on category name (primary),
                                // then categoryId, then noticeIds (fallback)
                                let widgetNotices: TNotice[] = []

                                if (container.category) {
                                  // Primary: filter by category name (string stored in Notice.category)
                                  widgetNotices = allNotices.filter((notice: TNotice) => 
                                    notice.category === container.category
                                  )
                                  if (process.env.NODE_ENV === 'development') {
                                    console.log(`Widget ${container.id}: Filtering by category name "${container.category}", found ${widgetNotices.length} notices`)
                                  }
                                } else if (container.categoryId) {
                                  // Secondary: filter by categoryId if present
                                  widgetNotices = allNotices.filter((notice: TNotice) => 
                                    notice.categoryId === container.categoryId
                                  )
                                  if (process.env.NODE_ENV === 'development') {
                                    console.log(`Widget ${container.id}: Filtering by categoryId ${container.categoryId}, found ${widgetNotices.length} notices`)
                                  }
                                } else if (container.noticeIds) {
                                  // Fallback to noticeIds for backward compatibility
                                  widgetNotices = container.noticeIds
                                    .map((noticeId: string) => allNotices.find((n: TNotice) => n.id === noticeId))
                                    .filter((notice: TNotice | undefined) => notice !== undefined) as TNotice[]
                                  if (process.env.NODE_ENV === 'development') {
                                    console.log(`Widget ${container.id}: Using noticeIds (${container.noticeIds.length} IDs), found ${widgetNotices.length} notices`)
                                  }
                                }

                                if (widgetNotices.length === 0) {
                                  return (
                                    <div className="flex items-center justify-center h-full">
                                      <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
                                        <p className="text-sm text-gray-600">Loading notices...</p>
                                      </div>
                                    </div>
                                  )
                                }

                                // Limit the number of notices displayed
const maxNotices = (typeof container.settings?.noticeCount === 'number' && container.settings.noticeCount > 0)
  ? container.settings.noticeCount
  : (isMobile ? getMaxNoticesPerWidget() : 5);
const displayedNotices = widgetNotices.slice(0, maxNotices)

                                return (
                                  <div className={`notices-container flex flex-col gap-2 overflow-auto scrollbar-hide`}>
                                    {displayedNotices.map((notice: TNotice, noticeIndex: number) => {
                                
                                    return (
                                      <motion.div
                                        key={notice.id}
                                    className="group relative shadow-sm hover:shadow-md transition-all duration-200"
                                    style={{
                                      backgroundColor: `${bgColor}${Math.round((settings.cardOpacity || 0.95) * 255).toString(16).padStart(2, '0')}`,
                                      backdropFilter: 'blur(10px)',
                                      border: `1px solid ${borderColor}20`,
                                      borderRadius: '20px',
                                      // Dynamic height: grows with content, minimum greater than QR code (160px)
                                      minHeight: '200px',
                                      width: '100%',
                                      position: 'relative',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      padding: '12px 16px'
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: noticeIndex * 0.1 }}
                                    whileHover={{ 
                                      scale: 1.01,
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    {/* QR Code - Fixed square, right-centered */}
                                    <div className="qr-code-container responsive-qr-code">
                                      <NoticeQRCode 
                                        notice={notice}
                                        imageData={notice.imageData}
                                        imageTitle={notice.imageFileName || notice.title}
                                        size={160}
                                        className="opacity-80 hover:opacity-100 transition-opacity w-full h-full"
                                      />
                                    </div>
                                    {/* Notice Header */}
                                    <div className="p-1 sm:p-2 md:p-4 pb-1 sm:pb-2 pr-24 sm:pr-28 md:pr-32 lg:pr-40 xl:pr-48">
                                      {/* Notice Title */}
                                      <h4 
                                        className="text-xs md:text-sm font-semibold leading-tight mb-4 break-words"
                                        style={{
                                          color: settings.fontColor || '#1e293b',
                                          fontSize: `${getResponsiveTitleFontSize()}px`,
                                          fontWeight: settings.fontWeight || 'semibold',
                                          fontFamily: settings.fontFamily || "'Tiro Bangla', 'Inter', sans-serif",
                                          lineHeight: '1.3',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          marginBottom: '16px',
                                          textAlign: 'justify'
                                        }}
                                      >
                                        {notice.title}
                                      </h4>
                                      
                                      {/* Publish Date and Last Updated Row */}
                                      <div className="flex items-center gap-2 flex-wrap mt-2">
                                        {/* Publish Date */}
                                        {notice.createdAt && (
                                          <div 
                                            className="text-xs font-medium opacity-70"
                                            style={{
                                              color: settings.fontColor || '#1e293b',
                                              fontSize: '12px'
                                            }}
                                          >
                                            Published Date: {formatNoticeDate(notice.createdAt)}
                                          </div>
                                        )}
                                        
                                        {/* Separator */}
                                        {notice.createdAt && notice.updatedAt && (
                                          <div className="w-1 h-1 rounded-full opacity-40"
                                            style={{
                                              backgroundColor: settings.fontColor || '#1e293b'
                                            }}
                                          />
                                        )}
                                        
                                        {/* Last Updated */}
                                        {notice.updatedAt && (
                                          <div 
                                            className="text-xs font-medium opacity-70"
                                            style={{
                                              color: settings.fontColor || '#1e293b',
                                              fontSize: '12px'
                                            }}
                                          >
                                            Last Updated: {formatNoticeDate(notice.updatedAt)}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Notice Content */}
                                    {settings.showFullContent && notice.content && (
                                        <div className="mt-2 md:mt-3">
                                      <div 
                                            className="text-xs leading-tight opacity-75 line-clamp-2 break-words"
                                        style={{
                                          color: settings.fontColor || '#1e293b',
                                              fontFamily: settings.fontFamily || "'Tiro Bangla', 'Inter', sans-serif",
                                              lineHeight: '1.3',
                                              fontSize: '10px',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'break-word'
                                        }}
                                      >
                                            <div 
                                              dangerouslySetInnerHTML={{ 
                                                __html: notice.content.length > 60 
                                                  ? `${notice.content.substring(0, 60)}...` 
                                                  : notice.content
                                              }} 
                                            />
                                      </div>
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
                                {widgetNotices.length > maxNotices && (
                                  <div className="text-center py-1">
                                    <div 
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium opacity-60"
                                      style={{
                                        backgroundColor: `${borderColor}15`,
                                        color: settings.fontColor || '#1e293b',
                                        fontSize: '10px'
                                      }}
                                    >
                                      +{widgetNotices.length - maxNotices} more notices
                                    </div>
                                  </div>
                                )}
                                </div>
                              )
                            })()}
                            </div>
                          )}

                          {container.type === 'image' && (container.category || container.categoryId || container.noticeIds) && (
                            <div className="h-full flex items-center justify-center" style={{ padding: '0' }}>
                              {(() => {
                                // Determine which notices to display based on category name (primary),
                                // then categoryId, then noticeIds (fallback)
                                let imageNotices: TNotice[] = []

                                if (container.category) {
                                  // Primary: filter by category name and ensure notice has image data
                                  imageNotices = allNotices
                                    .filter((notice: TNotice) => notice.category === container.category)
                                    .filter(notice => notice.imageUrl || notice.imageData || notice.imageFileName)
                                } else if (container.categoryId) {
                                  // Secondary: filter by categoryId if present
                                  imageNotices = getNoticesByCategoryId(container.categoryId)
                                    .filter(notice => notice.imageUrl || notice.imageData || notice.imageFileName)
                                } else if (container.noticeIds) {
                                  // Fallback to noticeIds for backward compatibility
                                  imageNotices = container.noticeIds
                                    .map((noticeId: string) => getNoticeById(noticeId))
                                    .filter((notice: TNotice | undefined) => 
                                      notice !== undefined && (notice.imageUrl || notice.imageData || notice.imageFileName)
                                    ) as TNotice[]
                                }

                                // Get the first image notice
                                const notice = imageNotices[0]
                                if (!notice) return null
                                
                                return (
                                  <motion.div 
                                    key={notice.id} 
                                    className="w-full h-full relative group rounded-lg shadow-md"
                                    style={{
                                      height: '100%',
                                      width: '100%',
                                      margin: '0',
                                      borderRadius: `${settings.imageBorderRadius || 12}px`,
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                                      border: '1px solid rgba(229, 231, 235, 0.8)'
                                    }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                  >
                                    <img
                                      src={reconstructImageUrl(notice)}
                                      alt={notice.title}
                                      className="w-full h-full transition-transform duration-300"
                                      style={{
                                        objectFit: settings.imageFit || 'contain',
                                        borderRadius: `${settings.imageBorderRadius || 12}px`,
                                        width: '100%',
                                        height: '100%'
                                      }}
                                    />
                                    
                                    {/* QR Code - Fixed square, bottom right for image widgets */}
                                    <div className="absolute bottom-3 right-3">
                                      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2">
                                        <NoticeQRCode 
                                          notice={notice}
                                          imageData={notice.imageData}
                                          imageTitle={notice.imageFileName || notice.title}
                                          size={160}
                                          className="w-full h-full responsive-qr-code"
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              })()}
                            </div>
                          )}

                          {container.type === 'pdf' && (container.pdfIds || container.pdfData) && (
                            <div className="h-full w-full flex flex-col" style={{ padding: '0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                                                            {/* Handle PDF widgets with pdfIds (from PDF table) */}
                              {container.pdfIds && container.pdfIds.slice(0, 1).map((pdfId: string) => {
                                const pdf = getPdfById(pdfId)
                                if (!pdf || !pdf.pdfData) return null
                                
                                return (
                                  <motion.div
                                    key={pdfId}
                                    className="relative w-full h-full flex flex-col overflow-hidden"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                      height: '100%',
                                      width: '100%',
                                      margin: '0',
                                      backgroundColor: '#ffffff',
                                      borderRadius: '0',
                                      boxShadow: 'none',
                                      border: 'none'
                                    }}
                                  >
                                    <ClientOnly fallback={
                                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                          <div className="animate-pulse">
                                            <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                                            <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-2">Loading PDF...</p>
                                        </div>
                                      </div>
                                    }>
                                      <LazyPdfWidget
                                      pdfData={pdf.pdfData}
                                      autoScroll={false}
                                      className="h-full w-full"
                                      showTitle={false}
                                        containerId={container.id}
                                    />
                                    </ClientOnly>
                                    
                                     {/* QR Code - Fixed square, bottom right - optimized for scanning */}
                                     <div className="absolute bottom-4 right-4 z-50">
                                       <div 
                                         className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-3"
                                         style={{
                                           minWidth: '160px',
                                           minHeight: '160px',
                                           boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.8)'
                                         }}
                                       >
                                         <NoticeQRCode 
                                           notice={{
                                             id: pdf.id,
                                             title: container.settings?.customCategoryName || pdf.title || 'PDF Document',
                                             pdfData: pdf.pdfData,
                                             pdfFileName: pdf.fileName || pdf.title
                                           }}
                                           size={160}
                                           className="w-full h-full responsive-qr-code"
                                         />
                                       </div>
                                     </div>
                                  </motion.div>
                                )
                              })}
                              
                                                            {/* Handle PDF widgets with pdfData directly in container */}
                              {container.pdfData && typeof container.pdfData === 'string' && !container.pdfIds && (
                                <motion.div
                                  key={`pdf-${container.id}`}
                                  className="relative w-full h-full flex flex-col overflow-hidden"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                  style={{
                                    height: '100%',
                                    width: '100%',
                                    margin: '0',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0',
                                    boxShadow: 'none',
                                    border: 'none'
                                  }}
                                >
                                                                      <ClientOnly fallback={
                                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                          <div className="animate-pulse">
                                            <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                                            <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-2">Loading PDF...</p>
                                        </div>
                                      </div>
                                    }>
                                      <LazyPdfWidget
                                      pdfData={container.pdfData}
                                      autoScroll={false}
                                      className="h-full w-full"
                                      showTitle={false}
                                        containerId={container.id}
                                    />
                                    </ClientOnly>
                                    
                                     {/* QR Code - Bottom Right - Optimized for Easy Scanning */}
                                     <div className="absolute bottom-4 right-4 z-50">
                                       <div 
                                         className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-3"
                                         style={{
                                           width: getResponsiveQRContainerSize(),
                                           height: getResponsiveQRContainerSize(),
                                           minWidth: '80px',
                                           minHeight: '80px',
                                           boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.8)'
                                         }}
                                       >
                                         <NoticeQRCode 
                                           notice={{
                                             id: container.id,
                                             title: container.settings?.customCategoryName || 'PDF Document',
                                             pdfData: container.pdfData,
                                             pdfFileName: container.pdfFileName
                                           }}
                                           size={getResponsiveQRSize()}
                                           className="w-full h-full"
                                         />
                                       </div>
                                     </div>
                                </motion.div>
                              )}
                            </div>
                          )}

                          {(!container.noticeIds || container.noticeIds.length === 0) && (!container.pdfData) && (container.type !== 'image') && (
                            <div className="flex items-center justify-center h-full p-2 sm:p-4 md:p-6">
                              <div className="text-center">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-4 rounded-full flex items-center justify-center opacity-30"
                                  style={{
                                    backgroundColor: `${borderColor}20`,
                                    border: `2px dashed ${borderColor}40`
                                  }}
                                >
                                  <svg className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p 
                                  className="text-xs sm:text-xs md:text-sm font-medium opacity-60"
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
              <div className="text-center text-white px-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4">No Dashboards Available</h2>
                <p className="text-sm sm:text-base md:text-lg opacity-80 mb-1 sm:mb-2">Please create dashboard interfaces first.</p>
                <p className="text-xs sm:text-sm opacity-60">Dashboards will be displayed with the latest created first, then by screen order (1, 2, 3...).</p>
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
        <div className={`w-full ${getResponsivePadding()}`}>
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-white/60 ${getResponsiveSubtitleFontSize()}`}>
            <span>
              Project Superviser: Md. Rashid Al Asif, Assistant Professor, CSE,BU
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Developers: Naeem – <a 
                href="mailto:naeem.cse7.bu@gmail.com" 
                className="hover:text-white/80 transition-colors"
                title="Email Naeem"
              >
                naeem.cse7.bu@gmail.com
              </a>
              {' '}(20CSE008),{' '}
              Ashik – <a 
                href="mailto:ashikghosh.cse7.bu@gmail.com" 
                className=" hover:text-white/80 transition-colors"
                title="Email Ashik"
              >
                ashikghosh.cse7.bu@gmail.com
              </a>
              {' '}(20CSE032)
            </span>
          </div>
        </div>
      </motion.footer>
      
    </div>
  )
}