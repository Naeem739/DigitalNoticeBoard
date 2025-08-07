"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { 
  Home, 
  BarChart2, 
  Users, 
  FolderPlus, 
  FilePenLine, 
  ChevronDown, 
  ChevronRight, 
  Image, 
  Layout,
  Megaphone,
  Bell,
  Settings,
  Palette,
  Grid3X3,
  Eye,
  Plus,
  List,
  Shield,
  UserCheck,
  UserPlus,
  LayoutDashboard,
  Monitor,
  Smartphone,
  QrCode
} from "lucide-react"
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
            <ChevronDown className="w-5 h-5 mr-2 transition-transform duration-500 ease-spring" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2 transition-transform duration-500 ease-spring" />
          )}
          {title}
        </Collapsible.Trigger>
        <Collapsible.Content
          ref={contentRef}
          className="overflow-hidden transition-all duration-700 ease-in-out"
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
      } md:relative md:translate-x-0 transition duration-500 ease-in-out z-50 overflow-y-auto border-r border-gray-700`}
    >
      <Link href="/dashboard" className="text-white flex items-center space-x-2 px-4">
        <Bell className="w-8 h-8 text-yellow-400" />
        <span className="text-2xl font-extrabold">Smart Notice Board</span>
      </Link>
      <nav className="space-y-2">
        <MenuItem href="/" icon={Home}>
          Home
        </MenuItem>
        <MenuItem href="/dashboard" icon={LayoutDashboard}>
          Dashboard
        </MenuItem>
        <MenuItem href="/notice" icon={Bell}>
          Public Notices
        </MenuItem>
        <MenuItem href="/dashboard/manage-public-notice" icon={Settings}>
          Notice Board Settings
        </MenuItem>
        <MenuItem href="/dashboard/category" icon={FolderPlus}>
          Notice Categories
        </MenuItem>
        <DropdownMenu
          title="Manage Notices"
          items={[
            { href: "/dashboard/create-notice", icon: Plus, label: "New Notice" },
            { href: "/dashboard/showNotices", icon: List, label: "All Notices" },
            { href: "/dashboard/showImageNotices", icon: Image, label: "Image-Based Notices" }
          ]}
        />
        <DropdownMenu
          title="Interface Management"
          items={[
            { href: "/dashboard/layout/edit-dashboard", icon: LayoutDashboard, label: "New Interface" },
            { href: "/dashboard/noticeInterfaces", icon: Grid3X3, label: "All Interfaces" }
          ]}
        />
        <DropdownMenu
          title="Manage Users"
          items={[
            { href: "/dashboard/admin/make-admin", icon: UserPlus, label: "Add Administrator" },
            { href: "/dashboard/admin/showAllAdmin", icon: UserCheck, label: "Administrators" }
          ]}
        />
      </nav>
    </div>
  )
}

