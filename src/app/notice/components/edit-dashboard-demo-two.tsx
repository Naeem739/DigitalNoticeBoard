/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type { TDashboard2, PublicNoticeSettings } from "@/types/types"
import { AlertCircle, Info, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Image from 'next/image'
import { NoticeQRCode } from "@/components/ui/qr-code"

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

// Add scrollbar hiding styles
const GlobalStyles = () => (
  <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
)

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
  data: TDashboard2
}

export function WidgetContainer({ data }: WidgetContainerProps) {
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const scrollIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const [settings, setSettings] = useState<PublicNoticeSettings | null>(null)

  // Load public notice settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/public-notice-settings');
        const result = await response.json();
        
        if (result.success && result.data) {
          setSettings(result.data);
        }
      } catch (error) {
        console.error('Error loading public notice settings:', error);
      }
    };

    loadSettings();
  }, []);

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
      // Only attempt to auto-scroll if the autoScroll property exists and is truthy.
      if (
        widget.type === "notice" &&
        typeof (widget.settings as any)?.autoScroll === "boolean" &&
        (widget.settings as any)?.autoScroll
      ) {
        const scrollRef = scrollRefs.current[widget.id];
        if (scrollRef) {
          const scrollHeight = scrollRef.scrollHeight;
          const clientHeight = scrollRef.clientHeight;
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

  // Get template-based styling for widgets
  const getTemplateWidgetStyle = () => {
    if (!settings) return {};
    
    // Apply template accent color and styling to widgets
    return {
      borderColor: settings.accentColor || '#3b82f6',
      boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${settings.accentColor || '#3b82f6'}30`,
    };
  };

  return (
    <div className="w-full h-full">
      {/* Include the global styles */}
      <GlobalStyles />

      <div className="w-full mx-auto h-full relative">
        {data.containers.map((widget) => {
          // Handle different widget types
          if (widget.type === "image") {
            // Image Widget
            const imageIds = widget.imageIds || []
            const image = data.images.find((img) => img.id === imageIds[0]) // Single image widget

            // Get category styling properties with fallbacks
            const categoryStyles = {
              backgroundColor: widget.settings?.categoryBackgroundColor || settings?.accentColor || "#1e293b",
              borderColor: widget.settings?.categoryBorderColor || settings?.accentColor || "#e2e8f0",
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
                className="absolute rounded-lg p-4 backdrop-blur-sm"
                style={{
                  left: widget.leftPercent,
                  top: widget.topPercent,
                  width: widget.width,
                  height: widget.height,
                  backgroundColor: widget.settings?.backgroundColor
                    ? `rgba(${hexToRgb(widget.settings.backgroundColor)},${widget.settings?.backgroundOpacity})`
                    : "rgba(30, 41, 59, 0.3)",
                  border: widget.settings?.borderWidth
                    ? `${widget.settings.borderWidth}px solid ${widget.settings.borderColor || settings?.accentColor || "#000"}`
                    : `1px solid ${settings?.accentColor || '#3b82f6'}30`,
                  fontFamily: "system-ui", // Removed usage of undefined widget.settings?.fontFamily to fix lint error
                  ...getTemplateWidgetStyle(),
                }}
              >
                {/* Category Card with custom styling */}
                <div style={categoryStyles}>
                  <h3 className="text-center font-bold text-3xl">{widget?.category || widget?.title}</h3>
                </div>

                {/* Image Display */}
                <div
                  className="flex-grow relative rounded-lg overflow-hidden"
                  style={{
                    height: "calc(100% - 80px)",
                  }}
                >
                  {image ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={image.imageData}
                        alt={image.title}
                        fill
                        className="w-full h-full rounded-lg object-contain"
                        style={{
                          borderRadius: `${widget.settings?.imageBorderRadius || 8}px`,
                        }}
                      />
                      
                      {/* QR Code for Image */}
                      <div className="absolute top-2 right-2">
                        <NoticeQRCode
                          notice={{
                            id: image.id,
                            title: image.title,
                            content: image.title
                          }}
                          imageData={image.imageData}
                          imageTitle={image.title}
                          size={50}
                          className="bg-white/90 rounded-lg p-1"
                        />
                      </div>
                      
                      {widget.settings?.showImageTitle && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent rounded-b"
                          style={{
                            borderBottomLeftRadius: `${widget.settings.imageBorderRadius || 8}px`,
                            borderBottomRightRadius: `${widget.settings.imageBorderRadius || 8}px`,
                          }}
                        >
                          <p
                            className="text-sm font-semibold text-white truncate"
                            style={{
                              color: widget.settings.imageTitleColor || "#ffffff",
                              fontSize: `${widget.settings.imageTitleFontSize || 14}px`,
                              fontWeight: widget.settings.imageTitleFontWeight || "medium",
                              fontFamily: "system-ui",
                            }}
                            title={image.title}
                          >
                            {image.title}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
                      <div className="p-3 rounded-full mb-3">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            backgroundColor: widget.settings?.categoryBackgroundColor || settings?.accentColor || "#1e293b",
            borderColor: widget.settings?.categoryBorderColor || settings?.accentColor || "#e2e8f0",
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
              className="absolute rounded-lg p-4 backdrop-blur-sm"
              style={{
                left: widget.leftPercent,
                top: widget.topPercent,
                width: widget.width,
                height: widget.height,
                backgroundColor: widget.settings?.backgroundColor
                  ? `rgba(${hexToRgb(widget.settings.backgroundColor)},${widget.settings?.backgroundOpacity})`
                  : "rgba(30, 41, 59, 0.3)",
                border: widget.settings?.borderWidth
                  ? `${widget.settings.borderWidth}px solid ${widget.settings.borderColor || settings?.accentColor || "#000"}`
                  : `1px solid ${settings?.accentColor || '#3b82f6'}30`,
                // Removed fontFamily as it is not a valid property of widget.settings
                ...getTemplateWidgetStyle(),
              }}
            >
              {/* Category Card with custom styling */}
              <div style={categoryStyles}>
                <h3 className="text-center font-bold text-3xl">{widget?.category || widget?.title}</h3>
              </div>

              {/* Notice Cards with hidden scrollbar */}
              <div
                ref={(el) => { scrollRefs.current[widget.id] = el }}
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
                      className="notice-card p-4 rounded-lg"
                      style={{
                        color: widget.settings?.fontColor ? `rgba(${fontColorRgb}, 1)` : undefined,
                        backgroundColor: widget.settings?.backgroundColor
                          ? `rgba(${hexToRgb(widget.settings.backgroundColor)}, ${widget.settings?.cardOpacity})`
                          : "rgba(51, 65, 85, 0.8)",
                        // fontSize, fontWeight, fontFamily removed because they do not exist on widget.settings type
                        border: `1px solid ${settings?.accentColor || '#3b82f6'}20`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {getNoticeIcon(notice?.title)}
                        <div className="font-semibold text-xl">{notice?.title}</div>
                      </div>

                      {notice?.content && (
                        <div className="mt-2">
                          <div 
                            dangerouslySetInnerHTML={{
                              __html: getTruncatedContent(
                                notice.content,
                                // Use undefined or false if showFullContent does not exist on settings
                                false
                              )
                            }}
                          />
                        </div>
                      )}
                        </div>
                        
                        {/* QR Code */}
                        <div className="ml-3 flex-shrink-0">
                          <NoticeQRCode
                            notice={notice}
                            size={60}
                            className="opacity-80 hover:opacity-100 transition-opacity"
                            imageData={notice.imageData || undefined}
                            imageTitle={notice.imageFileName || notice.title}
                          />
                        </div>
                      </div>
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
  )
}
