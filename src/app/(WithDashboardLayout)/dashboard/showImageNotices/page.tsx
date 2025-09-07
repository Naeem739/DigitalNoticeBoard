'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Image as ImageIcon, Download } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

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
  const { data: session } = useSession()
  const userRole = session?.user?.role
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
                  padding: 0;
                  background: #000;
                  font-family: Arial, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  overflow: hidden;
                }
                .image-container {
                  max-width: 100vw;
                  max-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                img {
                  max-width: 100vw;
                  max-height: 100vh;
                  object-fit: contain;
                  display: block;
                }
              </style>
            </head>
            <body>
              <div class="image-container">
                <img src="data:image/jpeg;base64,${image.imageData}" alt="${image.title}" />
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
       
        <div className="flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-semibold">{images.length} Images</span>
        </div>
      </div>

      {images.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Images Found</h3>
            <p className="text-gray-500 text-center">
              No notices with images have been created yet. Images will appear here once notices with images are added.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {images.map((image) => (
            <Card key={image.id} className="group relative overflow-hidden bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleViewFullSize(image)}>
              {/* Image preview area - 99% of card height */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${image.imageData}`}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Footer - 1% of card height with filename and buttons */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-2 py-1.5">
                <div className="flex items-center justify-between">
                  {/* Filename on left */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-700 truncate" title={image.imageFileName || image.title}>
                      {image.imageFileName || image.title}
                    </p>
                  </div>
                  
                  {/* Action buttons on right */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(image);
                      }}
                      className="h-5 w-5 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      title="Download Image"
                    >
                      <Download className="w-2.5 h-2.5" />
                    </Button>
                    {userRole !== 'USER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                        disabled={deletingId === image.id}
                        className="h-5 w-5 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Image"
                      >
                        {deletingId === image.id ? (
                          <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 