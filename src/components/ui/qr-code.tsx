"use client"

import { useEffect, useState } from 'react'
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

  // Helper to check if we have a "real" Notice id (UUID-like) vs a widget id (e.g. "widget-...")
  const isValidNoticeId = (id: string | undefined | null) => {
    if (!id) return false
    // Basic UUID v4 style check: 8-4-4-4-12 hex chars
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)
  }

  // Helper to detect PDF ids (from Pdf table, typically cuid-like, e.g. "clxyz...")
  const isPdfId = (id: string | undefined | null) => {
    if (!id) return false
    // Very loose CUID-style check: starts with a letter, then at least 10 more chars
    return /^[a-zA-Z][a-zA-Z0-9_-]{10,}$/.test(id) && !isValidNoticeId(id)
  }

  const generateQRCode = async () => {
    if (isLoading || qrDataUrl) return

    try {
      setIsLoading(true)
      setError('')

      // Create a simple, reliable QR content
      let qrContent = `Notice: ${notice.title}\nID: ${notice.id}`
      
      // Handle direct PDF data (like images) - no API needed, use descriptive text
      if (notice.pdfData) {
        // For PDFs with direct data (widget-based), use descriptive text
        // The download will work directly from the data
        qrContent = `PDF: ${notice.title}\nScan to view details`
      } 
      // Handle direct image data - no API needed
      else if (imageData || notice.imageData) {
        // For images with direct data, use descriptive text
        qrContent = `Image: ${notice.title}\nScan to view details`
      }
      // If we have a proper Notice id (from Notice table), generate API URLs
      else if (isValidNoticeId(notice.id)) {
        // If we have image URL, add image download URL
        if (notice.imageUrl) {
          qrContent = `${window.location.origin}/api/notice/download-image/${notice.id}`
        } else if (notice.pdfUrl) {
          qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
        } else {
          qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
        }
      } 
      // If we have a PDF id (from Pdf table), point to /api/pdf/:id
      else if (isPdfId(notice.id) && notice.pdfUrl) {
        // PDF coming from Pdf table (used in PDF widgets) - only if valid PDF ID
        qrContent = `${window.location.origin}/api/pdf/${notice.id}`
      } 
      // For widget-generated ids (like "widget-..."), use descriptive text
      else {
        // Use a safe, descriptive text payload for non‑database IDs (e.g. widget IDs)
        qrContent = `Notice: ${notice.title}`
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
  }, [notice.id])

  const handleDownload = async () => {
    try {
      // Handle direct PDF data download (like images) - no API call needed
      if (notice.pdfData) {
        // Extract base64 data from data URL if present
        let base64Data = notice.pdfData
        if (base64Data.startsWith('data:application/pdf;base64,')) {
          base64Data = base64Data.replace('data:application/pdf;base64,', '')
        } else if (base64Data.startsWith('data:')) {
          // Handle other data URL formats
          base64Data = base64Data.split(',')[1] || base64Data
        }
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = notice.pdfFileName || `${notice.title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        return
      }
      
      // Handle direct image data download (like images) - no API call needed
      if (imageData || notice.imageData) {
        // Extract base64 data from data URL if present
        let base64Data = imageData || notice.imageData || ''
        if (base64Data.startsWith('data:image/')) {
          base64Data = base64Data.split(',')[1] || base64Data
        }
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data)
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
        link.download = `${notice.imageFileName || imageTitle || notice.title}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        return
      }
      
      // Fallback to API-based downloads for database-stored content
      let downloadUrl = ''
      
      if (notice.imageUrl) {
        // Images stored on Notice (UUID id) - use API
        if (!isValidNoticeId(notice.id)) return
        downloadUrl = `/api/notice/download-image/${notice.id}`
      } else if (isValidNoticeId(notice.id)) {
        // Text/PDF stored on Notice model
        downloadUrl = `/api/notice/download/${notice.id}`
      } else if (isPdfId(notice.id) && notice.pdfUrl) {
        // PDF from Pdf table (PDF widget) - only if we have a valid PDF ID
        downloadUrl = `/api/pdf/${notice.id}`
      } else {
        // Unknown id type – nothing to download
        console.warn('Cannot download: invalid ID or missing data', notice.id)
        return
      }
      
      console.log('Downloading from API:', downloadUrl)
      
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
          
          if (notice.imageFileName) {
            link.download = notice.imageFileName
          } else if (notice.pdfFileName) {
            link.download = notice.pdfFileName
          } else {
            link.download = `${notice.title}.${contentType?.includes('image') ? 'jpg' : 'pdf'}`
          }
          
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      } else {
        console.error('Download failed:', response.statusText, response.status)
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
      <div className="relative group">
        <img
          src={qrDataUrl}
          alt="QR Code"
          style={{ width: size, height: size }}
          className="border border-gray-200 rounded-lg shadow-sm"
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