/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { NoticeBoardLoader } from '@/components/ui/loader'

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
  imageUrl?: string
  imageFileName?: string
  imageData?: string
}

type TImage = {
  id: string
  title: string
  imageUrl: string
}

export default function ViewDashboard() {
  const params = useParams()
  const dashboardId = params.id as string
  
  const [dashboard, setDashboard] = useState<TDashboard | null>(null)
  const [notices, setNotices] = useState<TNotice[]>([])
  const [images, setImages] = useState<TImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    fetchDashboard()
  }, [dashboardId])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard data
      const response = await fetch(`/api/dashboard/get-by-id/${dashboardId}`)
      const data = await response.json()
      
      if (data.success) {
        const foundDashboard = data.result
        if (foundDashboard) {
          setDashboard(foundDashboard)
          
          // Extract notice IDs from containers (both notice and image widgets now use noticeIds)
          const noticeIds: string[] = []
          
          foundDashboard.containers.forEach((container: any) => {
            if (container.noticeIds) {
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
          }
          
          // Clear images array since images are now stored as notices
          setImages([])
        } else {
          toast.error('Dashboard not found')
          setDashboard(null)
        }
      } else {
        toast.error('Failed to fetch dashboard')
        setDashboard(null)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Error loading dashboard')
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }

  const getNoticeById = (noticeId: string) => {
    return notices.find(notice => notice.id === noticeId)
  }

  // const getImageById = (imageId: string) => {
  //   return images.find(image => image.id === imageId)
  // }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <NoticeBoardLoader />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Not Found</h2>
          <p className="text-gray-600 mb-6">The dashboard you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/layouts/all">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Interfaces
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/layouts/all">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Interface</h1>
              <p className="text-gray-600">Aspect Ratio: {dashboard.aspectRatio}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {dashboard.containers.length} Widgets
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {dashboard.aspectRatio}
            </Badge>
            <Link href={`/create-layout?id=${dashboard.id}`}>
              <Button variant="outline" size="sm" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                <Edit className="w-4 h-4 mr-2" />
                Edit Interface
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Display */}
      <div className="bg-white rounded-lg shadow-lg p-6 flex-1">
        <div 
          className="relative mx-auto overflow-hidden bg-white rounded-lg shadow-lg"
          style={{
            aspectRatio: dashboard.aspectRatio,
            maxWidth: '1200px',
            width: '100%',
            minHeight: '500px',
            height: 'auto'
          }}
        >
          {/* Grid Layout for Widgets */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(12, 1fr)', minHeight: '400px' }}>
            {dashboard.containers.map((container, index) => {
              const settings = container.settings || {}
              const bgColor = settings.backgroundColor || '#ffffff'
              const bgOpacity = settings.backgroundOpacity || 0.3
              const borderColor = settings.borderColor || '#e2e8f0'
              const borderWidth = settings.borderWidth || 1
              
              return (
                <div
                  key={container.id}
                  className="relative rounded-lg shadow-md overflow-hidden flex flex-col"
                  style={{
                    gridColumn: `span ${container.w}`,
                    gridRow: `span ${container.h}`,
                    backgroundColor: `${bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                    border: `${borderWidth}px solid ${borderColor}`,
                    position: 'relative',
                    minHeight: '250px'
                  }}
                >
                  {/* Widget Header */}
                  <div 
                    className="px-4 py-2 border-b"
                    style={{
                      backgroundColor: settings.categoryBackgroundColor || '#f8fafc',
                      borderBottomColor: settings.categoryBorderColor || '#e2e8f0',
                      borderBottomWidth: settings.categoryBorderWidth || 0
                    }}
                  >
                    <h3 
                      className="text-lg font-semibold text-center truncate"
                      style={{
                        color: settings.categoryFontColor || '#1e293b',
                        fontFamily: settings.categoryFont || 'Inter',
                        fontSize: `${settings.categoryFontSize || 16}px`,
                        fontWeight: settings.categoryFontWeight || 'semibold'
                      }}
                    >
                      {container.title || `Widget ${index + 1}`}
                    </h3>
                  </div>

                  {/* Widget Content */}
                  <div 
                    className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                    style={{ 
                      minHeight: '200px', 
                      maxHeight: '400px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f3f4f6'
                    }}
                  >
                    {container.type === 'notice' && container.noticeIds && (
                      <div className="space-y-2 flex-1">
                        {container.noticeIds.map((noticeId: string) => {
                          const notice = getNoticeById(noticeId)
                          if (!notice) return null
                          
                          return (
                            <div
                              key={noticeId}
                              className="p-3 rounded shadow-sm"
                              style={{
                                backgroundColor: `${bgColor}${Math.round((settings.cardOpacity || 0.9) * 255).toString(16).padStart(2, '0')}`,
                                borderLeft: `3px solid ${borderColor}`
                              }}
                            >
                              <p 
                                className="text-sm font-medium"
                                style={{
                                  color: settings.fontColor || '#1e293b',
                                  fontSize: `${settings.fontSize || 14}px`,
                                  fontWeight: settings.fontWeight || 'normal',
                                  fontFamily: settings.fontFamily || 'Inter'
                                }}
                              >
                                {notice.title}
                              </p>
                              {settings.showFullContent && notice.content && (
                                <div 
                                  className="text-xs mt-1 opacity-70"
                                  style={{
                                    color: settings.fontColor || '#1e293b',
                                    fontFamily: settings.fontFamily || 'Inter'
                                  }}
                                >
                                  <div 
                                    dangerouslySetInnerHTML={{ __html: notice.content }}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {container.type === 'image' && container.noticeIds && (
                      <div className="h-full flex items-center justify-center">
                        {container.noticeIds.slice(0, 1).map((noticeId: string) => {
                          const notice = getNoticeById(noticeId)
                          if (!notice || !notice.imageUrl) return null
                          
                          return (
                            <div key={noticeId} className="w-full h-full relative">
                              <img
                                src={reconstructImageUrl(notice)}
                                alt={notice.title}
                                className="w-full h-full rounded"
                                style={{
                                  objectFit: settings.imageFit || 'contain',
                                  borderRadius: `${settings.imageBorderRadius || 8}px`
                                }}
                              />
                              {settings.showImageTitle && (
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent rounded-b">
                                  <p
                                    className="text-sm font-semibold text-white truncate"
                                    style={{
                                      color: settings.imageTitleColor || '#ffffff',
                                      fontSize: `${settings.imageTitleFontSize || 14}px`,
                                      fontWeight: settings.imageTitleFontWeight || 'medium',
                                      fontFamily: settings.fontFamily || 'Inter'
                                    }}
                                  >
                                    {notice.title}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {(!container.noticeIds || container.noticeIds.length === 0) && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-center">
                          No content available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{dashboard.containers.length}</p>
            <p className="text-sm text-gray-600">Total widgets in this interface</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{notices.length}</p>
            <p className="text-sm text-gray-600">Notices displayed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{images.length}</p>
            <p className="text-sm text-gray-600">Images displayed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 