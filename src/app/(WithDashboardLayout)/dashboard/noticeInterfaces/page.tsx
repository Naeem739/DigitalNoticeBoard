'use client'

import { useEffect, useState } from 'react'
import { getAllDashboards, deleteDashboard } from '@/app/actions/dashboard.action'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Layout, Eye, Calendar, BarChart3, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { BellLoader } from '@/components/ui/loader'

type TDashboard = {
  id: string
  aspectRatio: string
  containers: any[]
  createdAt?: Date
}

export default function NoticeInterfaces() {
  const [dashboards, setDashboards] = useState<TDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboards()
  }, [])

  const fetchDashboards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/get-all')
      const data = await response.json()
      
      if (data.success) {
        setDashboards(data.result || [])
      } else {
        toast.error('Failed to fetch dashboard interfaces')
      }
    } catch (error) {
      console.error('Error fetching dashboard interfaces:', error)
      toast.error('Error fetching dashboard interfaces')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard interface? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(dashboardId)
      const result = await deleteDashboard(dashboardId)
      
      if (result.success) {
        setDashboards(prev => prev.filter(dashboard => dashboard.id !== dashboardId))
        toast.success('Dashboard interface deleted successfully')
      } else {
        toast.error('Failed to delete dashboard interface')
      }
    } catch (error) {
      console.error('Error deleting dashboard interface:', error)
      toast.error('Error deleting dashboard interface')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getContainerCount = (containers: any[]) => {
    if (!containers || !Array.isArray(containers)) return 0
    return containers.length
  }

  const getWidgetTypes = (containers: any[]) => {
    if (!containers || !Array.isArray(containers)) return { notices: 0, images: 0 }
    
    const types = {
      notices: 0,
      images: 0
    }
    
    containers.forEach(container => {
      if (container.type === 'image') {
        types.images++
      } else if (container.type === 'notice') {
        types.notices++
      }
    })
    
    return types
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BellLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notice Interfaces</h1>
          <p className="text-gray-600 mt-2">Manage all dashboard interfaces</p>
        </div>
        <div className="flex items-center gap-2">
          <Layout className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-semibold">{dashboards.length} Interfaces</span>
        </div>
      </div>

      {dashboards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layout className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Dashboard Interfaces Found</h3>
            <p className="text-gray-500 text-center">
              No dashboard interfaces have been created yet. They will appear here once they are saved from the dashboard editor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => {
            const containerCount = getContainerCount(dashboard.containers)
            const widgetTypes = getWidgetTypes(dashboard.containers)
            
            return (
              <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Dashboard Interface</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.open(`/dashboard/view-dashboard/${dashboard.id}`, '_blank')
                          }
                        }}
                        className="h-8 w-8 p-0"
                        title="View Interface"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.open(`/dashboard/layout/edit-dashboard?id=${dashboard.id}`, '_blank')
                          }
                        }}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit Interface"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                        disabled={deletingId === dashboard.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        {deletingId === dashboard.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-blue-800">{containerCount}</div>
                      <div className="text-xs text-blue-600">Widgets</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Layout className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-green-800">{dashboard.aspectRatio}</div>
                      <div className="text-xs text-green-600">Aspect Ratio</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Notice Widgets:</span>
                      <span className="font-semibold">{widgetTypes.notices}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Image Widgets:</span>
                      <span className="font-semibold">{widgetTypes.images}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Created: {formatDate(dashboard.createdAt)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {dashboard.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 