"use client"

import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { memo } from "react"
import { pdfCache, generatePDFCacheKey, isPDFDataValid, optimizePDFData } from "@/utils/pdfCache"

// Configure PDF.js worker
if (typeof window !== "undefined") {
  ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()
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
    
    const container = containerRef.current
    if (!container) return
    
    // Always start from the very top
    container.scrollTop = 0

    // Cancel any ongoing animation loop before starting a new one
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const step = () => {
      if (!container) return
      
      // Scroll down by 0.5px each frame (slower scrolling)
      container.scrollBy(0, 0.5)

      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1
      if (atBottom) {
        // Loop back to the top for infinite scrolling
        container.scrollTop = 0
      }

      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
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
        startAutoScroll()
        return
      }

      // Check if we have cached document
      let pdf = pdfCache.get(`${cacheKey}_document`)
      if (!pdf) {
        // Create data URL for PDF.js
        const optimizedData = optimizePDFData(pdfData)
        const dataUrl = `data:application/pdf;base64,${optimizedData}`
        
        pdf = await pdfjsLib.getDocument(dataUrl).promise
        pdfCache.set(`${cacheKey}_document`, pdf)
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
      // Ensure we start from the first page on each render
      if (container) container.scrollTop = 0
      startAutoScroll()
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
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)"
        }}
      />
    </div>
  )
})

export default OptimizedPdfDisplay
