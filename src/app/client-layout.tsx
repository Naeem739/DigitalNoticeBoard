'use client'

import "./globals.css"
import Providers from '@/lib/providers'
import { Toaster } from 'sonner'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Providers>
        {children}
        <Toaster 
          duration={2000}
          position="top-right"
          richColors
          closeButton
        />
      </Providers>
    </>
  )
}

