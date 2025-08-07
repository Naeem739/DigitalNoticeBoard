"use client"

import { NoticeQRCode } from '@/components/ui/qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestQRPage() {
  const testNotices = [
    {
      id: '1',
      title: 'Text Notice Example',
      content: 'This is a sample text notice that will generate a QR code for PDF download.',
      category: 'General'
    },
    {
      id: '2',
      title: 'PDF Notice Example',
      content: 'This notice has PDF data and will generate a QR code for PDF download.',
      pdfData: 'JVBERi0xLjQKJcOkw7zDtsO...', // Sample base64 PDF data
      pdfFileName: 'sample-document.pdf',
      category: 'Documents'
    },
    {
      id: '3',
      title: 'Image Notice Example',
      content: 'This notice has an image and will generate a QR code for image download.',
      category: 'Images'
    }
  ]

  const sampleImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">QR Code Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Text Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Text Notice</span>
                <NoticeQRCode
                  notice={testNotices[0]}
                  size={40}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{testNotices[0].content}</p>
              <div className="text-xs text-gray-500">
                <strong>Category:</strong> {testNotices[0].category}<br/>
                <strong>Type:</strong> Text → PDF Download
              </div>
            </CardContent>
          </Card>

          {/* PDF Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>PDF Notice</span>
                <NoticeQRCode
                  notice={testNotices[1]}
                  size={40}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{testNotices[1].content}</p>
              <div className="text-xs text-gray-500">
                <strong>Category:</strong> {testNotices[1].category}<br/>
                <strong>Type:</strong> PDF → PDF Download
              </div>
            </CardContent>
          </Card>

          {/* Image Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Image Notice</span>
                <NoticeQRCode
                  notice={testNotices[2]}
                  imageData={sampleImageData}
                  imageTitle="sample-image.jpg"
                  size={40}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{testNotices[2].content}</p>
              <div className="text-xs text-gray-500">
                <strong>Category:</strong> {testNotices[2].category}<br/>
                <strong>Type:</strong> Image → Image Download
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How QR Codes Work</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Text Notices:</strong> QR code contains a link to download a PDF version</p>
            <p>• <strong>PDF Notices:</strong> QR code contains the PDF data for direct download</p>
            <p>• <strong>Image Notices:</strong> QR code contains the image data for direct download</p>
            <p>• <strong>Scan with Phone:</strong> Use any QR code scanner app to download content</p>
          </div>
        </div>
      </div>
    </div>
  )
} 