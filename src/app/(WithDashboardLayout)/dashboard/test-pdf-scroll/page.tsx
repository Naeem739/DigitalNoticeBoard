/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"

export default function TestPdfScrollPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.")
      return
    }

    const container = containerRef.current
    if (!container) return

    container.innerHTML = "" // Clear previous

    // Configure PDF.js worker (ESM build)
    if (typeof window !== "undefined") {
      ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString()
    }

    const fileURL = URL.createObjectURL(file)
    const pdf = await pdfjsLib.getDocument(fileURL).promise

    // Render each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.5 })

      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvas, viewport }).promise
      container.appendChild(canvas)
    }

    // Start auto-scroll
    function autoScroll() {
      if (!container) return
      container.scrollBy(0, 1)
      if (container.scrollTop + container.clientHeight < container.scrollHeight) {
        requestAnimationFrame(autoScroll)
      }
    }

    autoScroll()
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Upload PDF to Auto Scroll</h2>
      <input className="mt-3" type="file" accept="application/pdf" onChange={handleFileUpload} />
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "600px",
          overflowY: "scroll",
          border: "1px solid #ccc",
          marginTop: "10px",
        }}
      />
    </div>
  )
}


