"use client"

import { useState, useEffect } from 'react'
import { localStorageUtils } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TestStoragePage() {
  const [usage, setUsage] = useState<{ used: number; available: number; total: number } | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const usageInfo = localStorageUtils.getUsageInfo()
      setUsage(usageInfo)
    }
  }, [])

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSmallData = () => {
    addLog('Testing small data storage...')
    const smallData = { test: 'small', timestamp: Date.now() }
    const success = localStorageUtils.setItem('test-small', smallData)
    addLog(success ? '✅ Small data stored successfully' : '❌ Failed to store small data')
    updateUsage()
  }

  const testLargeData = () => {
    addLog('Testing large data storage...')
    // Create a large object (simulating large dashboard state)
    const largeData = {
      widgets: Array.from({ length: 10 }, (_, i) => ({
        id: `widget-${i}`,
        type: 'notice',
        images: Array.from({ length: 5 }, (_, j) => ({
          id: `img-${i}-${j}`,
          title: `Image ${i}-${j}`,
          url: 'data:image/jpeg;base64,' + 'A'.repeat(100000), // Large base64 string
          file: null,
          dbId: `db-${i}-${j}`
        }))
      })),
      layout: Array.from({ length: 10 }, (_, i) => ({
        i: `widget-${i}`,
        x: i % 3,
        y: Math.floor(i / 3),
        w: 2,
        h: 2
      })),
      selectedRatio: '16:9',
      widgetSettings: {}
    }
    
    const success = localStorageUtils.setItem('test-large', largeData)
    addLog(success ? '✅ Large data stored successfully' : '❌ Failed to store large data (expected)')
    updateUsage()
  }

  const testLightweightData = () => {
    addLog('Testing lightweight data storage...')
    // Create lightweight version (like our fix)
    const lightweightData = {
      widgets: Array.from({ length: 10 }, (_, i) => ({
        id: `widget-${i}`,
        type: 'notice',
        images: Array.from({ length: 5 }, (_, j) => ({
          id: `img-${i}-${j}`,
          title: `Image ${i}-${j}`,
          dbId: `db-${i}-${j}`
          // No url or file properties
        }))
      })),
      layout: Array.from({ length: 10 }, (_, i) => ({
        i: `widget-${i}`,
        x: i % 3,
        y: Math.floor(i / 3),
        w: 2,
        h: 2
      })),
      selectedRatio: '16:9',
      widgetSettings: {}
    }
    
    const success = localStorageUtils.setItem('test-lightweight', lightweightData)
    addLog(success ? '✅ Lightweight data stored successfully' : '❌ Failed to store lightweight data')
    updateUsage()
  }

  const clearTestData = () => {
    addLog('Clearing test data...')
    localStorageUtils.removeItem('test-small')
    localStorageUtils.removeItem('test-large')
    localStorageUtils.removeItem('test-lightweight')
    addLog('✅ Test data cleared')
    updateUsage()
  }

  const updateUsage = () => {
    const usageInfo = localStorageUtils.getUsageInfo()
    setUsage(usageInfo)
  }

  const clearAllStorage = () => {
    addLog('Clearing all localStorage...')
    if (typeof window !== 'undefined') {
      localStorage.clear()
      addLog('✅ All localStorage cleared')
      updateUsage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">LocalStorage Test Page</h1>
        
        {/* Usage Display */}
        {usage && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Current Storage Usage</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {((usage.used / 1024 / 1024)).toFixed(2)}MB
                </div>
                <div className="text-sm text-gray-600">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((usage.available / 1024 / 1024)).toFixed(2)}MB
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {((usage.total / 1024 / 1024)).toFixed(2)}MB
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    usage.used / usage.total > 0.8 
                      ? 'bg-red-500' 
                      : usage.used / usage.total > 0.6 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(usage.used / usage.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {((usage.used / usage.total) * 100).toFixed(1)}% used
              </div>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Test Functions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={testSmallData} variant="outline">
              Test Small Data
            </Button>
            <Button onClick={testLargeData} variant="outline">
              Test Large Data
            </Button>
            <Button onClick={testLightweightData} variant="outline">
              Test Lightweight Data
            </Button>
            <Button onClick={clearTestData} variant="outline">
              Clear Test Data
            </Button>
            <Button onClick={clearAllStorage} variant="destructive">
              Clear All Storage
            </Button>
            <Button onClick={updateUsage} variant="outline">
              Refresh Usage
            </Button>
          </div>
        </div>

        {/* Test Results */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <div className="bg-gray-50 p-3 rounded border max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Run some tests above.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">About This Test</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Small Data:</strong> Tests basic localStorage functionality</p>
            <p>• <strong>Large Data:</strong> Tests quota handling with large objects (should fail gracefully)</p>
            <p>• <strong>Lightweight Data:</strong> Tests our fix - storing only essential metadata</p>
            <p>• <strong>Expected Behavior:</strong> Large data should fail, lightweight data should succeed</p>
          </div>
        </div>
      </div>
    </div>
  )
} 