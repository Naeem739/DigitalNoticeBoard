/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { memo } from "react"
import { pdfCache, generatePDFCacheKey, isPDFDataValid } from "@/utils/pdfCache"

// Configure PDF.js worker - use same approach as InlinePdfWidget
if (typeof window !== "undefined") {
  try {
    // Use unpkg CDN with the installed version (5.4.54) - same as InlinePdfWidget
    ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`
    console.log('PDF.js worker configured:', (pdfjsLib as any).GlobalWorkerOptions.workerSrc)
  } catch (error) {
    console.error('Failed to configure PDF.js worker:', error)
    // Fallback to alternative CDN
    try {
      ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs`
    } catch (fallbackError) {
      console.error('Failed to configure PDF.js worker fallback:', fallbackError)
    }
  }
}

interface OptimizedPdfDisplayProps {
  pdfData: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
  onError?: () => void
}

// Validate PDF data on component mount
const validatePDFData = (pdfData: string): boolean => {
  return isPDFDataValid(pdfData)
}

const OptimizedPdfDisplay = memo(function OptimizedPdfDisplay({ 
  pdfData, 
  title, 
  autoScroll = true, 
  className = "", 
  showTitle = true,
  onError
}: OptimizedPdfDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const retryCountRef = useRef<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Memoize cache key and validate PDF data
  const cacheKey = useMemo(() => generatePDFCacheKey(pdfData), [pdfData])
  const isValidPDF = useMemo(() => validatePDFData(pdfData), [pdfData])

  // Initialize mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Memoized auto scroll function
  const startAutoScroll = useCallback(() => {
    if (!autoScroll || !mounted) return
    
    // Reset retry count
    retryCountRef.current = 0
    
    const container = containerRef.current
    if (!container) {
      // Retry after a short delay if container isn't ready (max 10 retries)
      if (retryCountRef.current < 10) {
        retryCountRef.current++
        setTimeout(() => startAutoScroll(), 100)
      }
      return
    }
    
    // Wait for container to be fully rendered and have content
    const checkAndStart = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) return
      
      // Check if container has scrollable content
      const hasScrollableContent = currentContainer.scrollHeight > currentContainer.clientHeight
      
      if (!hasScrollableContent && retryCountRef.current < 20) {
        // Retry after a short delay if content isn't ready yet (max 20 retries)
        retryCountRef.current++
        setTimeout(() => checkAndStart(), 100)
        return
      }
      
      // Reset retry count on success
      retryCountRef.current = 0
      
      // Always start from the very top
      currentContainer.scrollTop = 0

      // Cancel any ongoing animation loop before starting a new one
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      const step = () => {
        const scrollContainer = containerRef.current
        if (!scrollContainer) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
          return
        }
        
        // Scroll down by 0.5px each frame (slower scrolling)
        scrollContainer.scrollBy(0, 0.5)

        const atBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1
        if (atBottom) {
          // Loop back to the top for infinite scrolling
          scrollContainer.scrollTop = 0
        }

        rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setTimeout(checkAndStart, 50)
    })
  }, [autoScroll, mounted])

  // Memoized PDF rendering function
  const renderPdf = useCallback(async () => {
    if (!mounted || !isValidPDF) return
    
    const container = containerRef.current
    if (!container) return

    try {
      setIsLoading(true)
      setError(null)

      // Check if we have cached canvases
      const cachedCanvases = pdfCache.get(`${cacheKey}_canvases`)
      if (cachedCanvases) {
        container.innerHTML = ""
        cachedCanvases.forEach((canvas: HTMLCanvasElement) => {
          container.appendChild(canvas.cloneNode(true))
        })
        setIsLoading(false)
        // Wait for DOM to update before starting auto-scroll
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = 0
            setTimeout(() => {
              startAutoScroll()
            }, 100)
          }
        })
        return
      }

      // Check if we have cached document
      let pdf = pdfCache.get(`${cacheKey}_document`)
      if (!pdf) {
        // Use the same robust PDF data handling as InlinePdfWidget
        // Validate PDF data
        if (!pdfData || pdfData.trim() === '') {
          throw new Error('No PDF data provided')
        }
        
        // Ensure PDF data is properly formatted - same approach as InlinePdfWidget
        let pdfSource = pdfData
        if (!pdfSource.startsWith('data:')) {
          pdfSource = `data:application/pdf;base64,${pdfSource}`
        }
        
        // Extract base64 data from data URL (handles both with and without prefix)
        const base64Data = pdfSource.includes(',') ? pdfSource.split(',')[1] : pdfSource.replace(/^data:application\/pdf;base64,/, '')
        
        // Convert base64 to Uint8Array for PDF.js - same as InlinePdfWidget
        let pdfDocSource: any
        try {
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          // Load PDF using Uint8Array - same format as InlinePdfWidget
          pdfDocSource = {
            data: bytes,
            verbosity: 0
          }
        } catch (conversionError) {
          console.error("Error converting PDF to Uint8Array:", conversionError)
          throw new Error(`Failed to process PDF data: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`)
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
        
        try {
          pdf = await pdfjsLib.getDocument(pdfDocSource).promise
          pdfCache.set(`${cacheKey}_document`, pdf)
          console.log('PDF loaded successfully, pages:', pdf.numPages)
        } catch (pdfError: any) {
          console.error("PDF.js load error details:", {
            error: pdfError,
            message: pdfError?.message,
            name: pdfError?.name,
            stack: pdfError?.stack?.substring(0, 500)
          })
          throw new Error(`Failed to load PDF document: ${pdfError?.message || 'Unknown error'}`)
        }
      }

      container.innerHTML = ""
      const canvases: HTMLCanvasElement[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        // Fit page width to container to avoid horizontal scroll
        const containerWidth = container.clientWidth || 600
        const baseViewport = page.getViewport({ scale: 1 })
        const fitScale = containerWidth / baseViewport.width
        const viewport = page.getViewport({ scale: fitScale })
        
        // Render at higher pixel density for crisp text
        const outputScale = typeof window !== "undefined" ? Math.max(2, window.devicePixelRatio || 1) : 2
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        
        // Set canvas size for high DPI rendering
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        
        // Set CSS size to display size (no blur) - this ensures it fits the widget
        canvas.style.width = "100%"
        canvas.style.height = "auto"
        
        // Scale context for high DPI rendering
        context!.scale(outputScale, outputScale)
        
        await page.render({ 
          canvasContext: context!, 
          viewport
        }).promise
        
        container.appendChild(canvas)
        canvases.push(canvas)
      }

      // Cache the rendered canvases
      pdfCache.set(`${cacheKey}_canvases`, canvases)

      setIsLoading(false)
      
      // Wait for DOM to update before starting auto-scroll
      requestAnimationFrame(() => {
        // Ensure we start from the first page on each render
        if (container) {
          container.scrollTop = 0
          // Start auto-scroll after ensuring container is ready
          setTimeout(() => {
            startAutoScroll()
          }, 100)
        }
      })
    } catch (err) {
      console.error("Error rendering PDF:", err)
      console.error("PDF Data length:", pdfData?.length)
      console.error("PDF Data preview:", pdfData?.substring(0, 100))
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
      onError?.()
    }
  }, [pdfData, cacheKey, mounted, startAutoScroll, isValidPDF])

  // Render PDF when mounted and data is available
  useEffect(() => {
    if (mounted && pdfData) {
      console.log("PDF Data validation:", {
        isValid: isValidPDF,
        dataLength: pdfData?.length,
        dataPreview: pdfData?.substring(0, 50)
      })
      
      if (!isValidPDF) {
        setError("Invalid PDF data format")
        setIsLoading(false)
        return
      }
      renderPdf()
    }
  }, [mounted, pdfData, renderPdf, isValidPDF])

  // Don't render anything until mounted (prevents hydration errors)
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
})

export default OptimizedPdfDisplay
