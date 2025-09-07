"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PDFDebuggerProps {
  pdfData: string
  title?: string
}

export default function PDFDebugger({ pdfData, title }: PDFDebuggerProps) {
  const [showDebug, setShowDebug] = useState(false)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const analyzePDFData = () => {
    const analysis = {
      hasData: !!pdfData,
      dataType: typeof pdfData,
      dataLength: pdfData?.length || 0,
      isString: typeof pdfData === 'string',
      startsWithDataUrl: pdfData?.startsWith('data:application/pdf;base64,') || false,
      startsWithBase64: /^[A-Za-z0-9+/]/.test(pdfData || ''),
      hasValidLength: (pdfData?.length || 0) > 50,
      first100Chars: pdfData?.substring(0, 100) || 'No data',
      last100Chars: pdfData?.substring(Math.max(0, (pdfData?.length || 0) - 100)) || 'No data'
    }
    return analysis
  }

  const analysis = analyzePDFData()

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        onClick={() => setShowDebug(!showDebug)}
        variant="outline"
        size="sm"
        className="bg-white shadow-lg"
      >
        PDF Debug
      </Button>
      
      {showDebug && (
        <Card className="mt-2 w-96 max-h-96 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">PDF Data Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Has Data:</strong> {analysis.hasData ? '✅' : '❌'}
              </div>
              <div>
                <strong>Data Type:</strong> {analysis.dataType}
              </div>
              <div>
                <strong>Length:</strong> {analysis.dataLength}
              </div>
              <div>
                <strong>Is String:</strong> {analysis.isString ? '✅' : '❌'}
              </div>
              <div>
                <strong>Data URL:</strong> {analysis.startsWithDataUrl ? '✅' : '❌'}
              </div>
              <div>
                <strong>Base64:</strong> {analysis.startsWithBase64 ? '✅' : '❌'}
              </div>
              <div>
                <strong>Valid Length:</strong> {analysis.hasValidLength ? '✅' : '❌'}
              </div>
            </div>
            
            <div className="mt-4">
              <strong>First 100 chars:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {analysis.first100Chars}
              </pre>
            </div>
            
            <div className="mt-2">
              <strong>Last 100 chars:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {analysis.last100Chars}
              </pre>
            </div>
            
            <div className="mt-4">
              <Button
                onClick={() => {
                  console.log('PDF Data Analysis:', analysis)
                  console.log('Full PDF Data:', pdfData)
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Log to Console
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

