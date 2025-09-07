"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { SpinningBellLoader } from "@/components/ui/loader"

interface TempDashboardViewerProps {
  dashboardId?: string
}

interface TempDashboardScreen {
  id: string
  aspectRatio: string
  containers: any[]
  screenName?: string
  screenIndex?: number
  totalScreens?: number
  createdAt?: string
}

export default function TempDashboardViewer({ dashboardId }: TempDashboardViewerProps) {
  const [tempScreens, setTempScreens] = useState<TempDashboardScreen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)

  // Fetch temp dashboard data
  const fetchTempDashboard = async () => {
    if (!dashboardId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/temp-dashboard/get-screens/${dashboardId}`)
      const data = await response.json()
      
      if (data.success && data.result && data.result.length > 0) {
        setTempScreens(data.result)
        console.log("TempDashboard data updated:", data.result)
      }
    } catch (error) {
      console.error("Error fetching temp dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for updates every 2 seconds
  useEffect(() => {
    if (!dashboardId) return

    // Initial fetch
    fetchTempDashboard()

    // Set up polling
    const interval = setInterval(fetchTempDashboard, 2000)

    return () => clearInterval(interval)
  }, [dashboardId])

  // Auto-rotate screens every 10 seconds
  useEffect(() => {
    if (tempScreens.length <= 1) return

    const interval = setInterval(() => {
      setCurrentScreenIndex((prev) => (prev + 1) % tempScreens.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [tempScreens.length])

  if (!dashboardId) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No dashboard ID provided</p>
      </div>
    )
  }

  if (isLoading && tempScreens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <SpinningBellLoader />
          <p className="mt-2 text-gray-500">Loading temp dashboard...</p>
        </div>
      </div>
    )
  }

  if (tempScreens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No temp dashboard data available</p>
      </div>
    )
  }

  const currentScreen = tempScreens[currentScreenIndex]

  return (
    <div className="w-full">
      {/* Screen Navigation */}
      {tempScreens.length > 1 && (
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {tempScreens.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreenIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentScreenIndex
                    ? "bg-blue-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                title={`Screen ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screen Display */}
      <div className="relative bg-white border rounded-lg overflow-hidden">
        {/* Screen Header */}
        <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
          <div>
            <span className="font-semibold">
              {currentScreen.screenName || `Screen ${currentScreen.screenIndex + 1}`}
            </span>
            <span className="text-gray-300 ml-2">
              ({currentScreenIndex + 1} of {tempScreens.length})
            </span>
          </div>
          <div className="text-sm text-gray-300">
            {currentScreen.aspectRatio} • Auto-refresh
          </div>
        </div>

        {/* Screen Content */}
        <div 
          className="relative"
          style={{
            aspectRatio: currentScreen.aspectRatio,
            maxHeight: "70vh"
          }}
        >
          {/* Render containers/widgets */}
          {currentScreen.containers && currentScreen.containers.length > 0 ? (
            currentScreen.containers.map((container: any, index: number) => (
              <div
                key={container.id || index}
                className="absolute border border-gray-300 bg-white rounded shadow-sm"
                style={{
                  left: container.leftPercent || `${container.leftPx}`,
                  top: container.topPercent || `${container.topPx}`,
                  width: container.width,
                  height: container.height,
                  backgroundColor: container.settings?.backgroundColor || "#ffffff",
                  opacity: container.settings?.backgroundOpacity || 1,
                  borderColor: container.settings?.borderColor || "#e2e8f0",
                  borderWidth: `${container.settings?.borderWidth || 1}px`,
                }}
              >
                {/* Widget Header */}
                <div 
                  className="px-2 py-1 text-xs font-medium border-b"
                  style={{
                    backgroundColor: container.settings?.categoryBackgroundColor || "#f9fafb",
                    color: container.settings?.categoryFontColor || "#374151",
                    borderColor: container.settings?.categoryBorderColor || "#d1d5db",
                    borderWidth: `${container.settings?.categoryBorderWidth || 1}px`,
                  }}
                >
                  {container.title || `Widget ${index + 1}`}
                </div>

                {/* Widget Content */}
                <div className="p-2 text-xs">
                  {container.type === "image" ? (
                    <div className="text-center text-gray-500">
                      📷 Image Display
                      {container.noticeIds && container.noticeIds.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {container.noticeIds.length} image{container.noticeIds.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      {container.noticeIds && container.noticeIds.length > 0 ? (
                        <div>
                          <div className="font-medium text-gray-700">
                            {container.category || "Notice Widget"}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {container.noticeIds.length} notice{container.noticeIds.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          No notices assigned
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No widgets configured
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
          <div className="flex justify-between items-center">
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <span>
              {tempScreens.length} screen{tempScreens.length > 1 ? 's' : ''} • 
              {currentScreen.containers?.length || 0} widget{(currentScreen.containers?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
