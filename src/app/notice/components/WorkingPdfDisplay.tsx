/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"

interface WorkingPdfDisplayProps {
  pdfData: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
  onError?: () => void
}

export default function WorkingPdfDisplay({
  pdfData,
  title,
  autoScroll = true,
  className = "",
  showTitle = true,
  onError,
}: WorkingPdfDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Configure worker once on mount (client-side only) - same as InlinePdfWidget
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`
        console.log('PDF.js worker configured:', (pdfjsLib as any).GlobalWorkerOptions.workerSrc)
      } catch (error) {
        console.error('Failed to configure PDF.js worker:', error)
        try {
          ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs`
        } catch (fallbackError) {
          console.error('Failed to configure PDF.js worker fallback:', fallbackError)
        }
      }
    }
    setMounted(true)
    return () => {
      stopAutoScroll()
    }
  }, [])

  // NEW SIMPLE AUTOSCROLL - Remove old implementation completely
  const stopAutoScroll = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const startAutoScroll = () => {
    // Stop any existing scroll
    stopAutoScroll()
    
    const container = containerRef.current
    if (!container) return
    
    // Reset to top
    container.scrollTop = 0
    
    let retryCount = 0
    const maxRetries = 20 // Maximum retries before giving up
    
    // Wait for content to be ready
    const checkAndStart = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) return
      
      const maxScroll = currentContainer.scrollHeight - currentContainer.clientHeight
      
      // Only start if content is scrollable
      if (maxScroll <= 0) {
        retryCount++
        if (retryCount < maxRetries) {
          // Retry after a short delay if content isn't ready
          setTimeout(checkAndStart, 200)
        }
        return
      }
      
      // Content is ready, start scrolling
      const scrollSpeed = 0.8 // pixels per frame
      
      const scroll = () => {
        const scrollContainer = containerRef.current
        if (!scrollContainer) {
          stopAutoScroll()
          return
        }
        
        const currentScroll = scrollContainer.scrollTop
        const scrollHeight = scrollContainer.scrollHeight
        const clientHeight = scrollContainer.clientHeight
        const maxScrollPos = scrollHeight - clientHeight
        
        if (maxScrollPos <= 0) {
          // Not scrollable, stop
          stopAutoScroll()
          return
        }
        
        // Check if reached bottom
        if (currentScroll >= maxScrollPos - 2) {
          // Reset to top for continuous loop (start to end, then start again)
          scrollContainer.scrollTop = 0
        } else {
          // Scroll down smoothly
          scrollContainer.scrollTop += scrollSpeed
        }
        
        // Continue animation loop
        rafRef.current = requestAnimationFrame(scroll)
      }
      
      // Start scrolling after a brief pause at the top
      setTimeout(() => {
        if (containerRef.current) {
          rafRef.current = requestAnimationFrame(scroll)
        }
      }, 1000)
    }
    
    // Start checking after content is rendered
    setTimeout(checkAndStart, 500)
  }

  // Exact same rendering logic as InlinePdfWidget
  const renderPdfFromData = useCallback(async (pdfData: string) => {
    const container = containerRef.current
    if (!container) {
      console.error('Container ref not available')
      return
    }
    
    try {
      // Clear container and show loading state
      container.innerHTML = ""
      setIsLoading(true)
      setError(null)
      
      // Validate PDF data
      if (!pdfData || pdfData.trim() === '') {
        throw new Error('No PDF data provided')
      }
      
      // Check if PDF data is valid base64
      const base64Regex = /^data:application\/pdf;base64,/
      if (!base64Regex.test(pdfData) && !pdfData.startsWith('data:application/pdf')) {
        // Try to add the data URL prefix if missing
        if (!pdfData.startsWith('data:')) {
          pdfData = `data:application/pdf;base64,${pdfData}`
        }
      }

      // Check if PDF.js worker is configured
      if (!(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
        console.warn('PDF.js worker not configured, attempting to configure...')
        try {
          ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`
        } catch (workerError) {
          console.error('Failed to configure PDF.js worker:', workerError)
        }
      }

      // Load PDF document with error handling - exact same as InlinePdfWidget
      let pdf
      try {
        // Ensure PDF data is properly formatted
        let pdfSource = pdfData
        if (!pdfSource.startsWith('data:')) {
          pdfSource = `data:application/pdf;base64,${pdfSource}`
        }
        
        // Extract base64 data from data URL
        const base64Data = pdfSource.includes(',') ? pdfSource.split(',')[1] : pdfSource.replace(/^data:application\/pdf;base64,/, '')
        
        // Convert base64 to Uint8Array for PDF.js
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        // Load PDF using Uint8Array
        pdf = await (pdfjsLib as any).getDocument({
          data: bytes,
          verbosity: 0
        }).promise
        
        console.log('PDF loaded successfully, pages:', pdf.numPages)
      } catch (loadError: any) {
        console.error('PDF.js load error details:', {
          error: loadError,
          message: loadError?.message,
          name: loadError?.name,
          stack: loadError?.stack?.substring(0, 500)
        })
        throw new Error(`Failed to load PDF: ${loadError?.message || 'Unknown error'}`)
      }
      
      // Clear container
      container.innerHTML = ""

      // Render each page with enhanced text clarity
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          // Fit page width to container to avoid horizontal scroll
          const containerWidth = container.clientWidth || 600
          const baseViewport = page.getViewport({ scale: 1 })
          
          // Increase scale significantly for better readability (larger, clearer text)
          const baseFitScale = containerWidth / baseViewport.width
          const readabilityScale = baseFitScale * 1.5 // 50% larger for much better readability
          const viewport = page.getViewport({ scale: readabilityScale })
          
          // Render at extremely high pixel density for ultra-crisp, clear text
          const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
          // Use even higher DPI scaling for maximum text clarity
          const outputScale = Math.max(4, devicePixelRatio * 3) // Much higher DPI for ultra-sharp text
          
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d", {
            alpha: false, // Better performance
            desynchronized: true, // Better performance
            willReadFrequently: false // Optimize for rendering, not reading
          })
          
          if (!context) {
            throw new Error('Failed to get canvas context')
          }
          
          // Set canvas size for ultra-high DPI rendering
          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          
          // Set CSS size to display size (no blur) - this ensures it fits the widget
          canvas.style.width = "100%"
          canvas.style.height = "auto"
          // Use auto instead of crisp-edges for better text smoothing
          canvas.style.imageRendering = "auto"
          
          // Configure context for optimal text rendering
          context.imageSmoothingEnabled = true
          context.imageSmoothingQuality = "high"
          
          // Additional text rendering optimizations
          context.textBaseline = "alphabetic"
          context.textAlign = "left"
          
          // Scale context for high DPI rendering
          context.scale(outputScale, outputScale)
          
          // Render with maximum quality settings for best text clarity
          await page.render({ 
            canvasContext: context, 
            viewport,
            canvas,
            intent: "display" // Optimize for display with best quality
          }).promise
          container.appendChild(canvas)
        } catch (pageError) {
          console.error(`Error rendering PDF page ${pageNum}:`, pageError)
          // Continue with other pages even if one fails
        }
      }

      // Ensure we begin from the first page
      container.scrollTop = 0
      setIsLoading(false)
      
      // Start NEW autoscroll after PDF is fully rendered
      if (autoScroll) {
        // Wait for DOM to update and container to have proper dimensions
        setTimeout(() => {
          startAutoScroll()
        }, 1000)
      }
      
    } catch (error: any) {
      console.error('Error rendering PDF:', error)
      
      // Clear container and show error message
      container.innerHTML = ""
      setError(error?.message || 'Failed to load PDF')
      setIsLoading(false)
      onError?.()
    }
  }, [autoScroll, onError])

  // Render PDF when mounted and data is available
  useEffect(() => {
    if (mounted && pdfData) {
      renderPdfFromData(pdfData)
    }
    return () => {
      stopAutoScroll()
    }
  }, [mounted, pdfData, renderPdfFromData])

  // Don't render anything until mounted
  if (!mounted) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 font-medium">Loading PDF...</p>
        </div>
      </div>
    )
  }

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
    <div className={`flex flex-col h-full ${className}`}>
      {showTitle && title && (
        <div className="text-sm font-medium text-gray-700 mb-2 truncate">
          {title}
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600 font-medium">Loading PDF...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ 
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
          minHeight: "100%",
          height: "100%"
        }}
      />
    </div>
  )
}

