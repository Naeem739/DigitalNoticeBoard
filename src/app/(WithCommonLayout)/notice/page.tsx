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
      className="min-h-screen flex flex-col"
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
        <div className="max-w-6xl mx-auto px-3 py-2">
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
                  className="text-xl font-bold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {settings?.title || "Smart Notice Board"}
                </motion.h1>
                <motion.p 
                  className="text-sm text-gray-300"
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
                className="flex items-center space-x-4 text-white"
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
                className="text-xl font-bold font-mono"
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
            className="mt-2 pt-2 border-t border-white/20 flex items-center justify-center space-x-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Auto-refresh indicator */}
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2 text-white">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="text-xs font-medium">Auto-refreshing every 30 minutes</span>
            </div>

            {/* Auto-pagination toggle */}
            {dashboards.length > 1 && (
              <button
                onClick={toggleAutoPagination}
                className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2 text-white hover:bg-white/20 transition-all"
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
              <div className="flex items-center space-x-3">
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
                
                <div className="text-white text-xs font-medium">
                  Page {currentDashboardIndex + 1} of {dashboards.length}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Content */}
          {dashboardLoading ? (
            <motion.div 
              className="flex items-center justify-center min-h-[400px]"
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
              className="rounded-lg shadow-lg p-6 mx-4 sm:mx-6 lg:mx-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div 
                className="relative mx-auto overflow-hidden rounded-lg shadow-lg"
                style={{
                  aspectRatio: currentDashboard.aspectRatio,
                  width: '100vw',
                  minHeight: '500px',
                  height: 'auto',
                  marginLeft: 'calc(-50vw + 50%)',
                  marginRight: 'calc(-50vw + 50%)'
                }}
              >
                {/* Grid Layout for Widgets */}
                <div className="grid gap-4 px-4 sm:px-6 lg:px-8" style={{ gridTemplateColumns: 'repeat(12, 1fr)', minHeight: '400px' }}>
                  {currentDashboard.containers.map((container, index) => {
                    const settings = container.settings || {}
                    const bgColor = settings.backgroundColor || '#ffffff'
                    const bgOpacity = settings.backgroundOpacity || 0.3
                    const borderColor = settings.borderColor || '#e2e8f0'
                    const borderWidth = settings.borderWidth || 1
                    
                    return (
                      <motion.div
                        key={container.id}
                        className="relative rounded-xl shadow-lg overflow-hidden flex flex-col backdrop-blur-sm"
                        style={{
                          gridColumn: `span ${container.w}`,
                          gridRow: `span ${container.h}`,
                          backgroundColor: `${bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                          border: `${borderWidth}px solid ${borderColor}`,
                          position: 'relative',
                          minHeight: '250px',
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
                          className="px-4 py-3 border-b relative overflow-hidden"
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
                              className="text-lg font-bold text-center truncate px-2 py-1 rounded-lg"
                            style={{
                              color: settings.categoryFontColor || '#1e293b',
                              fontFamily: settings.categoryFont || 'Inter',
                              fontSize: `${settings.categoryFontSize || 16}px`,
                                fontWeight: settings.categoryFontWeight || 'bold',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                backgroundColor: `${settings.categoryBackgroundColor || '#f8fafc'}80`
                            }}
                          >
                            {container.title || `Widget ${index + 1}`}
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
                          className="p-4 flex-1 flex flex-col justify-center" 
                          style={{ 
                            minHeight: '200px', 
                            height: '100%'
                          }}
                        >
                          {container.type === 'notice' && container.noticeIds && (
                            <div className="h-full flex flex-col justify-between gap-2">
                              {container.noticeIds.slice(0, 5).map((noticeId: string, noticeIndex: number) => {
                                const notice = getNoticeById(noticeId)
                                if (!notice) return null
                                
                                return (
                                  <motion.div
                                    key={noticeId}
                                    className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex-1"
                                    style={{
                                      backgroundColor: `${bgColor}${Math.round((settings.cardOpacity || 0.95) * 255).toString(16).padStart(2, '0')}`,
                                      borderLeft: `3px solid ${borderColor}`,
                                      backdropFilter: 'blur(10px)',
                                      border: `1px solid ${borderColor}20`,
                                      minHeight: '140px',
                                      maxHeight: '180px',
                                      minWidth: '400px',
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
                                    {/* QR Code - Extended Position */}
                                    <div className="absolute top-0 right-0 bottom-0 w-1/3 z-10">
                                      <NoticeQRCode 
                                        notice={notice}
                                        imageData={notice.imageData}
                                        imageTitle={notice.imageFileName || notice.title}
                                        size={120}
                                        className="opacity-80 hover:opacity-100 transition-opacity w-full h-full flex items-center justify-center"
                                      />
                                    </div>
                                    {/* Notice Header */}
                                    <div className="p-4 pb-2 pr-2/3">
                                      {/* Notice Title */}
                                                                              <h4 
                                          className="text-sm font-semibold leading-tight mb-2"
                                      style={{
                                        color: settings.fontColor || '#1e293b',
                                        fontSize: `${settings.fontSize || 14}px`,
                                            fontWeight: settings.fontWeight || 'semibold',
                                            fontFamily: settings.fontFamily || 'Inter',
                                            lineHeight: '1.3'
                                      }}
                                    >
                                      {notice.title}
                                      </h4>
                                      
                                      {/* Category and Date Row */}
                                      <div className="flex items-center gap-2">
                                                                                    {/* Category Badge */}
                                            {notice.categoryName && (
                                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                  backgroundColor: `${borderColor}20`,
                                                  color: settings.fontColor || '#1e293b',
                                                  fontSize: '11px'
                                                }}
                                              >
                                            {notice.categoryName}
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
                                                fontSize: '11px'
                                              }}
                                            >
                                              {formatNoticeDate(notice.createdAt)}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Notice Content */}
                                    {settings.showFullContent && notice.content && (
                                        <div className="mt-3">
                                      <p 
                                            className="text-xs leading-tight opacity-75 line-clamp-2"
                                        style={{
                                          color: settings.fontColor || '#1e293b',
                                              fontFamily: settings.fontFamily || 'Inter',
                                              lineHeight: '1.3',
                                              fontSize: '12px'
                                        }}
                                      >
                                            {notice.content.length > 80 
                                              ? `${notice.content.substring(0, 80)}...` 
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
                          )}

                          {container.type === 'image' && container.imageIds && (
                            <div className="h-full flex items-center justify-center p-4">
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
                                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-lg">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                        <p
                                          className="text-sm font-semibold text-white truncate"
                                          style={{
                                            color: settings.imageTitleColor || '#ffffff',
                                            fontSize: `${settings.imageTitleFontSize || 14}px`,
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
                            <div className="flex items-center justify-center h-full p-6">
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center opacity-30"
                                  style={{
                                    backgroundColor: `${borderColor}20`,
                                    border: `2px dashed ${borderColor}40`
                                  }}
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p 
                                  className="text-sm font-medium opacity-60"
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
              className="flex items-center justify-center min-h-[400px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">No Dashboards Available</h2>
                <p className="text-lg opacity-80">Please create dashboard interfaces first.</p>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                © {new Date().getFullYear()} {settings?.title || "Smart Notice Board"}
              </span>
              <span className="text-white/60">•</span>
              <span className="text-sm text-white/80">
                {settings?.departmentName || "Information Technology Department"}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-white/80">
              <span>Last updated: {new Date().toLocaleString()}</span>
              <span className="text-white/60">•</span>
              <span>Auto-refresh enabled</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
