/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Users, 
  FileText, 
  Image, 
  Layout, 
  Activity, 
  Plus,
  Eye,
  Shield,
  Crown,
  X
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLoader } from '@/components/ui/loader'

type TDashboardStats = {
  totalNotices: number
  totalCategories: number
  totalImages: number
  totalPDFs: number
  totalNoticeInterfaces: number
  recentNotices: Array<{
    id: string
    title: string
    content: string
    category: string
    createdAt: Date
  }>
  recentImages: Array<{
    id: string
    title: string
    imageFileName?: string
    imageData?: string
    createdAt: Date
  }>
  recentPDFs: Array<{
    id: string
    title: string
    pdfFileName?: string
    createdAt: Date
  }>
  recentNoticeInterfaces: Array<{
    id: string
    aspectRatio: string
    createdAt: Date
  }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [fetchedAllowedRoutes, setFetchedAllowedRoutes] = useState<string[] | null>(null)
  const router = useRouter()
  const [stats, setStats] = useState<TDashboardStats>({
    totalNotices: 0,
    totalCategories: 0,
    totalImages: 0,
    totalPDFs: 0,
    totalNoticeInterfaces: 0,
    recentNotices: [],
    recentImages: [],
    recentPDFs: [],
    recentNoticeInterfaces: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedPDF, setSelectedPDF] = useState<any>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)

  // Load fresh permissions for moderators so UI reflects latest checks
  useEffect(() => {
    const loadPerms = async () => {
      if (session?.user?.role !== 'MODERATOR') return
      const moderatorId = (session?.user as any)?.id as string | undefined
      if (!moderatorId) return
      try {
        const res = await fetch(`/api/admin/permissions/${moderatorId}`)
        if (res.ok) {
          const json = await res.json()
          const routes: string[] = Array.isArray(json.allowedRoutes) ? json.allowedRoutes : []
          // Ensure home and dashboard are present by default
          setFetchedAllowedRoutes(Array.from(new Set<string>(['/', '/dashboard', ...routes])))
        }
      } catch {}
    }
    loadPerms()
  }, [session?.user?.id, session?.user?.role])

  useEffect(() => {
    fetchDashboardStats()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [session, router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch notices from Notice table
      const noticesResponse = await fetch('/api/notice/get-all')
      const noticesData = await noticesResponse.json()
      
      // Fetch categories from Category table
      const categoriesResponse = await fetch('/api/category/get-all')
      const categoriesData = await categoriesResponse.json()
      
      // Fetch dashboards from Dashboard table
      const dashboardsResponse = await fetch('/api/dashboard/get-all')
      const dashboardsData = await dashboardsResponse.json()

      // Filter notices that have imageData for recent images
      const noticesWithImages = noticesData.success 
        ? noticesData.result.filter((notice: any) => notice.imageData) 
        : []

      // Filter notices that have pdfData for recent PDFs
      const noticesWithPDFs = noticesData.success 
        ? noticesData.result.filter((notice: any) => notice.pdfData) 
        : []

      setStats({
        totalNotices: noticesData.success ? noticesData.result?.length || 0 : 0,
        totalCategories: categoriesData.success ? categoriesData.result?.length || 0 : 0,
        totalImages: noticesWithImages.length,
        totalPDFs: noticesWithPDFs.length,
        totalNoticeInterfaces: dashboardsData.success ? dashboardsData.result?.length || 0 : 0,
        recentNotices: noticesData.success ? noticesData.result?.slice(0, 5) || [] : [],
        recentImages: noticesWithImages.slice(0, 3),
        recentPDFs: noticesWithPDFs.slice(0, 3),
        recentNoticeInterfaces: dashboardsData.success ? dashboardsData.result?.slice(0, 3) || [] : []
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determine allowed routes (fresh fetch preferred, fallback to session token)
  const allowedRoutes: string[] = (session?.user?.role === 'MODERATOR')
    ? (fetchedAllowedRoutes ?? ((session?.user as any)?.allowedRoutes || ['/']))
    : []

  const isAllowed = (href: string) => {
    if (session?.user?.role !== 'MODERATOR') return true
    
    // Dashboard route is always allowed for moderators
    if (href === '/dashboard') {
      return true
    }
    
    // Home visibility depends only on explicit '/'
    if (href === '/') {
      return allowedRoutes.includes('/')
    }
    
    // For other routes, check if the href starts with any allowed route
    const enforceable = allowedRoutes.filter(r => r && r !== '/' && r !== '/dashboard')
    return enforceable.some(route => href.startsWith(route))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (date: Date) => {
    if (typeof window === 'undefined') return 'Loading...';
    
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return `${Math.floor(diffInDays / 7)} weeks ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DashboardLoader />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 absolute -top-1 -right-1" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
              Welcome back, {session?.user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">
              {session?.user?.role === 'USER' 
                ? 'Here are the latest notices and updates from your Digital Notice Board'
                : session?.user?.role === 'MODERATOR'
                ? 'Here\'s what\'s happening with your Digital Notice Board (Limited Access)'
                : 'Here\'s what\'s happening with your Digital Notice Board'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {session?.user?.role === 'USER' ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                View Only
              </>
            ) : session?.user?.role === 'MODERATOR' ? (
              <>
                <Shield className="w-3 h-3 mr-1" />
                Moderator
              </>
            ) : (
              <>
                <Crown className="w-3 h-3 mr-1" />
                Admin Access
              </>
            )}
          </Badge>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
      >
        {isAllowed('/notices/all') && (
          <Link href="/notices/all">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-blue-800">{stats.totalNotices}</div>
                    <div className="text-xs sm:text-sm text-blue-600">Total Notices</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {session?.user?.role !== 'USER' && isAllowed('/category') && (
          <Link href="/category">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-green-800">{stats.totalCategories}</div>
                    <div className="text-xs sm:text-sm text-green-600">Categories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isAllowed('/notices/images') && (
          <Link href="/notices/images">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                    <Image className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-purple-800">{stats.totalImages}</div>
                    <div className="text-xs sm:text-sm text-purple-600">Images</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isAllowed('/notices/pdfs') && (
          <Link href="/notices/pdfs">
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-red-800">{stats.totalPDFs}</div>
                    <div className="text-xs sm:text-sm text-red-600">PDFs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {session?.user?.role !== 'USER' && isAllowed('/layouts/all') && (
          <Link href="/layouts/all">
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0">
                    <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl sm:text-2xl font-bold text-orange-800">{stats.totalNoticeInterfaces}</div>
                    <div className="text-xs sm:text-sm text-orange-600">Notice Interfaces</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </motion.div>

      {/* Quick Actions for Admin and Moderator */}
      {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          {(session?.user?.role !== 'MODERATOR' || isAllowed('/create/notice')) && (
            <Link href="/create/notice">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Create Notice</h3>
                  <p className="text-xs text-gray-500 mt-1">Add new notice content</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {(session?.user?.role !== 'MODERATOR' || isAllowed('/create-layout')) && (
            <Link href="/create-layout">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-green-200 transition-colors">
                    <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Create New Dashboard</h3>
                  <p className="text-xs text-gray-500 mt-1">Create or customize a dashboard interface</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {(session?.user?.role !== 'MODERATOR' || isAllowed('/notices/all')) && (
            <Link href="/notices/all">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-purple-200 transition-colors">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">View Notices</h3>
                  <p className="text-xs text-gray-500 mt-1">Browse all notices</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {(session?.user?.role !== 'MODERATOR' || (isAllowed('/dashboard/admin/make-user') || isAllowed('/dashboard/admin/showAllUsers'))) && (
            <Link href={
              session?.user?.role === 'ADMIN' 
                ? "/dashboard/admin/make-moderator" 
                : session?.user?.role === 'MODERATOR'
                ? "/dashboard/admin/make-user"
                : "/admin/make"
            }>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-orange-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-orange-200 transition-colors">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">
                    {session?.user?.role === 'ADMIN' 
                      ? 'Manage Moderators' 
                      : session?.user?.role === 'MODERATOR'
                      ? 'Manage Users'
                      : 'Manage Admins'
                    }
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">User management</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {session?.user?.role === 'ADMIN' && (
            <Link href="/dashboard/admin/set-permission">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Set Moderator Permissions</h3>
                  <p className="text-xs text-gray-500 mt-1">Control page access for moderators</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </motion.div>
      )}

      {/* Quick Actions for USER Role */}
      {session?.user?.role === 'USER' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
        >
          <Link href="/notices/all">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 group">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-800">View Notices</h3>
                <p className="text-xs text-gray-500 mt-1">Browse all notices with content</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notices/images">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-300 group">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-purple-200 transition-colors">
                  <Image className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-800">View Images</h3>
                <p className="text-xs text-gray-500 mt-1">Browse all image notices</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notices/pdfs">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-red-300 group">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="p-2 sm:p-3 bg-red-100 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-red-200 transition-colors">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-800">View PDFs</h3>
                <p className="text-xs text-gray-500 mt-1">Browse all PDF notices</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Notices */}
        {isAllowed('/notices/all') && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Recent Notices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {stats.recentNotices.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">
                      {session?.user?.role === 'USER' ? 'No notices available yet' : 'No notices yet'}
                    </p>
                    {(session?.user?.role === 'ADMIN' || (session?.user?.role === 'MODERATOR' && isAllowed('/create/notice'))) && (
                      <Link href="/create/notice">
                        <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Create First Notice
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {stats.recentNotices.map((notice) => {
                      // Truncate content to 6 words to prevent overflow
                      const words = notice.content?.split(' ') || [];
                      let truncatedContent = words.length > 6 
                        ? words.slice(0, 6).join(' ') + '...'
                        : notice.content || '';
                      
                      // Additional character-based truncation as fallback
                      if (truncatedContent.length > 80) {
                        truncatedContent = truncatedContent.substring(0, 77) + '...';
                      }
                      
                      return (
                        <div key={notice.id} className="flex items-start justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate mb-1">{notice.title}</h4>
                            {session?.user?.role === 'USER' && notice.content && (
                              <div className="text-xs sm:text-sm text-gray-600 text-truncate-1 leading-tight mb-2">
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: notice.content.length > 100 
                                      ? notice.content.substring(0, 100) + '...' 
                                      : notice.content
                                  }} 
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{notice.category}</Badge>
                              <span>{getTimeAgo(notice.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-center pt-2">
                      <Link href="/notices/all">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          View All Notices
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Images */}
        {isAllowed('/notices/images') && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Image className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  Recent Images
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {stats.recentImages.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Image className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">
                      {session?.user?.role === 'USER' ? 'No images available yet' : 'No images uploaded yet'}
                    </p>
                    {(session?.user?.role === 'ADMIN' || (session?.user?.role === 'MODERATOR' && isAllowed('/create-layout'))) && (
                      <Link href="/create-layout">
                        <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Add Images
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {stats.recentImages.map((image) => (
                      <div key={image.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => {
                              setSelectedImage(image)
                              setShowImageModal(true)
                            }}
                          >
                            <img 
                              src={`data:image/jpeg;base64,${image.imageData}`}
                              alt={image.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{image.imageFileName || image.title}</h4>
                            <p className="text-xs text-gray-500">{formatDate(image.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Link href="/notices/images">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          View All Images
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent PDFs */}
        {isAllowed('/notices/pdfs') && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  Recent PDFs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {stats.recentPDFs.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">
                      {session?.user?.role === 'USER' ? 'No PDFs available yet' : 'No PDFs uploaded yet'}
                    </p>
                    {(session?.user?.role === 'ADMIN' || (session?.user?.role === 'MODERATOR' && isAllowed('/create/notice'))) && (
                      <Link href="/create/notice">
                        <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Add PDFs
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {stats.recentPDFs.map((pdf) => (
                      <div key={pdf.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div 
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => {
                              setSelectedPDF(pdf)
                              setShowPDFModal(true)
                            }}
                          >
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{pdf.pdfFileName || pdf.title}</h4>
                            <p className="text-xs text-gray-500">{formatDate(pdf.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Link href="/notices/pdfs">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          View All PDFs
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* System Status - Only for Admin and Moderator Users */}
      {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR') && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base text-green-800">System Online</div>
                    <div className="text-xs text-green-600">All services operational</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base text-blue-800">Database Connected</div>
                    <div className="text-xs text-blue-600">PostgreSQL active</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm sm:text-base text-purple-800">Authentication</div>
                    <div className="text-xs text-purple-600">NextAuth.js ready</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-lg overflow-hidden m-2 sm:m-4">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageModal(false)}
                className="bg-white/90 hover:bg-white text-gray-700 h-8 w-8 sm:h-10 sm:w-10 p-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{selectedImage.title}</h3>
              <div className="overflow-auto max-h-[calc(95vh-80px)] sm:max-h-[70vh]">
                <img
                  src={`data:image/jpeg;base64,${selectedImage.imageData}`}
                  alt={selectedImage.title}
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPDFModal && selectedPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-1 sm:p-2">
          <div 
            className="relative bg-white rounded-lg overflow-hidden shadow-2xl"
            style={{ width: '98vw', height: '98vh' }}
          >
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPDFModal(false)}
                className="bg-white/90 hover:bg-white text-gray-700 h-8 w-8 sm:h-10 sm:w-10 p-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <div className="p-2 sm:p-3 h-full flex flex-col">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 break-words pr-8 sm:pr-10">{selectedPDF.title}</h3>
              <div className="flex-1 overflow-auto">
                <embed
                  src={`data:application/pdf;base64,${selectedPDF.pdfData}`}
                  type="application/pdf"
                  className="w-full h-full rounded-lg min-h-[400px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
