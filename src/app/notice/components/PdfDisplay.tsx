/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef, useEffect, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"

// Configure PDF.js worker
if (typeof window !== "undefined") {
  ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()
}

interface PdfDisplayProps {
  pdfData: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
}

export default function PdfDisplay({ pdfData, title, autoScroll = true, className = "", showTitle = true }: PdfDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pdfData) {
      renderPdf()
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [pdfData])

  const startAutoScroll = () => {
    if (!autoScroll) return
    
    const container = containerRef.current
    if (!container) return
    // Always start from the very top
    container.scrollTop = 0

    // Cancel any ongoing animation loop before starting a new one
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const step = () => {
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
  }

  const renderPdf = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      setIsLoading(true)
      setError(null)
      container.innerHTML = ""

      const pdf = await pdfjsLib.getDocument(pdfData).promise

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        // Fit page width to container to avoid horizontal scroll
        const containerWidth = container.clientWidth || 600
        const baseViewport = page.getViewport({ scale: 1 })
        const fitScale = containerWidth / baseViewport.width
        const viewport = page.getViewport({ scale: fitScale })
        
        // Render at higher pixel density for crisp text (improved quality)
        const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const outputScale = Math.max(3, Math.min(4, devicePixelRatio * 2)) // 3-4x for high quality
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d", {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false
        })
        
        if (!context) {
          throw new Error('Failed to get canvas context')
        }
        
        // Set canvas size for high DPI rendering
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        
        // Set CSS size to display size (no blur) - this ensures it fits the widget
        canvas.style.width = "100%"
        canvas.style.height = "auto"
        canvas.style.imageRendering = "auto"
        
        // Configure context for optimal text rendering
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = "high"
        
        // Scale context for high DPI rendering
        context.scale(outputScale, outputScale)
        
        await page.render({ 
          canvas: canvas,
          canvasContext: context,
          viewport: viewport,
          intent: "display"
        }).promise
        container.appendChild(canvas)
      }

      setIsLoading(false)
      // Ensure we start from the first page on each render
      if (container) container.scrollTop = 0
      startAutoScroll()
    } catch (err) {
      console.error("Error rendering PDF (logged only):", err)
      // Don't set error state - only log to console to prevent error UI from showing
      setIsLoading(false)
    }
  }

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
}

