"use client"

import type { TDashboard2 } from "@/types/types"
import { AlertCircle, Info, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface WidgetContainerProps {
  data: TDashboard2
}

function hexToRgb(hex: string) {
  hex = hex.replace("#", "")
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

// Add scrollbar hiding styles and bubble animation using a style tag
const GlobalStyles = () => (
  <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    .gradient-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }
    
    .bubble {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 8s ease-in-out infinite;
      z-index: 0;
    }
    
    @keyframes float {
      0% {
        transform: translateY(0) translateX(0);
        opacity: 0;
      }
      50% {
        opacity: 0.3;
      }
      100% {
        transform: translateY(-100vh) translateX(20px);
        opacity: 0;
      }
    }
  `}</style>
)

// Bubble component
const Bubbles = () => {
  const [bubbles, setBubbles] = useState([])

  useEffect(() => {
    // Create random bubbles
    const createBubbles = () => {
      const newBubbles = []
      for (let i = 0; i < 15; i++) {
        newBubbles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          size: `${Math.random() * 100 + 20}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${Math.random() * 10 + 8}s`,
        })
      }
      setBubbles(newBubbles)
    }

    createBubbles()

    // Recreate bubbles every 20 seconds
    const interval = setInterval(createBubbles, 20000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {bubbles.map((bubble) => (
        <div
          key={bubble?.id}
          className="bubble"
          style={{
            left: bubble?.left,
            width: bubble.size,
            height: bubble.size,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
            bottom: "-100px",
          }}
        />
      ))}
    </>
  )
}

interface Notice {
  id: string
  title: string
  content?: string
  // Add other notice properties as needed
}

interface WidgetSettings {
  autoScroll: boolean
  backgroundColor: string
  backgroundOpacity: number
  borderColor: string
  borderWidth: number
  cardOpacity: number
  fontColor: string
  fontFamily: string
  fontSize: number
  fontWeight: string
  noticeCount: number
  showFullContent: boolean
  // New category styling properties
  categoryBackgroundColor?: string
  categoryBorderColor?: string
  categoryBorderWidth?: number
  categoryFont?: string
  categoryFontColor?: string
  categoryFontSize?: number
  categoryFontWeight?: string
  categoryHeight?: number
  // Image-specific settings
  imageFit?: string
  imageBorderRadius?: number
  showImageTitle?: boolean
  imageTitleColor?: string
  imageTitleFontSize?: number
  imageTitleFontWeight?: string
}

interface Widget {
  id: string
  title?: string
  category?: string
  type?: "notice" | "image"
  x: number
  y: number
  w: number
  h: number
  width?: string
  height?: string
  leftPx?: string
  topPx?: string
  leftPercent: string
  topPercent: string
  noticeIds?: string[]
  imageIds?: string[]
  settings?: WidgetSettings
}

interface WidgetContainerData {
  containers: Widget[]
  notices: Notice[]
  images: any[]
  // Add other data properties as needed
}

interface WidgetContainerProps {
  data: WidgetContainerData
}

export function WidgetContainer({ data }: WidgetContainerProps) {
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const scrollIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const getNoticeIcon = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes("urgent") || lowerTitle.includes("emergency")) {
      return <AlertCircle className="text-red-500" size={24} />
    } else if (lowerTitle.includes("info") || lowerTitle.includes("announcement")) {
      return <Info className="text-blue-500" size={24} />
    } else if (lowerTitle.includes("important") || lowerTitle.includes("priority")) {
      return <Star className="text-yellow-500" size={24} />
    }
    return <Info className="text-gray-500" size={24} />
  }

  // Auto-scroll functionality for notice widgets
  useEffect(() => {
    data.containers.forEach((widget) => {
      if (widget.type === "notice" && widget.settings?.autoScroll) {
        const scrollRef = scrollRefs.current[widget.id]
        if (scrollRef) {
          const scrollHeight = scrollRef.scrollHeight
          const clientHeight = scrollRef.clientHeight
          const maxScroll = scrollHeight - clientHeight

          if (maxScroll > 0) {
            let currentScroll = 0
            const scrollStep = 1
            const scrollInterval = 50

            const interval = setInterval(() => {
              currentScroll += scrollStep
              if (currentScroll >= maxScroll) {
                currentScroll = 0
              }
              scrollRef.scrollTop = currentScroll
            }, scrollInterval)

            scrollIntervals.current[widget.id] = interval
          }
        }
      }
    })

    // Cleanup intervals on unmount
    return () => {
      Object.values(scrollIntervals.current).forEach((interval) => clearInterval(interval))
    }
  }, [data.containers])

  // Function to truncate content based on showFullContent setting
  const getTruncatedContent = (content: string | undefined, showFull: boolean) => {
    if (!content) return ""
    if (showFull) return content
    return content.length > 100 ? `${content.substring(0, 100)}...` : content
  }

  return (
    <div className="w-full gradient-bg min-h-screen">
      {/* Include the global styles */}
      <GlobalStyles />

      {/* Bubble animation */}
      <Bubbles />

      <h1 className="text-center text-4xl my-5 pt-4 text-white font-bold relative z-10">Notices & Images</h1>
      <div
        className="mx-auto bg-white bg-opacity-10 backdrop-blur-md p-5 md:w-[85%] sm:w-[95%] rounded-xl shadow-lg relative z-10"
        style={{ minHeight: "80vh" }}
      >
        <div className="w-full mx-auto h-[80vh] relative">
          {data.containers.map((widget) => {
            // Handle different widget types
            if (widget.type === "image") {
              // Image Widget
              const imageIds = widget.imageIds || []
              const image = data.images.find((img) => img.id === imageIds[0]) // Single image widget

              // Get category styling properties with fallbacks
              const categoryStyles = {
                backgroundColor: widget.settings?.categoryBackgroundColor || "#1e293b",
                borderColor: widget.settings?.categoryBorderColor || "#e2e8f0",
                borderWidth: widget.settings?.categoryBorderWidth || 0,
                fontFamily: widget.settings?.categoryFont || "Inter",
                color: widget.settings?.categoryFontColor || "#ffffff",
                fontSize: widget.settings?.categoryFontSize ? `${widget.settings.categoryFontSize}px` : "16px",
                fontWeight: widget.settings?.categoryFontWeight || "semibold",
                height: widget.settings?.categoryHeight ? `${widget.settings.categoryHeight}px` : "auto",
                display: "flex",
                flexDirection: "column" as const,
                justifyContent: "center",
                alignItems: "center",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                marginBottom: "0.75rem",
              }

              return (
                <div
                  key={widget.id}
                  className="absolute rounded-lg shadow-md p-4 backdrop-blur-sm z-20"
                  style={{
                    left: widget.leftPercent,
                    top: widget.topPercent,
                    width: widget.width,
                    height: widget.height,
                    backgroundColor: widget.settings?.backgroundColor
                      ? `rgba(${hexToRgb(widget.settings.backgroundColor)},${widget.settings?.backgroundOpacity})`
                      : "rgba(255, 255, 255, 0.2)",
                    border: widget.settings?.borderWidth
                      ? `${widget.settings.borderWidth}px solid ${widget.settings.borderColor || "#000"}`
                      : undefined,
                    fontFamily: widget.settings?.fontFamily || "system-ui",
                  }}
                >
                  {/* Category Card with custom styling */}
                  <div className="shadow-md backdrop-blur-md" style={categoryStyles}>
                    <h3 className="text-center font-bold text-3xl">{widget?.category || widget?.title}</h3>
                  </div>

                  {/* Image Display */}
                  <div
                    className="flex-grow relative rounded-lg overflow-hidden shadow-inner"
                    style={{
                      height: "calc(100% - 80px)",
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    }}
                  >
                    {image ? (
                      <div className="w-full h-full relative">
                        <img
                          src={image.imageData}
                          alt={image.title}
                          className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                          style={{
                            objectFit: widget.settings?.imageFit as any || "cover",
                            borderRadius: `${widget.settings?.imageBorderRadius || 8}px`,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          }}
                        />
                        {widget.settings?.showImageTitle && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent rounded-b"
                            style={{
                              borderBottomLeftRadius: `${widget.settings.imageBorderRadius || 8}px`,
                              borderBottomRightRadius: `${widget.settings.imageBorderRadius || 8}px`,
                            }}
                          >
                            <p
                              className="text-sm font-semibold text-white truncate drop-shadow-lg"
                              style={{
                                color: widget.settings.imageTitleColor || "#ffffff",
                                fontSize: `${widget.settings.imageTitleFontSize || 14}px`,
                                fontWeight: widget.settings.imageTitleFontWeight || "medium",
                                fontFamily: widget.settings?.fontFamily || "system-ui",
                              }}
                              title={image.title}
                            >
                              {image.title}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">No Image Available</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            } else {
              // Notice Widget
            const limitedNoticeIds = widget.settings?.noticeCount
                ? (widget.noticeIds || []).slice(0, widget.settings.noticeCount)
                : widget.noticeIds || []

            // Get category styling properties with fallbacks
            const categoryStyles = {
              backgroundColor: widget.settings?.categoryBackgroundColor || "#1e293b",
              borderColor: widget.settings?.categoryBorderColor || "#e2e8f0",
              borderWidth: widget.settings?.categoryBorderWidth || 0,
              fontFamily: widget.settings?.categoryFont || "Inter",
              color: widget.settings?.categoryFontColor || "#ffffff",
              fontSize: widget.settings?.categoryFontSize ? `${widget.settings.categoryFontSize}px` : "16px",
              fontWeight: widget.settings?.categoryFontWeight || "semibold",
              height: widget.settings?.categoryHeight ? `${widget.settings.categoryHeight}px` : "auto",
              display: "flex",
              flexDirection: "column" as const,
              justifyContent: "center",
              alignItems: "center",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              marginBottom: "0.75rem",
            }

            return (
              <div
                key={widget.id}
                className="absolute rounded-lg shadow-md p-4 backdrop-blur-sm z-20"
                style={{
                  left: widget.leftPercent,
                  top: widget.topPercent,
                  width: widget.width,
                  height: widget.height,
                  backgroundColor: widget.settings?.backgroundColor
                    ? `rgba(${hexToRgb(widget.settings.backgroundColor)},${widget.settings?.backgroundOpacity})`
                    : "rgba(255, 255, 255, 0.2)",
                  border: widget.settings?.borderWidth
                    ? `${widget.settings.borderWidth}px solid ${widget.settings.borderColor || "#000"}`
                    : undefined,
                  fontFamily: widget.settings?.fontFamily || "system-ui",
                }}
              >
                {/* Category Card with custom styling */}
                <div className="shadow-md backdrop-blur-md" style={categoryStyles}>
                  <h3 className="text-center font-bold text-3xl">{widget?.category || widget?.title}</h3>
                </div>

                {/* Notice Cards with hidden scrollbar */}
                <div
                  ref={(el) => (scrollRefs.current[widget.id] = el)}
                  className="space-y-3 overflow-y-auto no-scrollbar"
                  style={{
                    maxHeight:
                      categoryStyles.height !== "auto"
                        ? `calc(100% - ${Number.parseInt(categoryStyles.height) + 20}px)`
                        : "calc(100% - 130px)",
                  }}
                >
                  {limitedNoticeIds.map((id) => {
                    const notice = data.notices.find((notice) => notice.id === id)
                    if (!notice) return null

                    const fontColorRgb = widget.settings?.fontColor ? hexToRgb(widget.settings.fontColor) : "0, 0, 0"

                    return (
                      <div
                        key={id}
                        className="notice-card p-4 rounded-lg shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                        style={{
                          color: widget.settings?.fontColor ? `rgba(${fontColorRgb}, 1)` : undefined,
                          backgroundColor: widget.settings?.backgroundColor
                            ? `rgba(${hexToRgb(widget.settings.backgroundColor)}, ${widget.settings?.cardOpacity})`
                            : "rgba(255, 255, 255, 0.7)",
                          fontSize: widget.settings?.fontSize ? `${widget.settings.fontSize}px` : undefined,
                          fontWeight: widget.settings?.fontWeight || "normal",
                          fontFamily: widget.settings?.fontFamily || "system-ui",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {getNoticeIcon(notice?.title)}
                          <div className="font-semibold text-xl">{notice?.title}</div>
                        </div>

                        {notice?.content && (
                          <div className="mt-2">
                            {getTruncatedContent(notice.content, !!widget.settings?.showFullContent)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
            }
          })}
        </div>
      </div>
    </div>
  )
}
