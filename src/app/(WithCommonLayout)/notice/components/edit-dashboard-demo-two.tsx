"use client"

import { TDashboard2 } from "@/types/types"
import { BellRing, AlertCircle, Info, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface WidgetContainerProps {
  data: TDashboard2
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
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
);

// Bubble component
const Bubbles = () => {
  const [bubbles, setBubbles] = useState([]);
  
  useEffect(() => {
    // Create random bubbles
    const createBubbles = () => {
      const newBubbles = [];
      for (let i = 0; i < 15; i++) {
        newBubbles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          size: `${Math.random() * 100 + 20}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${Math.random() * 10 + 8}s`,
        });
      }
      setBubbles(newBubbles);
    };
    
    createBubbles();
    
    // Recreate bubbles every 20 seconds
    const interval = setInterval(createBubbles, 20000);
    return () => clearInterval(interval);
  }, []);
  
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
            bottom: '-100px',
          }}
        />
      ))}
    </>
  );
};



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
}

interface Widget {
  id: string
  title?: string
  category?: string
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
  noticeIds: string[]
  settings?: WidgetSettings
}

interface WidgetContainerData {
  containers: Widget[]
  notices: Notice[]
  // Add other data properties as needed
}

interface WidgetContainerProps {
  data: WidgetContainerData
}

export function WidgetContainer({ data }: WidgetContainerProps) {
  // Function to get an appropriate icon based on the notice title
  const getNoticeIcon = (title: string) => {
    const titleLower = title?.toLowerCase() || ""
    if (titleLower.includes("alert") || titleLower.includes("warning")) {
      return <AlertCircle className="h-6 w-6 text-red-500" />
    } else if (titleLower.includes("important")) {
      return <Star className="h-6 w-6 text-yellow-500" />
    } else {
      return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  // Create refs for auto-scrolling containers
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Setup auto-scroll effect
  useEffect(() => {
    const scrollIntervals: { [key: string]: NodeJS.Timeout } = {}

    data.containers.forEach((widget) => {
      if (widget.settings?.autoScroll && scrollRefs.current[widget.id]) {
        const scrollContainer = scrollRefs.current[widget.id]
        if (scrollContainer) {
          scrollIntervals[widget.id] = setInterval(() => {
            if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight) {
              // Reset to top when reached bottom
              scrollContainer.scrollTop = 0
            } else {
              // Scroll down slowly
              scrollContainer.scrollTop += 1
            }
          }, 50)
        }
      }
    })

    // Cleanup intervals on unmount
    return () => {
      Object.values(scrollIntervals).forEach((interval) => clearInterval(interval))
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

      <h1 className="text-center text-4xl my-5 pt-4 text-white font-bold relative z-10">Notices</h1>
      <div
        className="relative mx-auto bg-white bg-opacity-10 backdrop-blur-md p-5 md:w-[85%] sm:w-[95%] rounded-xl shadow-lg relative z-10"
        style={{ minHeight: "80vh" }}
      >
        <div className="w-full mx-auto h-[80vh] relative">
          {data.containers.map((widget) => {
            // Limit notices based on noticeCount setting
            const limitedNoticeIds = widget.settings?.noticeCount
              ? widget.noticeIds.slice(0, widget.settings.noticeCount)
              : widget.noticeIds

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
                {/* Category Card with glass effect */}
                <div
                  className="mb-2 p-4 rounded-lg shadow-md backdrop-blur-md"
                  style={{
                    color: widget.settings?.fontColor ? `rgba(${hexToRgb(widget.settings.fontColor)}, 1)` : "#1e3a8a",
                    backgroundColor: "rgba(240, 249, 255, 0.85)",
                    fontSize: widget.settings?.fontSize ? `${widget.settings.fontSize}px` : undefined,
                    fontWeight: widget.settings?.fontWeight || "normal",
                  }}
                >
                  <h3 className="text-center font-bold text-3xl">{widget?.category || widget?.title}</h3>

                  <div className="flex items-center justify-center mb-4 gap-2">
                    <BellRing className="h-5 w-5 text-red-500" />
                    <h4 className="font-semibold text-lg text-red-600">Important Announcements:</h4>
                  </div>
                </div>

                {/* Notice Cards with hidden scrollbar */}
                <div
                  ref={(el) => (scrollRefs.current[widget.id] = el)}
                  className="space-y-3 overflow-y-auto no-scrollbar"
                  style={{ maxHeight: "calc(100% - 130px)" }}
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
          })}
        </div>
      </div>
    </div>
  )
}


/*
"use client"

import { TDashboard2 } from "@/types/types"

// type Widget = {
//   id: string
//   x: number
//   y: number
//   w: number
//   h: number
//   leftPx: string
//   topPx: string
//   leftPercent: string
//   topPercent: string
//   width: string
//   height: string
//   title: string
//   color: string
// }

interface WidgetContainerProps {
  data : TDashboard2
}

export function WidgetContainer({ data }: WidgetContainerProps) {
  return (
    <div className="w-full border border-green-600 ">

      <h1 className="text-center text-4xl my-5"> Notices</h1>
    <div
      className={` relative mx-auto border bg-gray-100 p-5 md:w-[85%] sm:w-[95%] `}
      style={{
        // Set a minimum height based on the widgets' positions
        minHeight: "80vh",
        // Or calculate dynamically based on the furthest widget:
        // minHeight: `${Math.max(...widgets.map(w => parseFloat(w.topPercent) + parseFloat(w.height)))}%`
      }}
    > <div className=" bg-gray-100 w-[100%] mx-auto h-[80vh] relative">
      {data.containers.map((widget) => (
        <div
          key={widget.id}
          className={`absolute  rounded-lg shadow-sm p-4 bg-white`}
          style={{
            left: widget.leftPercent,
            top: widget.topPercent,
            width: widget.width,
            height: widget.height,
            border: "1px solid rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <div className="font-medium">{widget.noticeIds } 

             
             
             <h3>Naeem</h3> </div>
          <div className="text-xs text-gray-500 mt-2">
            Position: {widget.leftPercent}, {widget.topPercent}
          </div>
          <div className="text-xs text-gray-500">
            Size: {widget.width} × {widget.height}
          </div>
        </div>
      ))}
       </div>
    </div>
    </div>
  )
}
*/
