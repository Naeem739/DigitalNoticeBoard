"use client"

import { useState, useEffect } from "react"
import PdfDisplay from "./PdfDisplay"

interface FallbackPdfDisplayProps {
  pdfData: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
}

export default function FallbackPdfDisplay({ 
  pdfData, 
  title, 
  autoScroll = true, 
  className = "", 
  showTitle = true 
}: FallbackPdfDisplayProps) {
  // const [useFallback, setUseFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to validate PDF data
    if (!pdfData || typeof pdfData !== 'string') {
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

    // If we get here, the data looks valid
    setError(null)
  }, [pdfData])

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
