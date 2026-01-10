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

  // Helper to detect widget/container IDs (not PDF IDs)
  const isWidgetId = (id: string | undefined | null) => {
    if (!id) return false
    // Widget IDs typically start with "widget-" or similar patterns
    // Container IDs might be UUIDs but not PDF IDs from the Pdf table
    return id.startsWith('widget-') || id.startsWith('container-') || id.startsWith('cid-')
  }

  // Helper to detect PDF ids (from Pdf table, typically cuid-like, e.g. "clxyz...")
  // Prisma CUIDs are exactly 25 characters and start with 'c', followed by 24 alphanumeric chars
  const isPdfId = (id: string | undefined | null) => {
    if (!id) return false
    // First check: if it's a widget/container ID, it's NOT a PDF ID
    if (isWidgetId(id)) return false
    // Check if it's a valid Notice ID (UUID format) - if so, it's NOT a PDF ID
    if (isValidNoticeId(id)) return false
    // CUID format: starts with 'c' (lowercase) and has 24 more alphanumeric characters (total 25)
    // Also accept other CUID-like formats: starts with letter, at least 20 chars, not a UUID or widget ID
    return /^c[a-z0-9]{24}$/.test(id) || (/^[a-zA-Z][a-zA-Z0-9_-]{19,}$/.test(id) && !isValidNoticeId(id) && !isWidgetId(id))
  }

  const generateQRCode = async () => {
    if (isLoading || qrDataUrl) return

    try {
      setIsLoading(true)
      setError('')

      // Create a simple, reliable QR content
      let qrContent = `Notice: ${notice.title}\nID: ${notice.id}`
      
      // PRIORITY ORDER: Check for PDF widgets first (same as download button), then handle other cases
      // This ensures QR code uses the same API endpoints as the download button
      
      // 1. If we have PDF data, prioritize PDF widget handling (same as download button)
      // For PDF widgets: notice.id = pdf.id (from Pdf table), notice.pdfData = pdf.pdfData
      // The download button works by using /api/pdf/${id} for PDF widgets, so QR code should too
      if (notice.pdfData && notice.id) {
        // First check: if it's a widget/container ID (e.g., "widget-1767986202354-530"), use container PDF endpoint
        if (isWidgetId(notice.id)) {
          // Container/widget ID - use container PDF endpoint (legacy containers with pdfData stored in container)
          qrContent = `${window.location.origin}/api/dashboard/container-pdf?containerId=${encodeURIComponent(notice.id)}`
        }
        // If ID is clearly a PDF ID (CUID format from Pdf table), use PDF endpoint
        else if (isPdfId(notice.id)) {
          // PDF coming from Pdf table (used in PDF widgets) - use same API as download button
          qrContent = `${window.location.origin}/api/pdf/${notice.id}`
        } 
        // If ID is a valid Notice ID (UUID format), use notice download endpoint
        else if (isValidNoticeId(notice.id)) {
          // PDF stored in Notice table (UUID format) - use notice download endpoint
          qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
        } 
        // Last resort: if we can't determine ID type, use container PDF endpoint for legacy containers
        else {
          qrContent = `${window.location.origin}/api/dashboard/container-pdf?containerId=${encodeURIComponent(notice.id)}`
        }
      }
      // 2. If we have a PDF ID (from Pdf table) without pdfData in notice object, still use PDF endpoint
      else if (isPdfId(notice.id)) {
        // PDF coming from Pdf table (used in PDF widgets) - triggers automatic download
        qrContent = `${window.location.origin}/api/pdf/${notice.id}`
      }
      // 3. If we have a proper Notice ID (UUID from Notice table), generate download API URLs
      else if (isValidNoticeId(notice.id)) {
        // If we have image data/URL, use image download URL (triggers automatic download)
        if (notice.imageUrl || imageData || notice.imageData) {
          qrContent = `${window.location.origin}/api/notice/download-image/${notice.id}`
        } 
        // If we have PDF data/URL, use PDF download URL (triggers automatic download)
        else if (notice.pdfUrl || notice.pdfData) {
          qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
        } 
        // Fallback to notice download
        else {
          qrContent = `${window.location.origin}/api/notice/download/${notice.id}`
        }
      }
      // 4. Handle direct PDF data without valid ID (container-based PDFs) - use container PDF endpoint
      // This is for legacy containers that have PDF data but no valid database ID
      else if (notice.pdfData) {
        // For container-based PDFs, use the container PDF download endpoint
        // This endpoint searches dashboards for the container and returns the PDF
        qrContent = `${window.location.origin}/api/dashboard/container-pdf?containerId=${encodeURIComponent(notice.id)}`
      } 
      // 4. Handle direct image data without valid ID - use descriptive text
      else if (imageData || notice.imageData) {
        // For images without notice ID, we need the notice ID to download
        // This case should not happen if images are properly stored as notices
        qrContent = `Image: ${notice.title}\nPlease contact administrator for download`
      }
      // 5. For widget-generated ids (like "widget-..."), use descriptive text
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
      } else if (isPdfId(notice.id)) {
        // PDF from Pdf table (PDF widget) - use same API as QR code
        // This is the same API endpoint that works for download button
        downloadUrl = `/api/pdf/${notice.id}`
      } else if (isValidNoticeId(notice.id)) {
        // Text/PDF stored on Notice model
        downloadUrl = `/api/notice/download/${notice.id}`
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
      <div className="relative group border border-gray-200 rounded-lg shadow-sm bg-white p-2">
        <img
          src={qrDataUrl}
          alt="QR Code"
          style={{ width: size - 16, height: size - 16 }}
          className="rounded"
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