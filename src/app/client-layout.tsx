'use client'

import { Inter } from 'next/font/google'
import "./globals.css"
import Providers from '@/lib/providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <body className={inter.className}>
      <Providers>
        {children}
        <Toaster 
          duration={2000}
          position="top-right"
          richColors
          closeButton
        />
      </Providers>
    </body>
  )
}

