"use client"

import { useState, useRef, useEffect, memo } from "react"
import OptimizedPdfDisplay from "./OptimizedPdfDisplay"
import FallbackPdfDisplay from "./FallbackPdfDisplay"

interface LazyPdfWidgetProps {
  pdfData: string
  title?: string
  autoScroll?: boolean
  className?: string
  showTitle?: boolean
  containerId: string
}

const LazyPdfWidget = memo(function LazyPdfWidget({
  pdfData,
  title,
  autoScroll = true,
  className = "",
  showTitle = true,
  containerId
}: LazyPdfWidgetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the component is visible
        rootMargin: "50px" // Start loading 50px before it comes into view
      }
    )

    const currentContainer = containerRef.current
    if (currentContainer) {
      observer.observe(currentContainer)
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer)
      }
    }
  }, [hasLoaded])

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        useFallback ? (
          <FallbackPdfDisplay
            pdfData={pdfData}
            title={title}
            autoScroll={autoScroll}
            className="h-full w-full"
            showTitle={showTitle}
          />
        ) : (
          <OptimizedPdfDisplay
            pdfData={pdfData}
            title={title}
            autoScroll={autoScroll}
            className="h-full w-full"
            showTitle={showTitle}
            onError={() => setUseFallback(true)}
          />
        )
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">PDF will load when visible</p>
          </div>
        </div>
      )}
    </div>
  )
})

export default LazyPdfWidget
