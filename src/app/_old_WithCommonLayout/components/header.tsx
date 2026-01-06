'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import Image from 'next/image'

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/notice', label: 'NOTICE' },
  { href: '/dashboard', label: 'DASHBOARD' },
  { href: '/about', label: 'ABOUT' },
  { href: '/causes', label: 'CAUSES' },
  { href: '/services', label: 'SERVICES' },
  { href: '/gallery', label: 'GALLERY' },
  { href: '/team', label: 'TEAM' },
  { href: '/testimonials', label: 'TESTIMONIALS' },
  { href: '/contact', label: 'CONTACT' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="w-full flex justify-center bg-white py-4 sticky top-0 z-50 border-b">
      <div className="container max-w-[1200px] flex justify-between items-center">
        <Link href="/" className="text-3xl p-2 font-bold text-gray-700">
          {/* BANDHON<span className="text-[#98e5d7]">.</span> */}
          <Image src="/images/bondhon-logo-1.svg"
           alt=" bondhon logo here"
           height={150}
           width={40}
           className='scale-150 ms-2 '
           />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`${
                link.href === '/' ? 'text-[#98e5d7]' : 'text-gray-600'
              } hover:text-[#98e5d7] transition-colors`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`${
                    link.href === '/' ? 'text-[#98e5d7]' : 'text-gray-600'
                  } hover:text-[#98e5d7] transition-colors text-lg`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Button className="bg-[#98e5d7] hover:bg-[#7dcdbf] text-white hidden md:inline-flex">
          DONATE NOW
        </Button>
      </div>
    </header>
  )
}

