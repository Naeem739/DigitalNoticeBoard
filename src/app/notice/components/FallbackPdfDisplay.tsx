"use client"

import { useState, useEffect } from "react"
import PdfDisplay from "./PdfDisplay"

interface FallbackPdfDisplayProps {
  pdfData?: string
  pdfUrl?: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
}

export default function FallbackPdfDisplay({ 
  pdfData,
  pdfUrl,
  title, 
  autoScroll = true, 
  className = "", 
  showTitle = true 
}: FallbackPdfDisplayProps) {
  const [error, setError] = useState<string | null>(null)
  const [convertedPdfData, setConvertedPdfData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Validate inputs
    if (!pdfUrl && !pdfData) {
      setError("No PDF data or URL provided")
      return
    }
    
    if (pdfData) {
      // Validate PDF data if provided
      if (typeof pdfData !== 'string') {
        setError("No PDF data provided")
        return
      }

      // Check if it's a valid base64 string
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      const cleanData = pdfData.replace(/^data:application\/pdf;base64,/, '')
      
      if (!base64Regex.test(cleanData) || cleanData.length < 50) {
        setError("Invalid PDF data format")
        return
      }
    }

    setError(null)
  }, [pdfData, pdfUrl])

  // Fetch PDF from URL and convert to base64 data URL for inline rendering
  useEffect(() => {
    if (pdfUrl && !pdfData && !convertedPdfData) {
      setIsLoading(true)
      setError(null)
      
      fetch(pdfUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`)
          }
          return response.arrayBuffer()
        })
        .then(arrayBuffer => {
          // Convert ArrayBuffer to base64
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const base64 = btoa(binary)
          const dataUrl = `data:application/pdf;base64,${base64}`
          setConvertedPdfData(dataUrl)
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Error fetching PDF (logged only):', err)
          // Don't set error state - only log to console
          setIsLoading(false)
        })
    }
  }, [pdfUrl, pdfData, convertedPdfData])

  // Don't show error UI - errors are logged to console only
  // if (error) {
  //   return (
  //     <div className={`flex items-center justify-center p-4 text-red-500 ${className}`}>
  //       <div className="text-center">
  //         <p className="text-sm">Error loading PDF</p>
  //         <p className="text-xs opacity-75">{error}</p>
  //       </div>
  //     </div>
  //   )
  // }

  // If pdfUrl is provided, fetch and convert to base64, then use PdfDisplay for inline rendering
  if (pdfUrl && !pdfData) {
    if (isLoading) {
      return (
        <div className={`flex flex-col h-full ${className}`}>
          {showTitle && title && (
            <div className="text-sm font-medium text-gray-700 mb-2 truncate">
              {title}
            </div>
          )}
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600 font-medium">Loading PDF...</p>
            </div>
          </div>
        </div>
      )
    }
    
    if (convertedPdfData) {
      return (
        <PdfDisplay
          pdfData={convertedPdfData}
          title={title}
          autoScroll={autoScroll}
          className={className}
          showTitle={showTitle}
        />
      )
    }
    
    return (
      <div className={`flex items-center justify-center p-4 text-gray-500 ${className}`}>
        <div className="text-center">
          <p className="text-sm">Loading PDF...</p>
        </div>
      </div>
    )
  }

  // If pdfData is provided, use PdfDisplay component
  if (pdfData) {
    return (
      <PdfDisplay
        pdfData={pdfData}
        title={title}
        autoScroll={autoScroll}
        className={className}
        showTitle={showTitle}
      />
    )
  }

  return (
    <div className={`flex items-center justify-center p-4 text-gray-500 ${className}`}>
      <div className="text-center">
        <p className="text-sm">No PDF data available</p>
      </div>
    </div>
  )
}
