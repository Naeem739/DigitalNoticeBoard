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

  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 text-red-500 ${className}`}>
        <div className="text-center">
          <p className="text-sm">Error loading PDF</p>
          <p className="text-xs opacity-75">{error}</p>
        </div>
      </div>
    )
  }

  // If pdfUrl is provided, use iframe for direct rendering (most efficient - no conversion needed!)
  if (pdfUrl && !pdfData) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {showTitle && title && (
          <div className="text-sm font-medium text-gray-700 mb-2 truncate">
            {title}
          </div>
        )}
        <iframe
          src={pdfUrl}
          className="flex-1 w-full border-0 rounded-lg"
          style={{
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
            minHeight: "100%"
          }}
          title={title || "PDF Document"}
        />
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
