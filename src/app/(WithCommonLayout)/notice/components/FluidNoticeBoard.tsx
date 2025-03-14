"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { Badge } from "@/components/ui/badge"

interface NoticeCardProps {
  title: string
  noticeId: string
  category?: string
  size?: "large" | "small"
  aspectRatio?: number
}

const NoticeCard = ({
  title,
  noticeId,
  category = "PROGRAMMING",
  size = "large",
  aspectRatio = size === "large" ? 2.5 : 1.5,
}: NoticeCardProps) => {
  const [height, setHeight] = useState<string>("auto")
  const [width, setWidth] = useState<number>(0)

  // Update card height based on its width to maintain aspect ratio
  useEffect(() => {
    const updateDimensions = () => {
      const cardElement = document.getElementById(`card-${noticeId}`)
      if (cardElement) {
        const cardWidth = cardElement.offsetWidth
        setWidth(cardWidth)

        // Calculate height based on aspect ratio, but cap at 80vh
        const calculatedHeight = cardWidth / aspectRatio
        const maxHeight = window.innerHeight * 0.8
        setHeight(`${Math.min(calculatedHeight, maxHeight)}px`)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [noticeId, aspectRatio])

  return (
    <Card
      id={`card-${noticeId}`}
      className="w-full transition-all duration-300"
      style={{
        height: height,
        minHeight: size === "large" ? "200px" : "150px",
      }}
    >
      <CardHeader className="p-6 pb-2">
        <CardTitle
          className="font-bold"
          style={{
            fontSize: size === "large" ? `calc(1rem + ${width * 0.01}px)` : `calc(0.9rem + ${width * 0.008}px)`,
          }}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-4">
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800 rounded-full font-medium px-4 py-1 border-0"
          style={{ fontSize: `calc(0.7rem + ${width * 0.005}px)` }}
        >
          {category}
        </Badge>
        <p className="text-muted-foreground" style={{ fontSize: `calc(0.75rem + ${width * 0.004}px)` }}>
          Notice ID: {noticeId}
        </p>
      </CardContent>
    </Card>
  )
}

export default function FluidNoticeLayout() {
  const notices = [
    {
      id: "1",
      title: "dfdfadsa",
      noticeId: "85f7f64c-efce-4564-8c07-7a808d67fd11",
      size: "large" as const,
    },
    {
      id: "2",
      title: "My first Notice on Nayem's Editor",
      noticeId: "0a473f62-6345-4ad6-a1d7-02e9586...",
      size: "large" as const,
    },
    {
      id: "3",
      title: "this notice ...",
      noticeId: "c74c8f...",
      size: "small" as const,
    },
    {
      id: "4",
      title: "this notice ...",
      noticeId: "c74c8f...",
      size: "small" as const,
    },
    {
      id: "5",
      title: "this notice belongs to programming",
      noticeId: "c74c8ffe-e6d7-41ff-ac35-7d8a3505a919",
      size: "small" as const,
    },
  ]

  return (
    <div className="w-full bg-gray-50 min-h-screen" style={{ padding: "2vw" }}>
      {/* Top row - larger cards */}
      <div
        className="grid gap-6 mb-6"
        style={{
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "calc(1rem + 1vw)",
        }}
      >
        {notices
          .filter((notice) => notice.size === "large")
          .map((notice) => (
            <NoticeCard
              key={notice.id}
              title={notice.title}
              noticeId={notice.noticeId}
              size={notice.size}
              aspectRatio={2.5} // Wider aspect ratio for large cards
            />
          ))}
      </div>

      {/* Bottom row - smaller cards */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "calc(1rem + 1vw)",
        }}
      >
        {notices
          .filter((notice) => notice.size === "small")
          .map((notice) => (
            <NoticeCard
              key={notice.id}
              title={notice.title}
              noticeId={notice.noticeId}
              size={notice.size}
              aspectRatio={1.5} // More square-like aspect ratio for small cards
            />
          ))}
      </div>
    </div>
  )
}

