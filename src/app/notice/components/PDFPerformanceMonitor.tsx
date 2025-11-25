"use client"

import { useEffect, useState } from 'react'
import { pdfCache } from '@/utils/pdfCache'

interface PerformanceStats {
  cacheHits: number
  cacheMisses: number
  totalLoads: number
  averageLoadTime: number
  cacheUtilization: number
  memoryUsage: number
}

export default function PDFPerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    cacheHits: 0,
    cacheMisses: 0,
    totalLoads: 0,
    averageLoadTime: 0,
    cacheUtilization: 0,
    memoryUsage: 0
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = pdfCache.getStats()
      setStats(prev => ({
        ...prev,
        cacheUtilization: cacheStats.utilization,
        memoryUsage: cacheStats.size
      }))
    }

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    updateStats() // Initial update

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
      >
        PDF Perf
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">PDF Performance</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Cache Utilization:</span>
              <span className="font-medium">{stats.cacheUtilization.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory Usage:</span>
              <span className="font-medium">{(stats.memoryUsage / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Loads:</span>
              <span className="font-medium">{stats.totalLoads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cache Hits:</span>
              <span className="font-medium text-green-600">{stats.cacheHits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cache Misses:</span>
              <span className="font-medium text-red-600">{stats.cacheMisses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Load Time:</span>
              <span className="font-medium">{stats.averageLoadTime.toFixed(0)}ms</span>
            </div>
          </div>
          <button
            onClick={() => {
              pdfCache.clear()
              setStats(prev => ({ ...prev, totalLoads: 0, cacheHits: 0, cacheMisses: 0 }))
            }}
            className="mt-3 w-full bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  )
}
