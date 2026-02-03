"use client"

import { useMemo } from "react"

function withPdfViewerParams(url: string) {
  // Chrome/Edge PDF viewer params (best-effort; ignored by some viewers)
  // toolbar=0 hides toolbar, navpanes=0 hides sidebar, scrollbar=0 hides scrollbars
  const hasHash = url.includes("#")
  const suffix = "#toolbar=0&navpanes=0&scrollbar=0"
  return hasHash ? url : `${url}${suffix}`
}

export default function DirectPdfEmbed({
  pdfUrl,
  title,
  className = "",
}: {
  pdfUrl: string
  title?: string
  className?: string
}) {
  const safeUrl = useMemo(() => {
    if (!pdfUrl || typeof pdfUrl !== "string") return ""
    const trimmed = pdfUrl.trim()
    if (!trimmed) return ""
    return trimmed
  }, [pdfUrl])

  if (!safeUrl) {
    return (
      <div className={`flex items-center justify-center h-full w-full bg-gray-50 ${className}`}>
        <div className="text-center px-4">
          <p className="text-sm text-gray-600 font-medium">No PDF URL configured</p>
        </div>
      </div>
    )
  }

  const viewerUrl = withPdfViewerParams(safeUrl)

  return (
    <div className={`w-full h-full ${className}`} style={{ backgroundColor: "#fff" }}>
      {/* Use <object> to embed the PDF, with a simple fallback if inline rendering is not supported */}
      <object
        data={viewerUrl}
        type="application/pdf"
        className="w-full h-full"
        style={{ border: "none", backgroundColor: "#fff" }}
      >
        <div className="flex items-center justify-center h-full w-full bg-gray-50">
          <div className="text-center px-4">
            <p className="text-sm text-gray-700 font-medium mb-2">
              PDF preview is not supported in this browser.
            </p>
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Open PDF
            </a>
          </div>
        </div>
      </object>
    </div>
  )
}

