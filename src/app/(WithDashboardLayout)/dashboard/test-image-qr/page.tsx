"use client"

import { NoticeQRCode } from '@/components/ui/qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Download, Database } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TestImageQRPage() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/image/get-all')
        if (response.ok) {
          const data = await response.json()
          setImages(data.result || [])
        } else {
          setError('Failed to fetch images')
        }
      } catch (err) {
        setError('Error fetching images')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  const testImageDownload = async (imageId: string) => {
    try {
      console.log('Testing image download for ID:', imageId)
      const response = await fetch(`/api/notice/download/${imageId}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `test-image-${imageId}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        console.log('Image download successful')
      } else {
        const errorText = await response.text()
        console.error('Download failed:', errorText)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const createSampleImage = async () => {
    try {
      const response = await fetch('/api/test/create-sample-image', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Sample image created:', data)
        // Refresh the images list
        window.location.reload()
      } else {
        console.error('Failed to create sample image')
      }
    } catch (error) {
      console.error('Error creating sample image:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Image QR Code Test</h1>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
            <span className="ml-2">Loading images...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Image QR Code Test</h1>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Database Status</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Total Images in Database: {images.length}</span>
            </div>
            {images.length === 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>No images found in database. Create some images first.</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {images.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Images Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                No images were found in the database. To test image QR codes, you need to:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                <li>Create some images through the dashboard</li>
                <li>Add them to a dashboard interface</li>
                <li>Then test the QR codes on the public notice board</li>
              </ul>
              <Button 
                onClick={createSampleImage}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Create Sample Image for Testing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card key={image.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{image.title}</span>
                    <NoticeQRCode
                      notice={{
                        id: image.id,
                        title: image.title,
                        content: image.title
                      }}
                      imageData={image.imageData}
                      imageTitle={image.title}
                      size={40}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-500 mb-4">
                    <div><strong>ID:</strong> {image.id}</div>
                    <div><strong>File:</strong> {image.fileName}</div>
                    <div><strong>Data Size:</strong> {image.imageData?.length || 0} chars</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => testImageDownload(image.id)}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Test Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Debug Information</h2>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• <strong>Image QR Code:</strong> Uses same API as notices for consistency</p>
            <p>• <strong>API Endpoint:</strong> /api/notice/download/{'{imageId}'}</p>
            <p>• <strong>Expected Behavior:</strong> QR code should download image directly</p>
            <p>• <strong>Test:</strong> Use "Test Download" button to verify API works</p>
            <p>• <strong>Unified Approach:</strong> Images and notices use the same QR code logic</p>
          </div>
        </div>
      </div>
    </div>
  )
} 