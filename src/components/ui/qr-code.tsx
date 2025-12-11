"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { Download, QrCode } from 'lucide-react'
import { Button } from './button'

interface QRCodeProps {
  notice: {
    id: string
    title: string
    content?: string
    pdfUrl?: string
    pdfFileName?: string
    pdfData?: string
    imageUrl?: string
    imageFileName?: string
    imageData?: string
  }
  imageData?: string
  imageTitle?: string
  className?: string
  size?: number
}

export function NoticeQRCode({ notice, imageData, imageTitle, className = "", size = 80 }: QRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const generateQRCode = async () => {
    if (isLoading || qrDataUrl) return

    try {
      setIsLoading(true)
      setError('')

      // Create a simple, reliable QR content
      let qrContent = `Notice: ${notice.title}\nID: ${notice.id}`
      
      // If we have image data, add image download URL
      if (imageData || notice.imageData || notice.imageUrl) {
        qrContent = `${window.location.origin}/api/notice/download-image/${notice.id}`
      } else if (notice.pdfData || notice.pdfUrl) {
        qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
      } else {
        qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
      }

      console.log('Generating QR code for:', qrContent)

      // Generate QR code with simple settings
      const qrDataUrl = await QRCode.toDataURL(qrContent, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'L'
      })

      setQrDataUrl(qrDataUrl)
      console.log('QR code generated successfully:', qrDataUrl.substring(0, 50) + '...')
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
      
      // Try with even simpler content
      try {
        const simpleContent = `Notice: ${notice.title}`
        const fallbackQrDataUrl = await QRCode.toDataURL(simpleContent, {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'L'
        })
        setQrDataUrl(fallbackQrDataUrl)
        setError('')
        console.log('Fallback QR code generated successfully')
      } catch (fallbackErr) {
        console.error('Fallback QR code generation failed:', fallbackErr)
        setError('QR code generation failed')
        
        // Last resort: try with just the notice ID
        try {
          const lastResortContent = `ID: ${notice.id}`
          const lastResortQrDataUrl = await QRCode.toDataURL(lastResortContent, {
            width: size,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'L'
          })
          setQrDataUrl(lastResortQrDataUrl)
          setError('')
          console.log('Last resort QR code generated successfully')
        } catch (lastResortErr) {
          console.error('Last resort QR code generation failed:', lastResortErr)
          setError('QR code generation completely failed')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Generate QR code on mount
  useEffect(() => {
    if (notice.id && !qrDataUrl && !isLoading) {
      console.log('Starting QR code generation for notice:', notice.id)
      
      // Add a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        generateQRCode()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [notice.id, qrDataUrl, isLoading, generateQRCode])

  const handleDownload = async () => {
    try {
      let downloadUrl = ''
      
      if (imageData || notice.imageData || notice.imageUrl) {
        downloadUrl = `/api/notice/download-image/${notice.id}`
      } else {
        downloadUrl = `/api/notice/download/${notice.id}`
      }
      
      console.log('Downloading from:', downloadUrl)
      
      const response = await fetch(downloadUrl)
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('text/html')) {
          const htmlContent = await response.text()
          const blob = new Blob([htmlContent], { type: 'text/html' })
          const url = window.URL.createObjectURL(blob)
          window.open(url, '_blank')
          window.URL.revokeObjectURL(url)
        } else {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          
          if (imageData || notice.imageData || notice.imageUrl) {
            link.download = `${notice.imageFileName || imageTitle || notice.title}.jpg`
          } else if (notice.pdfFileName) {
            link.download = notice.pdfFileName
          } else {
            link.download = `${notice.title}.pdf`
          }
          
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      } else {
        console.error('Download failed:', response.statusText)
      }
    } catch (err) {
      console.error('Error downloading file:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600 mb-2"></div>
        <div className="text-xs text-gray-500 text-center">
          Generating QR...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="text-red-500 text-xs text-center">
          <QrCode className="w-4 h-4 mx-auto mb-1" />
          Error
        </div>
      </div>
    )
  }

  if (!qrDataUrl) {
    return (
      <div 
        className={`flex flex-col items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors ${className}`} 
        style={{ width: size, height: size }}
        onClick={generateQRCode}
        title="Click to generate QR code"
      >
        <QrCode className="w-6 h-6 text-gray-400 mb-1" />
        <div className="text-xs text-gray-500 text-center">
          Click to generate
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative group" style={{ width: size, height: size }}>
        <Image
          src={qrDataUrl}
          alt="QR Code"
          fill
          className="border border-gray-200 rounded-lg shadow-sm object-contain"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <Button
            onClick={handleDownload}
            size="sm"
            variant="secondary"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
} 