'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TestDBPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [categories, setCategories] = useState<any>(null)
  const [quickSetup, setQuickSetup] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDB = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/db-test')
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ success: false, error: error })
    } finally {
      setLoading(false)
    }
  }

  const setupCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/setup-categories', {
        method: 'POST'
      })
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      setCategories({ success: false, error: error })
    } finally {
      setLoading(false)
    }
  }

  const runQuickSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/quick-setup', {
        method: 'POST'
      })
      const data = await response.json()
      setQuickSetup(data)
    } catch (error) {
      setQuickSetup({ success: false, error: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
          <h1 className="text-2xl font-bold">Database Test Page</h1>
          <p className="mt-2">Test database connectivity and setup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
            <Button 
              onClick={testDB} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Database Connection'}
            </Button>
            
            {dbStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(dbStatus, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Setup Categories</h2>
            <Button 
              onClick={setupCategories} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Setup Default Categories'}
            </Button>
            
            {categories && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(categories, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Setup</h2>
            <Button 
              onClick={runQuickSetup} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Setting up...' : 'Run Quick Setup'}
            </Button>
            
            {quickSetup && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(quickSetup, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 