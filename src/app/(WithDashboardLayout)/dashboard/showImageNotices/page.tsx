'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Image as ImageIcon, Download, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type TImage = {
  id: string
  title: string
  imageData: string
  imageFileName?: string
  createdAt?: Date
  category?: string
  categoryName?: string
}

export default function ShowImageNotices() {
  const [images, setImages] = useState<TImage[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      // Fetch from Notice model instead of Image model
      const response = await fetch('/api/notice/get-all')
      const data = await response.json()
      
      if (data.success) {
        // Filter notices that have imageData
        const noticesWithImages = data.result.filter((notice: any) => notice.imageData)
        setImages(noticesWithImages || [])
      } else {
        toast.error('Failed to fetch images')
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Error fetching images')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(imageId)
      // Delete from notice instead of image
      const response = await fetch(`/api/notice/delete?id=${imageId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        setImages(prev => prev.filter(img => img.id !== imageId))
        toast.success('Image deleted successfully')
      } else {
        toast.error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Error deleting image')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadImage = (image: TImage) => {
    try {
      // Create a blob from the base64 data
      const byteCharacters = atob(image.imageData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.imageFileName || `${image.title}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Image downloaded successfully')
    } catch (error) {
      console.error('Error downloading image:', error)
      toast.error('Error downloading image')
    }
  }

  const handleViewFullSize = (image: TImage) => {
    try {
      // Create a new window with the image
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${image.title}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f5f5f5;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-height: 100vh;
                }
                .image-container {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  max-width: 90vw;
                  max-height: 90vh;
                  overflow: auto;
                }
                img {
                  max-width: 100%;
                  max-height: 80vh;
                  object-fit: contain;
                  border-radius: 4px;
                }
                .image-info {
                  margin-top: 15px;
                  text-align: center;
                  color: #666;
                }
                .image-title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                  color: #333;
                }
                .image-details {
                  font-size: 14px;
                  color: #888;
                }
              </style>
            </head>
            <body>
              <div class="image-container">
                <img src="data:image/jpeg;base64,${image.imageData}" alt="${image.title}" />
                <div class="image-info">
                  <div class="image-title">${image.title}</div>
                  <div class="image-details">
                    Category: ${image.categoryName || image.category || 'N/A'} | ID: ${image.id}
                    ${image.createdAt ? ` | Created: ${new Date(image.createdAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
            </body>
          </html>
        `)
        newWindow.document.close()
      } else {
        // Fallback if popup is blocked
        toast.error('Please allow popups to view full-size images')
      }
    } catch (error) {
      console.error('Error opening full-size image:', error)
      toast.error('Error opening full-size image')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Image Notices</h1>
          <p className="text-gray-600 mt-2">Manage all notices with images</p>
        </div>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-semibold">{images.length} Images</span>
        </div>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Images Found</h3>
            <p className="text-gray-500 text-center">
              No notices with images have been created yet. Images will appear here once notices with images are added.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate" title={image.title}>
                    {image.imageFileName || image.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadImage(image)}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFullSize(image)}
                      className="h-8 w-8 p-0"
                      title="View Full Size"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deletingId === image.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      {deletingId === image.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={`data:image/jpeg;base64,${image.imageData}`}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Category: {image.categoryName || image.category || 'N/A'}</span>
                    <span>{formatDate(image.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 