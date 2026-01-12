/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"

interface WorkingPdfDisplayProps {
  pdfData?: string
  pdfUrl?: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
  onError?: () => void
}

export default function WorkingPdfDisplay({
  pdfData,
  pdfUrl,
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

  // Render PDF from either URL or base64 data
  const renderPdfFromData = useCallback(async (pdfData?: string, pdfUrl?: string) => {
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
      
      // Check if PDF.js worker is configured
      if (!(pdfjsLib as any).GlobalWorkerOptions.workerSrc) {
        console.warn('PDF.js worker not configured, attempting to configure...')
        try {
          ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`
        } catch (workerError) {
          console.error('Failed to configure PDF.js worker:', workerError)
        }
      }

      // Load PDF document with error handling
      let pdf
      try {
        // Priority 1: Use pdfUrl directly if available (PDF.js supports URLs natively - more efficient!)
        if (pdfUrl && typeof pdfUrl === 'string') {
          console.log('Loading PDF directly from URL:', pdfUrl)
          pdf = await (pdfjsLib as any).getDocument({
            url: pdfUrl,
            verbosity: 0
          }).promise
          console.log('PDF loaded successfully from URL, pages:', pdf.numPages)
        }
        // Priority 2: Use pdfData (base64) if pdfUrl not available
        else if (pdfData) {
          // Validate PDF data
          if (!pdfData || pdfData.trim() === '') {
            throw new Error('No PDF data provided')
          }
          
          // Check if PDF data is valid base64
          const base64Regex = /^data:application\/pdf;base64,/
          let processedPdfData = pdfData
          if (!base64Regex.test(processedPdfData) && !processedPdfData.startsWith('data:application/pdf')) {
            // Try to add the data URL prefix if missing
            if (!processedPdfData.startsWith('data:')) {
              processedPdfData = `data:application/pdf;base64,${processedPdfData}`
            }
          }
          
          // Extract base64 data from data URL
          const base64Data = processedPdfData.includes(',') ? processedPdfData.split(',')[1] : processedPdfData.replace(/^data:application\/pdf;base64,/, '')
          
          // Convert base64 to Uint8Array for PDF.js
          const binaryString = atob(base64Data)
          const pdfBytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            pdfBytes[i] = binaryString.charCodeAt(i)
          }
          
          // Load PDF using Uint8Array
          pdf = await (pdfjsLib as any).getDocument({
            data: pdfBytes,
            verbosity: 0
          }).promise
          
          console.log('PDF loaded successfully from base64 data, pages:', pdf.numPages)
        } else {
          throw new Error('No PDF data or URL provided')
        }
      } catch (loadError: any) {
        console.error('PDF.js load error details:', {
          error: loadError,
          message: loadError?.message,
          name: loadError?.name,
          stack: loadError?.stack?.substring(0, 500)
        })
        
        // If URL loading failed, try fallback: fetch and convert to Uint8Array
        if (pdfUrl && typeof pdfUrl === 'string' && !pdfData) {
          console.log('Direct URL loading failed, trying fetch fallback...')
          try {
            const response = await fetch(pdfUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`)
            }
            const arrayBuffer = await response.arrayBuffer()
            const pdfBytes = new Uint8Array(arrayBuffer)
            
            pdf = await (pdfjsLib as any).getDocument({
              data: pdfBytes,
              verbosity: 0
            }).promise
            
            console.log('PDF loaded successfully via fetch fallback, pages:', pdf.numPages)
          } catch (fetchError) {
            console.error('Fetch fallback also failed:', fetchError)
            throw new Error(`Failed to load PDF: ${loadError?.message || 'Unknown error'}`)
          }
        } else {
          throw new Error(`Failed to load PDF: ${loadError?.message || 'Unknown error'}`)
        }
      }
      
      // Clear container
      container.innerHTML = ""

      // Render each page with enhanced text clarity
      // Browser canvas size limits (most browsers support up to 16,384px per dimension)
      const MAX_CANVAS_SIZE = 16384
      
      // Detect large displays (75" 4K displays typically have viewport width > 3000px)
      const isLargeDisplay = typeof window !== "undefined" && window.innerWidth >= 3000
      
      // For large displays, use image-based rendering to avoid canvas size limits
      if (isLargeDisplay) {
        console.log('Using image-based rendering for large display')
        
        // Wait for container to have proper dimensions
        let retries = 0
        const maxRetries = 10
        while ((!container.clientWidth || container.clientWidth === 0) && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100))
          retries++
        }
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum)
            // Fit page width to container to avoid horizontal scroll
            const rawContainerWidth = container.clientWidth || window.innerWidth || 4096
            const containerWidth = Math.min(Math.max(rawContainerWidth, 600), 4096) // Cap at 4K width for safety, min 600
            const baseViewport = page.getViewport({ scale: 1 })
            
            // Calculate appropriate scale for large displays
            const baseFitScale = containerWidth / baseViewport.width
            const viewport = page.getViewport({ scale: baseFitScale })
            
            // Use higher scale for better quality on large displays (match laptop quality)
            const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
            let outputScale = Math.max(3, Math.min(4, devicePixelRatio * 2)) // 3-4x for high quality
            
            // Create a temporary canvas for rendering
            const tempCanvas = document.createElement("canvas")
            const tempContext = tempCanvas.getContext("2d", {
              alpha: false,
              desynchronized: true,
              willReadFrequently: false
            })
            
            if (!tempContext) {
              throw new Error('Failed to get canvas context')
            }
            
            // Calculate canvas dimensions with safe limits
            let canvasWidth = Math.floor(viewport.width * outputScale)
            let canvasHeight = Math.floor(viewport.height * outputScale)
            
            // Ensure we don't exceed canvas limits
            if (canvasWidth > MAX_CANVAS_SIZE || canvasHeight > MAX_CANVAS_SIZE) {
              const widthRatio = MAX_CANVAS_SIZE / canvasWidth
              const heightRatio = MAX_CANVAS_SIZE / canvasHeight
              const reductionFactor = Math.min(widthRatio, heightRatio) * 0.95 // 95% to be safe
              outputScale = outputScale * reductionFactor
              canvasWidth = Math.floor(viewport.width * outputScale)
              canvasHeight = Math.floor(viewport.height * outputScale)
              console.warn(`Canvas size would exceed limits, reducing scale to ${outputScale.toFixed(2)}x for page ${pageNum}`)
            }
            
            // Set canvas size
            tempCanvas.width = canvasWidth
            tempCanvas.height = canvasHeight
            
            // Configure context for optimal rendering
            tempContext.imageSmoothingEnabled = true
            tempContext.imageSmoothingQuality = "high"
            tempContext.scale(outputScale, outputScale)
            
            // Render PDF page to canvas
            await page.render({ 
              canvasContext: tempContext, 
              viewport,
              canvas: tempCanvas,
              intent: "display"
            }).promise
            
            // Convert canvas to image with maximum quality (PNG is lossless, better for text)
            const imageDataUrl = tempCanvas.toDataURL('image/png') // PNG is lossless, best for text clarity
            
            // Create image element
            const img = document.createElement("img")
            img.src = imageDataUrl
            img.style.width = "100%"
            img.style.height = "auto"
            img.style.display = "block"
            img.style.imageRendering = "auto"
            img.alt = `PDF Page ${pageNum}`
            
            // Add loading handler
            img.onload = () => {
              // Clean up temporary canvas to free memory
              tempCanvas.width = 0
              tempCanvas.height = 0
            }
            
            img.onerror = () => {
              console.error(`Failed to load image for PDF page ${pageNum}`)
            }
            
            container.appendChild(img)
            
            // Note: tempCanvas will be garbage collected after img.onload cleans it up
            // No need to explicitly remove it as it's not in the DOM
            
          } catch (pageError) {
            console.error(`Error rendering PDF page ${pageNum} as image:`, pageError)
            if (pageError instanceof Error) {
              console.error(`Page error details:`, {
                message: pageError.message,
                name: pageError.name,
                stack: pageError.stack?.substring(0, 500)
              })
            }
            // Continue with other pages even if one fails
          }
        }
      } else {
        // Use canvas-based rendering for smaller displays (original method)
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum)
            // Fit page width to container to avoid horizontal scroll
            // Cap container width to prevent issues on extremely large displays
            const rawContainerWidth = container.clientWidth || 600
            const containerWidth = Math.min(rawContainerWidth, 4096) // Cap at 4K width for safety
            const baseViewport = page.getViewport({ scale: 1 })
            
            // Increase scale significantly for better readability (larger, clearer text)
            const baseFitScale = containerWidth / baseViewport.width
            const readabilityScale = baseFitScale * 1.5 // 50% larger for much better readability
            const viewport = page.getViewport({ scale: readabilityScale })
            
            // Render at high pixel density for crisp text
            const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
            let outputScale = Math.max(2, Math.min(4, devicePixelRatio * 2))
            
            // Calculate canvas dimensions
            let canvasWidth = Math.floor(viewport.width * outputScale)
            let canvasHeight = Math.floor(viewport.height * outputScale)
            
            // Enforce canvas size limits - if exceeded, reduce scale
            if (canvasWidth > MAX_CANVAS_SIZE || canvasHeight > MAX_CANVAS_SIZE) {
              const widthRatio = MAX_CANVAS_SIZE / canvasWidth
              const heightRatio = MAX_CANVAS_SIZE / canvasHeight
              const reductionFactor = Math.min(widthRatio, heightRatio)
              outputScale = outputScale * reductionFactor
              canvasWidth = Math.floor(viewport.width * outputScale)
              canvasHeight = Math.floor(viewport.height * outputScale)
              console.warn(`Canvas size exceeded limits, reducing scale to ${outputScale.toFixed(2)}x for page ${pageNum}`)
            }
            
            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d", {
              alpha: false, // Better performance
              desynchronized: true, // Better performance
              willReadFrequently: false // Optimize for rendering, not reading
            })
            
            if (!context) {
              throw new Error('Failed to get canvas context')
            }
            
            // Set canvas size with enforced limits
            canvas.width = canvasWidth
            canvas.height = canvasHeight
            
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
            // Log detailed error for debugging
            if (pageError instanceof Error) {
              console.error(`Page error details:`, {
                message: pageError.message,
                name: pageError.name,
                stack: pageError.stack?.substring(0, 500)
              })
            }
            // Continue with other pages even if one fails
          }
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
      
      // Log detailed error information for debugging
      const errorDetails = {
        message: error?.message || 'Unknown error',
        name: error?.name,
        stack: error?.stack?.substring(0, 500),
        viewportWidth: typeof window !== "undefined" ? window.innerWidth : 'unknown',
        viewportHeight: typeof window !== "undefined" ? window.innerHeight : 'unknown',
        devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 'unknown',
        containerWidth: container?.clientWidth || 'unknown',
        pdfDataLength: pdfData?.length || 0
      }
      console.error('PDF rendering error details:', errorDetails)
      
      // Clear container and show error message
      container.innerHTML = ""
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load PDF'
      if (error?.message?.includes('canvas')) {
        errorMessage = 'PDF too large for display. Please try a smaller file or contact support.'
      } else if (error?.message?.includes('memory') || error?.message?.includes('allocation')) {
        errorMessage = 'Insufficient memory to render PDF. Please refresh the page.'
      } else if (error?.message) {
        errorMessage = `Failed to load PDF: ${error.message}`
      }
      
      // Only log error to console, don't set error state to prevent UI from showing error message
      console.error('PDF rendering error (logged only):', errorMessage)
      setIsLoading(false)
      // Don't call onError to prevent fallback - let it continue trying to render
      // onError?.()
    }
  }, [autoScroll, onError])

  // Render PDF when mounted and data is available
  useEffect(() => {
    if (mounted && (pdfData || pdfUrl)) {
      renderPdfFromData(pdfData, pdfUrl)
    }
    return () => {
      stopAutoScroll()
    }
  }, [mounted, pdfData, pdfUrl, renderPdfFromData])

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

  // Don't show error UI - errors are logged to console only
  // This prevents error overlays from appearing when PDF is successfully rendering
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
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
          minHeight: "100%",
          height: "100%"
        }}
      />
    </div>
  )
}

