"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Home, BarChart2, Users, FolderPlus, FilePenLine, ChevronDown, ChevronRight } from "lucide-react"
import * as Collapsible from "@radix-ui/react-collapsible"
import type React from "react"

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => (prev.includes(menu) ? prev.filter((item) => item !== menu) : [...prev, menu]))
  }

  const MenuItem = ({
    href,
    icon: Icon,
    children,
  }: { href: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link href={href} className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
      <Icon className="inline-block mr-2 w-5 h-5" /> {children}
    </Link>
  )

  const DropdownMenu = ({
    title,
    items,
  }: { title: string; items: { href: string; icon: React.ElementType; label: string }[] }) => {
    const contentRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

    useEffect(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight)
      }
    }, [])

    return (
      <Collapsible.Root open={openMenus.includes(title)} onOpenChange={() => toggleMenu(title)}>
        <Collapsible.Trigger className="flex items-center w-full py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white">
          {openMenus.includes(title) ? (
            <ChevronDown className="w-5 h-5 mr-2 transition-transform duration-500 ease-spring" /> // Increased from 300ms to 500ms
          ) : (
            <ChevronRight className="w-5 h-5 mr-2 transition-transform duration-500 ease-spring" /> // Increased from 300ms to 500ms
          )}
          {title}
        </Collapsible.Trigger>
        <Collapsible.Content
          ref={contentRef}
          className="overflow-hidden transition-all duration-700 ease-in-out" // Increased from 500ms to 700ms, changed to ease-in-out
          style={{
            height: openMenus.includes(title) ? contentHeight : 0,
            opacity: openMenus.includes(title) ? 1 : 0,
            transform: openMenus.includes(title) ? "translateY(0)" : "translateY(-10px)",
          }}
        >
          <div className="py-2 pl-6">
            {items.map((item, index) => (
              <MenuItem key={index} href={item.href} icon={item.icon}>
                {item.label}
              </MenuItem>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    )
  }

  return (
    <div
      className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 transition duration-500 ease-in-out z-50 overflow-y-auto`} // Increased from 200ms to 500ms
    >
      <Link href="/dashboard" className="text-white flex items-center space-x-2 px-4">
        <BarChart2 className="w-8 h-8" />
        <span className="text-2xl font-extrabold">Dashboard</span>
      </Link>
      <nav>
        <MenuItem href="/dashboard" icon={Home}>
          Home
        </MenuItem>

        <DropdownMenu
          title="Category"
          items={[
            { href: "/dashboard/category/create-category", icon: FolderPlus, label: "Create a New Category" },
           
          ]}
        />

        <DropdownMenu
          title="Notice Content"
          items={[
            { href: "/dashboard/create-notice", icon: FilePenLine, label: "Add New Notice" },
           // { href: "/dashboard/showNotices", icon: FilePenLine, label: "Show Notices" }
          ]}
        />

        
        <DropdownMenu
          title="Admin"
          items={[
            { href: "/dashboard/admin/make-admin", icon: Users, label: "Make Admin" }
          ]}
        />

        <DropdownMenu
          title="Layout"
          items={[
            { href: "/dashboard/layout/edit-dashboard", icon: Users, label: "Edit Dashboard" }
          ]}
        />


        {/* <MenuItem href="/dashboard/settings" icon={Settings}>
          Settings
        </MenuItem> */}
      </nav>
    </div>
  )
}

