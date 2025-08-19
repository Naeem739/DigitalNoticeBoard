"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
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

// Define the menu structure that matches the manageable pages from the API
const MENU_STRUCTURE = {
  // Top-level items
  home: { href: '/', icon: Home, label: 'Home' },
  dashboard: { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  publicNotices: { href: '/notice', icon: Bell, label: 'Public Notices' },
  
  // Individual dashboard items
  noticeBoardSettings: { href: '/dashboard/manage-public-notice', icon: Settings, label: 'Notice Board Settings' },
  noticeCategories: { href: '/dashboard/category', icon: FolderPlus, label: 'Notice Categories' },
  
  // Dropdown groups
  manageNotices: {
    title: 'Manage Notices',
    items: [
      { href: '/dashboard/create-notice', icon: Plus, label: 'New Notice' },
      { href: '/dashboard/showNotices', icon: List, label: 'All Notices' },
      { href: '/dashboard/showImageNotices', icon: Image, label: 'Image-Based Notices' },
      { href: '/dashboard/showPDFNotices', icon: FilePenLine, label: 'PDF Notices' }
    ]
  },
  
  interfaceManagement: {
    title: 'Interface Management',
    items: [
      { href: '/dashboard/layout/edit-dashboard', icon: LayoutDashboard, label: 'Create New Dashboard' },
      { href: '/dashboard/noticeInterfaces', icon: Grid3X3, label: 'All Interfaces' }
    ]
  },
  
  userManagement: {
    title: 'Manage Users',
    adminItems: [
      { href: '/dashboard/admin/make-moderator', icon: UserPlus, label: 'Add Moderator' },
      { href: '/dashboard/admin/showAllModerator', icon: UserCheck, label: 'Moderators' },
      { href: '/dashboard/admin/set-permission', icon: Shield, label: 'Set Permission' }
    ],
    moderatorItems: [
      { href: '/dashboard/admin/make-user', icon: UserPlus, label: 'Add User' },
      { href: '/dashboard/admin/showAllUsers', icon: UserCheck, label: 'All Users' }
    ],
    superAdminItems: [
      { href: '/dashboard/admin/make-admin', icon: UserPlus, label: 'Add Administrator' },
      { href: '/dashboard/admin/showAllAdmin', icon: UserCheck, label: 'Administrators' }
    ]
  }
}

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [fetchedAllowedRoutes, setFetchedAllowedRoutes] = useState<string[] | null>(null)
  const sessionAllowedRoutes: string[] = (session?.user as any)?.allowedRoutes || []

  useEffect(() => {
    const load = async () => {
      if (userRole !== 'MODERATOR') return
      const moderatorId = (session?.user as any)?.id
      if (!moderatorId) return
      try {
        const res = await fetch(`/api/admin/permissions/${moderatorId}`)
        if (res.ok) {
          const json = await res.json()
          const routes: string[] = Array.isArray(json.allowedRoutes) ? json.allowedRoutes : []
          // Ensure home and dashboard are present by default
          setFetchedAllowedRoutes(Array.from(new Set<string>(['/', '/dashboard', ...routes])))
        }
      } catch {}
    }
    load()
  }, [session?.user?.id, userRole])

  const allowedRoutes: string[] = userRole === 'MODERATOR'
    ? (fetchedAllowedRoutes ?? sessionAllowedRoutes)
    : []

  const isAllowed = (href: string) => {
    if (userRole !== 'MODERATOR') return true
    
    // Dashboard route is always allowed for moderators
    if (href === '/dashboard') {
      return true
    }
    
    // Home visibility depends only on explicit '/'
    if (href === '/') {
      return allowedRoutes.includes('/')
    }
    
    // For other routes, check if the href starts with any allowed route
    const enforceable = allowedRoutes.filter(r => r && r !== '/' && r !== '/dashboard')
    return enforceable.some(route => href.startsWith(route))
  }

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

  // Helper function to get user management items based on role
  const getUserManagementItems = () => {
    if (userRole === 'SUPER_ADMIN') {
      return MENU_STRUCTURE.userManagement.superAdminItems
    } else if (userRole === 'ADMIN') {
      return MENU_STRUCTURE.userManagement.adminItems
    } else if (userRole === 'MODERATOR') {
      return MENU_STRUCTURE.userManagement.moderatorItems.filter(item => isAllowed(item.href))
    }
    return []
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
        {/* Top-level items */}
        {isAllowed(MENU_STRUCTURE.home.href) && (
          <MenuItem href={MENU_STRUCTURE.home.href} icon={MENU_STRUCTURE.home.icon}>
            {MENU_STRUCTURE.home.label}
          </MenuItem>
        )}
        
        {isAllowed(MENU_STRUCTURE.dashboard.href) && (
          <MenuItem href={MENU_STRUCTURE.dashboard.href} icon={MENU_STRUCTURE.dashboard.icon}>
            {MENU_STRUCTURE.dashboard.label}
          </MenuItem>
        )}
        
        {isAllowed(MENU_STRUCTURE.publicNotices.href) && (
          <MenuItem href={MENU_STRUCTURE.publicNotices.href} icon={MENU_STRUCTURE.publicNotices.icon}>
            {MENU_STRUCTURE.publicNotices.label}
          </MenuItem>
        )}

        {/* Role-based content */}
        {userRole !== 'USER' && (
          <>
            {/* Individual dashboard items */}
            {isAllowed(MENU_STRUCTURE.noticeBoardSettings.href) && (
              <MenuItem href={MENU_STRUCTURE.noticeBoardSettings.href} icon={MENU_STRUCTURE.noticeBoardSettings.icon}>
                {MENU_STRUCTURE.noticeBoardSettings.label}
              </MenuItem>
            )}
            
            {isAllowed(MENU_STRUCTURE.noticeCategories.href) && (
              <MenuItem href={MENU_STRUCTURE.noticeCategories.href} icon={MENU_STRUCTURE.noticeCategories.icon}>
                {MENU_STRUCTURE.noticeCategories.label}
              </MenuItem>
            )}

            {/* Manage Notices Dropdown */}
            {(() => {
              const allowedItems = MENU_STRUCTURE.manageNotices.items.filter(item => isAllowed(item.href))
              return allowedItems.length > 0 ? (
                <DropdownMenu title={MENU_STRUCTURE.manageNotices.title} items={allowedItems} />
              ) : null
            })()}

            {/* Interface Management Dropdown */}
            {(() => {
              const allowedItems = MENU_STRUCTURE.interfaceManagement.items.filter(item => isAllowed(item.href))
              return allowedItems.length > 0 ? (
                <DropdownMenu title={MENU_STRUCTURE.interfaceManagement.title} items={allowedItems} />
              ) : null
            })()}

            {/* User Management Dropdown */}
            {(() => {
              const userManagementItems = getUserManagementItems()
              return userManagementItems.length > 0 ? (
                <DropdownMenu title={MENU_STRUCTURE.userManagement.title} items={userManagementItems} />
              ) : null
            })()}
          </>
        )}

        {/* User role specific content */}
        {userRole === 'USER' && (
          <MenuItem href="/dashboard/showNotices" icon={List}>
            View Notices
          </MenuItem>
        )}
      </nav>
    </div>
  )
}

