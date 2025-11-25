// app/(WithCommonLayout)/notice/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the PublicNoticePage component with SSR disabled
const PublicNoticePage = dynamic(
  () => import('./components/PublicNoticePage'),
  {
    ssr: false,
    loading: () => (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)'
        }}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Notice Board...</p>
        </div>
      </div>
    ),
  }
)

export default function NoticePage() {
  return (
    <Suspense fallback={
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)'
        }}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Initializing...</p>
        </div>
      </div>
    }>
      <PublicNoticePage />
    </Suspense>
  )
}