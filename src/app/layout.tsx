import type { Metadata } from "next";
import ClientLayout from './client-layout';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Digital Notice Board',
  description: 'A modern digital notice board system with drag-and-drop layouts, rich text editing, template system, and role-based access control for efficient team communication.',
  icons: {
    icon: [
      { url: '/images/logo.png', type: 'image/png' },
      { url: '/images/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/images/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Digital Notice Board',
    description: 'A modern digital notice board system for efficient team communication',
    images: ['/images/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Digital Notice Board',
    description: 'A modern digital notice board system for efficient team communication',
    images: ['/images/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}


