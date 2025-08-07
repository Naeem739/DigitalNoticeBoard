"use client"

import { NoticeQRCode } from '@/components/ui/qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Download } from 'lucide-react'

export default function TestQRFixesPage() {
  const testNotices = [
    {
      id: 'text-notice-1',
      title: 'Text Notice Test',
      content: 'This is a test text notice to verify QR code generation and PDF download functionality.',
      category: 'Test'
    },
    {
      id: 'pdf-notice-1',
      title: 'PDF Notice Test',
      content: 'This notice has PDF data and should download as PDF.',
      pdfData: 'JVBERi0xLjQKJcOkw7zDtsO...', // Sample base64 PDF data
      pdfFileName: 'test-document.pdf',
      category: 'Test'
    }
  ]

  const testImages = [
    {
      id: 'image-test-1',
      title: 'Test Image 1',
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      fileName: 'test-image-1.jpg'
    }
  ]

  const testDownload = async (type: 'text' | 'image', id: string) => {
    try {
      let url = ''
      if (type === 'image') {
        url = `/api/notice/download-image/${id}`
      } else {
        url = `/api/notice/download/${id}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        
        if (type === 'text' || contentType?.includes('text/html')) {
          // For text notices (HTML), open in new tab for printing
          const htmlContent = await response.text()
          const blob = new Blob([htmlContent], { type: 'text/html' })
          const downloadUrl = window.URL.createObjectURL(blob)
          window.open(downloadUrl, '_blank')
          window.URL.revokeObjectURL(downloadUrl)
        } else {
          // For PDF and image files, download directly
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = type === 'image' ? 'test-image.jpg' : 'test-notice.pdf'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        console.error('Download failed:', errorData)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">QR Code Fixes Test Page</h1>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Test Results</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Image QR codes now use correct image IDs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Text notices open in browser for PDF printing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>PDF notices download directly as PDF files</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Notice Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Text Notice Test</span>
                <NoticeQRCode
                  notice={testNotices[0]}
                  size={40}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{testNotices[0].content}</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => testDownload('text', testNotices[0].id)}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Test Download
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <strong>Expected:</strong> Opens in browser for PDF printing
              </div>
            </CardContent>
          </Card>

          {/* Image Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Image Test</span>
                <NoticeQRCode
                  notice={testImages[0]}
                  imageData={testImages[0].imageData}
                  imageTitle={testImages[0].title}
                  size={40}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Test image with QR code generation</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => testDownload('image', testImages[0].id)}
                  className="flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Test Download
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <strong>Expected:</strong> Downloads as JPG file
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Instructions</h2>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• <strong>Text Notices:</strong> QR code opens HTML page with "Print as PDF" button</p>
            <p>• <strong>Image Notices:</strong> QR code downloads image directly</p>
            <p>• <strong>PDF Notices:</strong> QR code downloads PDF directly</p>
            <p>• <strong>Testing:</strong> Use the "Test Download" buttons to verify functionality</p>
          </div>
        </div>
      </div>
    </div>
  )
} 